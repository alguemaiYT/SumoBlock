void radar(){
  Le_Sensores();
  if (sensorLD<=200||sensorLE<=200){
  re(255);
  delay(230);}
  else{
  if (sen_esq==HIGH) {
  esquerda(210);
  flag=LOW;
  }
  else if (sen_dir==HIGH){
  direita(210);
  flag=HIGH;
  }
  else if (sen_centro_esq==HIGH||sen_centro_dir==HIGH)
  frente(245);
  else {
    if(flag==LOW)
  esquerda(180);
    else
  direita(180);
}}
}
void hunter(){
  Le_Sensores();
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
void firula(){
  digitalWrite(12,HIGH);
  delay(300);
  digitalWrite(12,LOW);
  delay(300);
}
void suicida(){
  digitalWrite(12,HIGH);
  delay(100);
  digitalWrite(12,LOW);
  delay(100);
}
void sovai(){
  Le_Sensores();
  if (sensorLD<=200||sensorLE<=200){
  re(velocreta);
  delay(200);}
  frente(200);
}
void contorno(){
  digitalWrite(12,HIGH);
  delay(500);
  digitalWrite(12,LOW);
  delay(500);
}
void seg_linha(){
  digitalWrite(13,HIGH);
  delay(500);
  digitalWrite(13,LOW);
  delay(500);
}
void evasao() {
  re(255);
  delay(200);
  direita(255);
  delay(200);
  parado();
  delay(50);
}
