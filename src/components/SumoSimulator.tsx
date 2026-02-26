import { useCallback } from 'react';
import type { RobotConfig, SimulationState, SensorConfig } from '@/types/simulator';
import { ARENA_RADIUS } from '@/types/simulator';
import type { OpponentMode } from '@/hooks/useSimulator';
import type { FlowStrategy } from '@/types/flow';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Play, Square, RotateCcw, X, Maximize2, Bot, Workflow } from 'lucide-react';

// ── Arena + Robot SVG ─────────────────────────────────────────────────

function ArenaRing() {
  return (
    <>
      <circle cx={0} cy={0} r={ARENA_RADIUS} fill="#1a1a1a" stroke="#555" strokeWidth={2} />
      <circle cx={0} cy={0} r={ARENA_RADIUS - 4} fill="none" stroke="#ddd" strokeWidth={3} />
      <line x1={-10} y1={0} x2={10} y2={0} stroke="#333" strokeWidth={1} />
      <line x1={0} y1={-10} x2={0} y2={10} stroke="#333" strokeWidth={1} />
    </>
  );
}

function RobotSvg({
  config,
  x,
  y,
  rotation,
  showSensors,
}: {
  config: RobotConfig;
  x: number;
  y: number;
  rotation: number;
  showSensors: boolean;
}) {
  const hw = config.width / 2;
  const hh = config.height / 2;
  return (
    <g transform={`translate(${x},${y}) rotate(${rotation})`}>
      <rect x={-hw} y={-hh} width={config.width} height={config.height} rx={4}
        fill={config.color} stroke="#fff" strokeWidth={1.5} opacity={0.9} />
      {/* Front direction arrow (points toward -Y = "forward") */}
      <polygon points={`0,${-hh - 6} -5,${-hh} 5,${-hh}`} fill="#fff" opacity={0.9} />
      <text y={3} textAnchor="middle" fill="#fff" fontSize={8} fontWeight="bold"
        style={{ pointerEvents: 'none' }}>
        {config.name.slice(0, 3).toUpperCase()}
      </text>
      {showSensors &&
        config.sensors.filter((s) => s.enabled).map((sensor) => {
          const rad = (sensor.angle * Math.PI) / 180;
          const ox = sensor.position.includes('right') ? hw : sensor.position.includes('left') ? -hw : 0;
          const oy = sensor.position.includes('front') ? -hh : sensor.position === 'left' || sensor.position === 'right' ? 0 : hh;
          return (
            <line key={sensor.id}
              x1={ox} y1={oy}
              x2={ox + Math.sin(rad) * sensor.range}
              y2={oy - Math.cos(rad) * sensor.range}
              stroke="#22d3ee" strokeWidth={1.5} strokeDasharray="3 2" opacity={0.7} />
          );
        })}
    </g>
  );
}

// ── Sensor config panel ──────────────────────────────────────────────

type SensorPositionKey = SensorConfig['position'];

const ALL_POSITIONS: { key: SensorPositionKey; label: string; defaultAngle: number }[] = [
  { key: 'front-left',  label: 'Frontal Esq.', defaultAngle: -15 },
  { key: 'front-right', label: 'Frontal Dir.', defaultAngle:  15 },
  { key: 'left',        label: 'Lateral Esq.', defaultAngle: -90 },
  { key: 'right',       label: 'Lateral Dir.', defaultAngle:  90 },
];

function makeSensor(position: SensorPositionKey, angle: number, idPrefix: string): SensorConfig {
  return { id: `${idPrefix}-${position}`, label: ALL_POSITIONS.find(p => p.key === position)!.label,
    position, range: position.includes('front') ? 20 : 15, enabled: true, angle };
}

interface SensorPanelProps {
  config: RobotConfig;
  idPrefix: string;
  onUpdateSensor: (id: string, changes: Partial<SensorConfig>) => void;
  onSetConfig: (cfg: RobotConfig) => void;
}

