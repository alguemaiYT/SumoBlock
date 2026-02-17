import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { FlowNodeData } from '@/types/flow';

export function SensorNode({ data, selected }: NodeProps) {
  const d = data as FlowNodeData;
  const detectParam = d.params.find((p) => p.name === 'detectando' && p.type === 'boolean');
  const detectEnabled = detectParam?.value === true;
  const visibleParams = d.params
    .filter((p) => p.name !== 'detectando' && (p.name !== 'distância' || !detectEnabled))
    .map((p) => `${p.value}${p.unit ?? ''}`)
    .filter(Boolean);
  const paramsSummary = detectEnabled
    ? ['Detectando', ...visibleParams].filter(Boolean).join(' · ')
    : visibleParams.join(', ');
  const highlight = selected ? 'ring-2 ring-amber-400/70 shadow-[0_0_0_12px_rgba(251,191,36,0.35)]' : '';

  return (
    <div
      className={`relative min-w-[140px] rounded-lg border-2 border-[hsl(210,70%,50%)] bg-[hsl(210,70%,12%)] shadow-lg ${highlight}`}
    >
      {d.linkActive && (
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1 bg-yellow-400/80" />
      )}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-blue-500 !w-3 !h-3 !border-2 !border-blue-300"
      />

      <div className="px-3 py-2 text-center">
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <span className="h-2 w-2 rounded-full bg-[hsl(210,70%,50%)]" />
          <span className="text-sm font-semibold text-[hsl(210,70%,70%)]">
            {d.label}
          </span>
        </div>
        {paramsSummary && (
          <div className="text-[10px] text-blue-300/60">{paramsSummary}</div>
        )}
      </div>

      {/* Two outputs: Sim (left) and Não (right) */}
      <div className="flex justify-between px-2 pb-1.5">
        <div className="relative">
          <span className="text-[9px] font-medium text-emerald-400">Sim</span>
          <Handle
            type="source"
            position={Position.Bottom}
            id="yes"
            className="!bg-emerald-500 !w-2.5 !h-2.5 !border-2 !border-emerald-300 !left-2"
          />
        </div>
        <div className="relative">
          <span className="text-[9px] font-medium text-red-400">Não</span>
          <Handle
            type="source"
            position={Position.Bottom}
            id="no"
            className="!bg-red-500 !w-2.5 !h-2.5 !border-2 !border-red-300 !left-2"
          />
        </div>
      </div>
    </div>
  );
}
