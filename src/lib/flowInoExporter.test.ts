import { describe, expect, it } from 'vitest';
import { buildFlowInoExport } from '@/lib/flowInoExporter';
import type { BlockParam } from '@/types/blocks';
import type { FlowEdge, FlowNode, FlowStrategy } from '@/types/flow';

function startNode(): FlowNode {
  return {
    id: 'start',
    type: 'startNode',
    position: { x: 0, y: 0 },
    data: {
      definitionId: 'start',
      label: 'Inicio',
      category: 'start',
      params: [],
    },
    deletable: false,
  };
}

function actionNode(id: string, definitionId: string, label: string, params: BlockParam[]): FlowNode {
  return {
    id,
    type: 'actionNode',
    position: { x: 0, y: 0 },
    data: {
      definitionId,
      label,
      category: 'action',
      params,
    },
  };
}

function sensorNode(id: string, definitionId: string, label: string, params: BlockParam[]): FlowNode {
  return {
    id,
    type: 'sensorNode',
    position: { x: 0, y: 0 },
    data: {
      definitionId,
      label,
      category: 'sensor',
      params,
    },
  };
}

function gateNode(id: string, definitionId: string, label: string): FlowNode {
  return {
    id,
    type: 'gateNode',
    position: { x: 0, y: 0 },
    data: {
      definitionId,
      label,
      category: 'gate',
      params: [],
    },
  };
}

function logicNode(id: string, definitionId: string, label: string, params: BlockParam[]): FlowNode {
  return {
    id,
    type: 'logicNode',
    position: { x: 0, y: 0 },
    data: {
      definitionId,
      label,
      category: 'logic',
      params,
    },
  };
}

function edge(
  id: string,
  source: string,
  target: string,
  sourceHandle?: string,
  targetHandle?: string
): FlowEdge {
  return {
    id,
    source,
    target,
    sourceHandle,
    targetHandle,
  };
}

function strategyFixture(name: string, nodes: FlowNode[], edges: FlowEdge[]): FlowStrategy {
  return {
    id: 'fixture',
    name,
    description: 'fixture strategy',
    nodes: [startNode(), ...nodes],
    edges,
  };
}

