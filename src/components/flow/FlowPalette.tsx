import { blockDefinitions, BlockCategory } from '@/types/blocks';

const categories: { key: BlockCategory; label: string }[] = [
  { key: 'sensor', label: 'Sensores' },
  { key: 'action', label: 'Ações' },
  { key: 'logic', label: 'Lógica' },
];

const categoryColors: Record<string, string> = {
  sensor: 'border-[hsl(210,70%,50%)] bg-[hsl(210,70%,15%)] text-[hsl(210,70%,70%)]',
  action: 'border-[hsl(145,60%,45%)] bg-[hsl(145,60%,12%)] text-[hsl(145,60%,65%)]',
  logic: 'border-[hsl(45,80%,55%)] bg-[hsl(45,80%,14%)] text-[hsl(45,80%,70%)]',
};

const dotColors: Record<string, string> = {
  sensor: 'bg-[hsl(210,70%,50%)]',
  action: 'bg-[hsl(145,60%,45%)]',
  logic: 'bg-[hsl(45,80%,55%)]',
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
          <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {cat.label}
          </h3>
          <div className="space-y-1.5">
            {blockDefinitions
              .filter((b) => b.category === cat.key)
              .map((def) => (
                <button
                  key={def.id}
                  onClick={() => onAddNode(def.id)}
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
