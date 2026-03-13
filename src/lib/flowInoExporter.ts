import { FlowEdge, FlowNode, FlowStrategy } from '@/types/flow';

const INO_PROFILE_ID = 'prog-auto-esp32-v2' as const;
const INO_PROFILE_LABEL = 'Prog AUTO ESP32 V2';
const DEFAULT_LINE_THRESHOLD = 200;
const DEFAULT_ACTION_DURATION = 250;
const DEFAULT_LINEAR_SPEED = 200;

export type FlowInoProfileId = typeof INO_PROFILE_ID;

export interface FlowInoExportWarning {
  code: string;
  message: string;
  nodeId?: string;
}

export interface FlowInoExportResult {
  profileId: FlowInoProfileId;
  profileLabel: string;
  filename: string;
  functionName: string;
  content: string;
  warnings: FlowInoExportWarning[];
}

interface CompilerContext {
  strategy: FlowStrategy;
  nodeById: Map<string, FlowNode>;
  outgoingBySource: Map<string, FlowEdge[]>;
  incomingByTarget: Map<string, FlowEdge[]>;
  executableNodes: FlowNode[];
  stateByNodeId: Map<string, number>;
  repeatCounterByNodeId: Map<string, string>;
  warnings: FlowInoExportWarning[];
  warningKeys: Set<string>;
  entryState: number;
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function stripDiacritics(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function sanitizeIdentifier(value: string, fallback: string) {
  const normalized = stripDiacritics(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const safe = normalized || fallback;
  return /^[a-z_]/.test(safe) ? safe : `_${safe}`;
}

function sanitizeFilename(value: string, fallback: string) {
  const normalized = stripDiacritics(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || fallback;
}

function safeComment(value: string) {
  return value.replace(/\*\//g, '* /');
}

function paramValue(node: FlowNode, name: string) {
  return node.data.params.find((param) => param.name === name)?.value;
}

function numberParam(node: FlowNode, name: string, fallback: number) {
  const raw = paramValue(node, name);
  const value = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(value)) return fallback;
  return value;
}

function integerParam(node: FlowNode, name: string, fallback: number, min?: number) {
  const value = Math.trunc(numberParam(node, name, fallback));
  if (min !== undefined && value < min) return min;
  return value;
}

function boolParam(node: FlowNode, name: string, fallback: boolean) {
  const raw = paramValue(node, name);
  if (typeof raw === 'boolean') return raw;
  if (typeof raw === 'string') {
    if (raw.toLowerCase() === 'true') return true;
    if (raw.toLowerCase() === 'false') return false;
  }
  return fallback;
}

function textParam(node: FlowNode, name: string, fallback: string) {
  const raw = paramValue(node, name);
  if (typeof raw !== 'string') return fallback;
  return raw;
}

function addWarning(context: CompilerContext, warning: FlowInoExportWarning) {
  const key = `${warning.code}|${warning.nodeId ?? ''}|${warning.message}`;
  if (context.warningKeys.has(key)) return;
  context.warningKeys.add(key);
  context.warnings.push(warning);
}

function outgoingEdges(context: CompilerContext, nodeId: string) {
  return context.outgoingBySource.get(nodeId) ?? [];
}

function incomingEdges(context: CompilerContext, nodeId: string) {
  return context.incomingByTarget.get(nodeId) ?? [];
}

function resolveTargetState(
  context: CompilerContext,
  sourceNodeId: string,
  targetNodeId: string,
  fallbackState: number,
  warningCode: string
) {
  if (targetNodeId === 'start') {
    return context.entryState;
  }

  const nextState = context.stateByNodeId.get(targetNodeId);
  if (nextState !== undefined) return nextState;

  addWarning(context, {
    code: warningCode,
    nodeId: sourceNodeId,
    message: `No "${sourceNodeId}" aponta para destino invalido "${targetNodeId}". Voltando ao inicio.`,
  });
  return fallbackState;
}

function resolveLinearNextState(context: CompilerContext, node: FlowNode) {
  const edges = outgoingEdges(context, node.id);
  if (edges.length === 0) {
    addWarning(context, {
      code: 'terminal-node',
      nodeId: node.id,
      message: `No "${node.data.label}" sem saida. Voltando ao inicio.`,
    });
    return context.entryState;
  }

  if (edges.length > 1) {
    addWarning(context, {
      code: 'multiple-linear-edges',
      nodeId: node.id,
      message: `No "${node.data.label}" tem multiplas saidas lineares. Usando a primeira conexao.`,
    });
  }

  return resolveTargetState(
    context,
    node.id,
    edges[0].target,
    context.entryState,
    'invalid-linear-target'
  );
}

function resolveBranchState(
  context: CompilerContext,
  node: FlowNode,
  handle: 'yes' | 'no' | 'loop' | 'done'
) {
  const edges = outgoingEdges(context, node.id);
  const branchEdge = edges.find((edge) =>
    handle === 'loop' ? (edge.sourceHandle ?? 'loop') === 'loop' : edge.sourceHandle === handle
  );

  if (!branchEdge) {
    addWarning(context, {
      code: 'missing-branch',
      nodeId: node.id,
      message: `No "${node.data.label}" sem ramo "${handle}". Voltando ao inicio.`,
    });
    return context.entryState;
  }

  return resolveTargetState(
    context,
    node.id,
    branchEdge.target,
    context.entryState,
    'invalid-branch-target'
  );
}

function sensorConditionExpression(context: CompilerContext, node: FlowNode) {
  const side = textParam(node, 'lado', 'esquerdo').toLowerCase();
  const detectando = boolParam(node, 'detectando', false);

  if (!detectando && node.data.definitionId !== 'sensor_line') {
    addWarning(context, {
      code: 'distance-not-supported',
      nodeId: node.id,
      message: `No "${node.data.label}" usa modo por distancia, mas o firmware alvo so suporta deteccao digital.`,
    });
  }

  if (node.data.definitionId === 'sensor_front') {
    return side === 'direito' ? 'sen_centro_dir == HIGH' : 'sen_centro_esq == HIGH';
  }

  if (node.data.definitionId === 'sensor_side') {
    return side === 'direito' ? 'sen_dir == HIGH' : 'sen_esq == HIGH';
  }

  if (node.data.definitionId === 'sensor_line') {
    return side === 'direito'
      ? `sensorLD <= ${DEFAULT_LINE_THRESHOLD}`
      : `sensorLE <= ${DEFAULT_LINE_THRESHOLD}`;
  }

  addWarning(context, {
    code: 'unknown-sensor-node',
    nodeId: node.id,
    message: `Tipo de sensor "${node.data.definitionId}" nao suportado no perfil .ino.`,
  });
  return 'false';
}

function gateConditionExpression(
  context: CompilerContext,
  gateNode: FlowNode,
  stack: Set<string> = new Set()
): string {
  if (stack.has(gateNode.id)) {
    addWarning(context, {
      code: 'gate-cycle',
      nodeId: gateNode.id,
      message: `Ciclo detectado em gate "${gateNode.data.label}".`,
    });
    return 'false';
  }

  const nestedStack = new Set(stack);
  nestedStack.add(gateNode.id);

  const sortedIncoming = incomingEdges(context, gateNode.id)
    .map((edge, index) => ({ edge, index }))
    .sort((left, right) => {
      const leftRank = left.edge.targetHandle === 'in-0' ? 0 : left.edge.targetHandle === 'in-1' ? 1 : 10 + left.index;
      const rightRank = right.edge.targetHandle === 'in-0' ? 0 : right.edge.targetHandle === 'in-1' ? 1 : 10 + right.index;
      return leftRank - rightRank;
    });

  const relevantIncoming = sortedIncoming.filter(({ edge }) => {
    const source = context.nodeById.get(edge.source);
    if (!source) return true;
    if (source.data.category === 'sensor' || source.data.category === 'gate') return true;
    return edge.sourceHandle === 'yes' || edge.sourceHandle === 'no';
  });

  if (relevantIncoming.length === 0) {
    addWarning(context, {
      code: 'gate-without-inputs',
      nodeId: gateNode.id,
      message: `Gate "${gateNode.data.label}" sem entradas. Saida assumida como falsa.`,
    });
    return 'false';
  }

  const expressions = relevantIncoming.map(({ edge }) => {
    const source = context.nodeById.get(edge.source);
    if (!source) {
      addWarning(context, {
        code: 'gate-invalid-input-source',
        nodeId: gateNode.id,
        message: `Gate "${gateNode.data.label}" referencia origem invalida "${edge.source}".`,
      });
      return 'false';
    }

    let expression = 'false';
    if (source.data.category === 'sensor') {
      expression = sensorConditionExpression(context, source);
    } else if (source.data.category === 'gate') {
      expression = gateConditionExpression(context, source, nestedStack);
    } else {
      addWarning(context, {
        code: 'gate-non-boolean-input',
        nodeId: gateNode.id,
        message: `Entrada "${source.data.label}" no gate "${gateNode.data.label}" nao e booleana. Assumindo verdadeiro.`,
      });
      expression = 'true';
    }

    if (edge.sourceHandle === 'no') {
      return `!(${expression})`;
    }

    if (edge.sourceHandle && edge.sourceHandle !== 'yes') {
      addWarning(context, {
        code: 'gate-unknown-input-handle',
        nodeId: gateNode.id,
        message: `Handle "${edge.sourceHandle}" no gate "${gateNode.data.label}" nao e suportado. Tratando como "yes".`,
      });
    }

    return expression;
  });

  if (gateNode.data.definitionId === 'gate_and') {
    return expressions.map((expression) => `(${expression})`).join(' && ');
  }

  if (gateNode.data.definitionId === 'gate_or') {
    return expressions.map((expression) => `(${expression})`).join(' || ');
  }

  if (gateNode.data.definitionId === 'gate_not') {
    return `!(${expressions[0]})`;
  }

  addWarning(context, {
    code: 'unknown-gate-node',
    nodeId: gateNode.id,
    message: `Gate "${gateNode.data.definitionId}" nao suportado no perfil .ino.`,
  });
  return 'false';
}

function compileActionBody(context: CompilerContext, node: FlowNode): string[] {
  const nextState = resolveLinearNextState(context, node);

  if (node.data.definitionId === 'action_forward') {
    const velocity = integerParam(node, 'velocidade', DEFAULT_LINEAR_SPEED, 0);
    const duration = integerParam(node, 'tempo', DEFAULT_ACTION_DURATION, 0);
    return [`frente(${velocity});`, `delay(${duration});`, `estado = ${nextState};`, 'break;'];
  }

  if (node.data.definitionId === 'action_backward') {
    const velocity = integerParam(node, 'velocidade', DEFAULT_LINEAR_SPEED, 0);
    const duration = integerParam(node, 'tempo', DEFAULT_ACTION_DURATION, 0);
    return [`re(${velocity});`, `delay(${duration});`, `estado = ${nextState};`, 'break;'];
  }

  if (node.data.definitionId === 'action_turn_left') {
    const duration = integerParam(node, 'tempo', DEFAULT_ACTION_DURATION, 0);
    return [`esquerda(velocgiro);`, `delay(${duration});`, `estado = ${nextState};`, 'break;'];
  }

  if (node.data.definitionId === 'action_turn_right') {
    const duration = integerParam(node, 'tempo', DEFAULT_ACTION_DURATION, 0);
    return [`direita(velocgiro);`, `delay(${duration});`, `estado = ${nextState};`, 'break;'];
  }

  if (node.data.definitionId === 'action_stop') {
    return ['parado();', `estado = ${nextState};`, 'break;'];
  }

  if (node.data.definitionId === 'action_wait') {
    const duration = integerParam(node, 'tempo', DEFAULT_ACTION_DURATION, 0);
    return [`delay(${duration});`, `estado = ${nextState};`, 'break;'];
  }

  addWarning(context, {
    code: 'unknown-action-node',
    nodeId: node.id,
    message: `Acao "${node.data.definitionId}" nao suportada no exportador .ino.`,
  });
  return [`estado = ${nextState};`, 'break;'];
}

function compileLogicBody(context: CompilerContext, node: FlowNode): string[] {
  if (node.data.definitionId !== 'logic_repeat') {
    addWarning(context, {
      code: 'unsupported-logic-node',
      nodeId: node.id,
      message: `No logico "${node.data.definitionId}" sera tratado como passagem linear.`,
    });
    const nextState = resolveLinearNextState(context, node);
    return [`estado = ${nextState};`, 'break;'];
  }

  const infinite = boolParam(node, 'indefinido', false);
  const loopState = resolveBranchState(context, node, 'loop');

  if (infinite) {
    return [`estado = ${loopState};`, 'break;'];
  }

  const counterName = context.repeatCounterByNodeId.get(node.id);
  const times = integerParam(node, 'vezes', 1, 1);
  const doneState = resolveBranchState(context, node, 'done');

  if (!counterName) {
    addWarning(context, {
      code: 'repeat-counter-missing',
      nodeId: node.id,
      message: `No repeat "${node.data.label}" sem contador interno. Usando transicao linear.`,
    });
    return [`estado = ${doneState};`, 'break;'];
  }

  return [
    `if (${counterName} < ${times}) {`,
    `  ${counterName}++;`,
    `  estado = ${loopState};`,
    '} else {',
    `  ${counterName} = 0;`,
    `  estado = ${doneState};`,
    '}',
    'break;',
  ];
}

function compileDecisionBody(context: CompilerContext, node: FlowNode): string[] {
  const condition =
    node.data.category === 'sensor'
      ? sensorConditionExpression(context, node)
      : gateConditionExpression(context, node);
  const yesState = resolveBranchState(context, node, 'yes');
  const noState = resolveBranchState(context, node, 'no');

  return [
    `if (${condition}) {`,
    `  estado = ${yesState};`,
    '} else {',
    `  estado = ${noState};`,
    '}',
    'break;',
  ];
}

function compileCaseBody(context: CompilerContext, node: FlowNode): string[] {
  if (node.data.category === 'action') {
    return compileActionBody(context, node);
  }

  if (node.data.category === 'logic') {
    return compileLogicBody(context, node);
  }

  if (node.data.category === 'sensor' || node.data.category === 'gate') {
    return compileDecisionBody(context, node);
  }

  const nextState = resolveLinearNextState(context, node);
  return [`estado = ${nextState};`, 'break;'];
}

function collectReachableNodes(
  nodeById: Map<string, FlowNode>,
  outgoingBySource: Map<string, FlowEdge[]>
) {
  const reachable = new Set<string>();
  const queue: string[] = ['start'];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentOutgoing = outgoingBySource.get(current) ?? [];
    for (const edge of currentOutgoing) {
      if (!nodeById.has(edge.target)) continue;
      if (reachable.has(edge.target)) continue;
      reachable.add(edge.target);
      queue.push(edge.target);
    }
  }

  reachable.delete('start');
  return reachable;
}

function createCompilerContext(strategy: FlowStrategy): CompilerContext {
  const nodeById = new Map(strategy.nodes.map((node) => [node.id, node]));
  if (!nodeById.has('start')) {
    throw new Error('Nao foi possivel exportar .ino: estrategia sem no "start".');
  }

  const outgoingBySource = new Map<string, FlowEdge[]>();
  const incomingByTarget = new Map<string, FlowEdge[]>();

  for (const edge of strategy.edges) {
    const out = outgoingBySource.get(edge.source) ?? [];
    out.push(edge);
    outgoingBySource.set(edge.source, out);

    const incoming = incomingByTarget.get(edge.target) ?? [];
    incoming.push(edge);
    incomingByTarget.set(edge.target, incoming);
  }

  const startEdges = outgoingBySource.get('start') ?? [];
  if (startEdges.length === 0) {
    throw new Error('Nao foi possivel exportar .ino: o no "start" nao possui saida.');
  }

  const reachableNodeIds = collectReachableNodes(nodeById, outgoingBySource);
  const executableNodes = strategy.nodes.filter((node) => reachableNodeIds.has(node.id));
  if (executableNodes.length === 0) {
    throw new Error('Nao foi possivel exportar .ino: nao ha nos executaveis apos o inicio.');
  }

  const stateByNodeId = new Map<string, number>();
  executableNodes.forEach((node, index) => {
    stateByNodeId.set(node.id, index + 1);
  });

  const context: CompilerContext = {
    strategy,
    nodeById,
    outgoingBySource,
    incomingByTarget,
    executableNodes,
    stateByNodeId,
    repeatCounterByNodeId: new Map<string, string>(),
    warnings: [],
    warningKeys: new Set<string>(),
    entryState: 1,
  };

  if (startEdges.length > 1) {
    addWarning(context, {
      code: 'multiple-start-edges',
      nodeId: 'start',
      message: 'No "start" com multiplas saidas. Usando a primeira conexao.',
    });
  }

  const firstTarget = startEdges[0].target;
  if (firstTarget === 'start') {
    addWarning(context, {
      code: 'start-loop',
      nodeId: 'start',
      message: 'No "start" ligado a ele mesmo. Usando o primeiro estado executavel.',
    });
  } else {
    const mappedEntry = stateByNodeId.get(firstTarget);
    if (mappedEntry !== undefined) {
      context.entryState = mappedEntry;
    } else {
      addWarning(context, {
        code: 'invalid-start-target',
        nodeId: 'start',
        message: `No "start" aponta para destino invalido "${firstTarget}". Usando primeiro estado.`,
      });
    }
  }

  const usedCounterNames = new Set<string>();
  for (const node of executableNodes) {
    if (node.data.definitionId !== 'logic_repeat') continue;
    const base = `rep_${sanitizeIdentifier(node.id, 'repeat')}`;
    let candidate = base;
    let suffix = 2;
    while (usedCounterNames.has(candidate)) {
      candidate = `${base}_${suffix}`;
      suffix += 1;
    }
    usedCounterNames.add(candidate);
    context.repeatCounterByNodeId.set(node.id, candidate);
  }

  return context;
}

function buildFunctionName(strategyName: string) {
  const base = sanitizeIdentifier(strategyName, 'estrategia');
  return `estrategia_site_${base}`.slice(0, 63);
}

function buildFileName(strategyName: string) {
  const base = sanitizeFilename(strategyName, 'estrategia');
  return `${base}.ino`;
}

export function buildFlowInoExport(strategy: FlowStrategy): FlowInoExportResult {
  const context = createCompilerContext(strategy);
  const functionName = buildFunctionName(strategy.name || 'estrategia');
  const filename = buildFileName(strategy.name || 'estrategia');

  const lines: string[] = [
    '/**',
    ' * SumoBlocks .ino export',
    ` * Perfil: ${INO_PROFILE_LABEL}`,
    ` * Estrategia: ${safeComment(strategy.name || 'Sem nome')}`,
    ` * Descricao: ${safeComment(strategy.description || 'Sem descricao')}`,
    ' *',
    ' * Integracao sugerida:',
    ' * 1) Copie esta funcao para Estrategias.ino.',
    ' * 2) No switch (estrategia), adicione um case livre chamando esta funcao.',
    ' */',
    '',
    `void ${functionName}() {`,
    '  Le_Sensores();',
    `  static int estado = ${context.entryState};`,
  ];

  if (context.repeatCounterByNodeId.size > 0) {
    for (const counterName of context.repeatCounterByNodeId.values()) {
      lines.push(`  static int ${counterName} = 0;`);
    }
  }

  lines.push('', '  switch (estado) {');

  for (const node of context.executableNodes) {
    const state = context.stateByNodeId.get(node.id);
    if (!state) continue;
    lines.push(`    case ${state}: {`);
    lines.push(`      // ${safeComment(node.data.label)} (${node.data.definitionId})`);
    const bodyLines = compileCaseBody(context, node);
    for (const bodyLine of bodyLines) {
      lines.push(`      ${bodyLine}`);
    }
    lines.push('    }');
  }

  lines.push(
    '    default:',
    `      estado = ${context.entryState};`,
    '      break;',
    '  }',
    '}',
    ''
  );

  return {
    profileId: INO_PROFILE_ID,
    profileLabel: INO_PROFILE_LABEL,
    filename,
    functionName,
    content: lines.join('\n'),
    warnings: context.warnings,
  };
}

export function exportFlowINO(strategy: FlowStrategy): FlowInoExportResult {
  const result = buildFlowInoExport(strategy);
  downloadFile(result.content, result.filename, 'text/plain;charset=utf-8');
  return result;
}
