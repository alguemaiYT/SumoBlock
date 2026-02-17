import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { FlowNodeData } from '@/types/flow';

export function LogicNode({ data, selected }: NodeProps) {
  const d = data as FlowNodeData;
  const isRepeatNode = d.definitionId === 'logic_repeat';
  const infiniteParam = d.params.find((p) => p.name === 'indefinido' && p.type === 'boolean');
  const infinite = infiniteParam?.value === true;
  const visibleParams = d.params
    .filter((p) => p.name !== 'indefinido' && !(p.name === 'vezes' && infinite))
    .map((p) => `${p.name}: ${p.value}${p.unit ?? ''}`)
    .filter(Boolean);
  const paramsSummary = infinite
    ? '∞'
    : visibleParams.join(', ');

  const highlight = selected ? 'ring-2 ring-amber-400/70 shadow-[0_0_0_12px_rgba(251,191,36,0.35)]' : '';

  return (
    <div
      className={`relative min-w-[120px] rounded-lg border-2 border-[hsl(45,80%,55%)] bg-[hsl(45,80%,10%)] shadow-lg ${highlight}`}
    >
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

      {isRepeatNode ? (
        <div className="flex justify-between px-2 pb-1.5">
          <div className="relative">
            <span className="text-[9px] font-medium text-amber-400">Loop</span>
            <Handle
              type="source"
              position={Position.Bottom}
              id="loop"
              className="!bg-amber-500 !w-2.5 !h-2.5 !border-2 !border-amber-300 !left-2"
            />
          </div>
          {!infinite && (
            <div className="relative">
              <span className="text-[9px] font-medium text-sky-400">Done</span>
              <Handle
                type="source"
                position={Position.Bottom}
                id="done"
                className="!bg-sky-500 !w-2.5 !h-2.5 !border-2 !border-sky-300 !left-2"
              />
            </div>
          )}
        </div>
      ) : (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!bg-yellow-500 !w-3 !h-3 !border-2 !border-yellow-300"
        />
      )}
    </div>
  );
}
