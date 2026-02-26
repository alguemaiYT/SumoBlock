import { Handle, Position, type NodeProps } from '@xyflow/react';
import { BlockHoverCard } from '@/components/BlockHoverCard';

export function StartNode({ selected }: NodeProps) {
  return (
    <BlockHoverCard definitionId="start" side="right">
    <div
      className={`flex items-center justify-center rounded-full border-2 border-emerald-500 bg-emerald-950 px-5 py-2 shadow-md ${selected ? 'ring-2 ring-amber-400/60 shadow-[0_0_0_12px_rgba(251,191,36,0.25)]' : ''}`}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={false}
        className="!opacity-0 !pointer-events-none !w-0 !h-0"
      />
      <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
        Início
      </span>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-emerald-500 !w-3 !h-3 !border-2 !border-emerald-300"
      />
    </div>
    </BlockHoverCard>
  );
}
