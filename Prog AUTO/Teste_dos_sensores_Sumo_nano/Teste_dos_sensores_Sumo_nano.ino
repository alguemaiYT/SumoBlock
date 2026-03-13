
void setup() {
  // put your setup code here, to run once:
Serial.begin(115200);
pinMode(A0,INPUT);
pinMode(A1,INPUT);
pinMode(A2,INPUT);
pinMode(A4,INPUT);
pinMode(A5,INPUT);
pinMode(13,INPUT_PULLUP);
}

void loop() {
  // put your main code here, to run repeatedly:

//  int sensorLD = analogRead(A4);
//  int sensorLE = analogRead(A5);
//  Serial.print("sensorLD=");
//  Serial.print(sensorLD);
//  Serial.print("  sensorLE=");
//  Serial.print(sensorLE);

int dist_sen_dir = analogRead(A0);
int dist_sen_centro = analogRead(A1);
int dist_sen_esq = analogRead(A2);

dist_sen_dir = map(dist_sen_dir,470,10,3,50);
dist_sen_centro = map(dist_sen_centro,470,10,3,50);
dist_sen_esq = map(dist_sen_esq,470,10,3,50);
Serial.print("  Sensor Direita=");
Serial.print(dist_sen_dir);
Serial.print("cm");

Serial.print("  Sensor centro=");
Serial.print(dist_sen_centro);
Serial.print("cm");

Serial.print("  Sensor Esquerda=");
Serial.print(dist_sen_esq);
Serial.print("cm");

Serial.print("  botao=");
Serial.println(digitalRead(13));



delay(100);
}
