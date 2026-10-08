# Project Guidelines

## Stack
- Next.js (App Router, Turbopack), React 19, TypeScript
- Tailwind CSS v4, Base UI / Shadcn, Biome (linter & formatter), Ky (HTTP client)

## Structure
- `src/app/` — routes, layouts, server/client pages
- `src/components/ui/` — reusable primitive UI elements
- `src/components/[page]/` — page-specific component folders (e.g. `landing`, `dashboard`)
- `src/configs/` — central store for routes (`paths/`), constants (`consts/`), and config types
- `src/api/client.ts` — Ky-based HTTP client (`api` instance & typed helpers: `get`, `post`, etc.)
- `src/hooks/` — custom React hooks
- `src/lib/` — utility functions (`cn`, helpers)
- `src/middleware.ts` — Next.js middleware

## Rules for Agents
- Keep code clean: avoid redundant, explanatory, or trivial comments unless strictly necessary.
- Maintain consistent coding style and project conventions.
- Keep `src/configs/` as the single source of truth for URLs, route paths, and static constants.
- Update this `AGENTS.md` file whenever adding architectural decisions, new tooling, or project conventions.