function SensorPanel({ config, idPrefix, onUpdateSensor, onSetConfig }: SensorPanelProps) {
  return (
    <div className="space-y-2">
      {ALL_POSITIONS.map(({ key, label, defaultAngle }) => {
        const sensor = config.sensors.find((s) => s.position === key);
        const active = sensor?.enabled ?? false;

        const toggle = () => {
          if (sensor) {
            onUpdateSensor(sensor.id, { enabled: !sensor.enabled });
          } else {
            const ns = makeSensor(key, defaultAngle, idPrefix);
            onSetConfig({ ...config, sensors: [...config.sensors, ns] });
          }
        };

        return (
          <div key={key} className="rounded border border-border bg-background/40 p-2 text-xs space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className={`font-medium ${active ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
              <Switch checked={active} onCheckedChange={toggle} className="scale-75" />
            </div>
            {sensor && sensor.enabled && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground shrink-0">Alcance</span>
                <input
                  type="range" min={5} max={60} step={1}
                  value={sensor.range}
                  onChange={(e) => onUpdateSensor(sensor.id, { range: Number(e.target.value) })}
                  className="flex-1 h-1 accent-cyan-400"
                />
                <span className="text-muted-foreground w-10 text-right">{sensor.range}cm</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────

interface SumoSimulatorProps {
  robotConfig: RobotConfig;
  opponentConfig: RobotConfig;
  simState: SimulationState;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  showSimulator: boolean;
  onToggleShow: (val: boolean) => void;
  onUpdateRobotSensor: (id: string, changes: Partial<SensorConfig>) => void;
  onUpdateOpponentSensor: (id: string, changes: Partial<SensorConfig>) => void;
  onSetRobotConfig: (cfg: RobotConfig) => void;
  onSetOpponentConfig: (cfg: RobotConfig) => void;
  opponentMode: OpponentMode;
  onSetOpponentMode: (mode: OpponentMode) => void;
  opponentStrategyId: string | null;
  onSetOpponentStrategyId: (id: string | null) => void;
  strategies: FlowStrategy[];
}

export function SumoSimulator({
  robotConfig, opponentConfig, simState,
  isFullscreen, onToggleFullscreen,
  onStart, onStop, onReset,
  showSimulator, onToggleShow,
  onUpdateRobotSensor, onUpdateOpponentSensor,
  onSetRobotConfig, onSetOpponentConfig,
  opponentMode, onSetOpponentMode,
  opponentStrategyId, onSetOpponentStrategyId,
  strategies,
}: SumoSimulatorProps) {
  const handleDoubleClick = useCallback(() => onToggleFullscreen(), [onToggleFullscreen]);

  const arenaViewBox = `${-ARENA_RADIUS - 10} ${-ARENA_RADIUS - 10} ${(ARENA_RADIUS + 10) * 2} ${(ARENA_RADIUS + 10) * 2}`;

  const arenaSvg = (cls: string) => (
    <svg viewBox={arenaViewBox} className={cls}>
      <ArenaRing />
      <RobotSvg config={robotConfig} x={simState.robot.x} y={simState.robot.y}
        rotation={simState.robot.rotation} showSensors />
      <RobotSvg config={opponentConfig} x={simState.opponent.x} y={simState.opponent.y}
        rotation={simState.opponent.rotation} showSensors={false} />
    </svg>
  );

  // ── Fullscreen overlay ────────────────────────────────────────────
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-black/95 overflow-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 shrink-0">
          <span className="text-sm font-semibold text-white">⚙ Simulador Sumo</span>
          <Button variant="ghost" size="icon" onClick={onToggleFullscreen}>
            <X className="h-5 w-5 text-white" />
          </Button>
        </div>

        {/* Main 3-col layout */}
        <div className="flex flex-1 gap-4 p-4 min-h-0 flex-col md:flex-row">

          {/* ── Left: My Robot ── */}
          <div className="md:w-52 shrink-0 space-y-3">
            <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-blue-500 inline-block" />
              {robotConfig.name}
            </div>
            <p className="text-[10px] text-muted-foreground">Configuração de sensores</p>
            <SensorPanel
              config={robotConfig}
              idPrefix="r"
              onUpdateSensor={onUpdateRobotSensor}
              onSetConfig={onSetRobotConfig}
            />
          </div>

          {/* ── Center: Arena + controls ── */}
          <div className="flex flex-1 flex-col items-center justify-center gap-3 min-w-0">
            {arenaSvg('w-full max-w-[440px] max-h-[55vh]')}

            {/* Status */}
            {simState.status === 'finished' && (
              <p className="text-base font-bold text-white">
                {simState.winner === 'robot' ? '🏆 Seu robô venceu!' : simState.winner === 'opponent' ? '💀 Oponente venceu!' : 'Empate!'}
              </p>
            )}
            <p className="text-[11px] text-white/50">
              ⏱ {(simState.elapsed / 1000).toFixed(1)}s ·{' '}
              <span className="capitalize">{simState.status}</span>
            </p>

            {/* Controls */}
            <div className="flex gap-2">
              <Button size="sm" onClick={onStart} disabled={simState.status === 'running'} className="gap-1">
                <Play className="h-4 w-4" /> Iniciar
              </Button>
              <Button variant="secondary" size="sm" onClick={onStop} disabled={simState.status !== 'running'} className="gap-1">
                <Square className="h-4 w-4" /> Parar
              </Button>
              <Button variant="outline" size="sm" onClick={onReset} className="gap-1">
                <RotateCcw className="h-4 w-4" /> Reiniciar
              </Button>
            </div>
          </div>

          {/* ── Right: Opponent ── */}
          <div className="md:w-52 shrink-0 space-y-3">
            <div className="text-xs font-semibold text-red-400 uppercase tracking-wider flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-500 inline-block" />
              {opponentConfig.name}
            </div>

            {/* Mode selector */}
            <p className="text-[10px] text-muted-foreground">Modo do oponente</p>
            <div className="flex rounded-md border border-border overflow-hidden text-xs">
              <button
                onClick={() => onSetOpponentMode('ai')}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 transition-colors ${
                  opponentMode === 'ai' ? 'bg-red-900/60 text-red-300' : 'text-muted-foreground hover:bg-accent'
                }`}
              >
                <Bot className="h-3 w-3" /> IA
              </button>
              <button
                onClick={() => onSetOpponentMode('strategy')}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 transition-colors ${
                  opponentMode === 'strategy' ? 'bg-red-900/60 text-red-300' : 'text-muted-foreground hover:bg-accent'
                }`}
              >
                <Workflow className="h-3 w-3" /> Estratégia
              </button>
            </div>

            {/* Strategy selector */}
            {opponentMode === 'strategy' && (
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground">Selecionar estratégia</p>
                <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                  {strategies.length === 0 && (
                    <p className="text-[10px] text-muted-foreground italic">Nenhuma estratégia disponível</p>
                  )}
                  {strategies.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => onSetOpponentStrategyId(s.id)}
                      className={`w-full text-left rounded px-2 py-1.5 text-xs transition-colors truncate ${
                        opponentStrategyId === s.id
                          ? 'bg-red-900/60 text-red-300 font-medium'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      }`}
                    >
                      {s.name || 'Sem nome'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Opponent sensor config */}
            <p className="text-[10px] text-muted-foreground pt-1">Sensores do oponente</p>
            <SensorPanel
              config={opponentConfig}
              idPrefix="op"
              onUpdateSensor={onUpdateOpponentSensor}
              onSetConfig={onSetOpponentConfig}
            />
          </div>
        </div>
      </div>
    );
  }

  // ── Inline (mini) view ───────────────────────────────────────────────
  return (
    <div className="absolute bottom-2 right-2 z-10 flex flex-col items-end gap-1">
      <div className="flex items-center gap-1.5 rounded bg-card/80 border border-border px-2 py-1 text-[10px] text-muted-foreground backdrop-blur-sm">
        <span>Mapa</span>
        <Switch checked={showSimulator} onCheckedChange={onToggleShow} className="scale-75" />
        <span>Simulador</span>
      </div>

      {showSimulator && (
        <div className="rounded-lg border border-border bg-card/90 shadow-lg backdrop-blur-sm cursor-pointer select-none overflow-hidden"
          onDoubleClick={handleDoubleClick} title="Duplo clique para tela cheia">
          <div className="flex items-center justify-between px-2 py-1 border-b border-border bg-card/60">
            <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Simulador</span>
            <button onClick={onToggleFullscreen} className="text-muted-foreground hover:text-foreground">
              <Maximize2 className="h-3 w-3" />
            </button>
          </div>
          {arenaSvg('w-48 h-48')}
          <div className="px-2 py-1 text-center text-[9px] text-muted-foreground border-t border-border">
            {simState.status === 'idle' ? 'Duplo clique para simular'
              : simState.status === 'finished'
                ? simState.winner === 'robot' ? '🏆 Vitória!' : '💀 Derrota'
                : `⏱ ${(simState.elapsed / 1000).toFixed(1)}s`}
          </div>
        </div>
      )}
    </div>
  );
}
