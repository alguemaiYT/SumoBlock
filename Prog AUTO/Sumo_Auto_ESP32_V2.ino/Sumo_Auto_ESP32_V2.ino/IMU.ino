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
