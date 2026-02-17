import { useState, useCallback, useRef } from 'react';
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  type Connection,
  type NodeChange,
  type EdgeChange,
  MarkerType,
} from '@xyflow/react';
import { FlowNode, FlowEdge, FlowStrategy } from '@/types/flow';
import { blockDefinitions, getDefinition } from '@/types/blocks';
import { createUuid } from '@/lib/uuid';

function createStartNode(): FlowNode {
  return {
    id: 'start',
    type: 'startNode',
    position: { x: 300, y: 30 },
    data: {
      definitionId: 'start',
      label: 'Início',
      category: 'start',
      params: [],
    },
    deletable: false,
  };
}

function newFlowStrategy(): FlowStrategy {
  return {
    id: createUuid(),
    name: 'Nova Estratégia',
    description: '',
    nodes: [createStartNode()],
    edges: [],
  };
}

export function useFlowEditor() {
  const [strategies, setStrategies] = useState<FlowStrategy[]>([newFlowStrategy()]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const historyRef = useRef<FlowStrategy[][]>([]);
  const futureRef = useRef<FlowStrategy[][]>([]);

  const active = strategies[activeIndex];

  const selectedNode = selectedNodeId
    ? active.nodes.find((n) => n.id === selectedNodeId) ?? null
    : null;

  const pushHistory = useCallback(() => {
    historyRef.current.push(JSON.parse(JSON.stringify(strategies)));
    futureRef.current = [];
    if (historyRef.current.length > 50) historyRef.current.shift();
  }, [strategies]);

  const updateActive = useCallback(
    (updater: (s: FlowStrategy) => FlowStrategy) => {
      pushHistory();
      setStrategies((prev) =>
        prev.map((s, i) => (i === activeIndex ? updater(s) : s))
      );
    },
    [activeIndex, pushHistory]
  );

  // React Flow change handlers
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setStrategies((prev) =>
        prev.map((s, i) =>
          i === activeIndex
            ? { ...s, nodes: applyNodeChanges(changes, s.nodes) as FlowNode[] }
            : s
        )
      );
    },
    [activeIndex]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setStrategies((prev) =>
        prev.map((s, i) =>
          i === activeIndex
            ? { ...s, edges: applyEdgeChanges(changes, s.edges) as FlowEdge[] }
            : s
        )
      );
    },
    [activeIndex]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      pushHistory();
      const sourceNode = active.nodes.find((n) => n.id === connection.source);
      const hasBranches = sourceNode?.data.category === 'sensor' || sourceNode?.data.category === 'gate';

      const edgeLabel =
        hasBranches && connection.sourceHandle === 'yes'
          ? 'Sim'
          : hasBranches && connection.sourceHandle === 'no'
            ? 'Não'
            : undefined;

      const edgeStyle =
        hasBranches && connection.sourceHandle === 'yes'
          ? { stroke: '#22c55e' }
          : hasBranches && connection.sourceHandle === 'no'
            ? { stroke: '#ef4444' }
            : { stroke: '#64748b' };

      setStrategies((prev) =>
        prev.map((s, i) =>
          i === activeIndex
            ? {
                ...s,
                edges: addEdge(
                  {
                    ...connection,
                    label: edgeLabel,
                    style: edgeStyle,
                    markerEnd: { type: MarkerType.ArrowClosed },
                    animated: true,
                  },
                  s.edges
                ) as FlowEdge[],
              }
            : s
        )
      );
    },
    [activeIndex, active.nodes, pushHistory]
  );

  // Add a new node from palette
  const addNode = useCallback(
    (definitionId: string) => {
      const def = getDefinition(definitionId);
      if (!def) return;

      const nodeType =
        def.category === 'sensor'
          ? 'sensorNode'
          : def.category === 'action'
            ? 'actionNode'
            : def.category === 'gate'
              ? 'gateNode'
              : 'logicNode';

      // Place below existing nodes
      const maxY = active.nodes.reduce(
        (max, n) => Math.max(max, n.position.y),
        0
      );

      const newNode: FlowNode = {
        id: createUuid(),
        type: nodeType,
        position: { x: 250 + Math.random() * 100, y: maxY + 120 },
        data: {
          definitionId: def.id,
          label: def.label,
          category: def.category,
          params: def.params.map((p) => ({ ...p })),
        },
      };

      updateActive((s) => ({ ...s, nodes: [...s.nodes, newNode] }));
    },
    [active.nodes, updateActive]
  );

  // Delete a node
  const deleteNode = useCallback(
    (nodeId: string) => {
      if (nodeId === 'start') return;
      updateActive((s) => ({
        ...s,
        nodes: s.nodes.filter((n) => n.id !== nodeId),
        edges: s.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      }));
      if (selectedNodeId === nodeId) setSelectedNodeId(null);
    },
    [updateActive, selectedNodeId]
  );

  // Update node parameters
  const updateNodeParam = useCallback(
    (nodeId: string, paramName: string, value: string | number) => {
      updateActive((s) => ({
        ...s,
        nodes: s.nodes.map((n) =>
          n.id === nodeId
            ? {
                ...n,
                data: {
                  ...n.data,
                  params: n.data.params.map((p) =>
                    p.name === paramName ? { ...p, value } : p
                  ),
                },
              }
            : n
        ),
      }));
    },
    [updateActive]
  );

  const setName = useCallback(
    (name: string) => updateActive((s) => ({ ...s, name })),
    [updateActive]
  );

  const setDescription = useCallback(
    (description: string) => updateActive((s) => ({ ...s, description })),
    [updateActive]
  );

  const clearNodes = useCallback(
    () => updateActive((s) => ({ ...s, nodes: [createStartNode()], edges: [] })),
    [updateActive]
  );

  const undo = useCallback(() => {
    if (historyRef.current.length === 0) return;
    futureRef.current.push(JSON.parse(JSON.stringify(strategies)));
    const prev = historyRef.current.pop()!;
    setStrategies(prev);
  }, [strategies]);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    historyRef.current.push(JSON.parse(JSON.stringify(strategies)));
    const next = futureRef.current.pop()!;
    setStrategies(next);
  }, [strategies]);

  const addTab = useCallback(() => {
    pushHistory();
    const s = newFlowStrategy();
    setStrategies((prev) => [...prev, s]);
    setActiveIndex(strategies.length);
  }, [pushHistory, strategies.length]);

  const removeTab = useCallback(
    (index: number) => {
      if (strategies.length <= 1) return;
      pushHistory();
      setStrategies((prev) => prev.filter((_, i) => i !== index));
      setActiveIndex((prev) => Math.min(prev, strategies.length - 2));
    },
    [pushHistory, strategies.length]
  );

  const loadStrategy = useCallback(
    (strategy: FlowStrategy) => {
      pushHistory();
      setStrategies((prev) =>
        prev.map((s, i) => (i === activeIndex ? strategy : s))
      );
    },
    [activeIndex, pushHistory]
  );

  return {
    strategies,
    active,
    activeIndex,
    setActiveIndex,
    selectedNode,
    selectedNodeId,
    setSelectedNodeId,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    deleteNode,
    updateNodeParam,
    setName,
    setDescription,
    clearNodes,
    undo,
    redo,
    addTab,
    removeTab,
    loadStrategy,
  };
}
