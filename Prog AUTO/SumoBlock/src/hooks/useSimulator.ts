import { useState, useCallback, useRef, useEffect } from 'react';
import {
  type RobotConfig,
  type SensorConfig,
  type SimulationState,
  defaultRobotConfig,
  defaultOpponentConfig,
  createInitialSimState,
  ARENA_RADIUS,
} from '@/types/simulator';

export type OpponentMode = 'ai' | 'strategy';

const TICK_MS = 16;
const ROBOT_SPEED = 0.6;
const ROTATION_SPEED = 3;

function clampToArena(x: number, y: number, radius: number) {
  const dist = Math.sqrt(x * x + y * y);
  const maxDist = radius - 15;
  if (dist > maxDist) {
    const scale = maxDist / dist;
    return { x: x * scale, y: y * scale, out: true };
  }
  return { x, y, out: false };
}

function degToRad(deg: number) {
  return (deg * Math.PI) / 180;
}

export function useSimulator() {
  const [robotConfig, setRobotConfig] = useState<RobotConfig>(() => ({
    ...defaultRobotConfig,
    sensors: defaultRobotConfig.sensors.map((s) => ({ ...s })),
  }));
  const [opponentConfig, setOpponentConfig] = useState<RobotConfig>(() => ({
    ...defaultOpponentConfig,
    sensors: defaultOpponentConfig.sensors.map((s) => ({ ...s })),
  }));
  const [opponentMode, setOpponentMode] = useState<OpponentMode>('ai');
  const [opponentStrategyId, setOpponentStrategyId] = useState<string | null>(null);
  const [simState, setSimState] = useState<SimulationState>(createInitialSimState);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    setSimState((prev) => {
      if (prev.status !== 'running') return prev;

      const r = { ...prev.robot };
      const o = { ...prev.opponent };

      // Robot moves forward
      const rRad = degToRad(r.rotation);
      r.x += Math.sin(rRad) * ROBOT_SPEED;
      r.y -= Math.cos(rRad) * ROBOT_SPEED;

      // AI: opponent chases robot
      const dx = r.x - o.x;
      const dy = r.y - o.y;
      const targetAngle = (Math.atan2(dx, -dy) * 180) / Math.PI;
      let angleDiff = targetAngle - o.rotation;
      while (angleDiff > 180) angleDiff -= 360;
      while (angleDiff < -180) angleDiff += 360;
      o.rotation += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), ROTATION_SPEED);
      const oRad = degToRad(o.rotation);
      o.x += Math.sin(oRad) * ROBOT_SPEED * 0.85;
      o.y -= Math.cos(oRad) * ROBOT_SPEED * 0.85;

      const rc = clampToArena(r.x, r.y, ARENA_RADIUS);
      const oc = clampToArena(o.x, o.y, ARENA_RADIUS);

      if (rc.out || oc.out) {
        return {
          ...prev,
          status: 'finished',
          robot: { x: rc.x, y: rc.y, rotation: r.rotation },
          opponent: { x: oc.x, y: oc.y, rotation: o.rotation },
          elapsed: prev.elapsed + TICK_MS,
          winner: rc.out ? 'opponent' : 'robot',
        };
      }

      return {
        ...prev,
        robot: { x: rc.x, y: rc.y, rotation: r.rotation },
        opponent: { x: oc.x, y: oc.y, rotation: o.rotation },
        elapsed: prev.elapsed + TICK_MS,
      };
    });
  }, []);

  const start = useCallback(() => {
    stopTimer();
    setSimState((prev) => ({ ...prev, status: 'running' }));
    timerRef.current = setInterval(tick, TICK_MS);
  }, [tick, stopTimer]);

  const stop = useCallback(() => {
    stopTimer();
    setSimState((prev) => ({ ...prev, status: 'paused' }));
  }, [stopTimer]);

  const reset = useCallback(() => {
    stopTimer();
    setSimState(createInitialSimState());
  }, [stopTimer]);

  useEffect(() => stopTimer, [stopTimer]);

  useEffect(() => {
    if (simState.status === 'finished') stopTimer();
  }, [simState.status, stopTimer]);

  const toggleFullscreen = useCallback(() => setIsFullscreen((v) => !v), []);

  const updateRobotSensor = useCallback(
    (sensorId: string, changes: Partial<SensorConfig>) => {
      setRobotConfig((prev) => ({
        ...prev,
        sensors: prev.sensors.map((s) => (s.id === sensorId ? { ...s, ...changes } : s)),
      }));
    },
    []
  );

  const updateOpponentSensor = useCallback(
    (sensorId: string, changes: Partial<SensorConfig>) => {
      setOpponentConfig((prev) => ({
        ...prev,
        sensors: prev.sensors.map((s) => (s.id === sensorId ? { ...s, ...changes } : s)),
      }));
    },
    []
  );

  return {
    robotConfig,
    setRobotConfig,
    opponentConfig,
    setOpponentConfig,
    opponentMode,
    setOpponentMode,
    opponentStrategyId,
    setOpponentStrategyId,
    simState,
    isFullscreen,
    toggleFullscreen,
    start,
    stop,
    reset,
    updateRobotSensor,
    updateOpponentSensor,
  };
}
