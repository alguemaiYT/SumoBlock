#include <Wire.h>

#define sensorLinhaDireita 27
#define sensorLinhaEsquerda 35
#define sensorDireita 26
#define sensorCentroDireita 25
#define sensorCentroEsquerda 33
#define sensorEsquerda 32
#define Bot 14
#define led1 12
#define led2 13


void setup() {
  // put your setup code here, to run once:
Wire.begin();
Serial.begin(115200);
pinMode(sensorLinhaDireita,INPUT);
pinMode(sensorLinhaEsquerda,INPUT);
pinMode(sensorDireita,INPUT);
pinMode(sensorCentroDireita,INPUT);
pinMode(sensorCentroEsquerda,INPUT);
pinMode(sensorEsquerda,INPUT);
pinMode(Bot,INPUT);
pinMode(led1,OUTPUT);
pinMode(led2,OUTPUT);
pinMode(18,OUTPUT);
pinMode(19,OUTPUT);
pinMode(17,OUTPUT);
pinMode(5,OUTPUT);

digitalWrite(18,LOW);
digitalWrite(19,LOW);
digitalWrite(17,LOW);
digitalWrite(5,LOW);
}
void loop() {
  // put your main code here, to run repeatedly:

  int sensorLD = analogRead(sensorLinhaDireita);
  int sensorLE = analogRead(sensorLinhaEsquerda);
  Serial.print("sensorLD=");
  Serial.print(sensorLD);
  Serial.print("  sensorLE=");
  Serial.print(sensorLE);

int sen_esq = analogRead(sensorEsquerda);
int sen_centro_esq = analogRead(sensorCentroEsquerda);
int sen_centro_dir = analogRead(sensorCentroDireita);
int sen_dir = analogRead(sensorDireita); 

Serial.print("  SD=");
Serial.print(sen_dir);

Serial.print("  SCD=");
Serial.print(sen_centro_dir);

Serial.print("  SCE=");
Serial.print(sen_centro_esq);


Serial.print("  SE=");
Serial.println(sen_esq);

int le_bot = digitalRead(Bot);
if (le_bot == HIGH)
{ digitalWrite(led1,HIGH);
  digitalWrite(led2,HIGH);
}
else
{ digitalWrite(led1,LOW);
  digitalWrite(led2,LOW); 
}
delay(10);
}
