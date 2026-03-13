# Repository Guidelines

## Project Structure & Modules
- `src/`: main app. `components/` reusable UI, `pages/` routed screens, `hooks/` custom React hooks, `lib/` utilities, `types/` shared types, `test/` Vitest setup and samples.  
- `public/`: static assets served as-is.  
- Config roots: `vite.config.ts`, `tailwind.config.ts`, `eslint.config.js`, `vitest.config.ts`, `tsconfig*.json`.  
- Scripts and tooling helpers live in `scripts/` (e.g., `start-live-server.sh`).  
- Alias `@` maps to `./src` (see `vite.config.ts`).

## Build, Test, and Development Commands
- `npm install` — install dependencies (locked by `package-lock.json`).  
- `npm run dev` — start Vite with hot reload at http://localhost:5173.  
- `npm run build` — production bundle to `dist/`; use `npm run build:dev` for a development-target build.  
- `npm run preview` — serve the built bundle locally for smoke checks.  
- `npm run lint` — ESLint with TypeScript, React Hooks, and refresh rules.  
- `npm run test` / `npm run test:watch` — Vitest (jsdom) headless or watch mode.  
- `npm run mcp` — Playwright MCP utilities (use only when e2e workflows require it).

## Coding Style & Naming Conventions
- TypeScript + React functional components; prefer props typed with interfaces/types in `types/` or colocated.  
- Components and files: PascalCase for components (`BlockCanvas.tsx`), camelCase for helpers, `use*` prefix for hooks.  
- Tests: `*.test.ts` / `*.test.tsx` under `src/`, colocated or in `src/test/`.  
- Keep lint clean; follow React Hooks rules and avoid default exports unless a file exposes a single component.  
- Styling: Tailwind-first; fall back to scoped CSS in `App.css`/`index.css` for global tweaks. Indent with 2 spaces.

## Testing Guidelines
- Frameworks: Vitest with Testing Library + `@testing-library/jest-dom`; jsdom environment.  
- Global setup in `src/test/setup.ts` (includes `matchMedia` shim).  
- Use the `@/` alias in tests; prefer screen queries and user events over DOM traversal.  
- Add regression tests for new behaviors and bug fixes; keep sample names descriptive (e.g., `component-name.behavior.test.tsx`).

## Commit & Pull Request Guidelines
- Commit history favors concise, imperative Portuguese summaries (e.g., “Ajustar simulador de colisão”). Match that tone; no Conventional Commit prefixes needed.  
- Each PR should include: clear summary of scope, linked issue/ticket, screenshots or GIFs for UI changes, and manual test notes (`npm run dev`/`npm run test` results).  
- Keep changes small and focused; update tests and docs alongside code.

## Environment & Security
- Env var `VITE_GEMINI_API_KEY` enables Gemini features; place it in `.env.local` (never commit secrets).  
- Node 18+ recommended for Vite 5 toolchain.  
- Avoid committing `dist/` or generated assets; rely on CI/build steps.  
