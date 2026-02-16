// ============================================
// SumoBlock - Arduino C++ Code Generator
// ============================================
// Modify these functions to change how blocks
// translate to Arduino code.

import { BlockInstance, getDefinition } from '@/types/blocks';

function indent(code: string, level: number): string {
  const prefix = '  '.repeat(level);
  return code
    .split('\n')
    .map((line) => (line.trim() ? prefix + line : ''))
    .join('\n');
}

function paramValue(params: { name: string; value: string | number }[], name: string): string | number {
  return params.find((p) => p.name === name)?.value ?? '';
}

function generateCondition(block: BlockInstance): string {
  const def = getDefinition(block.definitionId);
  if (!def) return 'true';

  switch (block.definitionId) {
    case 'sensor_front':
      return `readSensorFront() < ${paramValue(block.params, 'distância')}`;
    case 'sensor_side': {
      const side = paramValue(block.params, 'lado');
      const fn = side === 'esquerdo' ? 'readSensorLeft' : 'readSensorRight';
      return `${fn}() < ${paramValue(block.params, 'distância')}`;
    }
    case 'sensor_line':
      return `readLineSensor("${paramValue(block.params, 'posição')}")`;
    case 'sensor_distance':
      return `readDistance() < ${paramValue(block.params, 'distância')}`;
    default:
      return 'true';
  }
}

function generateBlock(block: BlockInstance, level: number): string {
  const def = getDefinition(block.definitionId);
  if (!def) return indent(`// Unknown block: ${block.definitionId}`, level);

  switch (block.definitionId) {
    // Actions
    case 'action_forward':
      return indent(
        `moveForward(${paramValue(block.params, 'velocidade')}, ${paramValue(block.params, 'tempo')});`,
        level
      );
    case 'action_backward':
      return indent(
        `moveBackward(${paramValue(block.params, 'velocidade')}, ${paramValue(block.params, 'tempo')});`,
        level
      );
    case 'action_turn_left':
      return indent(`turnLeft(${paramValue(block.params, 'tempo')});`, level);
    case 'action_turn_right':
      return indent(`turnRight(${paramValue(block.params, 'tempo')});`, level);
    case 'action_stop':
      return indent('stopMotors();', level);

    // Logic
    case 'logic_if': {
      const condId = paramValue(block.params, 'condição') as string;
      // Create a fake sensor block for condition
      const condBlock: BlockInstance = {
        instanceId: '',
        definitionId: condId,
        params: [], // uses defaults
      };
      let code = indent(`if (${generateCondition(condBlock)}) {`, level);
      if (block.children?.length) {
        code += '\n' + block.children.map((c) => generateBlock(c, level + 1)).join('\n');
      }
      if (block.elseChildren?.length) {
        code += '\n' + indent('} else {', level);
        code += '\n' + block.elseChildren.map((c) => generateBlock(c, level + 1)).join('\n');
      }
      code += '\n' + indent('}', level);
      return code;
    }
    case 'logic_repeat': {
      const times = paramValue(block.params, 'vezes');
      let code = indent(`for (int i = 0; i < ${times}; i++) {`, level);
      if (block.children?.length) {
        code += '\n' + block.children.map((c) => generateBlock(c, level + 1)).join('\n');
      }
      code += '\n' + indent('}', level);
      return code;
    }

    // Sensors as standalone (no-op, they're conditions)
    default:
      return indent(`// ${def.label}`, level);
  }
}

export function generateArduinoCode(blocks: BlockInstance[], strategyName: string): string {
  const header = `// ================================
// SumoBlock - Estratégia: ${strategyName}
// Gerado automaticamente
// ================================

// --- Pin definitions (customize) ---
#define MOTOR_L_FWD 3
#define MOTOR_L_BWD 4
#define MOTOR_R_FWD 5
#define MOTOR_R_BWD 6
#define SENSOR_FRONT A0
#define SENSOR_LEFT A1
#define SENSOR_RIGHT A2
#define LINE_SENSOR A3

// --- Helper functions ---
int readSensorFront() { return analogRead(SENSOR_FRONT); }
int readSensorLeft() { return analogRead(SENSOR_LEFT); }
int readSensorRight() { return analogRead(SENSOR_RIGHT); }
int readDistance() { return analogRead(SENSOR_FRONT); }
bool readLineSensor(const char* pos) { return digitalRead(LINE_SENSOR) == HIGH; }

void moveForward(int speed, int duration) {
  analogWrite(MOTOR_L_FWD, speed);
  analogWrite(MOTOR_R_FWD, speed);
  delay(duration);
  stopMotors();
}

void moveBackward(int speed, int duration) {
  analogWrite(MOTOR_L_BWD, speed);
  analogWrite(MOTOR_R_BWD, speed);
  delay(duration);
  stopMotors();
}

void turnLeft(int duration) {
  analogWrite(MOTOR_L_BWD, 200);
  analogWrite(MOTOR_R_FWD, 200);
  delay(duration);
  stopMotors();
}

void turnRight(int duration) {
  analogWrite(MOTOR_L_FWD, 200);
  analogWrite(MOTOR_R_BWD, 200);
  delay(duration);
  stopMotors();
}

void stopMotors() {
  analogWrite(MOTOR_L_FWD, 0);
  analogWrite(MOTOR_L_BWD, 0);
  analogWrite(MOTOR_R_FWD, 0);
  analogWrite(MOTOR_R_BWD, 0);
}

void setup() {
  Serial.begin(9600);
  // Wait 5 seconds (sumo rules)
  delay(5000);
}

void loop() {`;

  const body = blocks.map((b) => generateBlock(b, 1)).join('\n');
  const footer = `\n  delay(50); // Loop delay\n}`;

  return header + '\n' + body + footer;
}
