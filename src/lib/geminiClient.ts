import { MarkerType } from '@xyflow/react';
import { z } from 'zod';
import { blockDefinitions, getDefinition, type BlockCategory, type BlockParam } from '@/types/blocks';
import type { FlowEdge, FlowNode, FlowStrategy } from '@/types/flow';
import { createUuid } from '@/lib/uuid';

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const SUMOBLOCKS_PROMPT_VERSION = 'sumoblocks-flow-v2.0';

const SYSTEM_PROMPT = [
  `Você é o gerador oficial de estratégias do SumoBlocks (${SUMOBLOCKS_PROMPT_VERSION}).`,
  'Seu trabalho é converter linguagem natural em um grafo executável para mini-sumo.',
  '',
  'COMO AGIR',
  '- Priorize precisão de schema e compatibilidade com o editor.',
  '- Use somente os blocos e parâmetros permitidos no catálogo da requisição.',
  '- Não invente tipos de nó, handles ou campos fora do schema.',
  '- Se a instrução for ambígua, assuma comportamento seguro e competitivo.',
  '- Raciocine internamente; não exponha explicações fora do JSON.',
  '',
  'COMO RETORNAR',
  '- Retorne exatamente 1 objeto JSON.',
  '- Nunca use markdown, nunca use crases, nunca inclua texto antes/depois.',
  '- Todos os IDs devem ser únicos e estáveis (snake_case ou kebab-case).',
  '- Não inclua o nó `start` em `nodes`; referencie `start` apenas em `edges.source`.',
  '- Em cada nó, inclua `params` com nomes fiéis ao catálogo.',
  '',
  'REGRAS DO GRAFO',
  '- Sensor/Gate podem usar `sourceHandle` yes/no para bifurcação.',
  '- `logic_repeat` deve usar `loop` para continuar e `done` para saída (quando aplicável).',
  '- Garanta pelo menos uma aresta partindo de `start` para iniciar execução.',
].join('\n');

const geminiParamSchema = z.object({
  name: z.string().min(1),
  value: z.union([z.string(), z.number(), z.boolean()]).default(''),
});

const geminiNodeSchema = z.object({
  id: z.string().min(1),
  definitionId: z.string().min(1),
  x: z.number().optional(),
  y: z.number().optional(),
  params: z.array(geminiParamSchema).default([]),
});

const geminiEdgeSchema = z.object({
  source: z.string().min(1),
  target: z.string().min(1),
  sourceHandle: z.string().optional(),
});

const geminiStrategySchema = z.object({
  name: z.string().min(1),
  description: z.string().default(''),
  nodes: z.array(geminiNodeSchema).min(1),
  edges: z.array(geminiEdgeSchema).default([]),
});

type GeminiStrategyDraft = z.infer<typeof geminiStrategySchema>;

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

const GEMINI_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    name: { type: 'STRING' },
    description: { type: 'STRING' },
    nodes: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          id: { type: 'STRING' },
          definitionId: { type: 'STRING' },
          x: { type: 'NUMBER' },
          y: { type: 'NUMBER' },
          params: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                name: { type: 'STRING' },
                value: {
                  anyOf: [{ type: 'STRING' }, { type: 'NUMBER' }, { type: 'BOOLEAN' }],
                },
              },
              required: ['name', 'value'],
            },
          },
        },
        required: ['id', 'definitionId', 'params'],
      },
    },
    edges: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          source: { type: 'STRING' },
          target: { type: 'STRING' },
          sourceHandle: { type: 'STRING' },
        },
        required: ['source', 'target'],
      },
    },
  },
  required: ['name', 'description', 'nodes', 'edges'],
};

function resolveGeminiApiKey() {
  const viteKey = import.meta.env.VITE_GEMINI_API_KEY;
  const processKey = typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : undefined;
  return (viteKey || processKey || '').trim();
}

