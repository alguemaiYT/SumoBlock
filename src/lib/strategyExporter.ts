import { BlockInstance, BlockParam, Strategy, getDefinition } from '@/types/blocks';

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportJSON(strategy: Strategy) {
  const payload = {
    ...strategy,
    readable: {
      steps: buildReadableSteps(strategy.blocks),
    },
  };
  const json = JSON.stringify(payload, null, 2);
  downloadFile(json, `${strategy.name || 'estrategia'}.json`, 'application/json');
}

export function importJSON(file: File): Promise<Strategy> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as Strategy;
        resolve(data);
      } catch {
        reject(new Error('Arquivo JSON inválido'));
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsText(file);
  });
}

function buildReadableSteps(blocks: BlockInstance[], depth = 0): string[] {
  const lines: string[] = [];

  blocks.forEach((block) => {
    const def = getDefinition(block.definitionId);
    const label = def?.label ?? block.definitionId;
    const paramsDescription = formatParams(block.params);
    const indent = '  '.repeat(depth);
    lines.push(`${indent}- ${label}${paramsDescription ? ` (${paramsDescription})` : ''}`);

    if (block.conditionChildren?.length) {
      const conditionTexts = block.conditionChildren.map((child) => {
        const childDef = getDefinition(child.definitionId);
        const childLabel = childDef?.label ?? child.definitionId;
        const childParams = formatParams(child.params);
        return `${childLabel}${childParams ? ` (${childParams})` : ''}`;
      });
      lines.push(`${indent}  condição: ${conditionTexts.join(' e ')}`);
    }

    if (block.children?.length) {
      lines.push(`${indent}  corpo:`);
      lines.push(...buildReadableSteps(block.children, depth + 2));
    }

    if (block.elseChildren?.length) {
      lines.push(`${indent}  senão:`);
      lines.push(...buildReadableSteps(block.elseChildren, depth + 2));
    }
  });

  return lines;
}

function formatParams(params: BlockParam[]): string {
  return params
    .filter((param) => param.value !== '' && param.value !== undefined)
    .map((param) => `${param.name}: ${param.value}${param.unit ?? ''}`)
    .join(', ');
}
