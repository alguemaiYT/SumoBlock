#define Bot 14
#define led1 12
#define led2 13
#define motorDir1 17
#define motorDir2 5
#define motorEsq1 18
#define motorEsq2 19
#define VbatPin 36
#define LED_BUILTIN      12
#define CH1_PIN 25
#define CH2_PIN 33
#define CH3_PIN 26
#define CH4_PIN 27

volatile uint32_t ch1_start, ch2_start, ch3_start, ch4_start;
volatile int ch1_raw, ch2_raw, ch3_raw, ch4_raw;

// Valores processados (-100 a +100)
int CH1 = 0;
int CH2 = 0;
int CH3 = 0;
int CH4 = 0;

// DEADZONE (10%)
const int DEADZONE = 10;
