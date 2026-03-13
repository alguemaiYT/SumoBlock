void radar(){
  Le_Sensores();
  if (sensorLD<=200||sensorLE<=200){
  re(255);
  delay(200);}
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
void cacador(){
  digitalWrite(12,HIGH);
  delay(1000);
  digitalWrite(12,LOW);
  delay(1000);
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
  digitalWrite(13,HIGH);
  delay(1000);
  digitalWrite(13,LOW);
  delay(1000);
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
