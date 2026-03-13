#include <IRremote.hpp> // include the library
#define IR_RECEIVE_PIN  34 
#define BUTTON_PIN 15 
#define LED_PIN_1 5 // led no pino 5
#define LED_PIN_2 4 // led no pino 4
#define Motor1PWMpin 23 
#define Motor2PWMpin 19
#define target 30
#define valorSenBorda 500
#define SensorA 0 // sensor fx da lateral esquerda
#define SensorB 1 // sensor fx da frente esquerda
#define SensorC 2 // sensor fx da frente direita
#define SensorD 3 // sensor fx da lateral direita
#define LinhaDir  6 // sensor de linha do lado direito
#define LinhaEsq  7 // sensor de linha do lado esquerdo
int veloc = 1500;
int terezo = 0;
int estrategia = 0;
int flag =0;
unsigned long buttonPressTime = 0;
bool buttonPressed = false;
bool ledsBlinking = true; // Controla o piscar dos LEDs
unsigned long lastButtonPress = 0;
const unsigned long debounceDelay = 200;
int sensorA = 0;
int sensorB = 0;
int sensorC = 0;
int sensorD = 0;
const int freq = 980;
const int Motor1PWM = 0;
const int Motor2PWM = 1;
const int resolution = 12;
int timeblink = 300;
void setup() {
  Serial.begin(115200);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(LED_PIN_1, OUTPUT);
  pinMode(LED_PIN_2, OUTPUT);
  pinMode(SensorA,OUTPUT);
  pinMode(SensorB,OUTPUT);
  pinMode(SensorC,OUTPUT);
  pinMode(SensorD,OUTPUT);
  pinMode(LinhaDir,OUTPUT);
  pinMode(LinhaEsq,OUTPUT);
  pinMode(1,OUTPUT);
  pinMode(3,OUTPUT);
  pinMode(18,OUTPUT);
  pinMode(5,OUTPUT);
  digitalWrite(LED_PIN_1, LOW);
  digitalWrite(LED_PIN_2, LOW);
  pinMode(Motor1PWMpin,OUTPUT);
  pinMode(Motor2PWMpin,OUTPUT);
    analogWrite(Motor2PWMpin, 0);
 digitalWrite(1, LOW);
 digitalWrite(3, LOW);
  analogWrite(Motor1PWMpin, 0);
 digitalWrite(18, LOW);
 digitalWrite(5, LOW);
  analogWrite(Motor2PWMpin, 0);
  Serial.println("aguardando estrategia =");
  IrReceiver.begin(IR_RECEIVE_PIN, ENABLE_LED_FEEDBACK);
 // delay(5000);
  waitForButtonPress();
  Serial.println(estrategia);
  for(int x=0; x<=5;x++){
  digitalWrite(LED_PIN_1, HIGH);
  digitalWrite(LED_PIN_2, HIGH);
  delay(100);
  digitalWrite(LED_PIN_1, LOW);
  digitalWrite(LED_PIN_2, LOW);
  delay(100);
  }
  
  while(1){
   if (IrReceiver.decode()) {
  
          if (IrReceiver.decodedIRData.command == 0x0) {
            terezo=1;
            digitalWrite(4,HIGH);
            digitalWrite(16,LOW);} 
          else if (IrReceiver.decodedIRData.command == 0x1 && terezo==1) {
           terezo=2;
           digitalWrite(4,HIGH);
           digitalWrite(16,HIGH);
           break;}
          else if (IrReceiver.decodedIRData.command == 0x2) {
           terezo=3;
          digitalWrite(4,LOW);
          digitalWrite(16,LOW);
        }
      IrReceiver.resume();    
    }
}
IrReceiver.resume(); 
timeblink = 100;
flag=0;
}
void waitForButtonPress() {
 while (true) {
  Serial.println(digitalRead(BUTTON_PIN));
    if (digitalRead(BUTTON_PIN) == LOW) {
      unsigned long currentTime = millis();

      // Verifica se o botão foi pressionado após o período de debounce
      if (!buttonPressed && (currentTime - lastButtonPress > debounceDelay)) {
        buttonPressTime = currentTime;
        buttonPressed = true;
      }
      
      // Verifica se o botão foi pressionado por mais de 3 segundos
      if (buttonPressed && (currentTime - buttonPressTime > 3000)) {
        // Saia da rotina
 //       Serial.println("Rotina encerrada.");
        return;
      }
    } else {
      // Botão solto
      if (buttonPressed) {
        unsigned long pressDuration = millis() - buttonPressTime;

        // Verifica se foi um toque curto
        if (pressDuration < 3000) {
          // Muda a estratégia
          estrategia = (estrategia % 3) + 1;
          ledsBlinking = false; // Para os LEDs de piscar após a primeira interação
          updateLeds();
 //         Serial.print("Estratégia atual: ");
 //         Serial.println(estrategia);
        }
        // Reseta a detecção do botão
        buttonPressed = false;
        lastButtonPress = millis(); // Atualiza o tempo da última pressão do botão
      }
      // Pisca os LEDs enquanto espera (somente antes da primeira interação)
      if (ledsBlinking) {
        blinkLeds();
      }}}}

void updateLeds() {
  switch (estrategia) {
    case 1:
      digitalWrite(LED_PIN_1, HIGH);
      digitalWrite(LED_PIN_2, LOW);
      break;
    case 2:
      digitalWrite(LED_PIN_1, LOW);
      digitalWrite(LED_PIN_2, HIGH);
      break;
    case 3:
      digitalWrite(LED_PIN_1, HIGH);
      digitalWrite(LED_PIN_2, HIGH);
      break;
  }}

