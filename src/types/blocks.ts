// ============================================
// SumoBlock - Block Type Definitions
// ============================================
// To customize block behavior, modify the blockDefinitions
// and the code generator in src/lib/codeGenerator.ts

import { createUuid } from '@/lib/uuid';

export type BlockCategory = 'sensor' | 'action' | 'logic';

export interface BlockParam {
  name: string;
  type: 'number' | 'string' | 'select';
  value: string | number;
  options?: string[]; // for select type
  unit?: string;
}

export interface BlockDefinition {
  id: string;
  label: string;
  category: BlockCategory;
  params: BlockParam[];
  /** Whether this block can contain children (e.g., If/Else) */
  hasChildren?: boolean;
  /** Whether this block has an else branch */
  hasElse?: boolean;
}

export interface BlockInstance {
  instanceId: string;
  definitionId: string;
  params: BlockParam[];
  children?: BlockInstance[];
  elseChildren?: BlockInstance[];
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  blocks: BlockInstance[];
}

// ============================================
// BLOCK DEFINITIONS - Edit here to add/modify blocks
// ============================================
export const blockDefinitions: BlockDefinition[] = [
  // --- SENSORS ---
  {
    id: 'sensor_front',
    label: 'Sensor Frontal',
    category: 'sensor',
    params: [
      { name: 'distância', type: 'number', value: 20, unit: 'cm' },
    ],
  },
  {
    id: 'sensor_side',
    label: 'Sensor Lateral',
    category: 'sensor',
    params: [
      { name: 'lado', type: 'select', value: 'esquerdo', options: ['esquerdo', 'direito'] },
      { name: 'distância', type: 'number', value: 15, unit: 'cm' },
    ],
  },
  {
    id: 'sensor_line',
    label: 'Sensor de Linha',
    category: 'sensor',
    params: [
      { name: 'posição', type: 'select', value: 'frente', options: ['frente', 'trás', 'esquerda', 'direita'] },
    ],
  },
  {
    id: 'sensor_distance',
    label: 'Sensor de Distância',
    category: 'sensor',
    params: [
      { name: 'distância', type: 'number', value: 30, unit: 'cm' },
    ],
  },

  // --- ACTIONS ---
  {
    id: 'action_forward',
    label: 'Frente',
    category: 'action',
    params: [
      { name: 'tempo', type: 'number', value: 1000, unit: 'ms' },
      { name: 'velocidade', type: 'number', value: 255 },
    ],
  },
  {
    id: 'action_backward',
    label: 'Trás',
    category: 'action',
    params: [
      { name: 'tempo', type: 'number', value: 1000, unit: 'ms' },
      { name: 'velocidade', type: 'number', value: 255 },
    ],
  },
  {
    id: 'action_turn_left',
    label: 'Girar Esquerda',
    category: 'action',
    params: [
      { name: 'tempo', type: 'number', value: 500, unit: 'ms' },
    ],
  },
  {
    id: 'action_turn_right',
    label: 'Girar Direita',
    category: 'action',
    params: [
      { name: 'tempo', type: 'number', value: 500, unit: 'ms' },
    ],
  },
  {
    id: 'action_stop',
    label: 'Parar',
    category: 'action',
    params: [],
  },

  // --- LOGIC ---
  {
    id: 'logic_if',
    label: 'Se',
    category: 'logic',
    params: [
      { name: 'condição', type: 'select', value: 'sensor_front', options: ['sensor_front', 'sensor_side', 'sensor_line', 'sensor_distance'] },
    ],
    hasChildren: true,
    hasElse: true,
  },
  {
    id: 'logic_repeat',
    label: 'Repetir',
    category: 'logic',
    params: [
      { name: 'vezes', type: 'number', value: 3 },
    ],
    hasChildren: true,
  },
];

export function getDefinition(id: string): BlockDefinition | undefined {
  return blockDefinitions.find((b) => b.id === id);
}

export function createInstance(defId: string): BlockInstance {
  const def = getDefinition(defId);
  if (!def) throw new Error(`Unknown block: ${defId}`);
  return {
    instanceId: createUuid(),
    definitionId: defId,
    params: def.params.map((p) => ({ ...p })),
    children: def.hasChildren ? [] : undefined,
    elseChildren: def.hasElse ? [] : undefined,
  };
}
