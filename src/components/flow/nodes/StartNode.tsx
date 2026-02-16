import { Handle, Position } from '@xyflow/react';

export function StartNode() {
  return (
    <div className="flex items-center justify-center rounded-full border-2 border-emerald-500 bg-emerald-950 px-5 py-2 shadow-md">
      <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
        Início
      </span>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-emerald-500 !w-3 !h-3 !border-2 !border-emerald-300"
      />
    </div>
  );
}
