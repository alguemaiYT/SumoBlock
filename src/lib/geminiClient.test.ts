import { describe, expect, it } from 'vitest';
import { buildFlowStrategyFromGeminiDraft } from '@/lib/geminiClient';

describe('buildFlowStrategyFromGeminiDraft', () => {
  it('maps nodes/edges with valid params and branch labels', () => {
    const strategy = buildFlowStrategyFromGeminiDraft({
      name: 'Agressiva',
      description: 'Busca e ataque',
      nodes: [
        {
          id: 'sensor_1',
          definitionId: 'sensor_front',
          params: [
            { name: 'detectando', value: 'true' },
            { name: 'lado', value: 'direito' },
            { name: 'distância', value: '18' },
          ],
        },
        {
          id: 'frente_1',
          definitionId: 'action_forward',
          params: [
            { name: 'tempo', value: '900' },
            { name: 'velocidade', value: '255' },
          ],
        },
      ],
      edges: [
        { source: 'start', target: 'sensor_1' },
        { source: 'sensor_1', target: 'frente_1', sourceHandle: 'yes' },
      ],
    });

    expect(strategy.nodes[0].id).toBe('start');
    expect(strategy.nodes[0].type).toBe('startNode');

    const sensor = strategy.nodes.find((node) => node.data.definitionId === 'sensor_front');
    expect(sensor).toBeTruthy();
    expect(sensor?.data.params.find((param) => param.name === 'detectando')?.value).toBe(true);
    expect(sensor?.data.params.find((param) => param.name === 'distância')?.value).toBe(18);
    expect(sensor?.data.params.find((param) => param.name === 'lado')?.value).toBe('direito');

    const branchEdge = strategy.edges.find((edge) => edge.sourceHandle === 'yes');
    expect(branchEdge?.label).toBe('Sim');
  });

  it('creates default edge from start when model omits edges', () => {
    const strategy = buildFlowStrategyFromGeminiDraft({
      name: 'Sem Edge',
      description: '',
      nodes: [
        {
          id: 'Primeiro Nó',
          definitionId: 'action_wait',
          params: [{ name: 'tempo', value: '300' }],
        },
      ],
      edges: [],
    });

    expect(strategy.edges.length).toBe(1);
    expect(strategy.edges[0].source).toBe('start');
    expect(strategy.edges[0].target).toBe(strategy.nodes[1].id);
  });

  it('throws when no valid nodes are returned', () => {
    expect(() =>
      buildFlowStrategyFromGeminiDraft({
        name: 'Inválida',
        description: '',
        nodes: [{ id: 'x', definitionId: 'nao_existe', params: [] }],
        edges: [],
      })
    ).toThrow('A resposta da IA não trouxe nós válidos.');
  });
});
