# Repository Guidelines

## Project Structure & Module Organization
- `src/app` holds Next.js routes, layouts, and page-level UI.
- `src/components`, `src/hooks`, `src/lib`, `src/store`, `src/types` contain shared UI, hooks, helpers, state, and types.
- `agent/` contains the interviewer agent runtime; `database/` and `docs/` store DB assets and documentation.
- `public/` hosts static assets; `messages/` and `my-note/` are auxiliary content.

## Build, Test, and Development Commands
- `pnpm dev`: run the Next.js dev server.
- `pnpm dev:turbo`: dev server with Turbopack.
- `pnpm build`: production build.
- `pnpm start`: run the production server.
- `pnpm lint`: ESLint checks.
- `pnpm format`: Prettier formatting across the repo.
- `pnpm test`: run Vitest in CI mode.
- `pnpm agent:dev`: run the agent process with `.env.local`.
- `pnpm agent:kill`: stop the agent process.

## Coding Style & Naming Conventions
- TypeScript + Next.js; prefer functional React components.
- Use Prettier for formatting and ESLint for lint rules; run `pnpm format` before commits.
- Typical naming: `PascalCase` for components, `camelCase` for functions/vars, `use*` for hooks.
- Paths are usually aliased via `@/` to `src/` (see `vitest.config.ts`).

## Testing Guidelines
- Framework: Vitest (`pnpm test`).
- Test files are `*.test.ts` (see `vitest.config.ts`). Place tests near the code they cover in `src/`.

## Commit & Pull Request Guidelines
- Conventional commits enforced via commitlint/cz-git (use `pnpm commit`).
- Common types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `build`, `ci`.
- PRs should include a clear description, linked issue (if any), and screenshots for UI changes.

## Configuration & Secrets
- Copy `.env.example` to `.env.local` and fill Supabase/LiveKit credentials before running locally.
- Do not commit secrets; prefer local environment overrides.
