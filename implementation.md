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
- **Auth route protection** — anonymous users are redirected to `/login` and
  signed-in users away from it (`AuthGate` in `src/routes/__root.tsx`); the
  header exposes sign-out and the sidebar shows the signed-in user's name +
  `RolePill` from `useCurrentUser`. `/admin` is guarded to `admin` role only
  (`src/routes/admin.tsx`).
- **Tests** — Vitest wired (`npm test`): `task-ui`, `aggregations`,
  `error-capture`, `errors-page` (SSR 500 smoke), and `tasks-api` (optimistic
  `useUpdateTaskStatus` rollback with a mocked Supabase client / mocked `toast`).
- **Package manager** — npm (`package-lock.json`), confirmed `build`, `lint`,
  `typecheck`, `test` all pass.

## What remains to be done

Remaining items are lower-priority hardening; nothing blocks the app from
building, testing, or shipping.

1. **CI bandwidth** — the workflow at `.github/workflows/ci.yml` runs
   `typecheck → lint → test → build`; activate it once the repo is on a host
   with GitHub Actions.
2. **Deployment** — the README recommends the `node-server` Nitro preset (and
   documents `vercel` / `cloudflare-workers` alternatives), but no preset build
   has been locked into a CI deploy step yet.
3. **Per-assignee task writes** — the RLS migration intentionally leaves task
   status drag/update open to all signed-in members; tighten to assignee/owner
   when per-task ownership is required.
4. **Admin writes** — `/admin` currently reads `useProfiles` and renders
   hard-coded policies; persisting role/policy changes through a server
   function isn't wired.
5. **Supabase client types** — the recent migrations added SQL-only helper
   functions and a trigger but no table/column/enum changes, so
   `src/integrations/supabase/types.ts` is still schema-accurate; regenerate
   anyway when the schema next changes (or to expose `is_workspace_admin` /
   `is_team_lead` as RPC Types).

## Definition of done (current gap-map)

| Area            | Today          | Target                     |
| --------------- | -------------- | -------------------------- |
| `/` (dashboard) | ✅ live        | —                          |
| Kanban `/board` | ✅ live+drag   | —                          |
| Projects /projects | ✅ live     | —                          |
| Teams /teams    | ✅ live        | —                          |
| Analytics /analytics | ✅ live  | —                          |
| Auth            | ✅ gated+session | —                      |
| RLS             | ✅ hardened    | per-assignee task writes   |
| Tests           | ✅ 18 passing  | —                          |
| CI              | ✅ workflow    | enabled on remote host     |
| Deployment      | 🟡 docs        | wired deploy step        |
| Package manager | ✅ npm         | —                          |