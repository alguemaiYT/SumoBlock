#include <Arduino.h>
#define DISABLE_CODE_FOR_RECEIVER
#include <IRremote.hpp>

// Definicao dos Pinos de Entrada (Botoes)
const byte pinReady = 2;
const byte pinStart = 3;
const byte pinStop  = 4;

// Definicao do Pino de Saida (Controle do Transistor IR)
const byte pinIrEmitter = 5;

// Configuracao Sony (SIRC)
const uint8_t sonyAddress        = 0x01;  // 5 bits (0..31)
const uint8_t sonyBits           = 12;    // 7 bits cmd + 5 bits endereco
const int_fast8_t sonyRepeats    = 2;     // 1 envio + 2 repeticoes
const unsigned long debounceMs   = 30;
const unsigned long stopRepeatMs = 140;   // STOP continuo enquanto pressionado

const uint8_t cmdReady = 0x00;
const uint8_t cmdStart = 0x01;
const uint8_t cmdStop  = 0x02;

struct DebouncedButton {
  uint8_t pin;
  uint8_t command;
  uint8_t stableLevel;
  uint8_t lastRawLevel;
  unsigned long lastChangeMs;
};

DebouncedButton btnReady = {pinReady, cmdReady, HIGH, HIGH, 0};
DebouncedButton btnStart = {pinStart, cmdStart, HIGH, HIGH, 0};
DebouncedButton btnStop  = {pinStop, cmdStop, HIGH, HIGH, 0};

unsigned long lastStopSentMs = 0;

void initButton(DebouncedButton &btn) {
  pinMode(btn.pin, INPUT_PULLUP);
  const uint8_t level = digitalRead(btn.pin);
  btn.stableLevel = level;
  btn.lastRawLevel = level;
  btn.lastChangeMs = millis();
}

bool buttonPressedEdge(DebouncedButton &btn, const unsigned long nowMs) {
  const uint8_t raw = digitalRead(btn.pin);

  if (raw != btn.lastRawLevel) {
    btn.lastRawLevel = raw;
    btn.lastChangeMs = nowMs;
  }

  if ((nowMs - btn.lastChangeMs) >= debounceMs && raw != btn.stableLevel) {
    btn.stableLevel = raw;
    if (btn.stableLevel == LOW) {
      return true;
    }
  }
  return false;
}

bool buttonIsPressed(const DebouncedButton &btn) {
  return btn.stableLevel == LOW;
}

void sendSonyCommand(const uint8_t cmd) {
  IrSender.sendSony(sonyAddress, cmd & 0x7F, sonyRepeats, sonyBits);

  Serial.print(F("Sony enviado -> cmd: 0x"));
  if (cmd < 0x10) {
    Serial.print('0');
  }
  Serial.println(cmd, HEX);
}

void setup() {
  Serial.begin(115200);

  initButton(btnReady);
  initButton(btnStart);
  initButton(btnStop);

  IrSender.begin(pinIrEmitter);

  Serial.println(F("Controle Sony IR pronto."));
  Serial.println(F("READY=0x00 | START=0x01 | STOP=0x02"));
}

void loop() {
  const unsigned long nowMs = millis();

  if (buttonPressedEdge(btnReady, nowMs)) {
    sendSonyCommand(btnReady.command);
  }

  if (buttonPressedEdge(btnStart, nowMs)) {
    sendSonyCommand(btnStart.command);
  }

  const bool stopEdge = buttonPressedEdge(btnStop, nowMs);
  const bool stopHold = buttonIsPressed(btnStop) && (nowMs - lastStopSentMs >= stopRepeatMs);

  if (stopEdge || stopHold) {
    sendSonyCommand(btnStop.command);
    lastStopSentMs = nowMs;
  }

  delay(1);
}
