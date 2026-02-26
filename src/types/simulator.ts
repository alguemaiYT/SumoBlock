// ============================================
// SumoBlocks — Simulator Data Model
// ============================================

export interface SensorConfig {
  id: string;
  label: string;
  /** Position relative to robot center: 'front-left' | 'front-right' | 'left' | 'right' */
  position: 'front-left' | 'front-right' | 'left' | 'right';
  /** Detection range in cm */
  range: number;
  /** Whether sensor is enabled */
  enabled: boolean;
  /** Angle offset from forward direction (degrees) */
  angle: number;
}

export interface RobotConfig {
  name: string;
  /** Width in arena units */
  width: number;
  /** Height (depth) in arena units */
  height: number;
  sensors: SensorConfig[];
  /** Color for rendering */
  color: string;
}

export type SimulationStatus = 'idle' | 'running' | 'paused' | 'finished';

export interface SimulationState {
  status: SimulationStatus;
  /** Robot position and rotation in arena */
  robot: { x: number; y: number; rotation: number };
  /** Opponent position and rotation in arena */
  opponent: { x: number; y: number; rotation: number };
  /** Elapsed time in ms */
  elapsed: number;
  /** Which robot won, if finished */
  winner?: 'robot' | 'opponent' | 'draw';
}

// ── Defaults ──────────────────────────────────────────────────────────────

export const defaultSensors: SensorConfig[] = [
  { id: 'sf-l', label: 'Frontal Esq.', position: 'front-left',  range: 20, enabled: true, angle: -15 },
  { id: 'sf-r', label: 'Frontal Dir.', position: 'front-right', range: 20, enabled: true, angle:  15 },
  { id: 'sl',   label: 'Lateral Esq.', position: 'left',        range: 15, enabled: true, angle: -90 },
  { id: 'sr',   label: 'Lateral Dir.', position: 'right',       range: 15, enabled: true, angle:  90 },
];

export const defaultRobotConfig: RobotConfig = {
  name: 'Meu Robô',
  width: 30,
  height: 30,
  sensors: defaultSensors.map((s) => ({ ...s })),
  color: '#3b82f6',
};

export const defaultOpponentConfig: RobotConfig = {
  name: 'Oponente',
  width: 30,
  height: 30,
  sensors: [
    { id: 'op-sf', label: 'Frontal', position: 'front-left', range: 20, enabled: true, angle: 0 },
  ],
  color: '#ef4444',
};

/** Arena diameter in the same unit as robot dimensions */
export const ARENA_DIAMETER = 154; // standard mini-sumo dohyō (77 cm radius)
export const ARENA_RADIUS = ARENA_DIAMETER / 2;

export function createInitialSimState(): SimulationState {
  return {
    status: 'idle',
    // robot starts at bottom facing up (rotation=0 → moves toward -y / opponent)
    robot:    { x: 0, y: 40, rotation: 0 },
    // opponent starts at top facing down (rotation=180 → moves toward +y / robot)
    opponent: { x: 0, y: -40, rotation: 180 },
    elapsed: 0,
  };
}
