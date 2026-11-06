# Project Guidelines

## Stack
- Next.js (App Router, Turbopack), React 19, TypeScript
- Tailwind CSS v4, Base UI / Shadcn, Biome (linter & formatter), Ky (HTTP client)

## Structure
- `src/app/` — routes, layouts, server/client pages
- `src/components/ui/` — reusable primitive UI elements
- `src/components/[page]/` — page-specific component folders (e.g. `landing`, `dashboard`)
- `src/configs/` — central store for routes (`paths/`), constants (`consts/`), and config types
- `src/api/generated/` — auto-generated Hey API SDK + types from the backend OpenAPI spec (never edit by hand; regenerate with `npm run openapi`)
- `src/api/hey-api.ts` — runtime config for the generated Ky client (baseUrl, timeout, retries)
- `openapi-ts.config.ts` — Hey API generator config (spec input, output path, plugins)
- `src/hooks/` — custom React hooks
- `src/lib/` — utility functions (`cn`, helpers)
- `src/tests/` — Vitest tests (mirror the `src/` structure, e.g. `src/tests/lib/utils.test.ts`); run with `npm test`
- `src/middleware.ts` — Next.js middleware
- `.prototype/` — standalone clickable HTML/CSS/JS prototype of the TravelHub product (screens, map, timeline, gallery, team overview). It is not part of the Next.js build; see `.prototype/README.md`.

## Rules for Agents
- TravelHub currently uses a browser-only demo session; passwords are never stored or verified. Do not treat client route guards as real authorization.
- `src/providers/travel-provider.tsx` owns session, account-scoped trips and active selection. Browser persistence is isolated in `src/lib/travel-storage.ts`; failed writes must not update in-memory state.
- Keep route pages thin, page-specific UI in `src/components/auth`, `src/components/trips`, and `src/components/landing`, and dashboard application chrome in `src/components/dashboard` and shared layout utilities in `src/components/layout`.
- Keep code clean: avoid redundant, explanatory, or trivial comments unless strictly necessary.
- Maintain consistent coding style and project conventions.
- Keep `src/configs/` as the single source of truth for URLs, route paths, and static constants.
- Keep `.prototype/` in sync with product docs in `docs/`. The prototype is a demo artifact: no build step, no external dependencies.
- Update this `AGENTS.md` file whenever adding architectural decisions, new tooling, or project conventions.