void blinkLeds() {
  static unsigned long lastBlinkTime = 0;
  static bool ledState = false;

  if (millis() - lastBlinkTime >= timeblink) {
    ledState = !ledState;
    digitalWrite(LED_PIN_1, !ledState);
    digitalWrite(LED_PIN_2, !ledState);
    lastBlinkTime = millis();
  }}
void le_stop(){
   if (IrReceiver.decode()) {
     if (IrReceiver.decodedIRData.command == 0x2) {
           terezo=3;
          digitalWrite(4,LOW);
          digitalWrite(16,LOW);
          digitalWrite(1, LOW);
          digitalWrite(3, LOW);
          analogWrite(Motor2PWMpin, 0);
          digitalWrite(18, LOW);
          digitalWrite(5, LOW);
          analogWrite(Motor2PWMpin, 0);
          while(1);
        }
        }
        IrReceiver.resume(); 
        }


void le_sensores(){
sensorA = digitalRead(SensorA);
sensorB = digitalRead(SensorB);
sensorC = digitalRead(SensorC);
sensorD = digitalRead(SensorD);

Serial.print("Sensor LE=");
Serial.print(sensorA);
Serial.print(" Sensor FE=");
Serial.print(sensorB);
Serial.print(" Sensor FD=");
Serial.print(sensorC);
Serial.print(" Sensor LD=");
Serial.print(sensorD);
delay(10);
}
void esquerda(int veloc){
  digitalWrite(1,LOW);
  digitalWrite(3,HIGH);
  digitalWrite(5,HIGH);
  digitalWrite(18,LOW);
  analogWrite(Motor1PWMpin, veloc);
  analogWrite(Motor2PWMpin, veloc);
}

void frente(int veloc){
  digitalWrite(1,LOW);
  digitalWrite(3,HIGH);
  digitalWrite(5,LOW);
  digitalWrite(18,HIGH);
  analogWrite(Motor1PWMpin, veloc);
  analogWrite(Motor2PWMpin, veloc);
}
void re(int veloc){
  digitalWrite(1,HIGH);
  digitalWrite(3,LOW);
  digitalWrite(5,HIGH);
  digitalWrite(18,LOW);
  analogWrite(Motor1PWMpin, veloc);
  analogWrite(Motor2PWMpin, veloc);
}
void direita(int veloc){
  digitalWrite(1,HIGH);
  digitalWrite(3,LOW);
  digitalWrite(5,LOW);
  digitalWrite(18,HIGH);
  analogWrite(Motor1PWMpin, veloc);
  analogWrite(Motor2PWMpin, veloc);
}
void hunter(){
 if(sensorB==HIGH && sensorC==HIGH)//sensores da frente detectando
  {frente(veloc*2);}
  if (sensorB==HIGH && sensorC==LOW)// sensores da frente direita somente detectando
  {  esquerda(veloc*0.5);}
  if (sensorB==LOW && sensorC==HIGH)// sensores da dir e esq detectando
  {  direita(veloc*0.5);}
  if (sensorA==HIGH)// sensores da frente e esquerda detectando
  {esquerda(veloc);}
  if (sensorD==HIGH)// sensores da direita e da frente detectando
  {direita(veloc);}
  if (sensorA==LOW && SensorB==LOW && SensorC==LOW && SensorD==LOW) // nenhum sensor detectando
  frente(veloc/3);
}
void radar(){
  if(sensorB==HIGH && sensorC==HIGH)//sensores da frente detectando
  {frente(veloc*2);}
  if (sensorB==HIGH && sensorC==LOW)// sensores da frente direita somente detectando
  {  esquerda(veloc*0.5);}
  if (sensorB==LOW && sensorC==HIGH)// sensores da dir e esq detectando
  {  direita(veloc*0.5);}
  if (sensorA==HIGH)// sensores da frente e esquerda detectando
  {esquerda(veloc);}
  if (sensorD==HIGH)// sensores da direita e da frente detectando
  {direita(veloc);}
  if (sensorA==LOW && SensorB==LOW && SensorC==LOW && SensorD==LOW) // nenhum sensor detectando
  esquerda(veloc*0.75);
}
void le_borda(){
  int sensorLD = analogRead(LinhaDir);
  int sensorLE = analogRead(LinhaEsq);
  
 // Serial.print("sensorLD=");
 // Serial.print(sensorLD);
 // Serial.print("  sensorLE=");
 // Serial.println(sensorLE);
 if (sensorLD <= valorSenBorda){
 re(veloc*2);
 delay(150);
 esquerda(veloc);
 delay(200);
 }
 if (sensorLE <= valorSenBorda){
 re(veloc*2);
 delay(150);
 direita(veloc);
 delay(150);
 }
 }

void loop() {
  le_stop();
  le_sensores();
  le_borda();
  switch (estrategia) {
    case 1:
   hunter();
    break;
    case 2:          // vai pra frente por um tempo e depois entra no modo radar
     if (flag==0){
    frente(2000); 
    delay(400);
    direita(2000);
    delay(350);
    frente(2000);
    delay(200);    
    flag = 1;}
    else
    radar();    
    break;
    case 3:         //dá ré indo pra direita e depois avança pra tentar pegar o oponente de lado.
   if (flag==0){
      int velocidade = 2000;
    esquerda(velocidade);
    delay(50);
    re(velocidade*2);
    delay(200);
    direita(velocidade);
    delay(100);
    frente(velocidade*2);
    delay(200);
    esquerda(velocidade);
    delay(200);
    frente(velocidade*2);
    delay(200);
     frente(0);
   
   flag = 1;}
    else
    radar();    
    break;
  }
   
}
