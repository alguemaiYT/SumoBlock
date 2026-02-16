import type { Node, Edge } from '@xyflow/react';
import { BlockParam } from './blocks';

// Data payload carried by every custom node
export interface FlowNodeData {
  definitionId: string;
  label: string;
  category: 'sensor' | 'action' | 'logic' | 'start';
  params: BlockParam[];
  [key: string]: unknown;
}

export type FlowNode = Node<FlowNodeData>;
export type FlowEdge = Edge<{ label?: string }>;

export interface FlowStrategy {
  id: string;
  name: string;
  description: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
}
