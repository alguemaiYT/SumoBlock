
// rotina para testes de sensores
void Le_Sensores(){
  sensorLD = analogRead(sensorLinhaDireita);
  sensorLE = analogRead(sensorLinhaEsquerda);
  sen_esq = digitalRead(sensorEsquerda);
  sen_centro_esq = digitalRead(sensorCentroEsquerda);
  sen_centro_dir = digitalRead(sensorCentroDireita);
  sen_dir = digitalRead(sensorDireita); 
  int leitura = analogRead(VbatPin);

  float tensaoPino = (leitura * Vref) / resolucaoADC;

  // Converte para a tensão real da bateria
  Vbat = tensaoPino * fatorDivisor;
  Serial.print("  Vbat=");
  Serial.println(Vbat);
  //mostra_sensores();
}

void mostra_sensores(){
  Serial.print("sensorLD=");
  Serial.print(sensorLD);
  Serial.print("  sensorLE=");
  Serial.print(sensorLE);

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
