import type { SumoRobotConfig } from '@/types/sumosim';

interface BottomViewProps {
  config: SumoRobotConfig;
  label: string;
  color: string;
}

/**
 * Shows the bottom (underside) of the robot so the user can see
 * where line sensors, wheels, and blade are positioned.
 */
export function BottomView({ config, label, color }: BottomViewProps) {
  const hw = config.width / 2;
  const hl = config.length / 2;
  const bladeY = -hl - config.bladeOverhang;
  const wedgeInset = config.wedgeAngle * 0.2;

  // Viewbox with some padding
  const pad = 12;
  const vbX = -hw - pad;
  const vbY = bladeY - pad;
  const vbW = config.width + pad * 2;
  const vbH = config.length + config.bladeOverhang + pad * 2;

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
        {label} — Vista Inferior
      </span>
      <svg
        viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
        className="w-56 h-56 rounded-lg border border-border bg-black/40"
        style={{ transform: 'scaleX(-1)' }} // mirror so left is left from below
      >
        {/* Ground reference */}
        <rect x={vbX} y={vbY} width={vbW} height={vbH} fill="#111" />

        {/* Chassis outline (bottom view = mirrored) */}
        <polygon
          points={`${-hw + wedgeInset},${bladeY} ${hw - wedgeInset},${bladeY} ${hw},${hl} ${-hw},${hl}`}
          fill={color}
          opacity={0.3}
          stroke={color}
          strokeWidth={0.8}
        />

        {/* Blade */}
        <line x1={-hw - 1} y1={bladeY} x2={hw + 1} y2={bladeY} stroke="#c0c0c0" strokeWidth={1.5} />

        {/* Wheels */}
        {[config.leftWheel, config.rightWheel].map((w, i) => (
          <rect
            key={i}
            x={w.offsetX - w.width}
            y={w.offsetY - w.radius}
            width={w.width * 2}
            height={w.radius * 2}
            fill="#444"
            stroke="#888"
            strokeWidth={0.5}
            rx={0.5}
          />
        ))}

        {/* Wheel axle */}
        <line
          x1={config.leftWheel.offsetX}
          y1={config.leftWheel.offsetY}
          x2={config.rightWheel.offsetX}
          y2={config.rightWheel.offsetY}
          stroke="#666"
          strokeWidth={0.5}
          strokeDasharray="1 1"
        />

        {/* Line sensors */}
        {config.lineSensors.map((ls) => (
          <g key={ls.id}>
            <circle
              cx={ls.offsetX}
              cy={ls.offsetY}
              r={2}
              fill={ls.enabled ? '#4ade80' : '#555'}
              stroke={ls.enabled ? '#22c55e' : '#444'}
              strokeWidth={0.5}
            />
            <text
              x={ls.offsetX}
              y={ls.offsetY + 5}
              textAnchor="middle"
              fill={ls.enabled ? '#86efac' : '#666'}
              fontSize={3}
              style={{ transform: 'scaleX(-1)', transformOrigin: `${ls.offsetX}px ${ls.offsetY + 5}px` }}
            >
              {ls.label.replace('Linha ', '').slice(0, 6)}
            </text>
          </g>
        ))}

        {/* Proximity sensors (shown on bottom view with their offset positions) */}
        {config.proximitySensors.map((ps) => {
          const baseX = ps.position === 'front-left' ? -hw
            : ps.position === 'front-right' ? hw
            : ps.position === 'left' ? -hw : hw;
          const baseY = ps.position.includes('front') ? bladeY : 0;
          const px = baseX + ps.offsetX;
          const py = baseY + ps.offsetY;
          const sensorAngleRad = (ps.angle * Math.PI) / 180;
          const rayLen = Math.min(ps.range * 0.4, 12);
          return (
            <g key={ps.id}>
              <circle
                cx={px}
                cy={py}
                r={1.8}
                fill={ps.enabled ? '#22d3ee' : '#555'}
                stroke={ps.enabled ? '#06b6d4' : '#444'}
                strokeWidth={0.5}
              />
              {ps.enabled && (
                <line
                  x1={px}
                  y1={py}
                  x2={px + Math.sin(sensorAngleRad) * rayLen}
                  y2={py - Math.cos(sensorAngleRad) * rayLen}
                  stroke="#22d3ee"
                  strokeWidth={0.6}
                  strokeDasharray="1 1"
                  opacity={0.7}
                />
              )}
              <text
                x={px}
                y={py + 5}
                textAnchor="middle"
                fill={ps.enabled ? '#67e8f9' : '#666'}
                fontSize={2.5}
                style={{ transform: 'scaleX(-1)', transformOrigin: `${px}px ${py + 5}px` }}
              >
                {ps.label.slice(0, 6)}
              </text>
            </g>
          );
        })}

        {/* Center crosshair */}
        <line x1={-3} y1={0} x2={3} y2={0} stroke="#555" strokeWidth={0.3} />
        <line x1={0} y1={-3} x2={0} y2={3} stroke="#555" strokeWidth={0.3} />

        {/* Front indicator */}
        <text
          x={0}
          y={bladeY - 3}
          textAnchor="middle"
          fill="#888"
          fontSize={3.5}
          fontWeight="bold"
          style={{ transform: 'scaleX(-1)', transformOrigin: `0px ${bladeY - 3}px` }}
        >
          FRENTE
        </text>
      </svg>
    </div>
  );
}
