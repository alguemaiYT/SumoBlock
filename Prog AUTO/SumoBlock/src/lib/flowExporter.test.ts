import { describe, expect, it } from 'vitest';
import { buildFlowExportPayload } from '@/lib/flowExporter';
import type { FlowStrategy } from '@/types/flow';

function createFixtureStrategy(): FlowStrategy {
  return {
    id: 'fixture-strategy',
    name: 'Estratégia de Teste',
    description: 'Valida exportação completa.',
    nodes: [
      {
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
      },
      {
        id: 'sensor-1',
        type: 'sensorNode',
        position: { x: 280, y: 180 },
        data: {
          definitionId: 'sensor_front',
          label: 'Sensor Frontal',
          category: 'sensor',
          params: [
            { name: 'detectando', type: 'boolean', value: false },
            {
              name: 'lado',
              type: 'select',
              value: 'esquerdo',
              options: ['esquerdo', 'direito'],
            },
            { name: 'distância', type: 'number', value: 20, unit: 'cm' },
          ],
        },
      },
      {
        id: 'action-1',
        type: 'actionNode',
        position: { x: 540, y: 300 },
        data: {
          definitionId: 'action_forward',
          label: 'Frente',
          category: 'action',
          params: [
            { name: 'tempo', type: 'number', value: 1000, unit: 'ms' },
            { name: 'velocidade', type: 'number', value: 255 },
          ],
        },
      },
      {
        id: 'logic-1',
        type: 'logicNode',
        position: { x: 100, y: 300 },
        data: {
          definitionId: 'logic_repeat',
          label: 'Repetir',
          category: 'logic',
          params: [
            { name: 'vezes', type: 'number', value: 3 },
            { name: 'indefinido', type: 'boolean', value: true },
          ],
        },
      },
    ],
    edges: [
      {
        id: 'edge-start-sensor',
        source: 'start',
        target: 'sensor-1',
      },
      {
        id: 'edge-sensor-yes',
        source: 'sensor-1',
        sourceHandle: 'yes',
        target: 'action-1',
      },
      {
        id: 'edge-sensor-no',
        source: 'sensor-1',
        sourceHandle: 'no',
        target: 'logic-1',
      },
    ],
  } as FlowStrategy;
}

describe('buildFlowExportPayload', () => {
  it('preserves nodes, edges and all params', () => {
    const strategy = createFixtureStrategy();

    const payload = buildFlowExportPayload(strategy);

    expect(payload.schemaVersion).toBe(1);
    expect(payload.nodes).toEqual(strategy.nodes);
    expect(payload.edges).toEqual(strategy.edges);
    expect(payload.nodes[1].data.params).toEqual(strategy.nodes[1].data.params);
    expect(payload.nodes[2].data.params).toEqual(strategy.nodes[2].data.params);
    expect(payload.nodes[3].data.params).toEqual(strategy.nodes[3].data.params);
  });

  it('keeps readable steps with params and branch labels', () => {
    const payload = buildFlowExportPayload(createFixtureStrategy());

    expect(payload.readable.steps).toContain('▶ Início');
    expect(payload.readable.steps.some((line) => line.includes('distância: 20cm'))).toBe(true);
    expect(payload.readable.steps.some((line) => line.trim() === 'Sim:')).toBe(true);
    expect(payload.readable.steps.some((line) => line.trim() === 'Não:')).toBe(true);
  });

  it('does not mutate original strategy object', () => {
    const strategy = createFixtureStrategy();
    const original = JSON.parse(JSON.stringify(strategy));

    buildFlowExportPayload(strategy);

    expect(strategy).toEqual(original);
  });
});
