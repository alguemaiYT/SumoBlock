#include <IRremote.hpp> // include the library
#define IR_RECEIVE_PIN  12
#define SensorA A0 // sensor fx da lateral esquerda
#define SensorB A1 // sensor fx da frente esquerda
#define SensorC A2 // sensor fx da frente direita
#define SensorD A3 // sensor fx da lateral direita
#define Motor1PWMpin 10 
#define Motor2PWMpin 6  
#define AN1  9
#define AN2  8
#define BN1  5
#define BN2  4
#define sleep1 3
#define sleep2 7
#define LED_PIN_1 A5 // led no pino 5
#define LED_PIN_2 A4 // led no pino 4
int terezo = 0;
int sensorA ;
int sensorB ;
int sensorC ;
int sensorD ;
int sensorLE;
int sensorLD;
int veloc = 200;
int dist = 100;
void setup() {
  // put your setup code here, to run once:
 pinMode(SensorA,OUTPUT);
  pinMode(SensorB,OUTPUT);
  pinMode(SensorC,OUTPUT);
  pinMode(SensorD,OUTPUT);
  pinMode(LinhaDir,OUTPUT);
  pinMode(LinhaEsq,OUTPUT);
  pinMode(Motor1PWMpin,OUTPUT);
  pinMode(Motor2PWMpin,OUTPUT);
  pinMode(AN1,OUTPUT);
  pinMode(AN2,OUTPUT);
  pinMode(BN1,OUTPUT);
  pinMode(BN2,OUTPUT);
  pinMode(LED_PIN_1, OUTPUT);
  pinMode(LED_PIN_2, OUTPUT);
  pinMode(sleep1,OUTPUT);
  pinMode(sleep2,OUTPUT);
  digitalWrite(sleep1,HIGH);
  digitalWrite(sleep2,HIGH);
  digitalWrite(LED_PIN_1,HIGH);
  digitalWrite(LED_PIN_2,LOW);
  Serial.begin(9600);

//    while(1){
//   if (IrReceiver.decode()) {
//  
//          if (IrReceiver.decodedIRData.command == 0x0) {
//            terezo=1;
//            digitalWrite(LED_PIN_1,HIGH);
//            digitalWrite(LED_PIN_2,LOW);} 
//          else if (IrReceiver.decodedIRData.command == 0x1 && terezo==1) {
//           terezo=2;
//           digitalWrite(LED_PIN_1,HIGH);
//           digitalWrite(LED_PIN_2,HIGH);
//           break;}
//          else if (IrReceiver.decodedIRData.command == 0x2) {
//           terezo=3;
//          digitalWrite(LED_PIN_1,LOW);
//          digitalWrite(LED_PIN_2,LOW);
//        }
//      IrReceiver.resume();    
//    }
//}
//IrReceiver.resume(); 
}
void lesensores(){
    // put your main code here, to run repeatedly:
sensorA = analogRead(SensorA);
sensorB = analogRead(SensorB);
sensorC = analogRead(SensorC);
sensorD = analogRead(SensorD);
sensorLE= analogRead(LinhaEsq);
sensorLD= analogRead(LinhaDir);
//Serial.print("Sensor LE=");
//Serial.print(sensorA);
//Serial.print(" Sensor FE=");
//Serial.print(sensorB);
//Serial.print(" Sensor FD=");
//Serial.print(sensorC);
//Serial.print(" Sensor LD=");
//Serial.print(sensorD);
//Serial.print(" Sensor linhaD=");
//Serial.print(sensorLE);
//Serial.print(" Sensor linhaE=");
//Serial.println(sensorLD);
//delay(10);
}
void frente(){
  digitalWrite(AN1,HIGH);
  digitalWrite(AN2,LOW);
  digitalWrite(BN1,LOW);
  digitalWrite(BN2,HIGH);
  analogWrite(Motor1PWMpin,veloc);
  analogWrite(Motor2PWMpin,veloc);
}
void re(){
  digitalWrite(AN1,LOW);
  digitalWrite(AN2,HIGH);
  digitalWrite(BN1,HIGH);
  digitalWrite(BN2,LOW);
  analogWrite(Motor1PWMpin,veloc);
  analogWrite(Motor2PWMpin,veloc);
}
void direita(){
  digitalWrite(AN1,HIGH);
  digitalWrite(AN2,LOW);
  digitalWrite(BN1,HIGH);
  digitalWrite(BN2,LOW);
  analogWrite(Motor1PWMpin,veloc/3);
  analogWrite(Motor2PWMpin,veloc/3);
}
void esquerda(){
  digitalWrite(AN1,LOW);
  digitalWrite(AN2,HIGH);
  digitalWrite(BN1,LOW);
  digitalWrite(BN2,HIGH);
  analogWrite(Motor1PWMpin,veloc/3);
  analogWrite(Motor2PWMpin,veloc/3);
}
void parado(){
  digitalWrite(AN1,LOW);
  digitalWrite(AN2,LOW);
  digitalWrite(BN1,LOW);
  digitalWrite(BN2,LOW);
  analogWrite(Motor1PWMpin,0);
  analogWrite(Motor2PWMpin,0);
}
void loop() {
lesensores();
  if(sensorB>=dist && sensorC>=dist && sensorA<=dist && sensorD<=dist)//sensores da frente detectando
  {frente();}
//  if (sensorB>=dist && sensorC<=dist&& sensorA<=dist && sensorD<=dist)// sensores da frente direita somente detectando
//  {  esquerda();}
//  if (sensorB<=dist && sensorC>=dist&& sensorA<=dist && sensorD<=dist)// sensores da dir e esq detectando
//  {  direita();}
//  if (sensorB<=dist && sensorC<=dist&& sensorA>=dist&& sensorD<=dist)// sensores da frente e esquerda detectando
//  {esquerda();}
//  if (sensorB<=dist && sensorC<=dist&& sensorA<=dist&&sensorD>=dist)// sensores da direita e da frente detectando
//  {direita();}
//  if (sensorA<=dist && SensorB<=dist && SensorC<=dist && SensorD<=dist) // nenhum sensor detectando
//  {esquerda();}
}
