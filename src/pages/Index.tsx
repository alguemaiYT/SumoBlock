import { useState, useRef } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import Logo from '@/components/Logo';
import { useFlowEditor } from '@/hooks/useFlowEditor';
import { FlowCanvas } from '@/components/flow/FlowCanvas';
import { FlowPalette } from '@/components/flow/FlowPalette';
import { NodeInspector } from '@/components/flow/NodeInspector';
import { exportFlowJSON, importFlowJSON } from '@/lib/flowExporter';
import { generateFlowStrategyFromPrompt, hasGeminiApiKey } from '@/lib/geminiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { FlowStrategy } from '@/types/flow';
import {
  Undo2,
  Redo2,
  Trash2,
  Upload,
  FileJson,
  Plus,
  X,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';

const Index = () => {
  const editor = useFlowEditor();
  const [panelOpen, setPanelOpen] = useState(true);
  const [panelMode, setPanelMode] = useState<'strategy' | 'inspector'>('inspector');
  const [generatedStrategy, setGeneratedStrategy] = useState<FlowStrategy | null>(null);
  const [isGeneratingWithAI, setIsGeneratingWithAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const removableSelectionCount = editor.selectedNodeIds.filter((nodeId) => nodeId !== 'start').length;
  const geminiEnabled = hasGeminiApiKey();

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const strategy = await importFlowJSON(file);
      editor.loadStrategy(strategy);
    } catch {
      alert('Erro ao importar arquivo');
    }
    e.target.value = '';
  };

  const handleGenerateWithAI = async (prompt: string) => {
    setAiError(null);
    setGeneratedStrategy(null);

    try {
      setIsGeneratingWithAI(true);
      const strategy = await generateFlowStrategyFromPrompt({
        prompt,
        currentStrategy: editor.active,
      });
      setGeneratedStrategy(strategy);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Não foi possível gerar estratégia com IA.';
      setAiError(message);
    } finally {
      setIsGeneratingWithAI(false);
    }
  };

  const handleApplyGeneratedStrategy = () => {
    if (!generatedStrategy) return;
    editor.loadStrategy({ ...generatedStrategy, id: editor.active.id });
    setGeneratedStrategy(null);
    setAiError(null);
  };

  const handleDiscardGeneratedStrategy = () => {
    setGeneratedStrategy(null);
  };

  return (
    <ReactFlowProvider>
      <div className="flex h-screen flex-col overflow-hidden">
        {/* Header */}
        <header className="flex flex-wrap shrink-0 items-center gap-3 border-b border-border bg-card px-4 h-auto md:h-12">
          <Logo />
          <h1 className="text-sm font-semibold tracking-wide text-foreground">SumoBlocks</h1>
          <span className="text-[10px] text-muted-foreground bg-primary/10 px-2 py-0.5 rounded-full">Flow</span>
          <div className="ml-auto flex flex-wrap items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setPanelOpen(!panelOpen)}
              title={panelOpen ? 'Ocultar painel lateral' : 'Mostrar painel lateral'}
            >
              {panelOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
            </Button>
            <div className="mx-2 h-5 w-px bg-border" />
            <Button variant="ghost" size="icon" onClick={editor.undo} title="Desfazer">
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={editor.redo} title="Refazer">
              <Redo2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={editor.clearNodes} title="Limpar">
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={editor.removeSelectedEdge}
              disabled={!editor.selectedEdgeId}
              title="Selecione uma ligação para remover"
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" /> Remover ligação
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={editor.removeSelectedNodes}
              disabled={removableSelectionCount === 0}
              title={
                removableSelectionCount > 1
                  ? 'Remover nós selecionados'
                  : 'Remover nó selecionado'
              }
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" />{' '}
              {removableSelectionCount > 1
                ? `Remover ${removableSelectionCount} nós`
                : 'Remover nó'}
            </Button>
            <div className="mx-2 h-5 w-px bg-border" />
            <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-1 h-3.5 w-3.5" /> Importar
            </Button>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
            <Button variant="ghost" size="sm" onClick={() => exportFlowJSON(editor.active)}>
              <FileJson className="mr-1 h-3.5 w-3.5" /> Exportar JSON
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
          <button onClick={editor.addTab} className="ml-1 rounded p-1 text-muted-foreground hover:text-foreground">
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
          {/* Palette */}
          <FlowPalette
            onAddNode={editor.addNode}
            strategyBlocks={editor.strategyBlocks}
            onCreateStrategyBlock={editor.compactActiveAsStrategyBlock}
            onUseStrategyBlock={editor.addStrategyBlockToCanvas}
            onLoadStrategyBlock={editor.loadStrategyBlockIntoActive}
            onUpdateStrategyBlock={editor.updateStrategyBlockFromActive}
            onRenameStrategyBlock={editor.renameStrategyBlock}
            onSetStrategyBlockDescription={editor.setStrategyBlockDescription}
            onRemoveStrategyBlock={editor.removeStrategyBlock}
            onGenerateWithAI={handleGenerateWithAI}
            onApplyGeneratedStrategy={handleApplyGeneratedStrategy}
            onDiscardGeneratedStrategy={handleDiscardGeneratedStrategy}
            generatedStrategy={generatedStrategy}
            isGeneratingWithAI={isGeneratingWithAI}
            aiError={aiError}
            hasGeminiApiKey={geminiEnabled}
          />

          {/* Flow Canvas */}
          <FlowCanvas
            nodes={editor.nodes}
            edges={editor.active.edges}
            onNodesChange={editor.onNodesChange}
            onEdgesChange={editor.onEdgesChange}
            onConnect={editor.onConnect}
            onSelectNode={editor.selectNode}
            onSelectEdge={editor.selectEdge}
            onSelectionChange={editor.onSelectionChange}
          />

          {/* Side panel */}
          {panelOpen && (
            <div className="w-full shrink-0 border-t border-border bg-card/30 overflow-y-auto md:w-64 md:border-t-0 md:border-l">
              {/* Panel toggle */}
              <div className="flex border-b border-border">
                <button
                  onClick={() => setPanelMode('inspector')}
                  className={`flex-1 py-1.5 text-[10px] font-semibold uppercase tracking-widest transition-colors ${
                    panelMode === 'inspector'
                      ? 'text-foreground bg-background'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Inspetor
                </button>
                <button
                  onClick={() => setPanelMode('strategy')}
                  className={`flex-1 py-1.5 text-[10px] font-semibold uppercase tracking-widest transition-colors ${
                    panelMode === 'strategy'
                      ? 'text-foreground bg-background'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Estratégia
                </button>
              </div>

              {panelMode === 'inspector' ? (
                <NodeInspector
                  node={editor.selectedNode}
                  onUpdateParam={editor.updateNodeParam}
                  onDeleteNode={editor.deleteNode}
                  onClearConnections={editor.clearNodeConnections}
                  onLinkNode={editor.linkNode}
                  onUnlinkNode={editor.unlinkNode}
                  onClose={() => editor.selectNode(null)}
                />
              ) : (
                <div className="p-4">
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
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ReactFlowProvider>
  );
};

export default Index;
