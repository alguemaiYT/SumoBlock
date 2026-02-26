// Hover metadata for every block: description + optional truth table for logic gates

export interface TruthTableRow {
  inputs: string[];
  output: string;
}

export interface TruthTable {
  headers: string[];
  rows: TruthTableRow[];
}

export interface BlockHoverData {
  description: string;
  detail?: string;
  truthTable?: TruthTable;
}

export const blockHoverData: Record<string, BlockHoverData> = {
  // ── SENSORS ─────────────────────────────────────────────────────────────
  sensor_front: {
    description: 'Sensor Frontal (Ultrassônico)',
    detail:
      'Detecta objetos na frente do robô usando ultrassom. Retorna Sim quando há um obstáculo dentro da distância configurada, e Não quando o caminho está livre.',
  },
  sensor_side: {
    description: 'Sensor Lateral (Ultrassônico)',
    detail:
      'Detecta objetos na lateral do robô. Útil para identificar oponentes que tentam flanquear. Retorna Sim quando detectado dentro da distância configurada.',
  },
  sensor_line: {
    description: 'Sensor de Linha (Infravermelho)',
    detail:
      'Detecta a borda branca da arena. Retorna Sim ao encontrar a linha, indicando que o robô está perto de cair fora do dohyô. Use para mudar de direção rapidamente.',
  },

  // ── ACTIONS ─────────────────────────────────────────────────────────────
  action_forward: {
    description: 'Mover para Frente',
    detail:
      'Aciona os motores para mover o robô para frente com a velocidade e tempo configurados. Velocidade varia de 0 (parado) a 255 (máxima potência).',
  },
  action_backward: {
    description: 'Mover para Trás',
    detail:
      'Aciona os motores em reverso. Útil para recuar após detectar uma borda ou preparar um ataque pelo lado oposto.',
  },
  action_turn_left: {
    description: 'Girar à Esquerda',
    detail:
      'Rotaciona o robô no sentido anti-horário pelo tempo configurado. O motor esquerdo recua e o direito avança simultaneamente.',
  },
  action_turn_right: {
    description: 'Girar à Direita',
    detail:
      'Rotaciona o robô no sentido horário pelo tempo configurado. O motor direito recua e o esquerdo avança simultaneamente.',
  },
  action_stop: {
    description: 'Parar',
    detail:
      'Corta a alimentação de todos os motores imediatamente. Use após uma sequência de ações ou quando precisar aguardar um sensor.',
  },
  action_wait: {
    description: 'Esperar',
    detail:
      'Pausa a execução do fluxo pelo tempo configurado (em milissegundos) antes de passar para o próximo bloco.',
  },

  // ── LOGIC ────────────────────────────────────────────────────────────────
  logic_if: {
    description: 'Condicional Se / Senão',
    detail:
      'Avalia a condição ligada à entrada e executa o ramo "Sim" se verdadeira, ou "Não" se falsa. Conecte um sensor ou porta lógica à entrada para definir a condição.',
  },
  logic_repeat: {
    description: 'Repetir (Loop)',
    detail:
      'Repete o fluxo interno N vezes (ou infinitamente com o modo Indefinido). O handle "Loop" conecta o corpo do laço; "Done" é seguido após o término das repetições.',
  },

  // ── GATES ────────────────────────────────────────────────────────────────
  gate_and: {
    description: 'Porta AND — E lógico',
    detail:
      'Saída é verdadeira apenas quando TODAS as entradas forem verdadeiras. Usada para exigir que dois sensores detectem algo ao mesmo tempo.',
    truthTable: {
      headers: ['Entrada A', 'Entrada B', 'Saída'],
      rows: [
        { inputs: ['0', '0'], output: '0' },
        { inputs: ['0', '1'], output: '0' },
        { inputs: ['1', '0'], output: '0' },
        { inputs: ['1', '1'], output: '1' },
      ],
    },
  },
  gate_or: {
    description: 'Porta OR — OU lógico',
    detail:
      'Saída é verdadeira quando PELO MENOS UMA das entradas for verdadeira. Usada para reagir se qualquer um dos sensores detectar algo.',
    truthTable: {
      headers: ['Entrada A', 'Entrada B', 'Saída'],
      rows: [
        { inputs: ['0', '0'], output: '0' },
        { inputs: ['0', '1'], output: '1' },
        { inputs: ['1', '0'], output: '1' },
        { inputs: ['1', '1'], output: '1' },
      ],
    },
  },
  gate_not: {
    description: 'Porta NOT — Inversão lógica',
    detail:
      'Inverte o sinal da entrada: verdadeiro vira falso e vice-versa. Útil para "Se NÃO detectou linha, então avançar".',
    truthTable: {
      headers: ['Entrada', 'Saída'],
      rows: [
        { inputs: ['0'], output: '1' },
        { inputs: ['1'], output: '0' },
      ],
    },
  },

  // ── START ────────────────────────────────────────────────────────────────
  start: {
    description: 'Início da Estratégia',
    detail:
      'Ponto de entrada do fluxo. A execução começa aqui e segue pelas conexões. Não pode ser removido.',
  },
};
