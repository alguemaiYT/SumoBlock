#include <IRremote.hpp> // include the library
#define IR_RECEIVE_PIN   A5  
#define LED_BUILTIN      11
#define DECODE_SONY
#define LED_PIN_1 12
#define LED_PIN_2 2
#define Motor1PWMpin 10 
#define Motor2PWMpin 6
#define AIN1 9
#define AIN2 8
#define BIN1 5
#define BIN2 4
#define SleepA 7
#define SleepB 3
#define target 40
#define valorSenBorda 500

int veloc = 150;
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
int timeblink = 300;
void setup() {
  Serial.begin(115200);
  pinMode(13,INPUT_PULLUP);
  pinMode(A0,INPUT);
  pinMode(A1,INPUT);
  pinMode(A2,INPUT);
  pinMode(A3,INPUT);
  pinMode(A4,INPUT);
  pinMode(LED_PIN_1, OUTPUT);
  pinMode(LED_PIN_2, OUTPUT);
  pinMode(AIN1,OUTPUT);
  pinMode(AIN2,OUTPUT);
  pinMode(BIN1,OUTPUT);
  pinMode(BIN2,OUTPUT);
  pinMode(SleepA,OUTPUT);
  pinMode(SleepB,OUTPUT);
  digitalWrite(LED_PIN_1, LOW);
  digitalWrite(LED_PIN_2, LOW);
  digitalWrite(SleepA, HIGH);
  digitalWrite(SleepB, HIGH);
  digitalWrite(AIN1, LOW);
  digitalWrite(AIN2, LOW);
  analogWrite(Motor1PWMpin, 0);
  digitalWrite(BIN1, LOW);
  digitalWrite(BIN2, LOW);
  analogWrite(Motor2PWMpin, 0);
  Serial.print("aguardando estrategia =");
   IrReceiver.begin(IR_RECEIVE_PIN, ENABLE_LED_FEEDBACK);
  
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
        IrReceiver.printIRResultShort(&Serial);
   if (IrReceiver.decode()) {
    Serial.print("código recebido");
      
          if (IrReceiver.decodedIRData.command == 0x0) {
            terezo=1;
            digitalWrite(LED_PIN_1,HIGH);
            digitalWrite(LED_PIN_2,LOW);} 
          else if (IrReceiver.decodedIRData.command == 0x1 && terezo==1) {
           terezo=2;
           digitalWrite(LED_PIN_1,HIGH);
           digitalWrite(LED_PIN_2,HIGH);
           break;}
          else if (IrReceiver.decodedIRData.command == 0x2) {
           terezo=3;
          digitalWrite(LED_PIN_1,LOW);
          digitalWrite(LED_PIN_2,LOW);
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
    Serial.print("botao=");
    Serial.println(digitalRead(13));
     
    if (digitalRead(13) == LOW) {
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
          Serial.print("   Estratégia atual: ");
          Serial.println(estrategia);
        }
        // Reseta a detecção do botão
        buttonPressed = false;
        lastButtonPress = millis(); // Atualiza o tempo da última pressão do botão
      }
      // Pisca os LEDs enquanto espera (somente antes da primeira interação)
      if (ledsBlinking) {
        blinkLeds();
      }}
      }
      }

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
          digitalWrite(LED_PIN_1,LOW);
          digitalWrite(LED_PIN_2,LOW);
          digitalWrite(SleepA, HIGH);
          digitalWrite(SleepB, HIGH);
          digitalWrite(AIN1, LOW);
          digitalWrite(AIN2, LOW);
          analogWrite(Motor1PWMpin, 0);
          digitalWrite(BIN1, LOW);
          digitalWrite(BIN2, LOW);
          analogWrite(Motor2PWMpin, 0);
          while(1);
        }
        }
        IrReceiver.resume(); 
        }


void le_sensores(){
int dist_sen_dir = analogRead(A0);
int dist_sen_centro = analogRead(A1);
int dist_sen_esq = analogRead(A2);
dist_sen_dir = map(dist_sen_dir,470,10,3,50);
dist_sen_centro = map(dist_sen_centro,470,10,3,50);
dist_sen_esq = map(dist_sen_esq,470,10,3,50);
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
  digitalWrite(AIN1, LOW);
  digitalWrite(AIN2, HIGH);
  analogWrite(Motor1PWMpin, veloc);
  digitalWrite(BIN1, HIGH);
  digitalWrite(BIN2, LOW);
  analogWrite(Motor2PWMpin, veloc);
}

void frente(int veloc){
  digitalWrite(AIN1, HIGH);
  digitalWrite(AIN2, LOW);
  analogWrite(Motor1PWMpin, veloc);
  digitalWrite(BIN1, HIGH);
  digitalWrite(BIN2, LOW);
  analogWrite(Motor2PWMpin, veloc);
}
void re(int veloc){
  digitalWrite(AIN1, LOW);
  digitalWrite(AIN2, HIGH);
  analogWrite(Motor1PWMpin, veloc);
  digitalWrite(BIN1, LOW);
  digitalWrite(BIN2, HIGH);
  analogWrite(Motor2PWMpin, veloc);
}
void direita(int veloc){
  digitalWrite(AIN1, HIGH);
  digitalWrite(AIN2, LOW);
  analogWrite(Motor1PWMpin, veloc);
  digitalWrite(BIN1, LOW);
  digitalWrite(BIN2, HIGH);
  analogWrite(Motor2PWMpin, veloc);
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
  int sensorLD = analogRead(A3);
  int sensorLE = analogRead(A4);
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
 // le_borda();
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
