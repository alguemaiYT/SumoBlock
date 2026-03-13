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
void cacador(){
 Le_Sensores();
  if (sensorLD<=200||sensorLE<=200){
  re(255);
  delay(230);}
  else{
  if (sen_esq==HIGH) {
  esquerda(210);
  }
  else if (sen_dir==HIGH){
  direita(210);
  }
  else if (sen_centro_esq==HIGH||sen_centro_dir==HIGH)
  frente(245);
  else 
  frente(170);
  }
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
  Frente(200);
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
