import { useState, useCallback, useRef, useEffect } from 'react';
import {
  OPPONENT_IDLE_OPTION_ID,
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
  const initialSimState = createInitialSimState();
  const [robotCfg, setRobotCfg] = useState<SumoRobotConfig>(() =>
    createDefaultRobot('Meu Robô', '#3b82f6', 'r'),
  );
  const [opponentCfg, setOpponentCfg] = useState<SumoRobotConfig>(() =>
    createDefaultRobot('Oponente', '#ef4444', 'op'),
  );
  const [simSnapshot, setSimSnapshot] = useState<SimState>(initialSimState);
  const [showBottomView, setShowBottomView] = useState(false);

  // Strategy selection
  const [strategyBlocks, setStrategyBlocks] = useState<StrategyBlock[]>(loadStrategyBlocks);
  const [robotStrategyId, setRobotStrategyId] = useState<string | null>(null);
  const [opponentStrategyId, setOpponentStrategyId] = useState<string | null>(null);

  const simStateRef = useRef<SimState>(initialSimState);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const accumulatorRef = useRef(0);
  const lastUiUpdateRef = useRef(0);
  const robotCfgRef = useRef(robotCfg);
  const opponentCfgRef = useRef(opponentCfg);
  const opponentBehaviorRef = useRef<'ai' | 'idle'>('ai');

  useEffect(() => { robotCfgRef.current = robotCfg; }, [robotCfg]);
  useEffect(() => { opponentCfgRef.current = opponentCfg; }, [opponentCfg]);
  useEffect(() => {
    opponentBehaviorRef.current =
      opponentStrategyId === OPPONENT_IDLE_OPTION_ID ? 'idle' : 'ai';
  }, [opponentStrategyId]);

  // Refresh strategies from localStorage when other tabs update it
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STRATEGY_BLOCKS_STORAGE_KEY) {
        setStrategyBlocks(loadStrategyBlocks());
      }
    };
    const handleVisibility = () => {
      if (!document.hidden) {
        setStrategyBlocks(loadStrategyBlocks());
      }
    };

    window.addEventListener('storage', handleStorage);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('storage', handleStorage);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    lastTimeRef.current = null;
    accumulatorRef.current = 0;
  }, []);

  const updateSnapshotIfNeeded = useCallback((now: number) => {
    if (now - lastUiUpdateRef.current < 100) return;
    lastUiUpdateRef.current = now;
    setSimSnapshot(simStateRef.current);
  }, []);

  const runFrame = useCallback((now: number) => {
    if (rafRef.current === null) return;
    if (lastTimeRef.current === null) {
      lastTimeRef.current = now;
    }

    const delta = now - lastTimeRef.current;
    lastTimeRef.current = now;
    accumulatorRef.current += delta;

    let steps = 0;
    while (accumulatorRef.current >= TICK_MS && steps < 5) {
      const next = stepSimulation(
        simStateRef.current,
        robotCfgRef.current,
        opponentCfgRef.current,
        opponentBehaviorRef.current,
      );
      simStateRef.current = next;
      accumulatorRef.current -= TICK_MS;
      steps += 1;

      if (next.status !== 'running') {
        setSimSnapshot(next);
        stopLoop();
        return;
      }
    }

    updateSnapshotIfNeeded(now);
    if (!document.hidden && simStateRef.current.status === 'running') {
      rafRef.current = requestAnimationFrame(runFrame);
    } else {
      stopLoop();
    }
  }, [stopLoop, updateSnapshotIfNeeded]);

  const start = useCallback(() => {
    stopLoop();
    simStateRef.current = { ...simStateRef.current, status: 'running' };
    setSimSnapshot(simStateRef.current);
    lastUiUpdateRef.current = 0;
    if (!document.hidden) {
      rafRef.current = requestAnimationFrame(runFrame);
    }
  }, [runFrame, stopLoop]);

  const stop = useCallback(() => {
    stopLoop();
    simStateRef.current = { ...simStateRef.current, status: 'paused' };
    setSimSnapshot(simStateRef.current);
  }, [stopLoop]);

  const reset = useCallback(() => {
    stopLoop();
    const next = createInitialSimState();
    simStateRef.current = next;
    setSimSnapshot(next);
  }, [stopLoop]);

  useEffect(() => () => stopLoop(), [stopLoop]);
  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden && simStateRef.current.status === 'running' && rafRef.current === null) {
        rafRef.current = requestAnimationFrame(runFrame);
      } else if (document.hidden) {
        stopLoop();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [runFrame, stopLoop]);

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
    simState: simSnapshot,
    getSimState: () => simStateRef.current,
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
    opponentBehavior: opponentStrategyId === OPPONENT_IDLE_OPTION_ID ? 'idle' : 'ai',
  };
}
