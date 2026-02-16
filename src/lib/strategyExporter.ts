import { Strategy } from '@/types/blocks';
import { generateArduinoCode } from './codeGenerator';

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
  const json = JSON.stringify(strategy, null, 2);
  downloadFile(json, `${strategy.name || 'estrategia'}.json`, 'application/json');
}

export function exportArduinoCode(strategy: Strategy) {
  const code = generateArduinoCode(strategy.blocks, strategy.name);
  downloadFile(code, `${strategy.name || 'estrategia'}.ino`, 'text/plain');
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
