import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
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

function isInfiniteRepeatNode(node?: FlowNode) {
  if (!node || node.data.definitionId !== 'logic_repeat') return false;
  return node.data.params.some(
    (param) =>
      param.name === 'indefinido' &&
      param.type === 'boolean' &&
      param.value === true
  );
}

export function useFlowEditor() {
  const [strategies, setStrategies] = useState<FlowStrategy[]>([newFlowStrategy()]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [linkFocusGroup, setLinkFocusGroup] = useState<string | null>(null);
  const historyRef = useRef<FlowStrategy[][]>([]);
  const futureRef = useRef<FlowStrategy[][]>([]);

  const active = strategies[activeIndex];

  useEffect(() => {
    if (!selectedNodeId) {
      setLinkFocusGroup(null);
      return;
    }
    const node = active.nodes.find((n) => n.id === selectedNodeId);
    setLinkFocusGroup(node?.data.linkGroupId ?? null);
  }, [selectedNodeId, active.nodes]);

  useEffect(() => {
    if (!selectedEdgeId) return;
    if (!active.edges.some((edge) => edge.id === selectedEdgeId)) {
      setSelectedEdgeId(null);
    }
  }, [selectedEdgeId, active.edges]);

  useEffect(() => {
    const activeNodeIds = new Set(active.nodes.map((node) => node.id));
    setSelectedNodeIds((prev) => {
      const next = prev.filter((nodeId) => activeNodeIds.has(nodeId));
      return next.length === prev.length ? prev : next;
    });
    setSelectedNodeId((prev) => (prev && activeNodeIds.has(prev) ? prev : null));
  }, [active.nodes]);

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
      if (!connection.source || !connection.target) return;

      const sourceNode = active.nodes.find((n) => n.id === connection.source);
      const hasBranches = sourceNode?.data.category === 'sensor' || sourceNode?.data.category === 'gate';
      const isRepeatNode = sourceNode?.data.definitionId === 'logic_repeat';
      const repeatHandle = (connection.sourceHandle ?? 'loop') as string;
      const repeatInfinite = isInfiniteRepeatNode(sourceNode);

      if (isRepeatNode && repeatInfinite && repeatHandle === 'done') {
        return;
      }

      const edgeLabel =
        hasBranches && connection.sourceHandle === 'yes'
          ? 'Sim'
          : hasBranches && connection.sourceHandle === 'no'
            ? 'Não'
            : isRepeatNode && repeatHandle === 'loop'
              ? 'Loop'
              : isRepeatNode && repeatHandle === 'done'
                ? 'Done'
                : undefined;

      const edgeStyle =
        hasBranches && connection.sourceHandle === 'yes'
          ? { stroke: '#22c55e' }
          : hasBranches && connection.sourceHandle === 'no'
            ? { stroke: '#ef4444' }
            : isRepeatNode && repeatHandle === 'loop'
              ? { stroke: '#f59e0b' }
              : isRepeatNode && repeatHandle === 'done'
                ? { stroke: '#0ea5e9' }
                : { stroke: '#64748b' };

      pushHistory();

      setStrategies((prev) =>
        prev.map((s, i) =>
          i === activeIndex
            ? {
                ...s,
                edges: addEdge(
                  {
                    ...connection,
                    sourceHandle: isRepeatNode ? repeatHandle : connection.sourceHandle,
                    label: edgeLabel,
                    style: edgeStyle,
                    markerEnd: { type: MarkerType.ArrowClosed },
                    animated: true,
                  },
                  isRepeatNode
                    ? s.edges.filter((edge) => {
                        if (edge.source !== connection.source) return true;
                        const edgeHandle = edge.sourceHandle ?? 'loop';
                        return edgeHandle !== repeatHandle;
                      })
                    : s.edges
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
      setSelectedNodeIds((prev) => prev.filter((id) => id !== nodeId));
    },
    [updateActive, selectedNodeId]
  );

  const removeSelectedNodes = useCallback(() => {
    const removeIds = selectedNodeIds.filter((nodeId) => nodeId !== 'start');
    if (removeIds.length === 0) return;

    const removeSet = new Set(removeIds);
    updateActive((s) => ({
      ...s,
      nodes: s.nodes.filter((node) => !removeSet.has(node.id)),
      edges: s.edges.filter(
        (edge) => !removeSet.has(edge.source) && !removeSet.has(edge.target)
      ),
    }));
    setSelectedNodeIds([]);
    setSelectedNodeId(null);
  }, [selectedNodeIds, updateActive]);

  const clearNodeConnections = useCallback(
    (nodeId: string) => {
      const hasConnections = active.edges.some(
        (edge) => edge.source === nodeId || edge.target === nodeId
      );
      if (!hasConnections) return;

      const selectedEdge = selectedEdgeId
        ? active.edges.find((edge) => edge.id === selectedEdgeId)
        : undefined;
      const shouldClearSelected = Boolean(
        selectedEdge &&
          (selectedEdge.source === nodeId || selectedEdge.target === nodeId)
      );

      updateActive((s) => ({
        ...s,
        edges: s.edges.filter(
          (edge) => edge.source !== nodeId && edge.target !== nodeId
        ),
      }));

      if (shouldClearSelected) {
        setSelectedEdgeId(null);
      }
    },
    [active.edges, selectedEdgeId, updateActive]
  );

  const removeSelectedEdge = useCallback(() => {
    if (!selectedEdgeId) return;
    updateActive((s) => ({
      ...s,
      edges: s.edges.filter((edge) => edge.id !== selectedEdgeId),
    }));
    setSelectedEdgeId(null);
  }, [selectedEdgeId, updateActive]);

  const linkNode = useCallback(
    (nodeId?: string) => {
      const targetId = nodeId ?? selectedNodeId;
      if (!targetId) return;
      const baseNode = active.nodes.find((n) => n.id === targetId);
      if (!baseNode) return;
      const groupId = baseNode.data.linkGroupId ?? baseNode.id;
      const cloneId = createUuid();
      const clone: FlowNode = {
        id: cloneId,
        type: baseNode.type,
        position: { x: baseNode.position.x + 80, y: baseNode.position.y + 120 },
        data: {
          ...baseNode.data,
          linkGroupId: groupId,
          params: baseNode.data.params.map((p) => ({ ...p })),
        },
        deletable: baseNode.deletable,
        draggable: true,
      };

      updateActive((s) => ({
        ...s,
        nodes: [
          ...s.nodes.map((n) =>
            n.id === baseNode.id && !n.data.linkGroupId
              ? {
                  ...n,
                  data: { ...n.data, linkGroupId: groupId },
                }
              : n
          ),
          clone,
        ],
      }));
      setSelectedNodeId(cloneId);
    },
    [selectedNodeId, active.nodes, updateActive]
  );

  const unlinkNode = useCallback(
    (nodeId: string) => {
      const target = active.nodes.find((n) => n.id === nodeId);
      if (!target) return;
      const groupId = target.data.linkGroupId;
      if (!groupId) return;

      const groupedNodes = active.nodes.filter((n) => n.data.linkGroupId === groupId);
      if (groupedNodes.length === 0) return;

      const removeIds = new Set(
        target.id === groupId
          ? groupedNodes.filter((n) => n.id !== target.id).map((n) => n.id)
          : [target.id]
      );

      updateActive((s) => {
        const nodesAfterRemoval = s.nodes.filter((n) => !removeIds.has(n.id));
        const linkedLeft = nodesAfterRemoval.filter((n) => n.data.linkGroupId === groupId);
        const normalizedNodes =
          linkedLeft.length <= 1
            ? nodesAfterRemoval.map((n) =>
                n.data.linkGroupId === groupId
                  ? {
                      ...n,
                      data: {
                        ...n.data,
                        linkGroupId: undefined,
                      },
                    }
                  : n
              )
            : nodesAfterRemoval;

        return {
          ...s,
          nodes: normalizedNodes,
          edges: s.edges.filter(
            (e) => !removeIds.has(e.source) && !removeIds.has(e.target)
          ),
        };
      });

      if (selectedNodeId && removeIds.has(selectedNodeId)) {
        setSelectedNodeId(null);
      }
      setSelectedNodeIds((prev) => prev.filter((id) => !removeIds.has(id)));
    },
    [active.nodes, updateActive, selectedNodeId]
  );

  // Update node parameters
  const updateNodeParam = useCallback(
    (nodeId: string, paramName: string, value: string | number | boolean) => {
      updateActive((s) => {
        const sourceNode = s.nodes.find((n) => n.id === nodeId);
        const groupId = sourceNode?.data.linkGroupId;
        const nodesToUpdate = s.nodes.filter((n) => {
          const matchesGroup =
            groupId !== undefined && n.data.linkGroupId === groupId;
          return n.id === nodeId || matchesGroup;
        });
        const repeatIdsToUpdate = new Set(
          nodesToUpdate
            .filter((n) => n.data.definitionId === 'logic_repeat')
            .map((n) => n.id)
        );
        const shouldHideDone =
          paramName === 'indefinido' && value === true && repeatIdsToUpdate.size > 0;

        return {
          ...s,
          nodes: s.nodes.map((n) => {
            const matchesGroup =
              groupId !== undefined && n.data.linkGroupId === groupId;
            if (n.id === nodeId || matchesGroup) {
              return {
                ...n,
                data: {
                  ...n.data,
                  params: n.data.params.map((p) =>
                    p.name === paramName ? { ...p, value } : p
                  ),
                },
              };
            }
            return n;
          }),
          edges: shouldHideDone
            ? s.edges.filter((edge) => {
                if (!repeatIdsToUpdate.has(edge.source)) return true;
                const sourceHandle = edge.sourceHandle ?? 'loop';
                return sourceHandle !== 'done';
              })
            : s.edges,
        };
      });
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

  const selectNode = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId);
    setSelectedNodeIds(nodeId ? [nodeId] : []);
    if (nodeId) {
      setSelectedEdgeId(null);
    }
  }, []);

  const selectEdge = useCallback((edgeId: string | null) => {
    setSelectedEdgeId(edgeId);
    if (edgeId) {
      setSelectedNodeId(null);
      setSelectedNodeIds([]);
    }
  }, []);

  const onSelectionChange = useCallback(
    (nodeIds: string[], edgeIds: string[]) => {
      setSelectedNodeIds(nodeIds);
      setSelectedNodeId((prev) => {
        if (prev && nodeIds.includes(prev)) return prev;
        return nodeIds.length > 0 ? nodeIds[nodeIds.length - 1] : null;
      });

      if (nodeIds.length > 0) {
        setSelectedEdgeId(null);
        return;
      }

      setSelectedEdgeId(edgeIds.length === 1 ? edgeIds[0] : null);
    },
    []
  );

  const decoratedNodes = useMemo(() => {
    return active.nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        linkActive: linkFocusGroup
          ? node.data.linkGroupId === linkFocusGroup
          : false,
      },
    }));
  }, [active.nodes, linkFocusGroup]);

  const selectedNode = selectedNodeId
    ? decoratedNodes.find((n) => n.id === selectedNodeId) ?? null
    : null;

  return {
    strategies,
    active,
    activeIndex,
    setActiveIndex,
    nodes: decoratedNodes,
    selectedNode,
    selectedNodeId,
    selectedNodeIds,
    selectedEdgeId,
    setSelectedNodeId,
    selectNode,
    selectEdge,
    onSelectionChange,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    deleteNode,
    removeSelectedNodes,
    clearNodeConnections,
    removeSelectedEdge,
    linkNode,
    unlinkNode,
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
