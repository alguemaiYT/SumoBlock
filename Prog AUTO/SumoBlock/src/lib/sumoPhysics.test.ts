import { describe, expect, it } from 'vitest';
import { stepSimulation } from '@/lib/sumoPhysics';
import {
  createDefaultLineSensors,
  createDefaultRobot,
  createInitialSimState,
} from '@/types/sumosim';

describe('sumoPhysics simulator controls', () => {
  it('keeps the opponent stopped when idle mode is selected', () => {
    const robotCfg = createDefaultRobot('Meu Robô', '#3b82f6', 'r');
    const opponentCfg = createDefaultRobot('Oponente', '#ef4444', 'op');
    const initial = {
      ...createInitialSimState(),
      status: 'running' as const,
    };

    const next = stepSimulation(initial, robotCfg, opponentCfg, 'idle');

    expect(next.opponent.x).toBe(initial.opponent.x);
    expect(next.opponent.y).toBe(initial.opponent.y);
    expect(next.opponent.rotation).toBe(initial.opponent.rotation);
    expect(next.opponent.leftWheelSpeed).toBe(0);
    expect(next.opponent.rightWheelSpeed).toBe(0);
    expect(next.robot.x !== initial.robot.x || next.robot.y !== initial.robot.y).toBe(true);
  });

  it('creates only front line sensors by default', () => {
    const sensors = createDefaultLineSensors('r');

    expect(sensors).toHaveLength(2);
    expect(sensors.map((sensor) => sensor.position)).toEqual([
      'bottom-front-left',
      'bottom-front-right',
    ]);
    expect(sensors.every((sensor) => sensor.offsetY < 0)).toBe(true);
  });
});
