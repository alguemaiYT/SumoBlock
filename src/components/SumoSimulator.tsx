import { useCallback } from 'react';
import type { RobotConfig, SimulationState } from '@/types/simulator';
import { ARENA_RADIUS } from '@/types/simulator';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Play, Square, RotateCcw, X, Maximize2 } from 'lucide-react';

// ── SVG sub-components ────────────────────────────────────────────────

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
      <rect
        x={-hw}
        y={-hh}
        width={config.width}
        height={config.height}
        rx={4}
        fill={config.color}
        stroke="#fff"
        strokeWidth={1.5}
        opacity={0.9}
      />
      {/* Direction arrow */}
      <polygon points={`0,${-hh - 5} -5,${-hh} 5,${-hh}`} fill="#fff" opacity={0.8} />
      <text
        y={3}
        textAnchor="middle"
        fill="#fff"
        fontSize={8}
        fontWeight="bold"
        style={{ pointerEvents: 'none' }}
      >
        {config.name.slice(0, 3).toUpperCase()}
      </text>

      {showSensors &&
        config.sensors
          .filter((s) => s.enabled)
          .map((sensor) => {
            const rad = (sensor.angle * Math.PI) / 180;
            const originX = sensor.position.includes('left') ? -hw : sensor.position.includes('right') ? hw : 0;
            const originY = sensor.position.includes('front') ? -hh : 0;
            const endX = originX + Math.sin(rad) * sensor.range;
            const endY = originY - Math.cos(rad) * sensor.range;
            return (
              <line
                key={sensor.id}
                x1={originX}
                y1={originY}
                x2={endX}
                y2={endY}
                stroke="#22d3ee"
                strokeWidth={1.5}
                strokeDasharray="3 2"
                opacity={0.7}
              />
            );
          })}
    </g>
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
}

export function SumoSimulator({
  robotConfig,
  opponentConfig,
  simState,
  isFullscreen,
  onToggleFullscreen,
  onStart,
  onStop,
  onReset,
  showSimulator,
  onToggleShow,
}: SumoSimulatorProps) {
  const handleDoubleClick = useCallback(() => {
    onToggleFullscreen();
  }, [onToggleFullscreen]);

  const arenaViewBox = `${-ARENA_RADIUS - 10} ${-ARENA_RADIUS - 10} ${(ARENA_RADIUS + 10) * 2} ${(ARENA_RADIUS + 10) * 2}`;

  // ── Fullscreen overlay ────────────────────────────────────────────
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm">
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onToggleFullscreen} title="Fechar">
            <X className="h-5 w-5 text-white" />
          </Button>
        </div>

        <svg viewBox={arenaViewBox} className="w-full max-w-[600px] max-h-[60vh]">
          <ArenaRing />
          <RobotSvg
            config={robotConfig}
            x={simState.robot.x}
            y={simState.robot.y}
            rotation={simState.robot.rotation}
            showSensors
          />
          <RobotSvg
            config={opponentConfig}
            x={simState.opponent.x}
            y={simState.opponent.y}
            rotation={simState.opponent.rotation}
            showSensors={false}
          />
        </svg>

        <div className="mt-4 flex flex-col items-center gap-3">
          {simState.status === 'finished' && (
            <p className="text-lg font-bold text-white">
              {simState.winner === 'robot'
                ? '🏆 Seu robô venceu!'
                : simState.winner === 'opponent'
                  ? '💀 Oponente venceu!'
                  : 'Empate!'}
            </p>
          )}
          <p className="text-xs text-white/60">
            Tempo: {(simState.elapsed / 1000).toFixed(1)}s · Status:{' '}
            <span className="font-semibold capitalize">{simState.status}</span>
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={onStart}
              disabled={simState.status === 'running'}
              className="gap-1"
            >
              <Play className="h-4 w-4" /> Iniciar
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={onStop}
              disabled={simState.status !== 'running'}
              className="gap-1"
            >
              <Square className="h-4 w-4" /> Parar
            </Button>
            <Button variant="outline" size="sm" onClick={onReset} className="gap-1">
              <RotateCcw className="h-4 w-4" /> Reiniciar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Inline (mini) view — replaces MiniMap ───────────────────────────
  return (
    <div className="absolute bottom-2 right-2 z-10 flex flex-col items-end gap-1">
      {/* Switch: Mapa ↔ Simulador */}
      <div className="flex items-center gap-1.5 rounded bg-card/80 border border-border px-2 py-1 text-[10px] text-muted-foreground backdrop-blur-sm">
        <span>Mapa</span>
        <Switch checked={showSimulator} onCheckedChange={onToggleShow} className="scale-75" />
        <span>Simulador</span>
      </div>

      {showSimulator && (
        <div
          className="rounded-lg border border-border bg-card/90 shadow-lg backdrop-blur-sm cursor-pointer select-none overflow-hidden"
          onDoubleClick={handleDoubleClick}
          title="Duplo clique para tela cheia"
        >
          <div className="flex items-center justify-between px-2 py-1 border-b border-border bg-card/60">
            <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
              Simulador
            </span>
            <button onClick={onToggleFullscreen} className="text-muted-foreground hover:text-foreground">
              <Maximize2 className="h-3 w-3" />
            </button>
          </div>

          <svg viewBox={arenaViewBox} className="w-48 h-48">
            <ArenaRing />
            <RobotSvg
              config={robotConfig}
              x={simState.robot.x}
              y={simState.robot.y}
              rotation={simState.robot.rotation}
              showSensors
            />
            <RobotSvg
              config={opponentConfig}
              x={simState.opponent.x}
              y={simState.opponent.y}
              rotation={simState.opponent.rotation}
              showSensors={false}
            />
          </svg>

          <div className="px-2 py-1 text-center text-[9px] text-muted-foreground border-t border-border">
            {simState.status === 'idle'
              ? 'Duplo clique para simular'
              : simState.status === 'finished'
                ? simState.winner === 'robot'
                  ? '🏆 Vitória!'
                  : '💀 Derrota'
                : `⏱ ${(simState.elapsed / 1000).toFixed(1)}s`}
          </div>
        </div>
      )}
    </div>
  );
}