describe('buildFlowInoExport', () => {
  it('exports a simple action sequence', () => {
    const strategy = strategyFixture(
      'Ataque Basico',
      [
        actionNode('forward', 'action_forward', 'Frente', [
          { name: 'tempo', type: 'number', value: 400, unit: 'ms' },
          { name: 'velocidade', type: 'number', value: 180 },
        ]),
        actionNode('stop', 'action_stop', 'Parar', []),
      ],
      [
        edge('e-start-forward', 'start', 'forward'),
        edge('e-forward-stop', 'forward', 'stop'),
        edge('e-stop-forward', 'stop', 'forward'),
      ]
    );

    const result = buildFlowInoExport(strategy);

    expect(result.filename).toBe('ataque-basico.ino');
    expect(result.content).toContain('void estrategia_site_ataque_basico()');
    expect(result.content).toContain('frente(180);');
    expect(result.content).toContain('delay(400);');
    expect(result.content).toContain('parado();');
    expect(result.warnings).toEqual([]);
  });

  it('exports sensor branch logic with yes/no handles', () => {
    const strategy = strategyFixture(
      'Busca Frontal',
      [
        sensorNode('sensor-front', 'sensor_front', 'Sensor Frontal', [
          { name: 'detectando', type: 'boolean', value: true },
          { name: 'lado', type: 'select', value: 'esquerdo', options: ['esquerdo', 'direito'] },
          { name: 'distancia', type: 'number', value: 20, unit: 'cm' },
        ]),
        actionNode('forward', 'action_forward', 'Frente', [
          { name: 'tempo', type: 'number', value: 300, unit: 'ms' },
          { name: 'velocidade', type: 'number', value: 200 },
        ]),
        actionNode('turn-left', 'action_turn_left', 'Girar esquerda', [
          { name: 'tempo', type: 'number', value: 220, unit: 'ms' },
        ]),
      ],
      [
        edge('e-start-sensor', 'start', 'sensor-front'),
        edge('e-sensor-yes', 'sensor-front', 'forward', 'yes'),
        edge('e-sensor-no', 'sensor-front', 'turn-left', 'no'),
        edge('e-forward-loop', 'forward', 'sensor-front'),
        edge('e-turn-loop', 'turn-left', 'sensor-front'),
      ]
    );

    const result = buildFlowInoExport(strategy);

    expect(result.content).toContain('if (sen_centro_esq == HIGH)');
    expect(result.content).toContain('estado = 2;');
    expect(result.content).toContain('estado = 3;');
    expect(result.content).toContain('esquerda(velocgiro);');
    expect(result.warnings).toEqual([]);
  });

  it('exports repeat loops with internal counters', () => {
    const strategy = strategyFixture(
      'Loop Controlado',
      [
        logicNode('repeat-main', 'logic_repeat', 'Repetir', [
          { name: 'vezes', type: 'number', value: 2 },
          { name: 'indefinido', type: 'boolean', value: false },
        ]),
        actionNode('wait', 'action_wait', 'Esperar', [
          { name: 'tempo', type: 'number', value: 100, unit: 'ms' },
        ]),
        actionNode('stop', 'action_stop', 'Parar', []),
      ],
      [
        edge('e-start-repeat', 'start', 'repeat-main'),
        edge('e-repeat-loop', 'repeat-main', 'wait', 'loop'),
        edge('e-wait-repeat', 'wait', 'repeat-main'),
        edge('e-repeat-done', 'repeat-main', 'stop', 'done'),
        edge('e-stop-repeat', 'stop', 'repeat-main'),
      ]
    );

    const result = buildFlowInoExport(strategy);

    expect(result.content).toMatch(/static int rep_/);
    expect(result.content).toContain('< 2');
    expect(result.content).toMatch(/rep_[a-z0-9_]+\+\+/);
    expect(result.content).toMatch(/rep_[a-z0-9_]+ = 0;/);
    expect(result.warnings).toEqual([]);
  });

  it('exports gate AND conditions from incoming sensor inputs', () => {
    const strategy = strategyFixture(
      'Gate And',
      [
        gateNode('gate-main', 'gate_and', 'E'),
        sensorNode('sensor-left', 'sensor_side', 'Sensor lateral esquerdo', [
          { name: 'detectando', type: 'boolean', value: true },
          { name: 'lado', type: 'select', value: 'esquerdo', options: ['esquerdo', 'direito'] },
        ]),
        sensorNode('sensor-right', 'sensor_side', 'Sensor lateral direito', [
          { name: 'detectando', type: 'boolean', value: true },
          { name: 'lado', type: 'select', value: 'direito', options: ['esquerdo', 'direito'] },
        ]),
        actionNode('forward', 'action_forward', 'Frente', [
          { name: 'tempo', type: 'number', value: 150, unit: 'ms' },
          { name: 'velocidade', type: 'number', value: 220 },
        ]),
        actionNode('stop', 'action_stop', 'Parar', []),
      ],
      [
        edge('e-start-gate', 'start', 'gate-main'),
        edge('e-left-gate', 'sensor-left', 'gate-main', 'yes', 'in-0'),
        edge('e-right-gate', 'sensor-right', 'gate-main', 'yes', 'in-1'),
        edge('e-gate-yes', 'gate-main', 'forward', 'yes'),
        edge('e-gate-no', 'gate-main', 'stop', 'no'),
        edge('e-forward-loop', 'forward', 'gate-main'),
        edge('e-stop-loop', 'stop', 'gate-main'),
      ]
    );

    const result = buildFlowInoExport(strategy);

    expect(result.content).toContain('sen_esq == HIGH');
    expect(result.content).toContain('sen_dir == HIGH');
    expect(result.content).toContain('&&');
    expect(result.warnings).toEqual([]);
  });

  it('throws when start has no outgoing edge', () => {
    const strategy = strategyFixture(
      'Sem Saida',
      [actionNode('forward', 'action_forward', 'Frente', [{ name: 'tempo', type: 'number', value: 100 }])],
      []
    );

    expect(() => buildFlowInoExport(strategy)).toThrow('o no "start" nao possui saida');
  });
});
