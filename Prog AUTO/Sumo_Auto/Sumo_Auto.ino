#include <IRremote.hpp> // include the library
#include <Wire.h>
#define IR_RECEIVE_PIN   25  
#define BUTTON_PIN 15
#define LED_PIN_1 4
#define LED_PIN_2 16
#define Motor1PWMpin 23 
#define Motor2PWMpin 19
#define target 30
#define valorSenBorda 500
int veloc = 1500;
int terezo = 0;
int estrategia = 0;
int flag =0;
unsigned long buttonPressTime = 0;
bool buttonPressed = false;
bool ledsBlinking = true; // Controla o piscar dos LEDs
unsigned long lastButtonPress = 0;
const unsigned long debounceDelay = 200;
int dist_sen_esq = 0;
int dist_sen_centro = 0;
int dist_sen_dir = 0;
const int freq = 980;
const int Motor1PWM = 0;
const int Motor2PWM = 1;
const int resolution = 12;
int timeblink = 300;
void setup() {
  Serial.begin(115200);
  Wire.begin();
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(LED_PIN_1, OUTPUT);
  pinMode(LED_PIN_2, OUTPUT);
//  pinMode(1,OUTPUT);
//  pinMode(3,OUTPUT);
//  pinMode(18,OUTPUT);
//  pinMode(5,OUTPUT);
  digitalWrite(LED_PIN_1, LOW);
  digitalWrite(LED_PIN_2, LOW);
  ledcSetup(Motor1PWM, freq, resolution);
  ledcSetup(Motor2PWM, freq, resolution);
  ledcAttachPin(Motor1PWMpin, Motor1PWM);
  ledcAttachPin(Motor2PWMpin, Motor2PWM);
//  digitalWrite(1, LOW);
//  digitalWrite(3, LOW);
//  ledcWrite(Motor1PWM, 0);
//  digitalWrite(18, LOW);
//  digitalWrite(5, LOW);
//  ledcWrite(Motor2PWM, 0);
  //Serial.print("aguardando estrategia =");
  IrReceiver.begin(IR_RECEIVE_PIN, ENABLE_LED_FEEDBACK);
  
  waitForButtonPress();
  //Serial.println(estrategia);
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
          ledcWrite(Motor1PWM, 0);
          digitalWrite(18, LOW);
          digitalWrite(5, LOW);
          ledcWrite(Motor2PWM, 0);
          while(1);
        }
        }
        IrReceiver.resume(); 
        }

int le_i2c(int adr, int reg){
  Wire.beginTransmission(adr>>1);
  Wire.write(reg);
  Wire.endTransmission();
  Wire.requestFrom(adr>>1,1);
  if(Wire.available()){
    return (Wire.read());
  }}

int Sensor(int adr){
  int dis_5e=0;
  int dis_5f=0;
  dis_5e=le_i2c(adr,0x5e);
  dis_5f=le_i2c(adr,0x5f);
  return((dis_5e*16+dis_5f)/16/4);
}

void le_sensores(){
dist_sen_dir = Sensor(0x10);
dist_sen_centro = Sensor(0x20);
dist_sen_esq = Sensor (0x80);
Serial.print("Sensor Direita=");
Serial.print(dist_sen_dir);
Serial.print("cm");
Serial.print("  Sensor centro=");
Serial.print(dist_sen_centro);
Serial.print("cm");
Serial.print("  Sensor Esquerda=");
Serial.print(dist_sen_esq);
Serial.println("cm");
delay(10);
}
void esquerda(int veloc){
  digitalWrite(1,LOW);
  digitalWrite(3,HIGH);
  digitalWrite(5,HIGH);
  digitalWrite(18,LOW);
  ledcWrite(Motor1PWM, veloc);
  ledcWrite(Motor2PWM, veloc);
}

void frente(int veloc){
  digitalWrite(1,LOW);
  digitalWrite(3,HIGH);
  digitalWrite(5,LOW);
  digitalWrite(18,HIGH);
  ledcWrite(Motor1PWM, veloc);
  ledcWrite(Motor2PWM, veloc);
}
void re(int veloc){
  digitalWrite(1,HIGH);
  digitalWrite(3,LOW);
  digitalWrite(5,HIGH);
  digitalWrite(18,LOW);
  ledcWrite(Motor1PWM, veloc);
  ledcWrite(Motor2PWM, veloc);
}
void direita(int veloc){
  digitalWrite(1,HIGH);
  digitalWrite(3,LOW);
  digitalWrite(5,LOW);
  digitalWrite(18,HIGH);
  ledcWrite(Motor1PWM, veloc);
  ledcWrite(Motor2PWM, veloc);
}
void hunter(){
  if (dist_sen_esq<=target && dist_sen_centro<=target && dist_sen_dir<=target)//todos os sensores detectando
  {frente(veloc*2); }
  if (dist_sen_esq<=target && dist_sen_centro>=target && dist_sen_dir<=target)// sensores da dir e esq detectando
  {frente(veloc); }
  if (dist_sen_esq<=target && dist_sen_centro<=target && dist_sen_dir>=target)// sensores da frente e esquerda detectando
  {frente(veloc); }
  if (dist_sen_esq>=target && dist_sen_centro<=target && dist_sen_dir<=target)// sensores da direita e da frente detectando
  {frente(veloc); }
  if (dist_sen_esq>=target && dist_sen_centro<=target && dist_sen_dir>=target)// somente do centro detectando
  {frente(veloc*2); }
  if (dist_sen_esq>=target && dist_sen_centro>=target && dist_sen_dir<=target) // somente da direita detectando
  direita(veloc);
  if (dist_sen_esq<=target && dist_sen_centro>=target && dist_sen_dir>=target) // somente da esquerda detectando
  esquerda(veloc);
  if (dist_sen_esq>=target && dist_sen_centro>=target && dist_sen_dir>=target) // nenhum sensor detectando
  frente(veloc/2);
}
void radar(){
  if(dist_sen_centro<=target&&dist_sen_dir<=target&&dist_sen_esq<=target)//todos os sensores detectando
  {frente(veloc*2);}
  if (dist_sen_centro>=target&&dist_sen_dir<=target&&dist_sen_esq<=target)// sensores da dir e esq detectando
  {frente(veloc);}
  if (dist_sen_centro<=target&&dist_sen_dir>=target&&dist_sen_esq<=target)// sensores da frente e esquerda detectando
  {frente(veloc);}
  if (dist_sen_centro<=target&&dist_sen_dir<=target&&dist_sen_esq>=target)// sensores da direita e da frente detectando
  {frente(veloc);}
  if (dist_sen_centro<=target&&dist_sen_dir>=target&&dist_sen_esq>=target)// somente do centro detectando
  {frente(veloc*2); }
  if (dist_sen_centro>=target&&dist_sen_dir<=target&&dist_sen_esq>=target) // somente da direita detectando
  direita(veloc);
  if (dist_sen_centro>=target&&dist_sen_dir>=target&&dist_sen_esq<=target) // somente da esquerda detectando
  esquerda(veloc);
  if (dist_sen_centro>=target&&dist_sen_dir>=target&&dist_sen_esq>=target) // nenhum sensor detectando
  esquerda(veloc*0.75);
}
void le_borda(){
  int sensorLD = analogRead(34);
  int sensorLE = analogRead(39);
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