function toNodeType(category: BlockCategory): FlowNode['type'] {
  if (category === 'sensor') return 'sensorNode';
  if (category === 'action') return 'actionNode';
  if (category === 'gate') return 'gateNode';
  return 'logicNode';
}

function parseBoolean(value: string) {
  const normalized = String(value).trim().toLowerCase();
  return ['1', 'true', 'sim', 'yes', 'y'].includes(normalized);
}

function applyParamOverrides(baseParams: BlockParam[], overrides: GeminiStrategyDraft['nodes'][number]['params']) {
  const byName = new Map(overrides.map((param) => [param.name.trim().toLowerCase(), param.value]));

  return baseParams.map((param) => {
    const override = byName.get(param.name.trim().toLowerCase());
    if (override === undefined) return { ...param };

    if (param.type === 'number') {
      const numeric = Number(override);
      return {
        ...param,
        value: Number.isFinite(numeric) ? numeric : param.value,
      };
    }

    if (param.type === 'boolean') {
      return {
        ...param,
        value: typeof override === 'boolean' ? override : parseBoolean(String(override)),
      };
    }

    if (param.type === 'select') {
      const normalizedOverride = String(override);
      if (!param.options?.length) {
        return { ...param, value: normalizedOverride };
      }

      const matched =
        param.options.find((option) => option.toLowerCase() === normalizedOverride.toLowerCase()) ??
        param.options[0];

      return {
        ...param,
        value: matched,
      };
    }

    return {
      ...param,
      value: String(override),
    };
  });
}

function createStartNode(): FlowNode {
  return {
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
  };
}

