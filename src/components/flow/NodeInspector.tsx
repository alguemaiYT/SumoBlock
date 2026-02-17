import { FlowNode } from '@/types/flow';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X } from 'lucide-react';

interface NodeInspectorProps {
  node: FlowNode | null;
  onUpdateParam: (nodeId: string, paramName: string, value: string | number | boolean) => void;
  onDeleteNode: (nodeId: string) => void;
  onLinkNode: (nodeId: string) => void;
  onClose: () => void;
}

export function NodeInspector({ node, onUpdateParam, onDeleteNode, onClose }: NodeInspectorProps) {
  if (!node) {
    return (
      <div className="p-4">
        <p className="text-xs text-muted-foreground">
          Selecione um nó no canvas para editar seus parâmetros
        </p>
      </div>
    );
  }

  const data = node.data;

  const detectToggle = data.params.find(
    (param) => param.name === 'detectado' && param.type === 'boolean'
  );
  const detectEnabled = detectToggle?.value === true;
  const infiniteToggle = data.params.find(
    (param) => param.name === 'indefinido' && param.type === 'boolean'
  );
  const infiniteEnabled = infiniteToggle?.value === true;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {data.label}
        </h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mb-3 rounded-md border border-border bg-background/50 p-2">
        <span className="text-sm font-semibold text-foreground">{data.label}</span>
        <span className="ml-2 text-[10px] uppercase text-muted-foreground">{data.category}</span>
      </div>

      {data.params.length > 0 ? (
        <div className="space-y-3">
          {data.params
            .filter((p) => {
              if (p.name === 'distância' && detectEnabled) return false;
              if (p.name === 'vezes' && infiniteEnabled) return false;
              return true;
            })
            .map((p) => (
              <div key={p.name}>
                <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">
                  {p.name} {p.unit && <span className="normal-case">({p.unit})</span>}
                </label>
                {p.type === 'select' && p.options ? (
                  <Select
                    value={String(p.value)}
                    onValueChange={(val) => onUpdateParam(node.id, p.name, val)}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {p.options.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : p.type === 'boolean' ? (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={Boolean(p.value)}
                      onCheckedChange={(checked) =>
                        onUpdateParam(node.id, p.name, Boolean(checked))
                      }
                    />
                    <span className="text-sm text-foreground">{p.name}</span>
                  </div>
                ) : (
                  <Input
                    type={p.type === 'number' ? 'number' : 'text'}
                    value={p.value}
                    onChange={(e) => {
                      let val: string | number = e.target.value;
                      if (p.type === 'number') {
                        val = parseFloat(val);
                        if (isNaN(val)) val = 0;
                      }
                      onUpdateParam(node.id, p.name, val);
                    }}
                    className="h-8 text-sm"
                  />
                )}
              </div>
            ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Nenhum parâmetro editável</p>
      )}

      {data.category !== 'start' && (
        <div className="mt-4 space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={() => onLinkNode(node.id)}
          >
            Criar link (ln)
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center border border-red-500/30 text-xs text-red-400 hover:bg-red-500/10"
            onClick={() => onDeleteNode(node.id)}
          >
            Remover nó
          </Button>
        </div>
      )}
    </div>
  );
}
