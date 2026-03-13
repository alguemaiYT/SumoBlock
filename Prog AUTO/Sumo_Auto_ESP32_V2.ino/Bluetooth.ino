void Bluetooth(){
    if(SerialBT.available()) {
  caracter = SerialBT.read();
  palavra = palavra + caracter;

   if(caracter == '*') {    
    palavra = palavra.substring(0, palavra.length() - 1); // Delete last char *
   //     Serial.println(palavra);
        ind1 = palavra.indexOf(',');
        String comando = palavra.substring(0, ind1);
        ind2 = palavra.indexOf(',', ind1+1 );
        String valor = palavra.substring(ind1+1, ind2);
        int value = valor.toInt();
        
      Serial.print("comando = ");
        Serial.println(comando);
       Serial.print("valor = ");
        Serial.println(valor);
        Serial.println();

  
     if (comando == "EST"){
     estrategia = value;  gravareeprom(1,2,estrategia);EEPROM.commit();
     flagestrategia=HIGH;} 

     if (comando == "VR"){
     velocreta = value;  gravareeprom(3,4,velocreta);EEPROM.commit(); } 

      if (comando == "VG"){
     velocgiro = value; gravareeprom(5,6, velocgiro);EEPROM.commit(); } 

     if (comando == "HBE"){
     HBEvasao = value; gravareeprom(7,8, HBEvasao);EEPROM.commit(); } 

     if (comando == "LIP"){
     limiarParado = value; gravareeprom(9,10, limiarParado);EEPROM.commit(); } 

     if (comando == "LIE"){
     limiarEmpurrado = value; gravareeprom(11,12, limiarEmpurrado);EEPROM.commit(); } 

      if (comando == "PARADA"){
      parado();} 

     if (comando == "dados"){ 
  //    Serial.println("enviando dados");
     Le_Sensores();
     SerialBT.print(velocreta);
     SerialBT.print("|");
     SerialBT.print(velocgiro);
     SerialBT.print("|");
     SerialBT.print(HBEvasao);
     SerialBT.print("|");
     SerialBT.print(limiarParado);
     SerialBT.print("|");
     SerialBT.print(limiarEmpurrado);
     SerialBT.print("|");
     SerialBT.print(Vbat);
     SerialBT.print("|");
     SerialBT.print(sen_dir);
     SerialBT.print("|");
     SerialBT.print(sen_centro_dir);
     SerialBT.print("|");
     SerialBT.print(sen_centro_esq);
     SerialBT.print("|");
     SerialBT.print(sen_esq);
     SerialBT.print("|");
     SerialBT.print(sensorLD);
     SerialBT.print("|");
     SerialBT.println(sensorLE);
       
//     Serial.println(HBEvasao);
   Serial.print("HBEvasao=");
    Serial.print(HBEvasao);
//     Serial.print("  sensorLE=");
//     Serial.print(sensorLE);
//     Serial.print("  SD=");
//     Serial.print(sen_dir);
//     Serial.print("  SCD=");
//     Serial.print(sen_centro_dir);
//     Serial.print("  SCE=");
//     Serial.print(sen_centro_esq);
//     Serial.print("  SE=");
//     Serial.println(sen_esq);
      }
    
          palavra = "";
   }
  } 
}
