#include "config.h"

void IRAM_ATTR isr_ch1() {
  if (digitalRead(CH1_PIN) == HIGH)
    ch1_start = micros();
  else
    ch1_raw = micros() - ch1_start;
}

void IRAM_ATTR isr_ch2() {
  if (digitalRead(CH2_PIN) == HIGH)
    ch2_start = micros();
  else
    ch2_raw = micros() - ch2_start;
}

void IRAM_ATTR isr_ch3() {
  if (digitalRead(CH3_PIN) == HIGH)
    ch3_start = micros();
  else
    ch3_raw = micros() - ch3_start;
}

void IRAM_ATTR isr_ch4() {
  if (digitalRead(CH4_PIN) == HIGH)
    ch4_start = micros();
  else
    ch4_raw = micros() - ch4_start;
}

// -----------------------------------------------------------
// FUNÇÃO DE MAPEAR PWM PARA -100 A +100 COM DEADZONE
// -----------------------------------------------------------
int mapPWMtoPercent(int pwm) {

  // Limitar valores anormais
  if(pwm==0) pwm=1500;
  if (pwm < 1000) pwm = 1000;
  if (pwm > 2000) pwm = 2000;

  // Converter 1000–2000 µs para -100 a +100
  int val = map(pwm,
                1000, 2000,   // entrada
                -4095, 4095);   // saída

  // Aplicar deadzone
  if (abs(val) < DEADZONE)
    val = 0;

  return val;
}
void setup() {
  // put your setup code here, to run once:
Serial.begin(115200);
pinMode(motorDir1,OUTPUT);
pinMode(motorDir2,OUTPUT);
pinMode(motorEsq1,OUTPUT);
pinMode(motorEsq2,OUTPUT);
ledcAttachChannel(motorDir1, 980, 12, 0); 
ledcAttachChannel(motorDir2, 980, 12, 1);
ledcAttachChannel(motorEsq1, 980, 12, 2);// Canal 0, freq 20kHz, resolução 8 bits
ledcAttachChannel(motorEsq2, 980, 12, 3);   // Canal 1, freq 20kHz, resolução 8 bits
digitalWrite(motorDir1,0);
digitalWrite(motorDir2,0);
digitalWrite(motorEsq1,0);
digitalWrite(motorEsq2,0);
pinMode(CH1_PIN, INPUT);
pinMode(CH2_PIN, INPUT);
pinMode(CH3_PIN, INPUT);
pinMode(CH4_PIN, INPUT);
attachInterrupt(CH1_PIN, isr_ch1, CHANGE);
attachInterrupt(CH2_PIN, isr_ch2, CHANGE);
attachInterrupt(CH3_PIN, isr_ch3, CHANGE);
attachInterrupt(CH4_PIN, isr_ch4, CHANGE);
}

void Movimento1(){

  frente(4095);
  delay(200);
  re(4096);
  delay(50);
  esquerda(3500);
  delay(200);
  frente(4095);
  delay(150);
  frente(0);
  delay(100);
    
      
}

void loop() {

  CH1 = mapPWMtoPercent(ch1_raw);
  CH2 = mapPWMtoPercent(ch2_raw);
  CH3 = mapPWMtoPercent(ch3_raw);
  CH4 = mapPWMtoPercent(ch4_raw);
   Serial.print("CH1=");
  Serial.print(CH1);
  Serial.print("  CH2=");
  Serial.print(CH2);
  Serial.print("  CH3=");
  Serial.print(CH3);
  Serial.print("  CH4=");
  Serial.println(CH4);
  if (CH3 <= 1100)
  Movimento1();


 else 
  drive(CH1, CH2);
  delay(15);
}
