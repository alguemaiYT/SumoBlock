import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { FlowNodeData } from '@/types/flow';

export function ActionNode({ data }: NodeProps) {
  const d = data as FlowNodeData;
  const paramsSummary = d.params
    .map((p) => `${p.value}${p.unit ?? ''}`)
    .join(', ');

  return (
    <div className="relative min-w-[120px] rounded-lg border-2 border-[hsl(145,60%,45%)] bg-[hsl(145,60%,10%)] shadow-lg">
      {d.linkActive && (
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1 bg-yellow-400/80" />
      )}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-green-500 !w-3 !h-3 !border-2 !border-green-300"
      />

      <div className="px-3 py-2 text-center">
        <div className="flex items-center justify-center gap-1.5 mb-0.5">
          <span className="h-2 w-2 rounded-full bg-[hsl(145,60%,45%)]" />
          <span className="text-sm font-semibold text-[hsl(145,60%,65%)]">
            {d.label}
          </span>
        </div>
        {paramsSummary && (
          <div className="text-[10px] text-green-300/60">{paramsSummary}</div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-green-500 !w-3 !h-3 !border-2 !border-green-300"
      />
    </div>
  );
}
