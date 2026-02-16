import { useState, useRef } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { blockDefinitions, BlockCategory, createInstance, getDefinition } from '@/types/blocks';
import { PaletteBlock, WorkspaceBlock } from '@/components/BlockItem';
import Logo from '@/components/Logo';
import { useStrategyEditor } from '@/hooks/useStrategyEditor';
import { exportJSON, exportArduinoCode, importJSON } from '@/lib/strategyExporter';
import { generateArduinoCode } from '@/lib/codeGenerator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Undo2,
  Redo2,
  Trash2,
  Download,
  Upload,
  Code,
  FileJson,
  ChevronDown,
  Plus,
  X,
} from 'lucide-react';

const categories: { key: BlockCategory; label: string }[] = [
  { key: 'sensor', label: 'Sensores' },
  { key: 'action', label: 'Ações' },
  { key: 'logic', label: 'Lógica' },
];

const Index = () => {
  const editor = useStrategyEditor();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [codeOpen, setCodeOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragStart = (e: DragStartEvent) => {
    setDraggingId(e.active.id as string);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setDraggingId(null);
    const data = e.active.data.current;
    if (data?.type === 'palette' && e.over?.id === 'workspace') {
      editor.addBlock(data.definitionId);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const strategy = await importJSON(file);
      editor.loadStrategy(strategy);
    } catch {
      alert('Erro ao importar arquivo');
    }
    e.target.value = '';
  };

  const draggingDef = draggingId?.startsWith('palette-')
    ? getDefinition(draggingId.replace('palette-', ''))
    : null;

  const generatedCode = generateArduinoCode(editor.active.blocks, editor.active.name);

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex h-screen flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border bg-card px-4">
          <Logo />
          <h1 className="text-sm font-semibold tracking-wide text-foreground">SumoBlock</h1>
          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={editor.undo} title="Desfazer">
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={editor.redo} title="Refazer">
              <Redo2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={editor.clearBlocks} title="Limpar">
              <Trash2 className="h-4 w-4" />
            </Button>
            <div className="mx-2 h-5 w-px bg-border" />
            <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-1 h-3.5 w-3.5" /> Importar
            </Button>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
            <Button variant="ghost" size="sm" onClick={() => exportJSON(editor.active)}>
              <FileJson className="mr-1 h-3.5 w-3.5" /> JSON
            </Button>
            <Button variant="ghost" size="sm" onClick={() => exportArduinoCode(editor.active)}>
              <Code className="mr-1 h-3.5 w-3.5" /> Arduino
            </Button>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex h-9 shrink-0 items-center gap-px border-b border-border bg-card/50 px-2 overflow-x-auto">
          {editor.strategies.map((s, i) => (
            <button
              key={s.id}
              onClick={() => editor.setActiveIndex(i)}
              className={`flex items-center gap-1 rounded-t px-3 py-1.5 text-xs transition-colors ${
                i === editor.activeIndex
                  ? 'bg-background text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {s.name || 'Sem nome'}
              {editor.strategies.length > 1 && (
                <X
                  className="ml-1 h-3 w-3 opacity-40 hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    editor.removeTab(i);
                  }}
                />
              )}
            </button>
          ))}
          <button
            onClick={editor.addTab}
            className="ml-1 rounded p-1 text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Main content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Palette */}
          <aside className="w-56 shrink-0 overflow-y-auto border-r border-border bg-card/30 p-3">
            {categories.map((cat) => (
              <div key={cat.key} className="mb-4">
                <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {cat.label}
                </h3>
                <div className="space-y-1.5">
                  {blockDefinitions
                    .filter((b) => b.category === cat.key)
                    .map((def) => (
                      <PaletteBlock key={def.id} definition={def} />
                    ))}
                </div>
              </div>
            ))}
          </aside>

          {/* Workspace */}
          <WorkspaceDropArea
            blocks={editor.active.blocks}
            onRemove={editor.removeBlock}
            onAddChild={editor.addChildBlock}
            onAddElseChild={editor.addElseChildBlock}
            onRemoveChild={editor.removeChildBlock}
            onRemoveElseChild={editor.removeElseChildBlock}
          />

          {/* Description panel */}
          <aside className="w-64 shrink-0 overflow-y-auto border-l border-border bg-card/30 p-4">
            <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Estratégia
            </h3>
            <Input
              value={editor.active.name}
              onChange={(e) => editor.setName(e.target.value)}
              placeholder="Nome da estratégia"
              className="mb-3 text-sm"
            />
            <Textarea
              value={editor.active.description}
              onChange={(e) => editor.setDescription(e.target.value)}
              placeholder="Descreva quando usar esta estratégia, contra qual tipo de oponente, condições da arena..."
              className="min-h-[160px] text-sm"
            />
          </aside>
        </div>

        {/* Code preview */}
        <Collapsible open={codeOpen} onOpenChange={setCodeOpen}>
          <CollapsibleTrigger className="flex w-full items-center gap-2 border-t border-border bg-card px-4 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <Code className="h-3.5 w-3.5" />
            Preview do Código
            <ChevronDown className={`ml-auto h-3.5 w-3.5 transition-transform ${codeOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <pre className="max-h-56 overflow-auto border-t border-border bg-background p-4 text-xs text-muted-foreground font-mono">
              {generatedCode}
            </pre>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {draggingDef && (
          <div className="rounded-md border border-primary/50 bg-card px-3 py-2 text-sm text-foreground shadow-lg">
            {draggingDef.label}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};

// Droppable workspace area
import { useDroppable } from '@dnd-kit/core';
import { BlockInstance } from '@/types/blocks';

function WorkspaceDropArea({
  blocks,
  onRemove,
  onAddChild,
  onAddElseChild,
  onRemoveChild,
  onRemoveElseChild,
}: {
  blocks: BlockInstance[];
  onRemove: (id: string) => void;
  onAddChild: (parentId: string, child: BlockInstance) => void;
  onAddElseChild: (parentId: string, child: BlockInstance) => void;
  onRemoveChild: (parentId: string, childId: string) => void;
  onRemoveElseChild: (parentId: string, childId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: 'workspace' });

  return (
    <main
      ref={setNodeRef}
      className={`flex-1 overflow-y-auto p-4 transition-colors ${
        isOver ? 'bg-primary/5' : 'bg-background'
      }`}
    >
      {blocks.length === 0 ? (
        <div className="flex h-full items-center justify-center">
          <p className="text-sm text-muted-foreground/50">
            Arraste blocos da paleta para cá
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {blocks.map((block) => (
            <WorkspaceBlock
              key={block.instanceId}
              block={block}
              onRemove={onRemove}
              onAddChild={onAddChild}
              onAddElseChild={onAddElseChild}
              onRemoveChild={onRemoveChild}
              onRemoveElseChild={onRemoveElseChild}
            />
          ))}
        </div>
      )}
    </main>
  );
}

export default Index;
