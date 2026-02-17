import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { FlowNodeData } from '@/types/flow';

export function LogicNode({ data }: NodeProps) {
  const d = data as FlowNodeData;
  const infiniteParam = d.params.find((p) => p.name === 'indefinido' && p.type === 'boolean');
  const infinite = infiniteParam?.value === true;
  const visibleParams = d.params
    .filter((p) => p.name !== 'indefinido' && !(p.name === 'vezes' && infinite))
    .map((p) => `${p.name}: ${p.value}${p.unit ?? ''}`)
    .filter(Boolean);
  const paramsSummary = infinite
    ? '∞'
    : visibleParams.join(', ');

  return (
    <div className="relative min-w-[120px] rounded-lg border-2 border-[hsl(45,80%,55%)] bg-[hsl(45,80%,10%)] shadow-lg">
      {d.linkActive && (
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1 bg-yellow-400/80" />
      )}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-yellow-500 !w-3 !h-3 !border-2 !border-yellow-300"
      />

      <div className="px-3 py-2 text-center">
        <div className="flex items-center justify-center gap-1.5 mb-0.5">
          <span className="h-2 w-2 rounded-full bg-[hsl(45,80%,55%)]" />
          <span className="text-sm font-semibold text-[hsl(45,80%,70%)]">
            {d.label}
          </span>
        </div>
        {paramsSummary && (
          <div className="text-[10px] text-yellow-300/60">{paramsSummary}</div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-yellow-500 !w-3 !h-3 !border-2 !border-yellow-300"
      />
    </div>
  );
}
