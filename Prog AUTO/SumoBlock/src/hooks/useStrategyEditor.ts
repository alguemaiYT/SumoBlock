import { useState, useCallback, useRef } from 'react';
import { Strategy, BlockInstance, createInstance } from '@/types/blocks';
import { createUuid } from '@/lib/uuid';

function newStrategy(): Strategy {
  return {
    id: createUuid(),
    name: 'Nova Estratégia',
    description: '',
    blocks: [],
  };
}

function updateBlockRecursive(
  blocks: BlockInstance[],
  instanceId: string,
  updater: (block: BlockInstance) => BlockInstance
): BlockInstance[] {
  return blocks.map((block) => {
    if (block.instanceId === instanceId) {
      return updater(block);
    }
    return {
      ...block,
      children: block.children ? updateBlockRecursive(block.children, instanceId, updater) : undefined,
      elseChildren: block.elseChildren ? updateBlockRecursive(block.elseChildren, instanceId, updater) : undefined,
      conditionChildren: block.conditionChildren
        ? updateBlockRecursive(block.conditionChildren, instanceId, updater)
        : undefined,
    };
  });
}

export function useStrategyEditor() {
  const [strategies, setStrategies] = useState<Strategy[]>([newStrategy()]);
  const [activeIndex, setActiveIndex] = useState(0);
  const historyRef = useRef<Strategy[][]>([]);
  const futureRef = useRef<Strategy[][]>([]);

  const active = strategies[activeIndex];

  const pushHistory = useCallback(() => {
    historyRef.current.push(JSON.parse(JSON.stringify(strategies)));
    futureRef.current = [];
    if (historyRef.current.length > 50) historyRef.current.shift();
  }, [strategies]);

  const updateActive = useCallback(
    (updater: (s: Strategy) => Strategy) => {
      pushHistory();
      setStrategies((prev) =>
        prev.map((s, i) => (i === activeIndex ? updater(s) : s))
      );
    },
    [activeIndex, pushHistory]
  );

  const addBlock = useCallback(
    (defId: string) => {
      updateActive((s) => ({
        ...s,
        blocks: [...s.blocks, createInstance(defId)],
      }));
    },
    [updateActive]
  );

  const removeBlock = useCallback(
    (instanceId: string) => {
      updateActive((s) => ({
        ...s,
        blocks: s.blocks.filter((b) => b.instanceId !== instanceId),
      }));
    },
    [updateActive]
  );

  const removeChildBlock = useCallback(
    (parentId: string, childId: string) => {
      updateActive((s) => ({
        ...s,
        blocks: s.blocks.map((b) =>
          b.instanceId === parentId
            ? { ...b, children: b.children?.filter((c) => c.instanceId !== childId) }
            : b
        ),
      }));
    },
    [updateActive]
  );

  const removeElseChildBlock = useCallback(
    (parentId: string, childId: string) => {
      updateActive((s) => ({
        ...s,
        blocks: s.blocks.map((b) =>
          b.instanceId === parentId
            ? { ...b, elseChildren: b.elseChildren?.filter((c) => c.instanceId !== childId) }
            : b
        ),
      }));
    },
    [updateActive]
  );

  const addChildBlock = useCallback(
    (parentId: string, child: BlockInstance) => {
      updateActive((s) => ({
        ...s,
        blocks: s.blocks.map((b) =>
          b.instanceId === parentId
            ? { ...b, children: [...(b.children || []), child] }
            : b
        ),
      }));
    },
    [updateActive]
  );

  const addElseChildBlock = useCallback(
    (parentId: string, child: BlockInstance) => {
      updateActive((s) => ({
        ...s,
        blocks: s.blocks.map((b) =>
          b.instanceId === parentId
            ? { ...b, elseChildren: [...(b.elseChildren || []), child] }
            : b
        ),
      }));
    },
    [updateActive]
  );

  const addConditionChild = useCallback(
    (parentId: string, child: BlockInstance) => {
      updateActive((s) => ({
        ...s,
        blocks: s.blocks.map((b) =>
          b.instanceId === parentId
            ? {
                ...b,
                conditionChildren: [...(b.conditionChildren || []), child],
              }
            : b
        ),
      }));
    },
    [updateActive]
  );

  const removeConditionChild = useCallback(
    (parentId: string, childId: string) => {
      updateActive((s) => ({
        ...s,
        blocks: s.blocks.map((b) =>
          b.instanceId === parentId
            ? {
                ...b,
                conditionChildren: b.conditionChildren?.filter((c) => c.instanceId !== childId),
              }
            : b
        ),
      }));
    },
    [updateActive]
  );

  const updateBlockParams = useCallback(
    (instanceId: string, paramName: string, value: string | number) => {
      updateActive((s) => ({
        ...s,
        blocks: updateBlockRecursive(s.blocks, instanceId, (block) => ({
          ...block,
          params: block.params.map((p) =>
            p.name === paramName ? { ...p, value } : p
          ),
        })),
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

  const clearBlocks = useCallback(
    () => updateActive((s) => ({ ...s, blocks: [] })),
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
    const s = newStrategy();
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
    (strategy: Strategy) => {
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
    addBlock,
    removeBlock,
    removeChildBlock,
    removeElseChildBlock,
    addChildBlock,
    addElseChildBlock,
    addConditionChild,
    removeConditionChild,
    setName,
    setDescription,
    clearBlocks,
    undo,
    redo,
    addTab,
    removeTab,
    loadStrategy,
    updateBlockParams,
  };
}
