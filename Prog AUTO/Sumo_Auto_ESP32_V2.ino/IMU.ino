void calibrarIMU() {
  Serial.println("Calibrando IMU...");
  const int amostras = 200;
  long somaX = 0, somaY = 0, somaZ = 0;
 
  for (int i = 0; i < amostras; i++) {
    mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);
    somaX += mpu.getAccelerationX();
    somaY += mpu.getAccelerationY();
    somaZ += mpu.getAccelerationZ();
    delay(10);
  }

  accelBiasX = somaX / (float)amostras;
  accelBiasY = somaY / (float)amostras;
  accelBiasZ = somaZ / (float)amostras;

  Serial.println("Calibracao concluida!");
}

bool detectarColisao() {
   mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);
  float ax = (mpu.getAccelerationX() - accelBiasX) / 16384.0; // em g
  float ay = (mpu.getAccelerationY() - accelBiasY) / 16384.0;
  float az = (mpu.getAccelerationZ() - accelBiasZ) / 16384.0;

  // Converte g para m/s²
  ax *= 9.81;
  ay *= 9.81;
  az *= 9.81;
 Le_Sensores();
 Serial.print("ax=");
 Serial.println(ax);
  // Se praticamente parado ou sendo empurrado
  if ((sen_centro_esq==HIGH && sen_centro_dir==HIGH)&&(abs(ax) < limiarParado || ax < limiarEmpurrado)) {
    return true;
  }
  return false;
}
float atualizarEMA(float medida) {
  // inicializar se primeira leitura
  static bool iniciada = false;
  if (!iniciada) {
    ema_ax = medida;
    iniciada = true;
    return ema_ax;
  }
  ema_ax = ema_alpha * medida + (1.0f - ema_alpha) * ema_ax;
  return ema_ax;
}
bool detectarColisaoEMA(bool motoresFrente) {
  int16_t axRaw, ayRaw, azRaw, gx, gy, gz;
  mpu.getMotion6(&axRaw, &ayRaw, &azRaw, &gx, &gy, &gz);

  float ax_corrected_counts = (float)axRaw - accelBiasX;
  float ax_g = ax_corrected_counts / LSB_PER_G;
  float ax_ms2 = ax_g * G_TO_MS2;

  float ax_filtrado = atualizarEMA(ax_ms2);

  // opcional: debug
  // Serial.printf("ax_raw=%d ax_ms2=%.3f ax_ema=%.3f\n", axRaw, ax_ms2, ax_filtrado);

  if (motoresFrente) {
    if (fabs(ax_filtrado) < limiarParado) return true;    // travado
    if (ax_filtrado < limiarEmpurrado) return true;      // sendo empurrado pra trás
  }
  return false;
}
