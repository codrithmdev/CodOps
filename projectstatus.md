# Project Status — CodOps

> Status document for **CodOps — Team Tasks & HR Analytics**.
> Last updated: 2026-08-07. Keep this file in sync with significant changes.

## Overview

CodOps is a full-stack team task management and HR analytics workspace. The
front end is a TanStack Start (React 19) SSR application; the data layer is
Supabase (Postgres). The app is currently in **early functional stage**: the UI
surface is complete across seven routes, but only the Task Board is wired to
real Supabase data — the remaining views render seeded mock data.

## Current status

| Area                                                  | Status       | Notes                                                                                                            |
| ----------------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------- |
| App shell (sidebar, header, command palette, theming) | ✅ Done      | Responsive, collapsible sidebar, ⌘K palette, dark/light                                                          |
| Task Board (`/tasks`)                                 | ✅ Done      | Live Supabase CRUD, optimistic drag-and-drop, filters, task dialog                                               |
| Kanban Board (`/board`)                               | ⚠️ Mock data | `src/components/kanban-board.tsx` reads `src/lib/mock-data.ts`                                                   |
| Dashboard (`/`)                                       | ⚠️ Mock data | Metrics, throughput chart, project health from mock data                                                         |
| Projects (`/projects`)                                | ⚠️ Mock data | Cards render `projects`/`projectHealth` from mock data                                                           |
| Teams (`/teams`)                                      | ⚠️ Mock data | Rosters from `teamMembers`/`profiles` mock data                                                                  |
| HR Analytics (`/analytics`)                           | ⚠️ Mock data | `individualPerformance` from mock data                                                                           |
| Admin (`/admin`)                                      | ⚠️ Mock data | Profiles/policies are hard-coded                                                                                 |
| Supabase schema + seed                                | ✅ Done      | `supabase/migrations/…sql` — enums, 5 tables, RLS, seed                                                          |
| Auth wiring                                           | 🟡 Partial   | Middleware exists (`requireSupabaseAuth`, `attachSupabaseAuth`) but no login UI; no route is currently protected |
| SSR error handling                                    | ✅ Done      | `src/server.ts` + `src/lib/error-capture.ts` render friendly 500s                                                |
| Error reporting                                       | ✅ Done      | Client error boundaries + server error normalization                                                             |

**Legend:** ✅ complete · 🟡 partial / wired but not fully exposed · ⚠️ mock data / needs wiring

## Architecture

```
Browser ⇄ TanStack Start (SSR) ⇄ Supabase (Postgres + Auth)
        └─ TanStack Router (file-based routes in src/routes/)
        └─ TanStack Query (server-state in src/lib/tasks-api.ts)
```

- **Routing**: file-based; `src/routes/__root.tsx` is the app shell, `routeTree.gen.ts` is generated.
- **Server entry**: `src/start.ts` registers middleware (Supabase auth attach, error, CSRF); `src/server.ts` wraps the Nitro/TanStack server entry with catastrophic-error handling.
- **Data access**: `src/lib/tasks-api.ts` exposes TanStack Query hooks (`useTasks`, `useProjects`, `useProfiles`, `useTeams`, `useSaveTask`, `useUpdateTaskStatus`, `useDeleteTask`) over the Supabase client (`src/integrations/supabase/client.ts`).
- **Types**: DB row types are generated in `src/integrations/supabase/types.ts`; UI-facing types mirror them in `src/lib/types.ts`.
- **UI**: shadcn/ui-style components (`src/components/ui/`), Tailwind v4 design tokens in `src/styles.css` (oklch, `dark` variant), lucide icons, Recharts for analytics.

## Database schema (`supabase/migrations/`)

- Enums: `app_role` (`admin|lead|member`), `task_priority`, `task_status`, `project_status`
- Tables:
  - `profiles` — workspace members, role
  - `teams` — teams
  - `team_members` — membership + role-in-team (unique `(team_id, user_id)`)
  - `projects` — projects, owning team, dates, status
  - `tasks` — title, project, assignee, creator, priority, status, due date, completed_at
- Triggers: `set_updated_at()` keeps `updated_at` fresh
- Security: RLS enabled with an **open workspace access** policy (`USING (true)`) for `anon`/`authenticated` — suitable for demo/prototype, **needs tightening before production**
- Seed: 5 profiles, 3 teams, 7 memberships, 3 projects, 12 tasks

## Known gaps & risks

1. **Mock data coverage** — only `/tasks` talks to Supabase. Dashboards, kanban, projects, teams, analytics and admin need to be ported to real queries (queries already exist for tasks/projects/profiles/teams).
2. **No auth UX** — `requireSupabaseAuth` middleware exists but no route uses it and there is no sign-in/sign-up flow. Sessions are not enforced anywhere.
3. **RLS is wide open** — the migration grants `SELECT/INSERT/UPDATE/DELETE` to `anon` with open policies. Fine for demos; must be replaced with ownership/role-based policies for real use.
4. **No tests** — no unit/integration/e2e suites exist. Highest-risk areas: drag-and-drop mutations, task dialog form, SSR error path.
5. **No CI** — no pipeline runs typecheck/lint/build on push.
6. **`.env` was removed** — credentials must be re-provisioned (see `.env.example`); the app throws a clear error until `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` are set.
7. **Supabase project ref** — `supabase/config.toml` points at `sitjxrepzfwakpgbxqjw`; confirm this is the intended project before `supabase db push`.
8. **Analytics are illustrative** — HR evaluation metrics (`v_individual_performance`-style data) are mocked; no real evaluation model exists yet.

## Recent changes

- 2026-08-07 — Removed all Lovable scaffolding: replaced `@lovable.dev/vite-tanstack-config` with a standard TanStack Start Vite config, removed Lovable error reporting, updated AGENTS.md, README.md, and scrubbed the lockfile. Created this status document.

## Roadmap

1. Port remaining views (dashboard, kanban, projects, teams, analytics, admin) from mock data to Supabase queries + React Query.
2. Add authentication UX (sign in/up with Supabase Auth) and protect routes with `requireSupabaseAuth`.
3. Harden RLS: ownership-based policies per role; drop `anon` write access.
4. Add tests: Vitest for `src/lib` (task-ui, tasks-api mocks), plus a smoke test for the SSR error path.
5. Add CI (typecheck → lint → build) and a deployment pipeline (Nitro preset).
6. Define the HR evaluation model and views backed by real data.
7. Onboarding polish: loading skeletons for all data-driven views, empty states, optimistic UI everywhere.

## How to verify the app works

```sh
npm install          # first time
npm run dev          # dev server (SSR)
# open the printed URL, browse /tasks — CRUD + drag-and-drop hit Supabase
npm run build        # production build sanity check
npm run lint         # lint
npx tsc --noEmit     # typecheck
```