function normalizeNodeId(rawId: string, fallbackIndex: number, usedIds: Set<string>) {
  const cleaned = rawId
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const base = cleaned || `node-${fallbackIndex + 1}`;
  let candidate = base;
  let suffix = 2;

  while (usedIds.has(candidate) || candidate === 'start') {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  usedIds.add(candidate);
  return candidate;
}

function normalizeSourceHandle(sourceNode: FlowNode | undefined, sourceHandle?: string) {
  const normalized = sourceHandle?.trim().toLowerCase();
  if (!sourceNode) return undefined;

  if (sourceNode.data.category === 'sensor' || sourceNode.data.category === 'gate') {
    if (normalized === 'yes' || normalized === 'sim') return 'yes';
    if (normalized === 'no' || normalized === 'não' || normalized === 'nao') return 'no';
    return undefined;
  }

  if (sourceNode.data.definitionId === 'logic_repeat') {
    if (normalized === 'done') return 'done';
    return 'loop';
  }

  return undefined;
}

function edgePresentation(sourceNode: FlowNode | undefined, sourceHandle?: string) {
  const normalizedHandle = normalizeSourceHandle(sourceNode, sourceHandle);

  if (normalizedHandle === 'yes') {
    return { sourceHandle: 'yes', label: 'Sim', style: { stroke: '#22c55e' } };
  }

  if (normalizedHandle === 'no') {
    return { sourceHandle: 'no', label: 'Não', style: { stroke: '#ef4444' } };
  }

  if (normalizedHandle === 'loop') {
    return { sourceHandle: 'loop', label: 'Loop', style: { stroke: '#f59e0b' } };
  }

  if (normalizedHandle === 'done') {
    return { sourceHandle: 'done', label: 'Done', style: { stroke: '#0ea5e9' } };
  }

  return { sourceHandle: undefined, label: undefined, style: { stroke: '#64748b' } };
}

function summarizeCurrentStrategy(strategy?: FlowStrategy) {
  if (!strategy) return 'Sem estratégia atual no contexto.';

  const nodeSummary = strategy.nodes
    .slice(0, 20)
    .map((node) => `${node.id}:${node.data.definitionId}`)
    .join(', ');

  return `Estratégia atual: ${strategy.name}\nNós (id:def): ${nodeSummary}\nTotal edges: ${strategy.edges.length}`;
}

function formatCatalog() {
  return blockDefinitions
    .map((definition) => {
      const params = definition.params
        .map((param) => {
          const options = param.options?.length ? ` options=[${param.options.join('|')}]` : '';
          return `${param.name}:${param.type}${options} default=${String(param.value)}`;
        })
        .join(', ');

      return `- ${definition.id} (${definition.category}) -> ${params || 'params: none'}`;
    })
    .join('\n');
}

function outputContractExample() {
  return JSON.stringify(
    {
      name: 'Busca circular e ataque frontal',
      description: 'Busca oponente, aproxima e ataca com correção por sensor.',
      nodes: [
        {
          id: 'sensor_front_1',
          definitionId: 'sensor_front',
          x: 240,
          y: 180,
          params: [
            { name: 'detectando', value: true },
            { name: 'lado', value: 'esquerdo' },
            { name: 'distância', value: 20 },
          ],
        },
        {
          id: 'action_forward_1',
          definitionId: 'action_forward',
          x: 500,
          y: 300,
          params: [
            { name: 'tempo', value: 900 },
            { name: 'velocidade', value: 255 },
          ],
        },
      ],
      edges: [
        { source: 'start', target: 'sensor_front_1' },
        { source: 'sensor_front_1', target: 'action_forward_1', sourceHandle: 'yes' },
      ],
    },
    null,
    2
  );
}

function buildPrompt(userPrompt: string, currentStrategy?: FlowStrategy) {
  return [
    `PERFIL: ${SUMOBLOCKS_PROMPT_VERSION}`,
    '',
    'CONTEXTO',
    '- Você está gerando uma estratégia para o editor visual SumoBlocks.',
    '- A estratégia precisa ser coerente para mini-sumo (buscar, detectar, atacar, recuperar).',
    '',
    'CATÁLOGO DE BLOCOS AUTORIZADOS',
    formatCatalog(),
    '',
    'CONTRATO DE SAÍDA OBRIGATÓRIO',
    '- Objeto JSON com chaves exatas: name, description, nodes, edges.',
    '- Não use campos extras.',
    '- Cada node deve ter: id, definitionId, params (x/y opcionais).',
    '- Cada edge deve ter: source, target (sourceHandle opcional).',
    '- Use start somente em edges.source.',
    '',
    'EXEMPLO DE FORMATO (NÃO COPIAR LITERALMENTE, APENAS ESTRUTURA)',
    outputContractExample(),
    '',
    'REGRAS DE DECISÃO',
    '1. Monte fluxo enxuto e funcional (normalmente 4-12 nós).',
    '2. Inclua parâmetros coerentes com defaults e ajuste quando o pedido exigir.',
    '3. Crie bifurcações com yes/no quando houver decisão de sensor/gate.',
    '4. Evite nós desconectados.',
    '5. Se faltar contexto, assuma estratégia agressiva equilibrada.',
    '',
    'ESTRATÉGIA ATUAL (PARA CONTEXTO, NÃO É OBRIGATÓRIO REUTILIZAR)',
    summarizeCurrentStrategy(currentStrategy),
    '',
    'PEDIDO DO USUÁRIO',
    `Pedido do usuário: ${userPrompt}`,
  ].join('\n\n');
}

function extractJsonText(response: GeminiResponse) {
  const text = response.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('') ?? '';
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('Gemini retornou resposta vazia.');
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced?.[1] ?? trimmed).trim();
}

