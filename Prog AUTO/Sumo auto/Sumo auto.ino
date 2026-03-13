/* Calculos para o robô de mini sumo da IronCup
 *  A Roda Usada é de 32mm, portanto para cada volta a roda desloca:
 *  C = 2.pi.r = 2 . 3,14 . 16 ~= 100mm.
 *  O motor possui 600 RPM, para completar uma volta, precisa de 
 *  1 RPM ----- X ms
 *  600RPM -- 60000ms
 *  X = 60000 / 600 = 100ms para cada volta do motor.
 *  
 *  Com isso concluimos que acionando o motor por 100ms,o motor dá uma volta e o robô se desloca em 100mm. 
 *  
 *  para fazer o robô girar 90° no próprio eixo, é necessário acionar o motor por 85ms. 
 *  
 *  para fazer o robô girar 180º no próprio eixo, é necessário acionar o motor por 170ms
 *   
 */
/*******PINOUT DEFINES*********/
// it is not recommended to make changes
// nao e recomendado que se faca alteracoes
// no se recomienda hacer cambios

// LED
#define LED 6

// left motor
#define pwmL 9
#define leftMotor1 7
#define leftMotor2 8

// right motor
#define pwmR 3
#define rightMotor1 5
#define rightMotor2 4

// DIP switch
#define DIP1 10
#define DIP2 11
#define DIP3 12
#define DIP4 13

// Robocore's line sensor
#define lineL A0
#define lineR A1

// Jsumo's distance sensor
#define distL A2
#define distR A3

// Jsumo's micro-start
#define microST 2
/*******PINOUT DEFINES - END*********/

/*******FUNCTIONS*******/
//void MotorL(int pwm); // left motor / motor esquerdo / motor izquierdo
//void MotorR(int pwm); // right motor / motor direito / motor derecho
//int readDIP(); // read DIP switch / ler chave DIP / leer el interruptor DIP
/*******FUNCTIONS - END*******/

void setup() {

  /****************PINOUT CONFIG****************/
  // OUTPUTS
  pinMode(LED, OUTPUT);         // led

  // right motor
  pinMode(pwmR, OUTPUT);        // right motor power
  pinMode(rightMotor1, OUTPUT); // right motor dir.
  pinMode(rightMotor2, OUTPUT); // right motor dir.

  // left motor
  pinMode(pwmL, OUTPUT);        // left motor power
  pinMode(leftMotor1, OUTPUT);  // left motor dir.
  pinMode(leftMotor2, OUTPUT);  // left motor dir.


  // INPUTS: DO NOT CHANGE / NAO MUDAR / NO CAMBIAR
  // DIP switch
  pinMode(DIP1, INPUT_PULLUP);  // DO NOT CHANGE / NAO MUDAR / NO CAMBIAR
  pinMode(DIP2, INPUT_PULLUP);  // DO NOT CHANGE / NAO MUDAR / NO CAMBIAR
  pinMode(DIP3, INPUT_PULLUP);  // DO NOT CHANGE / NAO MUDAR / NO CAMBIAR
  pinMode(DIP4, INPUT_PULLUP);  // DO NOT CHANGE / NAO MUDAR / NO CAMBIAR

  // line sensor
  pinMode(lineL, INPUT); // DO NOT CHANGE / NAO MUDAR / NO CAMBIAR
  pinMode(lineR, INPUT); // DO NOT CHANGE / NAO MUDAR / NO CAMBIAR

  // distance sensor
  pinMode(distR, INPUT); // DO NOT CHANGE / NAO MUDAR / NO CAMBIAR
  pinMode(distL, INPUT); // DO NOT CHANGE / NAO MUDAR / NO CAMBIAR

  // micro-start
  pinMode(microST, INPUT); // DO NOT CHANGE / NAO MUDAR / NO CAMBIAR
  /****************PINOUT CONFIG - END***************/

  /***************INITIAL CONDITIONS*****************/
  digitalWrite(LED, LOW); // LED off / LED desligado / LED apagado
  MotorL(0); // left motor stopped / motor esquerdo parado / motor izquierdo parado
  MotorR(0); // right motor stopped / motor direito parado / motor derecho parado
  /*************INITIAL CONDITIONS - END*************/
  while (microST==LOW)
  {
    delay(1);
  }
}

