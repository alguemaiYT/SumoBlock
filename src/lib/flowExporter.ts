import { FlowStrategy, FlowNode } from '@/types/flow';

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportFlowJSON(strategy: FlowStrategy) {
  const payload = {
    ...strategy,
    readable: {
      steps: buildReadableFlow(strategy),
    },
  };
  const json = JSON.stringify(payload, null, 2);
  downloadFile(json, `${strategy.name || 'estrategia'}.json`, 'application/json');
}

export function importFlowJSON(file: File): Promise<FlowStrategy> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as FlowStrategy;
        if (!data.nodes || !data.edges) {
          reject(new Error('Formato inválido: arquivo não contém nodes/edges'));
          return;
        }
        resolve(data);
      } catch {
        reject(new Error('Arquivo JSON inválido'));
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsText(file);
  });
}

function buildReadableFlow(strategy: FlowStrategy): string[] {
  const lines: string[] = [];
  const nodeMap = new Map(strategy.nodes.map((n) => [n.id, n]));

  // Walk from start node
  const visited = new Set<string>();

  function walk(nodeId: string, indent: number) {
    if (visited.has(nodeId)) {
      lines.push('  '.repeat(indent) + '↻ (volta ao nó já visitado)');
      return;
    }
    visited.add(nodeId);

    const node = nodeMap.get(nodeId);
    if (!node) return;

    const prefix = '  '.repeat(indent);
    const paramText = node.data.params
      .filter((p) => p.value !== '' && p.value !== undefined)
      .map((p) => `${p.name}: ${p.value}${p.unit ?? ''}`)
      .join(', ');

    if (node.type === 'startNode') {
      lines.push(`${prefix}▶ Início`);
    } else if (node.type === 'sensorNode') {
      lines.push(`${prefix}? ${node.data.label}${paramText ? ` (${paramText})` : ''}`);
    } else if (node.type === 'gateNode') {
      lines.push(`${prefix}⊕ ${node.data.label}`);
    } else {
      lines.push(`${prefix}→ ${node.data.label}${paramText ? ` (${paramText})` : ''}`);
    }

    // Find outgoing edges
    const outEdges = strategy.edges.filter((e) => e.source === nodeId);

    if (node.type === 'sensorNode' || node.type === 'gateNode') {
      const yesEdge = outEdges.find((e) => e.sourceHandle === 'yes');
      const noEdge = outEdges.find((e) => e.sourceHandle === 'no');

      if (yesEdge) {
        lines.push(`${prefix}  Sim:`);
        walk(yesEdge.target, indent + 2);
      }
      if (noEdge) {
        lines.push(`${prefix}  Não:`);
        walk(noEdge.target, indent + 2);
      }
    } else if (node.type === 'logicNode' && node.data.definitionId === 'logic_repeat') {
      const loopEdge = outEdges.find((e) => (e.sourceHandle ?? 'loop') === 'loop');
      const doneEdge = outEdges.find((e) => e.sourceHandle === 'done');

      if (loopEdge) {
        lines.push(`${prefix}  Loop:`);
        walk(loopEdge.target, indent + 2);
      }
      if (doneEdge) {
        lines.push(`${prefix}  Done:`);
        walk(doneEdge.target, indent + 2);
      }
    } else {
      for (const edge of outEdges) {
        walk(edge.target, indent + 1);
      }
    }
  }

  const startNode = strategy.nodes.find((n) => n.type === 'startNode');
  if (startNode) walk(startNode.id, 0);

  return lines;
}
