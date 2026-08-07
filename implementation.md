# Implementation — CodOps

> Concrete implementation plan for CodOps — Team Tasks & HR Analytics.
> This file is the working runbook for getting the app to a fully wired,
> production-shaped state. Companion status tracked in `projectstatus.md`; live
> state/schema in `README.md`.

## What is already implemented ✅

- **App shell** — collapsible sidebar, header, ⌘K command palette, dark/light
  theming (`src/components/app-*.tsx`, `src/routes/__root.tsx`).
- **UI component cleanup** — removed 27 unused shadcn/ui primitives
  (`src/components/ui/*`); dropped 20 now-dangling deps from `package.json`
  (16 `@radix-ui/react-*`, `embla-carousel-react`, `input-otp`,
  `react-resizable-panels`, `vaul`). `recharts` kept — still used by
  `/analytics` and `/` charts. Remaining primitives are all referenced.
- **Data layer wired to Supabase** — no route reads `mock-data.ts` (the file is
  deleted). All views use TanStack Query hooks in `src/lib/tasks-api.ts`:
  `useTasks`, `useProjects`, `useProfiles`, `useTeams`, `useTeamMembers`,
  `useProjectHealth`, `useThroughput`, `useIndividualPerformance`,
  `useDashboardMetrics`, `useSaveTask`, `useUpdateTaskStatus`, `useDeleteTask`,
  `useCurrentUser`. Optimistic drag-and-drop status updates, filters, task
  dialog (`src/components/tasks/`, `src/components/kanban-board.tsx`).
- **App pages (live)**: Dashboard `/`, Kanban Board `/board`, Projects
  `/projects`, Teams `/teams`, HR Analytics `/analytics`.
- **Auth UX** — sign-in / sign-up UI at `/login`
  (`src/routes/login.tsx`, email/password + full name).
- **Schema + seed** — `supabase/migrations/*.sql`: 4 enums, 5 tables,
  `set_updated_at` trigger, 12-task seed.
- **Auth ↔ profiles** — `handle_new_user()` trigger creates a `profiles` row
  keyed by the auth user id on sign-up, so `useCurrentUser` resolves.
- **Hardened RLS** — `20260807170000_harden_rls.sql` drops all `anon`
  privileges and gates `authenticated` access by role/team via
  `is_workspace_admin()` / `is_team_lead()`: profiles (read roster / edit self,
  admin edits all), teams + team_members (read-all, write admin/lead), projects
  (read-all, write lead/admin), tasks (read/create/update members, delete admin).
- **SSR error handling** — `src/server.ts` + `src/lib/error-capture.ts`.
- **Tests (partial)** — Vitest wired (`npm test`):
  `src/lib/task-ui.test.ts`, `src/lib/aggregations.test.ts`,
  `src/lib/error-capture.test.ts`.
- **Package manager** — npm (`package-lock.json`), confirmed `build`, `lint`,
  `typecheck`, `test` all pass.

## What remains to be done

### 1. Authentication route protection ⭐

Login/signup exists, but the app is not actually gated.
`requireSupabaseAuth` (`src/integrations/supabase/auth-middleware.ts`) is
defined but never called; nothing redirects anonymous users.

- Call `requireSupabaseAuth` in the server functions in `src/lib/tasks-api.ts`.
- Add a client guard/redirect: unauthenticated users hitting `/` are sent to
  `/login`; signed-in users on `/login` are sent to `/`.
- Wire the authenticated session (and role, from `profiles`) into the
  sidebar/avatar with a sign-out action.
- Ship a sign-in lander when unauthenticated instead of a blank error.

### 2. Regenerate Supabase client types

The RLS/trigger migrations added SQL helper functions and a trigger, but
`src/integrations/supabase/types.ts` has not been regenerated
(`supabase gen types typescript …`). Regenerate and commit.

### 3. Tests — fill remaining gaps

- `tasks-api.ts` with a mocked Supabase client (CRUD + optimistic mutation
  rollback on error).
- SSR error-page smoke test — assert `src/server.ts` renders a friendly 500.

### 4. CI + deployment

- CI workflow (`.github/workflows/`): `npx tsc --noEmit` → `npm run lint` →
  `npm test` → `npm run build`.
- Deployment: pick a Nitro preset (`node-server`, `vercel`,
  `cloudflare-workers`) and document the build/deploy path.

### 5. Hardening (noted in the RLS migration)

- Task status drag/update is currently open to all signed-in members; tighten
  to assignee/owner (or use per-team ownership) when per-task ownership is
  required.
- Admin page persists role/policy changes through a server function (currently
  reads `useProfiles`; writes not fully wired).

## Definition of done (current gap-map)

| Area            | Today          | Target                     |
| --------------- | -------------- | -------------------------- |
| `/` (dashboard) | ✅ live        | —                          |
| Kanban `/board` | ✅ live+drag   | —                          |
| Projects /projects | ✅ live     | —                          |
| Teams /teams    | ✅ live        | —                          |
| Analytics /analytics | ✅ live  | —                          |
| Auth UX         | ✅ login/signup | protected routes + session |
| RLS             | ✅ hardened    | per-assignee task writes   |
| Supabase types  | ⚠️ stale       | regenerated                |
| Tests           | 🟡 partial     | api + SSR smoke added      |
| CI              | ❌ none        | typecheck → lint → test → build |
| Deployment      | ❌ none        | Nitro preset + docs        |
| Package manager | ✅ npm         | —                          |