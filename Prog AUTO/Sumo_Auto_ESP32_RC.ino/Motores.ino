// pinos dos motores:
// motor lado direito - pinos 18 e 19
// motor lado esquerdo - pinos 17 e 5
// A velocidade máxima é representada pelo valor 4095 e a min pelo 0
void drive(int CH1, int CH2) {
  int motorA = CH1+CH2;  // direita/esquerda + frente/trás
  int motorB = CH1-CH2 ;
  motorA = constrain(motorA, -4095, 4095);
  motorB = constrain(motorB, -4095, 4095);

  int pwmA = abs(motorA);
  int pwmB = abs(motorB);

  bool sentidoA = (motorA >= 0);
  bool sentidoB = (motorB >= 0);

  motorControl(1, pwmA, sentidoA);
  motorControl(2, pwmB, sentidoB);
}

void motorControl(int motor, int vel, bool sentido) {
  vel = constrain(vel, 0, 4095);
  if (motor == 1) { // Motor A
      if ( sentido == HIGH){
        ledcWrite(motorDir2, 0);
        ledcWrite(motorDir1, vel);}
      else {
        ledcWrite(motorDir1, 0);
        ledcWrite(motorDir2, vel);}
      }
   else if (motor == 2) { // Motor B
     if ( sentido == HIGH){
        ledcWrite(motorEsq2, 0);
        ledcWrite(motorEsq1, vel);}
      else {
        ledcWrite(motorEsq1, 0);
        ledcWrite(motorEsq2, vel);}
      }
}

// ==== Comandos ====
// Frente: os dois motores para frente
void frente(int velocidade) {
  motorControl(1, velocidade, true);
  motorControl(2, velocidade, true);
}

// Ré: os dois motores para trás
void re(int velocidade) {
  motorControl(1, velocidade, false);
  motorControl(2, velocidade, false);
}

// Esquerda: motor A frente, motor B ré
void esquerda(int velocidade) {
  motorControl(1, velocidade, true);
  motorControl(2, velocidade, false);
}

// Direita: motor A ré, motor B frente
void direita(int velocidade) {
  motorControl(1, velocidade, false);
  motorControl(2, velocidade, true);
}

// Parar os motores
void parado() {
  motorControl(1, 0, false);
  motorControl(2, 0, false);
}
