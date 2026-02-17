import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { FlowNodeData } from '@/types/flow';

const gateSymbols: Record<string, string> = {
  gate_and: '&',
  gate_or: '≥1',
  gate_not: '1',
};

const gateTooltips: Record<string, string> = {
  gate_and: 'Verdadeiro quando TODAS as entradas forem verdadeiras',
  gate_or: 'Verdadeiro quando QUALQUER entrada for verdadeira',
  gate_not: 'Inverte: verdadeiro vira falso e vice-versa',
};

export function GateNode({ data }: NodeProps) {
  const d = data as FlowNodeData;
  const symbol = gateSymbols[d.definitionId] ?? '?';
  const tooltip = gateTooltips[d.definitionId] ?? '';
  const isNot = d.definitionId === 'gate_not';

  return (
    <div
      className="relative flex flex-col items-center"
      title={tooltip}
    >
      {d.linkActive && (
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1 bg-yellow-400/80" />
      )}
      {/* Multiple target handles for AND/OR, single for NOT */}
      {isNot ? (
        <Handle
          type="target"
          position={Position.Top}
          id="in-0"
          className="!bg-purple-500 !w-3 !h-3 !border-2 !border-purple-300"
        />
      ) : (
        <>
          <Handle
            type="target"
            position={Position.Top}
            id="in-0"
            className="!bg-purple-500 !w-2.5 !h-2.5 !border-2 !border-purple-300"
            style={{ left: '30%' }}
          />
          <Handle
            type="target"
            position={Position.Top}
            id="in-1"
            className="!bg-purple-500 !w-2.5 !h-2.5 !border-2 !border-purple-300"
            style={{ left: '70%' }}
          />
        </>
      )}

      {/* Gate body — diamond shape */}
      <div className="flex flex-col items-center rounded-lg border-2 border-purple-500 bg-purple-950 px-4 py-2 shadow-lg min-w-[90px]">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="h-2 w-2 rounded-full bg-purple-500" />
          <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">
            {d.label}
          </span>
        </div>
        <span className="text-lg font-mono font-bold text-purple-400">{symbol}</span>
        {!isNot && (
          <span className="text-[9px] text-purple-400/50 mt-0.5">
            2 entradas
          </span>
        )}
      </div>

      {/* Two outputs: Sim / Não */}
      <div className="flex justify-between w-full px-3 mt-0.5">
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
