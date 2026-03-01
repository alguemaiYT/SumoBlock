// ============================================
// SumoBlocks — Enhanced Simulator Data Model
// ============================================

/** Sensor mounting position */
export type SensorPosition =
  | 'front-left'
  | 'front-right'
  | 'left'
  | 'right';

/** Line sensor position on the bottom of the robot */
export type LineSensorPosition =
  | 'bottom-front-left'
  | 'bottom-front-right'
  | 'bottom-rear-left'
  | 'bottom-rear-right';

export interface ProximitySensor {
  id: string;
  label: string;
  position: SensorPosition;
  /** Range in arena units */
  range: number;
  enabled: boolean;
  /** Angle in degrees from forward (0=straight ahead, negative=left, positive=right) */
  angle: number;
  /** Offset X from default position (arena units) */
  offsetX: number;
  /** Offset Y from default position (arena units, negative = forward) */
  offsetY: number;
}

export interface LineSensor {
  id: string;
  label: string;
  position: LineSensorPosition;
  enabled: boolean;
  /** Offset X from robot center (arena units) */
  offsetX: number;
  /** Offset Y from robot center (arena units, negative = forward) */
  offsetY: number;
  /** Whether currently detecting white border */
  triggered: boolean;
}

export interface WheelConfig {
  /** Offset X from robot center */
  offsetX: number;
  /** Offset Y from robot center (positive = rear) */
  offsetY: number;
  /** Wheel radius */
  radius: number;
  /** Wheel width */
  width: number;
}

export interface SumoRobotConfig {
  name: string;
  /** Overall width (mm mapped to arena units) */
  width: number;
  /** Overall length/depth */
  length: number;
  /** Mass in grams */
  mass: number;
  /** Wedge front angle in degrees (0 = flat, higher = steeper ramp) */
  wedgeAngle: number;
  /** Blade overhang in front (arena units) */
  bladeOverhang: number;
  /** Color for rendering */
  color: string;
  /** Proximity sensors (front/lateral) */
  proximitySensors: ProximitySensor[];
  /** Line sensors on the bottom */
  lineSensors: LineSensor[];
  /** Left rear wheel */
  leftWheel: WheelConfig;
  /** Right rear wheel */
  rightWheel: WheelConfig;
}

export type SimStatus = 'idle' | 'running' | 'paused' | 'finished';

export interface RobotState {
  x: number;
  y: number;
  rotation: number; // degrees
  vx: number;
  vy: number;
  angularVelocity: number;
  leftWheelSpeed: number;
  rightWheelSpeed: number;
}

export interface SimState {
  status: SimStatus;
  robot: RobotState;
  opponent: RobotState;
  elapsed: number; // ms
  winner?: 'robot' | 'opponent' | 'draw';
  /** Sensor readings for debugging */
  robotSensorReadings: Record<string, number | boolean>;
  opponentSensorReadings: Record<string, number | boolean>;
}

// ── Arena constants ────────────────────────────────────────────────────
export const DOHYO_DIAMETER = 154; // 77cm radius mini-sumo
export const DOHYO_RADIUS = DOHYO_DIAMETER / 2;
export const BORDER_WIDTH = 4; // white border width in arena units

// ── Default configs ───────────────────────────────────────────────────

export function createDefaultProximitySensors(prefix: string): ProximitySensor[] {
  return [
    { id: `${prefix}-pfl`, label: 'Frontal Esq.', position: 'front-left', range: 50, enabled: true, angle: 0, offsetX: 0, offsetY: 0 },
    { id: `${prefix}-pfr`, label: 'Frontal Dir.', position: 'front-right', range: 50, enabled: true, angle: 0, offsetX: 0, offsetY: 0 },
    { id: `${prefix}-sl`, label: 'Lateral Esq.', position: 'left', range: 30, enabled: true, angle: -90, offsetX: 0, offsetY: 0 },
    { id: `${prefix}-sr`, label: 'Lateral Dir.', position: 'right', range: 30, enabled: true, angle: 90, offsetX: 0, offsetY: 0 },
  ];
}

export function createDefaultLineSensors(prefix: string): LineSensor[] {
  return [
    { id: `${prefix}-lfl`, label: 'Linha Frontal Esq.', position: 'bottom-front-left', enabled: true, offsetX: -10, offsetY: -14, triggered: false },
    { id: `${prefix}-lfr`, label: 'Linha Frontal Dir.', position: 'bottom-front-right', enabled: true, offsetX: 10, offsetY: -14, triggered: false },
    { id: `${prefix}-lrl`, label: 'Linha Traseira Esq.', position: 'bottom-rear-left', enabled: true, offsetX: -10, offsetY: 14, triggered: false },
    { id: `${prefix}-lrr`, label: 'Linha Traseira Dir.', position: 'bottom-rear-right', enabled: true, offsetX: 10, offsetY: 14, triggered: false },
  ];
}

export function createDefaultRobot(name: string, color: string, prefix: string): SumoRobotConfig {
  return {
    name,
    width: 30,
    length: 30,
    mass: 500,
    wedgeAngle: 15,
    bladeOverhang: 5,
    color,
    proximitySensors: createDefaultProximitySensors(prefix),
    lineSensors: createDefaultLineSensors(prefix),
    leftWheel: { offsetX: -13, offsetY: 10, radius: 4, width: 3 },
    rightWheel: { offsetX: 13, offsetY: 10, radius: 4, width: 3 },
  };
}

export function createInitialRobotState(x: number, y: number, rotation: number): RobotState {
  return { x, y, rotation, vx: 0, vy: 0, angularVelocity: 0, leftWheelSpeed: 0, rightWheelSpeed: 0 };
}

export function createInitialSimState(): SimState {
  return {
    status: 'idle',
    robot: createInitialRobotState(0, 40, 0),
    opponent: createInitialRobotState(0, -40, 180),
    elapsed: 0,
    robotSensorReadings: {},
    opponentSensorReadings: {},
  };
}
