import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  type EdgeMouseHandler,
  type NodeMouseHandler,
  type OnSelectionChangeFunc,
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
  onSelectEdge: (edgeId: string | null) => void;
  onSelectionChange: (nodeIds: string[], edgeIds: string[]) => void;
}

export function FlowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onSelectNode,
  onSelectEdge,
  onSelectionChange,
}: FlowCanvasProps) {
  const memoNodeTypes = useMemo(() => nodeTypes, []);

  const linkEdges = useMemo(() => {
    const groups = new Map<string, FlowNode[]>();
    nodes.forEach((node) => {
      const groupId = node.data.linkGroupId;
      if (!groupId) return;
      const list = groups.get(groupId) ?? [];
      list.push(node);
      groups.set(groupId, list);
    });

    return Array.from(groups.entries()).flatMap(([groupId, groupNodes]) => {
      if (groupNodes.length < 2) return [];
      const leader = groupNodes.find((n) => n.id === groupId) ?? groupNodes[0];
      return groupNodes
        .filter((node) => node.id !== leader.id)
        .map((node) => ({
          id: `link-${groupId}-${node.id}`,
          source: leader.id,
          target: node.id,
          animated: false,
          selectable: false,
          focusable: false,
          updatable: false,
          deletable: false,
          type: 'straight',
          style: {
            stroke: '#facc15',
            strokeDasharray: '4 4',
            strokeWidth: 2,
            pointerEvents: 'none',
          },
        }));
    });
  }, [nodes]);

  const renderedEdges = useMemo(() => [...edges, ...linkEdges], [edges, linkEdges]);

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      onSelectNode(node.id);
    },
    [onSelectNode]
  );

  const handleEdgeClick: EdgeMouseHandler = useCallback(
    (_event, edge) => {
      onSelectEdge(edge.id);
    },
    [onSelectEdge]
  );

  const handlePaneClick = useCallback(() => {
    onSelectNode(null);
    onSelectEdge(null);
  }, [onSelectNode, onSelectEdge]);

  const handleSelectionChange: OnSelectionChangeFunc<FlowNode, FlowEdge> = useCallback(
    ({ nodes: selectedNodes, edges: selectedEdges }) => {
      onSelectionChange(
        selectedNodes.map((node) => node.id),
        selectedEdges.map((edge) => edge.id)
      );
    },
    [onSelectionChange]
  );

  return (
    <div className="flex-1 min-h-0 min-w-0">
      <ReactFlow
        nodes={nodes}
        edges={renderedEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        onPaneClick={handlePaneClick}
        onSelectionChange={handleSelectionChange}
        nodeTypes={memoNodeTypes}
        fitView
        deleteKeyCode={['Delete', 'Backspace']}
        multiSelectionKeyCode="Control"
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