/**LEFT MOTOR CONTROL / CONTROLE DO MOTOR ESQUERDO / CONTROL DEL MOTOR IZQUIERDO**/
// pwm = 0 -> stopped / parado / parado
// 0<pwm<=255 -> forward / para frente / seguir adelante
// -255<=pwm<0 -> backward / para tras / seguir espalda
void MotorL(int pwm) {
  // leftMotor1=0 and leftMotor2=0 -> stopped / parado / parado
  // leftMotor1=0 and leftMotor2=1 -> moves forward / avanca / avanzar
  // leftMotor1=1 and leftMotor2=0 -> moves back / recua / retrocede
  // leftMotor1=1 and leftMotor2=1 -> stopped (braked) / parado (travado) / parado (frenado)

  if (pwm == 0) {
    digitalWrite(leftMotor1, LOW);
    digitalWrite(leftMotor2, LOW);
  }
  else if (pwm < 0)
  {
    analogWrite(pwmL, -pwm);
    digitalWrite(leftMotor1, HIGH);
    digitalWrite(leftMotor2, LOW);
  }
  else
  {
    analogWrite(pwmL, pwm);
    digitalWrite(leftMotor1, LOW);
    digitalWrite(leftMotor2, HIGH);
  }
}


/**RIGHT MOTOR CONTROL / CONTROLE DO MOTOR DIREITO / CONTROL DEL MOTOR DERECHO**/
// pwm = 0 -> stopped / parado / parado
// 0<pwm<=255 -> forward / frente / adelante
// -255<=pwm<0 -> backward / tras / espalda
void MotorR(int pwm) {
  // rightMotor1=0 and rightMotor2=0 -> stopped / parado / parado
  // rightMotor1=0 and rightMotor2=1 -> moves forward / avanca / avanzar
  // rightMotor1=1 and rightMotor2=0 -> moves back / recua / retrocede
  // rightMotor1=1 and rightMotor2=1 -> stopped (braked) / parado (travado) / parado (frenado)

  if (pwm == 0) {
    digitalWrite(rightMotor1, LOW);
    digitalWrite(rightMotor2, LOW);  }
  else if (pwm < 0){
    analogWrite(pwmR, -pwm);
    digitalWrite(rightMotor1, HIGH);
    digitalWrite(rightMotor2, LOW); }
  else
  {
    analogWrite(pwmR, pwm);
    digitalWrite(rightMotor1, LOW);
    digitalWrite(rightMotor2, HIGH);
  }
}

/** read DIP switch / ler chave DIP / leer el interruptor DIP **/
// returns a value between 0 and 15
// retorna um valor entre 0 e 15
// devuelve un valor entre 0 y 15
int readDIP() {
  int n = 0;
  if (digitalRead(DIP4) == HIGH)
    n = 1;
  if (digitalRead(DIP3) == HIGH)
    n |= (1 << 1);
  if (digitalRead(DIP2) == HIGH)
    n |= (1 << 2);
  if (digitalRead(DIP1) == HIGH)
    n |= (1 << 3);
}
void virar_esquerda(int velocidade_e) {
  MotorL(velocidade_e);
  MotorR(-velocidade_e);
  delay(600);
  return;
}

void virar_direita(int velocidade_e) {
  MotorR(velocidade_e);
  MotorL(-velocidade_e);
  delay(600);
  return;
}
void re(float velocidade) {
  if (velocidade >= 0){
    velocidade = velocidade * -1;}
  MotorR(velocidade);
  MotorL(velocidade);
  //aqui tem 0 = parado e -255 maxima velocidade de re
}
void frente(float velocidade) {
  if (velocidade <= 0){
    velocidade = velocidade * -1;}
  MotorR(velocidade);
  MotorL(velocidade);
  //velocidade max = 255 e min = 0
}
void lesensores(){
  
}
void estr_01() {
  float velocidade = -180;
  if ((digitalRead(distR)==HIGH) && (digitalRead(distL)==HIGH)) {

  virar_direita(velocidade);
  }
  else frente(40);
  }
void estr_02() {
  do {
    virar_direita(30);
    frente(186);
    delay(1000);
    virar_esquerda(30);
    delay(1500);
    frente(190);
    delay(1000);
    virar_esquerda(30);

  } while (!digitalRead(lineR) || !digitalRead(lineL));
}
void estr_03(){
  
}
void estr_04(){
  
}
void estr_05(){
  
}
void loop() {
  //digitalWrite(MicroStart,HIGH);
  int estrategia = readDIP();

  if (estrategia == 0) estr_01();
  if (estrategia == 1) estr_02();
  if (estrategia == 2) estr_03();
  if (estrategia == 4) estr_04();
  if (estrategia == 8) estr_05();
 /* else if (sensorL && sensorR) {
    //o robo esta com a frente para fora da arena a
    //unica opção e dar re
    do {
      re(velocidade_re);
    } while (sensorL && sensorR);
    return;
  }
}
*/
}
