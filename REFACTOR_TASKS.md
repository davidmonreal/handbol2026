# Refactor & Testability Task List

Front-end and back-end are listed separately. Each item is phrased as an actionable refactor aimed at SOLID, decoupling, and testability. Treat this as a backlog: pull items into tickets as needed.

Legend: 🚨 high urgency/impact · ⚠️ medium · 🟢 nice-to-have

## Frontend (frontend/)
- ✅ ~~🚨 `src/components/MatchTracker.tsx`: Extract a pure “match clock adapter” that maps domain state to the Scoreboard props; move side effects (intervals, unlock resets) into a dedicated hook to simplify rendering; add contract tests for the adapter given mocked match states.~~
- 🚨 `src/components/match/Scoreboard.tsx`: Split UI from behavior by introducing a `useScoreboardViewModel` hook that computes button visibility/enabled states; add unit tests for every lock/half-state combination; remove inline comments once view model expresses intent.
- 🚨 `src/components/match/events/EventForm.tsx`: Decompose into container + presentational sub-sections (opponent GK selector, player grid, severity buttons, zone selectors, context toggles, footer actions); rely on injected callbacks/interfaces instead of direct state hook usage to improve mocking.
- ⚠️ Performance: Add route-level code splitting for heavy pages (Statistics, VideoMatchTracker, MatchTracker) using dynamic imports and suspense fallbacks; measure bundle impact with Vite analyze.
- ⚠️ Performance: Introduce skeletons for MatchTracker/Statistics instead of blocking renders on data; move data prefetching to loaders/hooks triggered before navigation when possible.
- ⚠️ Performance: Memoize large lists (player grids, action selectors) with `React.memo` + stable props; use virtualization for player grids if counts grow; ensure context selectors prevent full-tree rerenders.
- ⚠️ `src/context/MatchContext.tsx`: Convert to selector-based context with memoized slices to reduce rerenders; add a thin domain adapter so components do not depend on raw API shapes; expand context tests to cover subscription behavior.
- ⚠️ `src/context/VideoSyncContext.tsx`: Move video⇄clock synchronization math into a pure utility; wrap side effects (players, listeners) in a hook to make the provider easier to unit test.
- ⚠️ `src/components/Statistics.tsx` and related data hooks: Split data loading into `useStatisticsData` (fetch/cache) and a presentational component; mock the hook in tests to validate rendering for empty/loading/error states.
- ⚠️ `src/components/match/events/ActionSelectors.tsx`: Move static configuration (actions per category) into a separate `actionCatalog.ts` module; export only the component to satisfy fast-refresh rules; add tests asserting rendering per catalog entry.
- ⚠️ `src/components/match/events/eventFormStateMachine.ts`: Convert to a pure reducer with explicit discriminated unions per category; expose factory functions for initial state to remove duplication; add exhaustive-switch guards with `never` checks to prevent unhandled states.
- ⚠️ `src/components/match/events/useEventFormState.ts`: Replace ad-hoc setters with the reducer + action creators; isolate side effects (analytics, toast, navigation) into effect hooks triggered by dispatched outcomes; add integration tests with the reducer mocked.
- 🟢 `src/components/common` (buttons, grids, toggles): Introduce a small design-system layer (Button, SegmentedControl, Pill) to remove inline styles/opacity logic from feature components; document prop contracts and add snapshot tests.
- 🟢 `src/hooks` (shared hooks): Standardize hook patterns (input params, return tuple/object, error handling) and add unit tests with React Testing Library hooks for each.
- 🟢 `src/services` (API clients): Wrap fetch/axios calls in thin gateway classes (e.g., `MatchEventsApi`, `ClockApi`) that return typed results; mock these gateways in component tests.
- 🟢 `src/utils` and `src/types`: Centralize domain types (EventCategory, ShotResult, TurnoverType, SanctionType, ZoneType) into a single module consumed by both UI and state machine; add helper factories/builders for common test fixtures.
- 🟢 `src/components/video/VideoMatchTracker.tsx`: Extract time-mapping logic (video time ⇄ match time) into a pure utility with tests for calibration edge cases; keep component focused on rendering and wiring.

## Backend (my-project/)
- ✅ ~~🚨 `src/app.ts`: Introduce a composition root that wires controllers, services, and repositories via dependency injection (factory function) instead of importing singletons; make server start-up accept injected logger/config for testability.~~
- 🚨 `src/controllers/*` (e.g., `controllers/gameEventsController.ts`): Keep controllers thin by delegating to services; validate inputs via schema middleware before controller logic; add request/response DTO mappers to avoid leaking DB shapes.
- 🚨 `src/services/gameEventsService.ts`: Enforce domain rules via injected policy helpers (lock checks, time bounds); return rich result objects (`Ok|Err`) rather than throwing; add service-level tests covering lock/unlock and score patch cases.
- ⚠️ Performance: Add HTTP caching headers and ETags for static match/team data; introduce server-side response compression if not already handled upstream.
- ⚠️ Performance: Add simple in-memory caching layer for read-mostly queries (match metadata, teams, players) with TTL and cache-busting on write; provide a test double for cache in unit tests.
- ⚠️ Performance: Ensure DB queries in repositories are paginated and indexed (players, events); add repository tests that assert query shape for large lists.
- ⚠️ `src/services/openai.service.ts`: Wrap the OpenAI client behind a provider interface; inject API keys/config and add a no-op/dummy provider for local/testing; add timeout/error-path tests.
- ⚠️ `src/services/weekly-ticker-metrics.ts`: Separate scheduling/cron wiring from the pure metric aggregation; add contract tests for aggregation logic with fixture data.
- ⚠️ `src/repositories/*`: Define repository interfaces (ports) and implement adapters (e.g., Prisma) separately; use in-memory fakes in tests; ensure methods are narrowly scoped (no god-repository).
- ⚠️ `src/schemas/*`: Centralize Zod/validation schemas and reuse them for both routing and testing; export type-safe DTOs; add negative tests for invalid payloads.
- ⚠️ `src/middleware/*`: Isolate cross-cutting concerns (auth, validation, error handling) into composable middleware; add unit tests for each middleware in isolation using mocked `req/res/next`.
- ⚠️ `src/lib` (utilities): Move shared domain rules (event locking, half transitions, timestamp normalization) into pure functions with exhaustive tests; avoid mixing IO and domain logic.
- ⚠️ `src/types`: Publish domain-level interfaces/enums consumed by controllers and services; avoid importing ORM types in upper layers; add factory functions for common domain objects to simplify tests.
- ⚠️ `src/routes/*`: Build routers via small factory functions that accept controllers/middleware, enabling test instantiation without global state; add routing tests that assert middleware order and handler wiring.
- ⚠️ `tests/` (backend): Add contract tests for each service and controller using in-memory repositories; include scenario tests for lock toggling, half restarts, and timestamp preservation when replaying events from video.

## Cross-cutting
- ⚠️ Introduce a lightweight feature module structure (domain, application, infrastructure layers) so both frontend and backend share clear boundaries; document module responsibilities in `BACKLOG.md`.
- 🟢 Add fixture builders (frontend and backend) to generate realistic match/event states for tests; avoid inline object literals in specs.
- 🟢 Enforce lint rules for imports layering (no infra imports in domain); add CI checks for unused exports and discriminated union exhaustiveness.
