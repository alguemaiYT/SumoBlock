import { useDraggable } from '@dnd-kit/core';
import { BlockDefinition, BlockInstance, getDefinition } from '@/types/blocks';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const categoryStyles: Record<string, { border: string; bg: string; text: string; dot: string }> = {
  sensor: {
    border: 'border-[hsl(210,70%,50%)]',
    bg: 'bg-[hsl(210,70%,15%)]',
    text: 'text-[hsl(210,70%,70%)]',
    dot: 'bg-[hsl(210,70%,50%)]',
  },
  action: {
    border: 'border-[hsl(145,60%,45%)]',
    bg: 'bg-[hsl(145,60%,12%)]',
    text: 'text-[hsl(145,60%,65%)]',
    dot: 'bg-[hsl(145,60%,45%)]',
  },
  logic: {
    border: 'border-[hsl(45,80%,55%)]',
    bg: 'bg-[hsl(45,80%,14%)]',
    text: 'text-[hsl(45,80%,70%)]',
    dot: 'bg-[hsl(45,80%,55%)]',
  },
};

// Palette block (draggable source)
export function PaletteBlock({ definition }: { definition: BlockDefinition }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${definition.id}`,
    data: { type: 'palette', definitionId: definition.id },
  });

  const style = categoryStyles[definition.category];

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        'flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-grab select-none transition-opacity',
        style.border,
        style.bg,
        style.text,
        isDragging && 'opacity-40'
      )}
    >
      <span className={cn('h-2 w-2 rounded-full', style.dot)} />
      <span className="font-medium">{definition.label}</span>
      {definition.params.length > 0 && (
        <span className="ml-auto text-xs opacity-60">
          {definition.params.map((p) => `${p.value}${p.unit || ''}`).join(', ')}
        </span>
      )}
    </div>
  );
}

// Workspace block (placed in workspace)
export function WorkspaceBlock({
  block,
  depth = 0,
  onRemove,
  onAddChild,
  onAddElseChild,
  onRemoveChild,
  onRemoveElseChild,
  onUpdateParams,
}: {
  block: BlockInstance;
  depth?: number;
  onRemove: (id: string) => void;
  onAddChild?: (parentId: string, child: BlockInstance) => void;
  onAddElseChild?: (parentId: string, child: BlockInstance) => void;
  onRemoveChild?: (parentId: string, childId: string) => void;
  onRemoveElseChild?: (parentId: string, childId: string) => void;
  onUpdateParams?: (instanceId: string, paramName: string, value: string | number) => void;
}) {
  const def = getDefinition(block.definitionId);
  if (!def) return null;

  const style = categoryStyles[def.category];

  const { setNodeRef: setBodyRef, isOver: isBodyOver } = useDroppable({ id: `body-${block.instanceId}` });
  const { setNodeRef: setElseRef, isOver: isElseOver } = useDroppable({ id: `else-${block.instanceId}` });

  return (
    <div className={cn('rounded-md border', style.border, style.bg)} style={{ marginLeft: depth * 16 }}>
      <div className={cn('flex items-center gap-2 px-3 py-2', style.text)}>
        <span className={cn('h-2 w-2 rounded-full shrink-0', style.dot)} />
        <span className="font-medium text-sm">{def.label}</span>
        
        <div className="flex items-center gap-2 flex-wrap">
          {block.params.map((p) => (
            <div key={p.name} className="flex items-center gap-1">
              {p.type === 'select' && p.options ? (
                <Select
                  value={String(p.value)}
                  onValueChange={(val) => onUpdateParams?.(block.instanceId, p.name, val)}
                >
                  <SelectTrigger className="h-6 w-fit min-w-[80px] text-xs px-2 py-0 border-white/20 bg-black/20 text-white">
                    <SelectValue placeholder={p.name} />
                  </SelectTrigger>
                  <SelectContent>
                    {p.options.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center gap-1">
                   {/* Label for context if needed, but keeping it minimal for now */}
                  <Input
                    type={p.type === 'number' ? 'number' : 'text'}
                    value={p.value}
                    onChange={(e) => {
                      let val: string | number = e.target.value;
                      if (p.type === 'number') {
                         val = parseFloat(val);
                         if (isNaN(val)) val = 0;
                      }
                      onUpdateParams?.(block.instanceId, p.name, val);
                    }}
                    className="h-6 w-16 text-xs px-2 py-0 border-white/20 bg-black/20 text-white"
                    placeholder={p.name}
                  />
                  {p.unit && <span className="text-[10px] opacity-60">{p.unit}</span>}
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={() => onRemove(block.instanceId)}
          className="ml-auto text-xs opacity-40 hover:opacity-100 transition-opacity"
        >
          ✕
        </button>
      </div>

      {/* Children (if/repeat body) */}
      {block.children !== undefined && (
        <div ref={setBodyRef} className={cn('mx-2 mb-2 rounded border border-dashed border-white/10 p-2 min-h-[32px]', isBodyOver ? 'bg-primary/5' : '')}>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">corpo</span>
          {block.children.map((child) => (
            <div key={child.instanceId} className="mb-1">
              <WorkspaceBlock
                block={child}
                depth={0}
                onRemove={(id) => onRemoveChild?.(block.instanceId, id)}
                onAddChild={onAddChild}
                onAddElseChild={onAddElseChild}
                onRemoveChild={onRemoveChild}
                onRemoveElseChild={onRemoveElseChild}
                onUpdateParams={onUpdateParams}
              />
            </div>
          ))}
        </div>
      )}

      {/* Else children */}
      {block.elseChildren !== undefined && (
        <div ref={setElseRef} className={cn('mx-2 mb-2 rounded border border-dashed border-white/10 p-2 min-h-[32px]', isElseOver ? 'bg-primary/5' : '')}>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">senão</span>
          {block.elseChildren.map((child) => (
            <div key={child.instanceId} className="mb-1">
              <WorkspaceBlock
                block={child}
                depth={0}
                onRemove={(id) => onRemoveElseChild?.(block.instanceId, id)}
                onAddChild={onAddChild}
                onAddElseChild={onAddElseChild}
                onRemoveChild={onRemoveChild}
                onRemoveElseChild={onRemoveElseChild}
                onUpdateParams={onUpdateParams}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
