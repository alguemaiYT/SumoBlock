# SumoBlock Copilot instructions

## Build, test, and lint

- Install dependencies with `npm install`.
- Start local development with `npm run dev` (Vite serves on port 8080).
- Build the production bundle with `npm run build`.
- Run the full test suite with `npm run test`.
- Run a single test file with `npm run test -- src/lib/flowExporter.test.ts`.
- Use watch mode with `npm run test:watch`.
- Run ESLint with `npm run lint`.
- Playwright MCP for workspace automation is configured in `.vscode/mcp.json` and runs `npm run mcp -- --headless --isolated`.
- Vitest uses `jsdom`, loads `src/test/setup.ts`, and discovers `src/**/*.{test,spec}.{ts,tsx}`.
- Gemini-powered strategy generation requires `VITE_GEMINI_API_KEY` (as documented in `README.md`) or `GEMINI_API_KEY` (see `src/lib/geminiClient.ts`).
- Current verified baseline: `npm run lint` fails before new changes because of existing issues in `src/components/ui/command.tsx`, `src/components/ui/textarea.tsx`, and `tailwind.config.ts`. Do not assume a lint failure comes from your change unless you touched those files.

## High-level architecture

- Live routes are defined in `src/App.tsx`: `/` is the visual flow editor (`src/pages/Index.tsx`) and `/simulator` is the physics simulator (`src/pages/Simulator.tsx`).
- The editor is built around `useFlowEditor` plus React Flow. The three main surfaces are `src/components/flow/FlowPalette.tsx`, `src/components/flow/FlowCanvas.tsx`, and `src/components/flow/NodeInspector.tsx`.
- The editor's working model is `FlowStrategy` from `src/types/flow.ts`: a graph of `nodes` and `edges` plus `name` and `description`. Every live strategy is expected to include the immutable `start` node.
- Reusable strategy snippets are stored as `StrategyBlock`s in browser localStorage under `sumoblocks.strategyBlocks.v1`. `useFlowEditor` writes that data, and `useSumoSimulator` polls the same key every 2 seconds so the simulator can see saved blocks from the editor tab.
- Flow import/export lives in `src/lib/flowExporter.ts`. Exported JSON adds `schemaVersion` and `readable.steps`; import only validates that `nodes` and `edges` exist.
- AI generation lives in `src/lib/geminiClient.ts`. It builds the Gemini prompt from the block catalog in `src/types/blocks.ts`, validates the response with Zod, normalizes node IDs and branch handles, and injects a `start` edge if the model omits one.
- The simulator is assembled from `src/hooks/useSumoSimulator.ts`, `src/lib/sumoPhysics.ts`, and `src/types/sumosim.ts`. Physics uses differential-drive motion, proximity raycasts, line-sensor border checks, and SAT collision handling.
- Important current limitation: simulator strategy selection is UI metadata only. Saved `robotStrategyId` / `opponentStrategyId` values are selectable and displayed, but `stepSimulation()` still does not execute `FlowStrategy` graphs yet; the only live opponent behavior modes are the built-in AI and the special `Parado` option.

## Key conventions

- Prefer the live flow-based stack when editing behavior: `src/types/flow.ts`, `src/hooks/useFlowEditor.ts`, `src/hooks/useSumoSimulator.ts`, and `src/types/sumosim.ts`. The older tree/block stack (`src/hooks/useStrategyEditor.ts`, `src/lib/strategyExporter.ts`, `src/hooks/useSimulator.ts`, `src/types/simulator.ts`, and `src/components/SumoSimulator.tsx`) is still in the repo but is not wired from `src/App.tsx`.
- Preserve Portuguese UI copy and parameter names. Names such as `detectando`, `distância`, `vezes`, and `indefinido` are not just labels: `NodeInspector`, `useFlowEditor`, `flowExporter`, and `geminiClient` all key off those exact names.
- The live simulator only models front bottom line sensors now. `createDefaultLineSensors()` returns left/right front sensors only, and all line-sensor UI/physics assumes that smaller set.
- Sensor nodes use `detectando` as a mode switch: when it is true, the inspector hides the `distância` field instead of treating it like a normal distance-based sensor edit.
- Keep using the `@/` import alias. It is configured in `tsconfig.json`, `vite.config.ts`, and `vitest.config.ts`.
- `logic_repeat` has special cross-file behavior: when `indefinido` is true, the inspector hides `vezes`, new `done` edges are rejected, and existing `done` edges are removed. Changes to repeat-node behavior must keep `NodeInspector`, `useFlowEditor`, `flowExporter`, and `geminiClient` aligned.
- Branch semantics are encoded in edge `sourceHandle`s. Sensor and gate nodes use `yes` and `no`; `logic_repeat` uses `loop` and `done`. Labels and colors are assigned from those handles in both the editor and Gemini import path.
- Linked nodes use `data.linkGroupId`. Editing one linked node updates every node in the group, `FlowCanvas` draws dashed yellow link edges, and `addStrategyBlockToCanvas()` intentionally strips link metadata when pasting a saved block.
- Strategy block actions are intentionally different: `Carregar` replaces the active strategy, `Usar` pastes the block into the current canvas with fresh node IDs, and `Atualizar` overwrites the saved block from the active strategy.
- If you add a new block category or node type, update all cross-file mappings: `src/types/blocks.ts`, node type selection in `useFlowEditor` and `geminiClient`, palette category/color maps in `FlowPalette.tsx`, and MiniMap coloring in `FlowCanvas.tsx`.
- If you change block params or definitions, also review `src/lib/geminiClient.test.ts` and `src/lib/flowExporter.test.ts`; the current automated coverage is centered on those pure-library behaviors rather than the React UI.
