import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  type NodeMouseHandler,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { StartNode } from './nodes/StartNode';
import { SensorNode } from './nodes/SensorNode';
import { ActionNode } from './nodes/ActionNode';
import { LogicNode } from './nodes/LogicNode';
import { GateNode } from './nodes/GateNode';

import type { FlowNode, FlowEdge } from '@/types/flow';
import type { NodeChange, EdgeChange, Connection } from '@xyflow/react';

const nodeTypes = {
  startNode: StartNode,
  sensorNode: SensorNode,
  actionNode: ActionNode,
  logicNode: LogicNode,
  gateNode: GateNode,
};

interface FlowCanvasProps {
  nodes: FlowNode[];
  edges: FlowEdge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  onSelectNode: (nodeId: string | null) => void;
}

export function FlowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onSelectNode,
}: FlowCanvasProps) {
  const memoNodeTypes = useMemo(() => nodeTypes, []);

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      onSelectNode(node.id);
    },
    [onSelectNode]
  );

  const handlePaneClick = useCallback(() => {
    onSelectNode(null);
  }, [onSelectNode]);

  return (
    <div className="flex-1 min-h-0 min-w-0">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={memoNodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
        className="bg-background"
        defaultEdgeOptions={{
          animated: true,
          style: { stroke: '#64748b' },
        }}
        connectionLineStyle={{ stroke: '#64748b', strokeWidth: 2 }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#333" />
        <Controls className="!bg-card !border-border !shadow-lg [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-foreground [&>button:hover]:!bg-accent" />
        <MiniMap
          className="!bg-card !border-border"
          nodeColor={(n) => {
            switch (n.type) {
              case 'startNode': return '#22c55e';
              case 'sensorNode': return '#3b82f6';
              case 'actionNode': return '#22c55e';
              case 'logicNode': return '#eab308';
              case 'gateNode': return '#a855f7';
              default: return '#64748b';
            }
          }}
        />
      </ReactFlow>
    </div>
  );
}
