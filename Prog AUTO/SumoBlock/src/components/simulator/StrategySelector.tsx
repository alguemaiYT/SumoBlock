import type { StrategyBlock } from '@/types/flow';
import { Workflow } from 'lucide-react';

interface StrategySelectorProps {
  strategies: StrategyBlock[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  label: string;
  accent: string;
  extraOptions?: Array<{
    id: string;
    label: string;
    description?: string;
  }>;
}

export function StrategySelector({
  strategies,
  selectedId,
  onSelect,
  label,
  accent,
  extraOptions = [],
}: StrategySelectorProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
        <Workflow className="h-3 w-3" /> Estratégia — {label}
      </h3>

      <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
        <button
          onClick={() => onSelect(null)}
          className={`w-full text-left rounded px-2 py-1.5 text-xs transition-colors truncate ${
            selectedId === null
              ? `${accent} font-medium`
              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          }`}
        >
          IA Padrão (sem estratégia)
        </button>

        {extraOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => onSelect(option.id)}
            className={`w-full text-left rounded px-2 py-1.5 text-xs transition-colors ${
              selectedId === option.id
                ? `${accent} font-medium`
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
            title={option.description || option.label}
          >
            {option.label}
            {option.description && (
              <span className="block text-[9px] text-muted-foreground/70">
                {option.description}
              </span>
            )}
          </button>
        ))}

        {strategies.length === 0 ? (
          <p className="px-1 text-[10px] italic text-muted-foreground">
            Nenhuma estratégia salva. Crie blocos de estratégia no editor principal para usá-los aqui.
          </p>
        ) : (
          strategies.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              className={`w-full text-left rounded px-2 py-1.5 text-xs transition-colors truncate ${
                selectedId === s.id
                  ? `${accent} font-medium`
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
              title={s.description || s.name}
            >
              {s.name || 'Sem nome'}
              {s.description && (
                <span className="block text-[9px] text-muted-foreground/70 truncate">
                  {s.description}
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
