#include <MPU6050.h>
#include "config.h"
#include <Wire.h>
#include <EEPROM.h>
#include "BluetoothSerial.h"
#include <IRremote.hpp> // include the library

BluetoothSerial SerialBT;

void gravareeprom(int endereco1, int endereco2, int valor){
  int valorAtual = lereeprom(endereco1,endereco2);
  if (valorAtual == valor){
    return;
  }
  else{
      byte primeiroByte = valor&0xff;
      byte segundoByte = (valor >> 8) &0xff;
      EEPROM.write(endereco1,primeiroByte);
      EEPROM.write(endereco2,segundoByte);
  }
}

int lereeprom(int endereco1, int endereco2){
  int valor = 0;
  byte primeiroByte = EEPROM.read(endereco1);
  byte segundoByte = EEPROM.read(endereco2);
  valor = (segundoByte << 8) + primeiroByte;
  return valor; 
}

void setup() {
  // put your setup code here, to run once:
Wire.begin();
Serial.begin(115200);
IrReceiver.begin(IR_RECEIVE_PIN);
mpu.initialize();
estrategia = lereeprom(1,2);
velocreta = lereeprom(3,4);
velocgiro = lereeprom(5,6);
if (lereeprom(7,8)==1)HBEvasao=true; else HBEvasao=false;
limiarParado = lereeprom(9,10);
limiarEmpurrado = lereeprom(11,12);
pinMode(sensorLinhaDireita,INPUT);
pinMode(sensorLinhaEsquerda,INPUT);
pinMode(sensorDireita,INPUT);
pinMode(sensorCentroDireita,INPUT);
pinMode(sensorCentroEsquerda,INPUT);
pinMode(sensorEsquerda,INPUT);
pinMode(Bot,INPUT);
pinMode(led1,OUTPUT);
pinMode(led2,OUTPUT);
pinMode(motorDir1,OUTPUT);
pinMode(motorDir2,OUTPUT);
pinMode(motorEsq1,OUTPUT);
pinMode(motorEsq2,OUTPUT);
ledcAttachChannel(motorDir1, 20000, 8, 0); 
ledcAttachChannel(motorDir2, 20000, 8, 1);
ledcAttachChannel(motorEsq1, 20000, 8, 2);// Canal 0, freq 20kHz, resolução 8 bits
ledcAttachChannel(motorEsq2, 20000, 8, 3);   // Canal 1, freq 20kHz, resolução 8 bits
digitalWrite(motorDir1,0);
digitalWrite(motorDir2,0);
digitalWrite(motorEsq1,0);
digitalWrite(motorEsq2,0);
SerialBT.begin(device_name); //Bluetooth device name
delay(3000);
digitalWrite(led1,HIGH);
digitalWrite(led2,HIGH);
calibrarIMU();

digitalWrite(led1,LOW);
digitalWrite(led2,LOW);
   
 while(1){
  
  Bluetooth();
  if (flagestrategia==HIGH)
  break;
  else 
  flagestrategia=LOW;
  
 }
 
 while(1){
         IrReceiver.printIRResultShort(&Serial);
   if (IrReceiver.decode()) {
    Serial.print("código recebido");
      Serial.println(IrReceiver.decodedIRData.command);
      
          if (IrReceiver.decodedIRData.command == 0x0) {
            terezo=1;
            digitalWrite(led1,HIGH);
            digitalWrite(led2,LOW);} 
          else if (IrReceiver.decodedIRData.command == 0x1 && terezo==1) {
           terezo=2;
           digitalWrite(led1,HIGH);
           digitalWrite(led2,HIGH);
           break;}
          else if (IrReceiver.decodedIRData.command == 0x2) {
           terezo=3;
          digitalWrite(led1,LOW);
          digitalWrite(led2,LOW);
        }
      IrReceiver.resume();    
    }
}
ultimaVerificacao=millis();
}
void le_stop(){
   if (IrReceiver.decode()) {
     if (IrReceiver.decodedIRData.command == 0x2) {
           terezo=3;
          digitalWrite(led1,LOW);
          digitalWrite(led2,LOW);
          parado();
          ledcWrite(motorEsq1, 0);
          ledcWrite(motorEsq2, 0);
          ledcWrite(motorDir1, 0);
          ledcWrite(motorDir2, 0);
          while(1);
        }
        }
        IrReceiver.resume(); 
        }
void loop() {
  // put your main code here, to run repeatedly:
// IMU();
//frente(200); delay(1000); parado(); delay(1000);
//re(200); delay(1000); parado(); delay(1000);
//direita(200); delay(1000); parado(); delay(1000);
//esquerda(200); delay(1000); parado(); delay(1000);
Le_Sensores();
le_stop();

switch (estrategia) {
    case 1:
      radar();
    break;
    case 2:
      cacador();
    break;
    case 3:
      firula();
    break;
    case 4:
      suicida();
    break;
    case 5:
      sovai();
    break;
    case 6:
      contorno();
    break;
    case 7:
      seg_linha();
    break;
    
}
if (HBEvasao==true){
if (millis() - ultimaVerificacao > intervaloVerificacao) {
    ultimaVerificacao = millis();
    if (detectarColisao()) {
      evasao();
    }}
}
}
