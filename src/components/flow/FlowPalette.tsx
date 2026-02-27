import { useState } from 'react';
import { blockDefinitions, BlockCategory } from '@/types/blocks';
import { BlockHoverCard } from '@/components/BlockHoverCard';
import { Textarea } from '@/components/ui/textarea';
import type { FlowStrategy, StrategyBlock } from '@/types/flow';

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

interface FlowPaletteProps {
  onAddNode: (definitionId: string) => void;
  strategyBlocks: StrategyBlock[];
  onCreateStrategyBlock: () => void;
  onUseStrategyBlock: (blockId: string) => void;
  onLoadStrategyBlock: (blockId: string) => void;
  onUpdateStrategyBlock: (blockId: string) => void;
  onRenameStrategyBlock: (blockId: string, name: string) => void;
  onSetStrategyBlockDescription: (blockId: string, description: string) => void;
  onRemoveStrategyBlock: (blockId: string) => void;
  onGenerateWithAI: (prompt: string) => Promise<void> | void;
  onApplyGeneratedStrategy: () => void;
  onDiscardGeneratedStrategy: () => void;
  generatedStrategy: FlowStrategy | null;
  isGeneratingWithAI: boolean;
  aiError: string | null;
  hasGeminiApiKey: boolean;
}

export function FlowPalette({
  onAddNode,
  strategyBlocks,
  onCreateStrategyBlock,
  onUseStrategyBlock,
  onLoadStrategyBlock,
  onUpdateStrategyBlock,
  onRenameStrategyBlock,
  onSetStrategyBlockDescription,
  onRemoveStrategyBlock,
  onGenerateWithAI,
  onApplyGeneratedStrategy,
  onDiscardGeneratedStrategy,
  generatedStrategy,
  isGeneratingWithAI,
  aiError,
  hasGeminiApiKey,
}: FlowPaletteProps) {
  const [tab, setTab] = useState<'default' | 'strategy' | 'ai'>('default');
  const [aiPrompt, setAiPrompt] = useState('');

  const handleRename = (block: StrategyBlock) => {
    const nextName = window.prompt('Novo nome do bloco de estratégia:', block.name);
    if (nextName === null) return;
    onRenameStrategyBlock(block.id, nextName);
  };

  const handleDescription = (block: StrategyBlock) => {
    const nextDescription = window.prompt(
      'Descrição do bloco de estratégia:',
      block.description
    );
    if (nextDescription === null) return;
    onSetStrategyBlockDescription(block.id, nextDescription);
  };

  const handleRemove = (block: StrategyBlock) => {
    const shouldRemove = window.confirm(
      `Remover o bloco de estratégia "${block.name}"?`
    );
    if (!shouldRemove) return;
    onRemoveStrategyBlock(block.id);
  };

  const handleGenerateAI = () => {
    void onGenerateWithAI(aiPrompt);
  };

  return (
    <aside className="w-full max-h-[260px] shrink-0 overflow-y-auto border-b border-border bg-card/30 p-3 md:w-56 md:max-h-none md:border-b-0 md:border-r">
      <div className="mb-3 flex gap-1 rounded-md border border-border bg-background/40 p-1">
        <button
          onClick={() => setTab('default')}
          className={`flex-1 rounded px-2 py-1 text-[10px] font-semibold uppercase tracking-widest transition-colors ${
            tab === 'default'
              ? 'bg-background text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Blocos
        </button>
        <button
          onClick={() => setTab('strategy')}
          className={`flex-1 rounded px-2 py-1 text-[10px] font-semibold uppercase tracking-widest transition-colors ${
            tab === 'strategy'
              ? 'bg-background text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Estratégia
        </button>
        <button
          onClick={() => setTab('ai')}
          className={`flex-1 rounded px-2 py-1 text-[10px] font-semibold uppercase tracking-widest transition-colors ${
            tab === 'ai'
              ? 'bg-background text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          IA
        </button>
      </div>

      <p className="text-[10px] text-muted-foreground mb-3">
        {tab === 'default'
          ? 'Clique para adicionar ao fluxo'
          : tab === 'strategy'
            ? 'Compacte e reutilize estratégias'
            : 'Gere fluxo com prompt (Gemini)'}
      </p>

      {tab === 'default' ? (
        categories.map((cat) => (
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
                  <BlockHoverCard key={def.id} definitionId={def.id} side="right">
                    <button
                      onClick={() => onAddNode(def.id)}
                      className={`flex w-full items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer select-none transition-all hover:scale-[1.02] hover:brightness-110 ${categoryColors[def.category]}`}
                    >
                      <span className={`h-2 w-2 rounded-full ${dotColors[def.category]}`} />
                      <span className="font-medium">{def.label}</span>
                    </button>
                  </BlockHoverCard>
                ))}
            </div>
          </div>
        ))
      ) : tab === 'strategy' ? (
        <div className="space-y-2">
          <button
            onClick={onCreateStrategyBlock}
            className="w-full rounded-md border border-primary/50 bg-primary/10 px-2 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
          >
            + Compactar estratégia atual
          </button>

          {strategyBlocks.length === 0 ? (
            <p className="rounded-md border border-dashed border-border px-2 py-3 text-[11px] text-muted-foreground">
              Nenhum bloco de estratégia salvo ainda.
            </p>
          ) : (
            strategyBlocks.map((block) => (
              <div key={block.id} className="rounded-md border border-border bg-background/40 p-2">
                <p className="text-xs font-semibold text-foreground">{block.name}</p>
                <p className="mb-2 text-[10px] text-muted-foreground">
                  {block.description || 'Sem descrição'}
                </p>
                <p className="mb-2 text-[10px] text-muted-foreground">
                  {Math.max(block.nodes.length - 1, 0)} nós • {block.edges.length} ligações
                </p>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => onUseStrategyBlock(block.id)}
                    className="rounded border border-border px-2 py-1 text-[10px] text-foreground hover:bg-accent"
                  >
                    Usar
                  </button>
                  <button
                    onClick={() => onLoadStrategyBlock(block.id)}
                    className="rounded border border-border px-2 py-1 text-[10px] text-foreground hover:bg-accent"
                  >
                    Carregar
                  </button>
                  <button
                    onClick={() => onUpdateStrategyBlock(block.id)}
                    className="rounded border border-border px-2 py-1 text-[10px] text-foreground hover:bg-accent"
                  >
                    Atualizar
                  </button>
                  <button
                    onClick={() => handleRename(block)}
                    className="rounded border border-border px-2 py-1 text-[10px] text-foreground hover:bg-accent"
                  >
                    Nome
                  </button>
                  <button
                    onClick={() => handleDescription(block)}
                    className="rounded border border-border px-2 py-1 text-[10px] text-foreground hover:bg-accent"
                  >
                    Descrição
                  </button>
                  <button
                    onClick={() => handleRemove(block)}
                    className="rounded border border-red-500/50 px-2 py-1 text-[10px] text-red-400 hover:bg-red-500/10"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {!hasGeminiApiKey && (
            <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-2 text-[11px] text-amber-300">
              Configure `VITE_GEMINI_API_KEY` para habilitar geração.
            </p>
          )}

          <Textarea
            value={aiPrompt}
            onChange={(event) => setAiPrompt(event.target.value)}
            placeholder="Ex: Estratégia agressiva para iniciar com busca circular e atacar ao detectar oponente na esquerda"
            className="min-h-[120px] text-xs"
          />

          <button
            onClick={handleGenerateAI}
            disabled={!hasGeminiApiKey || isGeneratingWithAI || aiPrompt.trim().length === 0}
            className="w-full rounded-md border border-primary/50 bg-primary/10 px-2 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isGeneratingWithAI ? 'Gerando estratégia...' : 'Gerar estratégia com IA'}
          </button>

          {aiError && (
            <p className="rounded-md border border-red-500/40 bg-red-500/10 px-2 py-2 text-[11px] text-red-300">
              {aiError}
            </p>
          )}

          {generatedStrategy && (
            <div className="rounded-md border border-border bg-background/40 p-2 text-[11px]">
              <p className="font-semibold text-foreground">Prévia gerada</p>
              <p className="text-foreground">{generatedStrategy.name}</p>
              <p className="text-muted-foreground">{generatedStrategy.description || 'Sem descrição'}</p>
              <p className="mt-1 text-muted-foreground">
                {Math.max(generatedStrategy.nodes.length - 1, 0)} nós • {generatedStrategy.edges.length} ligações
              </p>
              <div className="mt-2 flex gap-1">
                <button
                  onClick={onApplyGeneratedStrategy}
                  className="flex-1 rounded border border-green-500/50 px-2 py-1 text-[10px] text-green-300 hover:bg-green-500/10"
                >
                  Aplicar
                </button>
                <button
                  onClick={onDiscardGeneratedStrategy}
                  className="flex-1 rounded border border-border px-2 py-1 text-[10px] text-foreground hover:bg-accent"
                >
                  Descartar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
