<!-- Copilot/AI agent instructions for the handbol2026 repo -->
# Quick-start for AI coding agents

This file gives concise, actionable guidance so an AI coding agent becomes productive in this repository immediately. Focus on reproducible commands, key files, and local conventions discovered in the repo.

**Big Picture:**
- **Frontend:** `frontend/` — React + TypeScript + Vite app. Uses Tailwind, `vite` for dev, `vitest` for unit tests. Entry points: `frontend/src/main.tsx`, `frontend/vite.config.ts`.
- **Backend / API:** `my-project/` — TypeScript Node app (entry `my-project/src/app.ts`). Uses Prisma (Postgres datasource in `my-project/prisma/schema.prisma`) and builds to `dist/` via `tsc`.

**Run & build (practical examples):**
- Frontend dev: `cd frontend && npm ci && npm run dev` (hot reload via Vite).
- Frontend build: `cd frontend && npm ci && npm run build` (note: `build` runs `tsc -b && vite build`).
- Frontend tests: `cd frontend && npm test` or `npm run test:coverage`.
- Backend dev quick-run: `cd my-project && npm ci && npx tsx src/app.ts` or use `npx ts-node src/app.ts` for quick experiments (AGENTS.md notes this option).
- Backend build + run: `cd my-project && npm ci && npm run build && npm start` (build emits to `dist/` then `start` runs `node dist/app.js`).
- Prisma: `cd my-project && npx prisma generate` (run after `npm install` — `postinstall`/`vercel-build` hooks run this automatically). Ensure `DATABASE_URL` is set for migrations / generate.
- Typecheck (backend): `cd my-project && npm run typecheck` (`tsc --noEmit`). Frontend uses `tsc -b` during build.

**Tests & Locations:**
- Frontend unit tests live near components under `frontend/src/` alongside `*.test.tsx` files. Use `vitest` (see `frontend/package.json`).
- Backend tests mirror `src/` under `my-project/tests/` (see `my-project/tests/*.test.ts`). Run with `cd my-project && npm test`.

**Coding conventions & patterns (concrete):**
- TypeScript strictness and explicit types at module boundaries are expected (see `my-project/AGENTS.md`).
- Filenames: prefer `kebab-case.ts`. Types/classes: `PascalCase`. Variables/functions: `camelCase`.
- No magic strings/numbers — use constants. Prefer small, single-responsibility modules (SOLID). See `.cursorrules` for agent-specific mandates (TDD, SOLID, explain pattern choices).
- Tests first: write a failing test in the appropriate `tests/` or `*.test.tsx` file, implement code, run full test suite before committing.

**CI / Pre-commit hints:**
- Husky and `lint-staged` are used in `my-project` — pre-commit hooks may run lint/format checks. Use `npm run lint` and `npm run format` (see `my-project/package.json`).
- Conventional commit messages are expected: `feat:`, `fix:`, `chore:`, `test:`, etc.

**Important files to inspect when making changes:**
- `my-project/src/app.ts` — backend entry and routing/bootstrap.
- `my-project/prisma/schema.prisma` — canonical data model (Postgres). Changes here require `prisma generate` and migrations.
- `my-project/package.json` — backend scripts, `postinstall` runs `prisma generate`.
- `frontend/package.json` and `frontend/vite.config.ts` — frontend scripts and build configuration.
- `.cursorrules` — project-specific agent rules (follow SOLID, TDD, explain design choices).
- `my-project/AGENTS.md` — human-curated engineering guidelines; follow naming, test location, and commit guidance there.

**When proposing code changes, include:**
- Short rationale and design tradeoffs (one-sentence). If applying a design pattern, state why it fits.
- The exact commands to run locally to verify (e.g., `cd my-project && npm run test`).
- Any DB or env changes required (e.g., `DATABASE_URL` for Prisma migrations).

**What not to assume:**
- Do not assume a single mono-repo script runs everything — subprojects have their own `package.json`. Always `cd` into `frontend/` or `my-project/` before running scripts.
- Do not modify `prisma/schema.prisma` without noting migration and `prisma generate` steps.

If anything in this guide is unclear or you want examples for a specific file/feature, ask and I will iterate.
