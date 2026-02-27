# Plano de Execução — SumoBlocks Flow + Gemini

Data base da pesquisa: **27/02/2026**.

## Referências externas usadas
- Gemini API Structured Output (JSON + schema): https://ai.google.dev/gemini-api/docs/structured-output
- Gemini API Key (boas práticas e uso de chave): https://ai.google.dev/gemini-api/docs/api-key
- React Flow Save/Restore (`toObject`, persistência de nodes/edges): https://reactflow.dev/examples/interaction/save-and-restore
- Projetos visuais/open-source para inspiração de UX e modularidade:
  - Flowise: https://github.com/FlowiseAI/Flowise
  - Langflow: https://github.com/langflow-ai/langflow
  - n8n: https://github.com/n8n-io/n8n
- Sinalizações da comunidade sobre fragilidade de JSON em LLM (reforço para validação forte):
  - https://www.reddit.com/r/LangChain/comments/1jh2fbo/parsing_json_in_a_reliable_way/
  - https://www.reddit.com/r/Bard/comments/1fpc7x1/how_to_get_structured_output_json_from_free_tier/

## Objetivo
Garantir exportação JSON confiável e adicionar geração de estratégia por prompt (Gemini) com validação, revisão e aplicação segura no editor de fluxo.

## Fase 1 — Contrato de exportação (Flow)
1. Extrair uma função pura de payload de export (`FlowStrategy -> payload`).
2. Garantir que `nodes`, `edges` e todos os `params` sejam preservados sem perda.
3. Manter versão de schema mínima no JSON exportado.
4. Cobrir com testes Vitest focados em:
   - preservação de `number/string/boolean/select`
   - legibilidade (`readable.steps`)
   - não mutação do objeto original.

Critério de aceite:
- Exportação usa helper puro testado.
- Testes verdes cobrindo parâmetros e estrutura.

## Fase 2 — Pipeline Gemini para `FlowStrategy`
1. Criar cliente Gemini (`src/lib/geminiClient.ts`) usando API key por `VITE_GEMINI_API_KEY` (fallback `GEMINI_API_KEY`).
2. Pedir saída estruturada JSON com schema explícito e parsing robusto.
3. Validar resposta e converter para `FlowStrategy` compatível com o canvas:
   - apenas `definitionId` válidos
   - hidratar params a partir de `blockDefinitions`
   - normalizar edges/handles (`yes/no`, `loop/done`)
   - garantir nó `start` e ligação inicial.
4. Expor erros acionáveis (sem chave, JSON inválido, resposta vazia, etc.).

Critério de aceite:
- Prompt gera uma estratégia válida sem quebrar o editor.
- Respostas inválidas falham com mensagem clara.

## Fase 3 — UX de IA no editor
1. Adicionar aba **IA (Gemini)** na `FlowPalette`.
2. Permitir:
   - entrada de prompt
   - geração com loading
   - preview resumido da estratégia gerada
   - aplicar/descartar antes de substituir o fluxo ativo.
3. Degradação graciosa quando não houver chave:
   - botão desabilitado
   - mensagem objetiva no painel.

Critério de aceite:
- Fluxo completo: Prompt -> Preview -> Aplicar funciona no app.

## Fase 4 — Validação final
1. Rodar `npm run test`.
2. Rodar `npm run build`.
3. Revisar regressões visuais/funcionais básicas.

Critério de aceite:
- Build e testes passando.

## Execução (status)
- [x] Fase 1 concluída
- [x] Fase 2 concluída
- [x] Fase 3 concluída
- [x] Fase 4 concluída

## Evidência de execução
- `npm run test` -> **7 testes passando** (flowExporter + geminiClient + exemplo).
- `npm run build` -> **build concluído** em produção (sem erros de compilação).
