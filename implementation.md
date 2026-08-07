# Implementation — CodOps

> Concrete implementation plan for CodOps — Team Tasks & HR Analytics.
> This file is the working runbook for turning the current mock-data UI into a
> fully wired, production-shaped app. Companion status tracked in
> `projectstatus.md`; live state/schema in `README.md`.

## What is already implemented ✅

- **App shell** — collapsible sidebar, header, ⌘K command palette, dark/light
  theming (`src/components/app-*.tsx`, `src/routes/__root.tsx`).
- **Task Board** (`/tasks`) — only route wired to Supabase. Live CRUD via
  TanStack Query hooks (`src/lib/tasks-api.ts`): `useTasks`, `useProjects`,
  `useProfiles`, `useTeams`, `useSaveTask`, `useUpdateTaskStatus`,
  `useDeleteTask`. Optimistic drag-and-drop status updates, filters, task dialog
  (`src/components/tasks/`).
- **App shell pages** (UI complete, rendering mock data):
  - Dashboard `/`
  - Kanban Board `/board`
  - Projects `/projects`
  - Teams `/teams`
  - HR Analytics `/analytics`
  - Admin `/admin`
- **Supabase schema + seed** — `supabase/migrations/*.sql`: 4 enums, 5 tables,
  `set_updated_at` trigger, RLS, 12-task seed.
- **SSR error handling** — `src/server.ts` + `src/lib/error-capture.ts`.
- **Package manager** — npm (`package-lock.json`), confirmed `build`, `lint`,
  `typecheck` all pass.

## What remains to be done

Remaining work is grouped into five workstreams. They are roughly ordered by
dependency (data layer before features before hardening), but workstreams 3–5
can proceed in any order.

### 1. Port the mock-data views to Supabase

Only `/tasks` talks to Supabase. Every other view reads
`src/lib/mock-data.ts`.

| Route           | Mock source used                                | Needs |
| --------------- | ----------------------------------------------- | ----- |
| `/` (dashboard) | `projectHealth`, `throughputSeries`             | Metrics computed from tasks; real throughput; project health from `projects`+`tasks` |
| `/board`        | `tasks`/`projects` via `kanban-board.tsx`       | `useTasks` + `useProjects`; wire drag-and-drop (reuse `useUpdateTaskStatus`) |
| `/projects`     | `projects`, `projectHealth`, `teams`            | `useProjects` + `useTeams`; aggregate health per project |
| `/teams`        | `teams`, `teamMembers`, `profiles`              | `useTeams` + `useProfiles`; join membership via new query |
| `/analytics`    | `individualPerformance`                         | New aggregate query/view over `tasks` per assignee |
| `/admin`        | `profiles` + hard-coded policies                | `useProfiles`; persist role/policy changes |

Actions:
- Add missing TanStack Query hooks to `src/lib/tasks-api.ts`:
  - `useTeamMembers()` (join `team_members` → `profiles`).
  - `useProjectHealth()` — either a Supabase RPC/view or client aggregation.
  - `useThroughput()` — created vs completed per week (client aggregation over
    `tasks`, or a SQL view).
  - `useIndividualPerformance()` — per-assignee on-time %, throughput, overdue
    (aggregate over `tasks`).
- Create reusable loading skeletons + empty states for every data-driven view
  (adds to the `ui/skeleton` usage). The `recharts` charts need fallbacks while
  their series are empty.
- Retire `src/lib/mock-data.ts` once no route references it. Keep `initialsOf`
  / `nameOf` helpers (move to `src/lib/utils.ts`).

### 2. Authentication UX + route protection

`src/integrations/supabase/auth-middleware.ts` exports `requireSupabaseAuth`
and `attachSupabaseAuth`, but no route uses them and there is no login UI.

- Add sign-in / sign-up UI (Supabase Auth — email/password) at `src/routes`.
- Call `requireSupabaseAuth` in server functions and gate protected routes.
- Wire the authenticated session into the sidebar/avatar (show role, sign out).
- Ship a sign-in lander when unauthenticated instead of a blank error.

### 3. Harden RLS

Current migration grants `SELECT/INSERT/UPDATE/DELETE` to `anon` and
`authenticated` with open (`USING (true)`) policies — demo-only.

- Port `authorization` schema or implement ownership/role-based policies:
  - `profiles.*` — manage own row; admins manage all.
  - `teams`/`team_members` — members only where they belong.
  - `projects`/`tasks` — members of the owning team.
- Remove `anon` write grants; keep `authenticated` scoped.
- Regenerate `src/integrations/supabase/types.ts` after schema changes.

### 4. Tests

No test suites exist. Add Vitest for `src/lib` and a smoke check for the SSR
error path.

- `task-ui.ts` (priority/status label mappings).
- `tasks-api.ts` with mocked Supabase client (CRUD + optimistic mutation
  rollback).
- SSR error page — assert `src/server.ts` renders a friendly 500.
- Add `npm test` script and wire Vitest into the repo.

### 5. CI + deployment

No pipeline runs typecheck → lint → build today.

- CI workflow: `npx tsc --noEmit` → `npm run lint` → `npm run build`.
- Deployment: pick a Nitro preset (`node-server`, `vercel`, `cloudflare-workers`)
  and document the build/deploy path.

## Definition of done (current gap-map)

| Area | Today | Target |
| ---- | ----- | ------ |
| `/tasks` | ✅ live | — (verified) |
| Dashboard `/` | ⚠️ mock | live metrics + chart |
| Kanban `/board` | ⚠️ mock | live + draggable |
| Projects `/projects` | ⚠️ mock | live |
| Teams `/teams` | ⚠️ mock | live |
| Analytics `/analytics` | ⚠️ mock | live (real eval model) |
| Admin `/admin` | ⚠️ mock | live, role-aware |
| Auth | 🟡 partial | login + protected routes |
| RLS | ⚠️ open | role/ownership policies |
| Tests | ❌ none | unit + SSR smoke |
| CI | ❌ none | typecheck → lint → build |
| Package manager | ✅ npm | — |