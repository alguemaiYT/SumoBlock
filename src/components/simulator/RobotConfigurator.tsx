import type { SumoRobotConfig, ProximitySensor, LineSensor } from '@/types/sumosim';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';

interface RobotConfiguratorProps {
  config: SumoRobotConfig;
  onSetConfig: (cfg: SumoRobotConfig) => void;
  onUpdateProxSensor: (id: string, changes: Partial<ProximitySensor>) => void;
  onUpdateLineSensor: (id: string, changes: Partial<LineSensor>) => void;
  label: string;
  color: 'blue' | 'red';
}

export function RobotConfigurator({
  config,
  onSetConfig,
  onUpdateProxSensor,
  onUpdateLineSensor,
  label,
  color,
}: RobotConfiguratorProps) {
  const accent = color === 'blue' ? 'text-blue-400' : 'text-red-400';
  const dot = color === 'blue' ? 'bg-blue-500' : 'bg-red-500';

  return (
    <div className="p-3 space-y-4">
      {/* Title */}
      <div className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${accent}`}>
        <span className={`h-2 w-2 rounded-full ${dot} inline-block`} />
        {label}
      </div>

      {/* ── Shape / Physics ─────────────────────────────────────── */}
      <Section title="Forma & Física">
        <ParamRow label="Largura" value={config.width} unit="mm" min={20} max={50}
          onChange={(v) => onSetConfig({ ...config, width: v })} />
        <ParamRow label="Comprimento" value={config.length} unit="mm" min={20} max={50}
          onChange={(v) => onSetConfig({ ...config, length: v })} />
        <ParamRow label="Massa" value={config.mass} unit="g" min={100} max={500}
          onChange={(v) => onSetConfig({ ...config, mass: v })} />
        <ParamRow label="Ângulo cunha" value={config.wedgeAngle} unit="°" min={0} max={45}
          onChange={(v) => onSetConfig({ ...config, wedgeAngle: v })} />
        <ParamRow label="Lâmina (avanço)" value={config.bladeOverhang} unit="mm" min={0} max={15}
          onChange={(v) => onSetConfig({ ...config, bladeOverhang: v })} />
      </Section>

      {/* ── Rodas ───────────────────────────────────────────────── */}
      <Section title="Rodas (Traseiras)">
        <ParamRow label="Distância entre eixos" value={Math.abs(config.rightWheel.offsetX - config.leftWheel.offsetX)}
          unit="mm" min={10} max={40}
          onChange={(v) => {
            const half = v / 2;
            onSetConfig({
              ...config,
              leftWheel: { ...config.leftWheel, offsetX: -half },
              rightWheel: { ...config.rightWheel, offsetX: half },
            });
          }}
        />
        <ParamRow label="Raio roda" value={config.leftWheel.radius} unit="mm" min={2} max={10}
          onChange={(v) => onSetConfig({
            ...config,
            leftWheel: { ...config.leftWheel, radius: v },
            rightWheel: { ...config.rightWheel, radius: v },
          })}
        />
        <ParamRow label="Posição Y" value={config.leftWheel.offsetY} unit="mm" min={0} max={15}
          onChange={(v) => onSetConfig({
            ...config,
            leftWheel: { ...config.leftWheel, offsetY: v },
            rightWheel: { ...config.rightWheel, offsetY: v },
          })}
        />
      </Section>

      {/* ── Proximity Sensors ──────────────────────────────────── */}
      <Section title="Sensores de Proximidade">
        {config.proximitySensors.map((sensor) => (
          <div key={sensor.id} className="rounded border border-border bg-background/40 p-2 text-xs space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className={`font-medium ${sensor.enabled ? 'text-foreground' : 'text-muted-foreground'}`}>
                {sensor.label}
              </span>
              <Switch
                checked={sensor.enabled}
                onCheckedChange={(v) => onUpdateProxSensor(sensor.id, { enabled: v })}
                className="scale-75"
              />
            </div>
            {sensor.enabled && (
              <>
                <ParamRow label="Alcance" value={sensor.range} unit="cm" min={5} max={80}
                  onChange={(v) => onUpdateProxSensor(sensor.id, { range: v })} />
                <ParamRow label="Ângulo" value={sensor.angle} unit="°" min={-180} max={180}
                  onChange={(v) => onUpdateProxSensor(sensor.id, { angle: v })} />
                <ParamRow label="Offset X" value={sensor.offsetX} unit="" min={-15} max={15}
                  onChange={(v) => onUpdateProxSensor(sensor.id, { offsetX: v })} />
                <ParamRow label="Offset Y" value={sensor.offsetY} unit="" min={-15} max={15}
                  onChange={(v) => onUpdateProxSensor(sensor.id, { offsetY: v })} />
              </>
            )}
          </div>
        ))}
      </Section>

      {/* ── Line Sensors ───────────────────────────────────────── */}
      <Section title="Sensores de Linha (Inferior)">
        <p className="text-[10px] text-muted-foreground mb-1">
          Posicionados na parte inferior do robô — use a "Vista inferior" para visualizar.
        </p>
        {config.lineSensors.map((sensor) => (
          <div key={sensor.id} className="rounded border border-border bg-background/40 p-2 text-xs space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className={`font-medium ${sensor.enabled ? 'text-foreground' : 'text-muted-foreground'}`}>
                {sensor.label}
              </span>
              <Switch
                checked={sensor.enabled}
                onCheckedChange={(v) => onUpdateLineSensor(sensor.id, { enabled: v })}
                className="scale-75"
              />
            </div>
            {sensor.enabled && (
              <>
                <ParamRow label="Offset X" value={sensor.offsetX} unit="" min={-20} max={20}
                  onChange={(v) => onUpdateLineSensor(sensor.id, { offsetX: v })} />
                <ParamRow label="Offset Y" value={sensor.offsetY} unit="" min={-20} max={20}
                  onChange={(v) => onUpdateLineSensor(sensor.id, { offsetY: v })} />
              </>
            )}
          </div>
        ))}
      </Section>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
        {title}
      </h3>
      {children}
    </div>
  );
}

function ParamRow({
  label,
  value,
  unit,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-muted-foreground shrink-0 w-24">{label}</span>
      <Slider
        min={min}
        max={max}
        step={1}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        className="flex-1"
      />
      <span className="text-muted-foreground w-14 text-right tabular-nums">
        {value}{unit}
      </span>
    </div>
  );
}