export function buildFlowStrategyFromGeminiDraft(draftInput: unknown): FlowStrategy {
  const draft = geminiStrategySchema.parse(draftInput);
  const usedIds = new Set<string>(['start']);
  const idMap = new Map<string, string>([['start', 'start']]);

  const mappedNodes: FlowNode[] = draft.nodes
    .map((node, index) => {
      const definition = getDefinition(node.definitionId);
      if (!definition) return null;

      const normalizedId = normalizeNodeId(node.id, index, usedIds);
      idMap.set(node.id, normalizedId);

      return {
        id: normalizedId,
        type: toNodeType(definition.category),
        position: {
          x: Number.isFinite(node.x) ? Number(node.x) : 240 + (index % 3) * 220,
          y: Number.isFinite(node.y) ? Number(node.y) : 170 + Math.floor(index / 3) * 130,
        },
        data: {
          definitionId: definition.id,
          label: definition.label,
          category: definition.category,
          params: applyParamOverrides(definition.params, node.params),
        },
      } satisfies FlowNode;
    })
    .filter((node): node is FlowNode => Boolean(node));

  if (mappedNodes.length === 0) {
    throw new Error('A resposta da IA não trouxe nós válidos.');
  }

  const allNodes = [createStartNode(), ...mappedNodes];
  const nodeMap = new Map(allNodes.map((node) => [node.id, node]));
  const seenEdges = new Set<string>();

  const mappedEdges: FlowEdge[] = draft.edges
    .map((edge) => {
      const sourceRaw = edge.source.trim();
      const targetRaw = edge.target.trim();

      const source = sourceRaw === 'start' ? 'start' : idMap.get(sourceRaw);
      const target = idMap.get(targetRaw);

      if (!source || !target || source === target) return null;

      const sourceNode = nodeMap.get(source);
      const presentation = edgePresentation(sourceNode, edge.sourceHandle);
      const dedupeKey = `${source}|${target}|${presentation.sourceHandle ?? ''}`;

      if (seenEdges.has(dedupeKey)) return null;
      seenEdges.add(dedupeKey);

      return {
        id: createUuid(),
        source,
        target,
        sourceHandle: presentation.sourceHandle,
        label: presentation.label,
        style: presentation.style,
        markerEnd: { type: MarkerType.ArrowClosed },
        animated: true,
      } satisfies FlowEdge;
    })
    .filter((edge): edge is FlowEdge => Boolean(edge));

  if (!mappedEdges.some((edge) => edge.source === 'start') && mappedNodes.length > 0) {
    mappedEdges.unshift({
      id: createUuid(),
      source: 'start',
      target: mappedNodes[0].id,
      style: { stroke: '#64748b' },
      markerEnd: { type: MarkerType.ArrowClosed },
      animated: true,
    });
  }

  return {
    id: createUuid(),
    name: draft.name.trim() || 'Estratégia IA',
    description: draft.description.trim(),
    nodes: allNodes,
    edges: mappedEdges,
  };
}

export function hasGeminiApiKey() {
  return resolveGeminiApiKey().length > 0;
}

export async function generateFlowStrategyFromPrompt({
  prompt,
  currentStrategy,
  signal,
}: {
  prompt: string;
  currentStrategy?: FlowStrategy;
  signal?: AbortSignal;
}) {
  const apiKey = resolveGeminiApiKey();
  if (!apiKey) {
    throw new Error('VITE_GEMINI_API_KEY/GEMINI_API_KEY não configurada.');
  }

  const userPrompt = prompt.trim();
  if (!userPrompt) {
    throw new Error('Digite um prompt para gerar a estratégia.');
  }

  const requestBody = {
    systemInstruction: {
      parts: [
        {
          text: SYSTEM_PROMPT,
        },
      ],
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: buildPrompt(userPrompt, currentStrategy) }],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json',
      responseSchema: GEMINI_RESPONSE_SCHEMA,
    },
  };

  const response = await fetch(GEMINI_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify(requestBody),
    signal,
  });

  const payload = (await response.json().catch(() => ({}))) as GeminiResponse;

  if (!response.ok) {
    throw new Error(payload.error?.message || `Falha na API Gemini (${response.status}).`);
  }

  const rawJson = extractJsonText(payload);
  const parsed = JSON.parse(rawJson);
  return buildFlowStrategyFromGeminiDraft(parsed);
}
