void cacador(){
  
}

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
void contorno(){
  
}
void firula(){
  
}

void suicida(){
  
}

void reto(){
  
}

void seg_linha(){
  
}
