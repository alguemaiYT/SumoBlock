# Sumo Robot Autonomous Firmware (Prog AUTO)

## Project Overview
This project contains several versions of firmware for a Sumo robot, ranging from simple movement tests to advanced autonomous combat logic. The primary development focus is on the ESP32 version (`Sumo_Auto_ESP32_V2.ino`), which features IMU-based collision detection, Bluetooth configuration, and multiple combat strategies.

### Key Technologies
- **Platform:** ESP32 (Primary), Arduino Nano (Secondary)
- **Framework:** Arduino
- **Sensors:** 
  - **Line Sensors:** TCRT5000 or similar for edge detection.
  - **Opponent Sensors:** IR proximity/range sensors (Left, Right, Center-Left, Center-Right).
  - **IMU:** MPU6050 for collision detection and stabilization.
  - **Remote Control:** IR Receiver for start/stop commands (Sony protocol).
- **Actuators:** DC Motors driven via PWM (ESP32 `ledc` API).
- **Communication:** Bluetooth Serial for real-time parameter tuning and strategy selection.

## Directory Structure
- `Sumo_Auto_ESP32_V2.ino/`: The main production firmware for ESP32.
  - `Sumo_Auto_ESP32_V2.ino.ino`: Main entry point (Setup/Loop).
  - `config.h`: Hardware pinout, PID constants, and global settings.
  - `Estrategias.ino`: High-level combat behaviors (`radar`, `cacador`, `suicida`, etc.).
  - `Motores.ino`: Motor control abstraction (Frente, Re, Direita, Esquerda).
  - `Sensores.ino`: Logic for reading and filtering sensor data.
  - `Bluetooth.ino`: Bluetooth command interface.
  - `IMU.ino`: MPU6050 initialization and collision monitoring.
- `Sumo_Auto_nano/`: Lightweight version for Arduino Nano.
- `Teste_dos_sensores_Sumo/`: Calibration and hardware verification scripts.
- `Movimenta__o_nano/`: Basic locomotion test scripts.

## Building and Running
### Requirements
- **Hardware:** ESP32 DevKit V1 or Arduino Nano.
- **Libraries:**
  - `MPU6050` by Jeff Rowberg
  - `IRremote` (v4.x)
  - `BluetoothSerial` (Built-in for ESP32)
  - `Wire` (Built-in)
  - `EEPROM` (Built-in)

### Installation
1. Open the desired `.ino` file in the Arduino IDE.
2. Ensure all required libraries are installed via the Library Manager.
3. Select the correct board (e.g., `ESP32 Dev Module` or `Arduino Nano`).
4. Configure the pins in `config.h` if your hardware wiring differs.
5. Upload to the microcontroller.

### Remote Start/Stop
The robot uses the Sony IR protocol for competition compliance:
- **Command 0x0:** Prepare/Wait.
- **Command 0x1:** Start combat.
- **Command 0x2:** Emergency Stop.

## Development Conventions
- **Modularity:** Logic is split across multiple `.ino` files in the same directory. The Arduino IDE automatically concatenates these during compilation.
- **Configuration:** All hardware-specific constants (pins, thresholds) MUST be defined in `config.h`.
- **Strategy Pattern:** Combat behaviors are encapsulated in functions within `Estrategias.ino` and toggled via the `estrategia` variable, which is persisted in EEPROM.
- **Safety:** Always include the `le_stop()` check in the main loop to ensure the IR stop command is responsive.

## Usage
- **Calibration:** Use `Teste_dos_sensores_Sumo` to find the reflection thresholds for the arena floor and border.
- **Tuning:** Use the Bluetooth interface (default name: `Madinboo_BT`) to adjust `velocreta` (straight speed) and `velocgiro` (turning speed) without re-flashing.
