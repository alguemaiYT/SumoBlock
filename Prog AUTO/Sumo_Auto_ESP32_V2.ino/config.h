#define sensorLinhaDireita 27
#define sensorLinhaEsquerda 35
#define sensorDireita 26
#define sensorCentroDireita 25
#define sensorCentroEsquerda 33
#define sensorEsquerda 32
#define Bot 14
#define led1 12
#define led2 13
#define motorDir1 18
#define motorDir2 19
#define motorEsq1 17
#define motorEsq2 5
#define VbatPin 36
#define IR_RECEIVE_PIN   23  
#define LED_BUILTIN      11
#define DECODE_SONY
float accelBiasX = 0.0f;      // definido na calibração (raw counts)
const float LSB_PER_G = 16384.0f; // ajuste se usar ±4g -> 8192
const float G_TO_MS2 = 9.81f;
float ema_alpha = 0.30f;      // ajuste: 0.2..0.4 recomendado
float ema_ax = 0.0f;          // estado do EMA (m/s^2)
float Vbat = 0.0;
const float Vref = 3.3;         // Tensão de referência do ADC
const int resolucaoADC = 4095;  // Resolução do ADC ESP32 (12 bits)
const float fatorDivisor = (30.0 + 10.0) / 10.0; // = 4.0 ;
const float fatorCalibracao = 1.06;
float tensaoPino ;
float tensaoBateria ;
int sensorLD = 0;
int sensorLE = 0;
int sen_esq = 0;
int sen_dir = 0;
int sen_centro_esq = 0;
int sen_centro_dir = 0;
bool flag = LOW;
MPU6050 mpu;
String device_name = "Madinboo_BT";
char caracter ;
String palavra = "";
int ind1;
int ind2;
int estrategia;
int flagestrategia;
int velocreta;
int velocgiro;
int terezo = 0;
bool HBEvasao = LOW;
unsigned long ultimaVerificacao = 0;
const unsigned long intervaloVerificacao = 500; // ms
float limiarParado = 0.1;  // m/s² (quanto menor, mais sensível)
float limiarEmpurrado = -0.25; // aceleração negativa detectando empurrão
// --------- Variáveis de calibração ----------
float accelBiasX = 0, accelBiasY = 0, accelBiasZ = 0;
 int16_t ax, ay, az, gx, gy, gz;
