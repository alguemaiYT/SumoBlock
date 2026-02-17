import { blockDefinitions, BlockCategory } from '@/types/blocks';

const categories: { key: BlockCategory; label: string; tooltip?: string }[] = [
  { key: 'sensor', label: 'Sensores', tooltip: 'Leituras do robô (distância, linha)' },
  { key: 'action', label: 'Ações', tooltip: 'Comandos de movimento' },
  { key: 'gate', label: 'Portas Lógicas', tooltip: 'Combine sensores com E/OU/NÃO' },
  { key: 'logic', label: 'Lógica', tooltip: 'Repetição e condições' },
];

const categoryColors: Record<string, string> = {
  sensor: 'border-[hsl(210,70%,50%)] bg-[hsl(210,70%,15%)] text-[hsl(210,70%,70%)]',
  action: 'border-[hsl(145,60%,45%)] bg-[hsl(145,60%,12%)] text-[hsl(145,60%,65%)]',
  logic: 'border-[hsl(45,80%,55%)] bg-[hsl(45,80%,14%)] text-[hsl(45,80%,70%)]',
  gate: 'border-purple-500 bg-purple-950 text-purple-300',
};

const dotColors: Record<string, string> = {
  sensor: 'bg-[hsl(210,70%,50%)]',
  action: 'bg-[hsl(145,60%,45%)]',
  logic: 'bg-[hsl(45,80%,55%)]',
  gate: 'bg-purple-500',
};

const blockTooltips: Record<string, string> = {
  sensor_front: 'Detecta objetos à frente do robô',
  sensor_side: 'Detecta objetos ao lado do robô',
  sensor_line: 'Detecta a borda da arena (linha branca)',
  action_forward: 'Move o robô para frente',
  action_backward: 'Move o robô para trás',
  action_turn_left: 'Gira o robô para a esquerda',
  action_turn_right: 'Gira o robô para a direita',
  action_stop: 'Para todos os motores',
  action_wait: 'Espera um tempo antes de continuar',
  logic_if: 'Executa ações condicionalmente',
  logic_repeat: 'Repete ações N vezes',
  gate_and: 'Combina 2 sensores: ambos devem ser verdadeiros',
  gate_or: 'Combina 2 sensores: pelo menos um verdadeiro',
  gate_not: 'Inverte o resultado de um sensor',
};

interface FlowPaletteProps {
  onAddNode: (definitionId: string) => void;
}

export function FlowPalette({ onAddNode }: FlowPaletteProps) {
  return (
    <aside className="w-full max-h-[260px] shrink-0 overflow-y-auto border-b border-border bg-card/30 p-3 md:w-56 md:max-h-none md:border-b-0 md:border-r">
      <p className="text-[10px] text-muted-foreground mb-3">
        Clique para adicionar ao fluxo
      </p>
      {categories.map((cat) => (
        <div key={cat.key} className="mb-4">
          <h3
            className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
            title={cat.tooltip}
          >
            {cat.label}
          </h3>
          <div className="space-y-1.5">
            {blockDefinitions
              .filter((b) => b.category === cat.key)
              .map((def) => (
                <button
                  key={def.id}
                  onClick={() => onAddNode(def.id)}
                  title={blockTooltips[def.id]}
                  className={`flex w-full items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer select-none transition-all hover:scale-[1.02] hover:brightness-110 ${categoryColors[def.category]}`}
                >
                  <span className={`h-2 w-2 rounded-full ${dotColors[def.category]}`} />
                  <span className="font-medium">{def.label}</span>
                </button>
              ))}
          </div>
        </div>
      ))}
    </aside>
  );
}
