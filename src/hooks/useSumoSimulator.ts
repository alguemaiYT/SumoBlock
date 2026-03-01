import { useState, useCallback, useRef, useEffect } from 'react';
import {
  type SumoRobotConfig,
  type ProximitySensor,
  type LineSensor,
  type SimState,
  createDefaultRobot,
  createInitialSimState,
} from '@/types/sumosim';
import type { StrategyBlock } from '@/types/flow';
import { stepSimulation, TICK_MS } from '@/lib/sumoPhysics';

const STRATEGY_BLOCKS_STORAGE_KEY = 'sumoblocks.strategyBlocks.v1';

function loadStrategyBlocks(): StrategyBlock[] {
  try {
    const raw = window.localStorage.getItem(STRATEGY_BLOCKS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function useSumoSimulator() {
  const [robotCfg, setRobotCfg] = useState<SumoRobotConfig>(() =>
    createDefaultRobot('Meu Robô', '#3b82f6', 'r'),
  );
  const [opponentCfg, setOpponentCfg] = useState<SumoRobotConfig>(() =>
    createDefaultRobot('Oponente', '#ef4444', 'op'),
  );
  const [simState, setSimState] = useState<SimState>(createInitialSimState);
  const [showBottomView, setShowBottomView] = useState(false);

  // Strategy selection
  const [strategyBlocks, setStrategyBlocks] = useState<StrategyBlock[]>(loadStrategyBlocks);
  const [robotStrategyId, setRobotStrategyId] = useState<string | null>(null);
  const [opponentStrategyId, setOpponentStrategyId] = useState<string | null>(null);

  // Refresh strategies from localStorage periodically (in case user edits in the other tab)
  useEffect(() => {
    const interval = setInterval(() => {
      setStrategyBlocks(loadStrategyBlocks());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const robotCfgRef = useRef(robotCfg);
  const opponentCfgRef = useRef(opponentCfg);

  useEffect(() => { robotCfgRef.current = robotCfg; }, [robotCfg]);
  useEffect(() => { opponentCfgRef.current = opponentCfg; }, [opponentCfg]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    setSimState((prev) => stepSimulation(prev, robotCfgRef.current, opponentCfgRef.current));
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

  // ── Config updaters ────────────────────────────────────────────────

  const updateRobotProxSensor = useCallback(
    (sensorId: string, changes: Partial<ProximitySensor>) => {
      setRobotCfg((prev) => ({
        ...prev,
        proximitySensors: prev.proximitySensors.map((s) =>
          s.id === sensorId ? { ...s, ...changes } : s,
        ),
      }));
    },
    [],
  );

  const updateRobotLineSensor = useCallback(
    (sensorId: string, changes: Partial<LineSensor>) => {
      setRobotCfg((prev) => ({
        ...prev,
        lineSensors: prev.lineSensors.map((s) =>
          s.id === sensorId ? { ...s, ...changes } : s,
        ),
      }));
    },
    [],
  );

  const updateOpponentProxSensor = useCallback(
    (sensorId: string, changes: Partial<ProximitySensor>) => {
      setOpponentCfg((prev) => ({
        ...prev,
        proximitySensors: prev.proximitySensors.map((s) =>
          s.id === sensorId ? { ...s, ...changes } : s,
        ),
      }));
    },
    [],
  );

  const updateOpponentLineSensor = useCallback(
    (sensorId: string, changes: Partial<LineSensor>) => {
      setOpponentCfg((prev) => ({
        ...prev,
        lineSensors: prev.lineSensors.map((s) =>
          s.id === sensorId ? { ...s, ...changes } : s,
        ),
      }));
    },
    [],
  );

  return {
    robotCfg,
    setRobotCfg,
    opponentCfg,
    setOpponentCfg,
    simState,
    start,
    stop,
    reset,
    showBottomView,
    setShowBottomView,
    updateRobotProxSensor,
    updateRobotLineSensor,
    updateOpponentProxSensor,
    updateOpponentLineSensor,
    strategyBlocks,
    robotStrategyId,
    setRobotStrategyId,
    opponentStrategyId,
    setOpponentStrategyId,
  };
}
