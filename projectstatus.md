# Project Status — CodOps

> Status document for **CodOps — Team Tasks & HR Analytics**.
> Last updated: 2026-08-21. Keep this file in sync with significant changes.

## Overview

CodOps is a full-stack team task management and HR analytics workspace. The
front end is a TanStack Start (React 19) SSR application; the data layer is
Supabase (Postgres + Auth). The app is now **fully wired to real Supabase
data**: every route renders live queries (React Query) and the entire surface
sits behind a real sign-in flow. `src/lib/mock-data.ts` no longer exists —
there is no mock data left in the codebase.

## Current status

| Area                                                  | Status       | Notes                                                                                                   |
| ----------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------- |
| App shell (sidebar, header, command palette, theming) | ✅ Done      | Responsive, collapsible sidebar, ⌘K palette, dark/light                                                 |
| Auth UX (`/login`, `/reset-password`)                 | ✅ Done      | Sign in / sign up / forgot-password / email confirmation; session cookie (`codops-session`) sync        |
| Session handling                                       | ✅ Done      | Server guard prefers live bearer token, falls back to cookie, refreshes via refresh token; auto-logout after 5 min idle |
| Route protection                                      | ✅ Done      | `requireAuth` guard in `src/lib/auth-guard.ts` on every workspace route; `AuthGate` client redirect     |
| Task Board (`/tasks`)                                 | ✅ Done      | Live Supabase CRUD, optimistic drag-and-drop, filters, task dialog                                      |
| Dashboard (`/`)                                       | ✅ Done      | Live metrics, throughput chart, project health (`useDashboardMetrics`, `useThroughput`, `useProjectHealth`) |
| Projects (`/projects`)                                | ✅ Done      | Live projects + derived health, create dialog (admin/lead gated by RLS)                                 |
| Teams (`/teams`)                                      | ✅ Done      | Live rosters, invite/add member, edit/delete team, member role changes                                  |
| HR Analytics (`/analytics`)                           | ✅ Done      | `useIndividualPerformance` derived from live profiles + tasks                                            |
| Admin (`/admin`)                                      | ✅ Done      | Live member roster, role assignment, deactivate/reactivate (server fn), persisted policy toggles        |
| Role-based access                                      | ✅ Done      | Members/leads restricted to Task Board, Projects, Teams; Dashboard, Analytics and Admin are admin-only (`requireAdmin` + sidebar filtering) |
| Admin management                                       | ✅ Done      | Admins get full Supabase control: member role change, deactivate/reactivate, permanent member removal, project create/edit/delete, and email invitations |
| RLS hardening                                         | ✅ Done      | `20260807170000_harden_rls.sql` — role/ownership policies, anon privileges revoked; `20260820000000_admin_full_control.sql` grants admins INSERT/DELETE on `profiles`; `20260821000001_tighten_tasks_rls.sql` scopes task writes to assignee/creator/team lead/admin |
| Server-fn access control                              | ✅ Done      | `src/lib/admin-functions.ts` (ban/unban/delete/invite) now requires `requireSupabaseAuth` + an explicit admin-role check — previously callable by any signed-in (or unauthenticated) client, see Recent changes |
| Workspace policies (Admin → Policies)                 | ✅ Done      | Persisted in `workspace_policies` table (`useWorkspacePolicies`/`useUpdateWorkspacePolicy`); previously a hard-coded, UI-only array |
| Role management                                       | ✅ Done      | `useUpdateUserRole`, `useUpdateTeamMemberRole`, `useAddTeamMember`, `useRemoveTeamMember`               |
| Unit tests                                            | 🟡 Partial   | 3 Vitest suites (`aggregations`, `task-ui`, `tasks-api`); no e2e                                        |
| CI / deployment pipeline                              | ✅ Done      | `.github/workflows/ci.yml` restored — lint → typecheck → test → build on push/PR                        |

**Legend:** ✅ complete · 🟡 partial / present but not fully covered · ❌ missing

## Architecture

```
Browser ⇄ TanStack Start (SSR) ⇄ Supabase (Postgres + Auth)
        └─ TanStack Router (file-based routes in src/routes/)
        └─ TanStack Query (server-state in src/lib/tasks-api.ts)
```

- **Routing**: file-based; `src/routes/__root.tsx` is the app shell (sidebar,
  header, `AuthGate`), `routeTree.gen.ts` is generated.
- **Auth**: `src/lib/auth-guard.ts` validates the `codops-session` cookie /
  bearer token server-side and redirects unauthenticated users to `/login`;
  `src/routes/__root.tsx` syncs the Supabase session to that cookie and
  `AuthGate` handles client-side redirects.
- **Data access**: `src/lib/tasks-api.ts` exposes React Query hooks for every
  table and several derived metrics (`useDashboardMetrics`, `useThroughput`,
  `useProjectHealth`, `useIndividualPerformance`) computed in
  `src/lib/aggregations.ts`. Components never call Supabase directly.
- **Admin actions**: `src/lib/admin-functions.ts` runs server-side functions
  against `supabaseAdmin` (`client.server.ts`) to ban/unban/delete auth
  accounts and send invites. Because `supabaseAdmin` bypasses RLS, every
  handler is wrapped in `requireSupabaseAuth` and independently re-checks the
  caller's own profile role is `admin` before doing anything — the route-level
  `requireAdmin` guard only protects page navigation, not the server function
  RPC endpoint itself.
- **Types**: DB row types are generated in
  `src/integrations/supabase/types.ts`; UI-facing types mirror them in
  `src/lib/types.ts`.
- **UI**: shadcn/ui-style components (`src/components/ui/`), Tailwind v4
  design tokens in `src/styles.css` (oklch, `dark` variant), lucide icons,
  Recharts for analytics.

## Database schema (`supabase/migrations/`)

- `20260807114326_…` — enums (`app_role`, `task_priority`, `task_status`,
  `project_status`), 5 tables, `set_updated_at()` trigger, seed data.
- `20260807160000_link_auth_to_profiles.sql` — links Supabase Auth users to
  `profiles`.
- `20260807170000_harden_rls.sql` — replaces the open workspace policies:
  - Helpers `is_workspace_admin()` / `is_team_lead()` (SECURITY DEFINER).
  - `anon` privileges revoked from all tables.
  - `profiles`: all members read; update self or admin.
  - `teams`: all read; create/edit/delete admin-only.
  - `team_members`: all read; write admin or owning team lead.
  - `projects`: all read; write admin or owning team lead.
  - `tasks`: all members read/create/update; delete admin-only. (superseded
    by `20260821000001_tighten_tasks_rls.sql` below.)
- `20260820000000_admin_full_control.sql` — grants admins INSERT/DELETE on
  `profiles`.
- `20260820000001_invite_role.sql` — lets `handle_new_user()` read the role
  passed via `inviteUserByEmail`'s `raw_user_meta_data`, defaulting to
  `member`.
- `20260821000000_workspace_policies.sql` — new `workspace_policies`
  key/label/enabled table backing Admin → Policies; readable by all members,
  writable by admins. Defines `public.set_updated_at()` inline (some
  environments were missing it from the initial migration) so this file is
  self-sufficient.
- `20260821000001_tighten_tasks_rls.sql` — replaces the open `tasks_insert`/
  `tasks_update` policies: inserts must be self-attributed
  (`created_by = auth.uid()`), updates require being the assignee, the
  creator, the owning project's team lead, or an admin. Tasks created before
  this change have `created_by = NULL` (the client never set it) and are only
  editable by their assignee or an admin until backfilled.
- Note: `supabase/seed.sql` does not exist; seed lives in the initial
  migration. `supabase/config.toml` still points at project ref
  `sitjxrepzfwakpgbxqjw` — confirm before `supabase db push`. These
  migrations were applied by hand via the Supabase SQL editor rather than the
  CLI; `public.set_updated_at()` was found missing on the live project when
  applying `20260821000000`, suggesting the initial migration wasn't run
  1:1 against it (pre-dates this repo's migration history).

## Known gaps & risks

1. **Test coverage is unit-only** — 3 Vitest suites exist; no integration or
   e2e coverage (highest-risk areas: drag-and-drop mutations, auth redirects,
   SSR error path).
2. **Pre-2026-08-21 tasks have no `created_by`** — the tightened `tasks_update`
   policy (see schema notes) means these rows are only editable by their
   assignee or an admin until an admin backfills `created_by` on them.
3. **HR evaluation metrics are derived, not authored** — analytics aggregates
   the live `tasks` table; there is still no formal evaluation model.
4. **Email flows depend on the Supabase project** — sign-up confirmation and
   password reset require email provider settings in the Supabase project.
5. **`.env` is gitignored** — must be provisioned locally (see `.env.example`)
   for `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`.
6. **Node 22+ required** — `package.json` `engines` pins `>=22`; the lockfile
   was regenerated 2026-08-21 (`npm ci` was drifted/failing in CI before the
   fix).
7. **Migrations are applied by hand, not via `supabase db push`** — the live
   project's schema history doesn't fully match this repo's migration files
   (see schema notes on `20260821000000`); treat each new migration as
   needing manual verification against the live project, not blind trust
   that prior ones ran identically.

## Recent changes

- 2026-08-21 — Fixed a critical broken-access-control bug: the admin server
  functions in `src/lib/admin-functions.ts` (`deactivateUser`,
  `reactivateUser`, `deleteUser`, `inviteUser`) ran against the service-role
  client with **no auth or role check at all** — the `requireAdmin` guard on
  `/admin` only protects the page route, not the underlying server-fn RPC
  endpoint, so any signed-in non-admin (or possibly unauthenticated caller)
  could ban/unban any account, permanently delete any user, or invite
  themselves as `admin`. Fixed by wrapping every handler in
  `requireSupabaseAuth` and adding an explicit admin-role re-check.
- 2026-08-21 — Restored the CI workflow (`.github/workflows/ci.yml`):
  lint → typecheck → `npm test` → build on every push/PR.
- 2026-08-21 — Persisted Admin → Policies toggles to a new
  `workspace_policies` table (previously a hard-coded, UI-only array);
  `useWorkspacePolicies`/`useUpdateWorkspacePolicy` wire the UI to it.
- 2026-08-21 — Tightened `tasks` RLS: inserts must be self-attributed,
  updates require being the assignee, creator, the project's team lead, or an
  admin (previously any member could edit/move any task). `useSaveTask` now
  stamps `created_by` on create, which it never did before.
- 2026-08-21 — Regenerated `package-lock.json` from a clean install; the
  previously-committed lockfile didn't reproduce under `npm ci` (CI failed
  with "Missing: lru-cache@11.5.2 from lock file").
- 2026-08-18 — Email invitations: admins can invite members by email (with a
  chosen role) from Admin → Members. The invitee receives an email and sets
  their own password at the new `/invite` route, then signs in. Migration
  `20260820000001_invite_role.sql` lets the invite carry a role
  (`supabase db push` required). The `/invite` redirect URL must be allowlisted
  in Supabase Auth settings and SMTP must be enabled for invite emails.
- 2026-08-18 — Admin full control: admins can now permanently remove any
  member (deletes the auth account + profile via a server function) and
  create/edit/delete projects from the Projects page. New migration
  `20260820000000_admin_full_control.sql` grants admins INSERT/DELETE on
  `profiles` (must be applied via `supabase db push`).
- 2026-08-18 — Fixed auth/session bugs: (1) server guard no longer trusts the
  stale cookie over the live bearer token — it tries header → cookie → refresh
  token exchange, eliminating intermittent kicks to `/login`; (2) the session
  cookie now stores access + refresh tokens via `src/lib/session-cookie.ts`;
  (3) added auto-logout after 5 minutes of inactivity; (4) fixed the AuthGate
  redirect that broke the `/reset-password` recovery flow; (5) sign-out now
  clears the session cookie.
- 2026-08-18 — Role-based access control: members and leads now only see the
  Task Board, Projects and Teams. Dashboard, HR Analytics and Admin Controls
  are admin-only (`requireAdmin` guard + role-filtered sidebar); non-admins
  land on `/tasks` after sign-in. Added after removing the Kanban Board
  (`/board` route, `kanban-board.tsx`, sidebar entry, dashboard section).
- 2026-08-18 — (this update) Full data wiring complete: mock data removed;
  auth UX shipped (login/reset-password, session cookie, `requireAuth`
  guards); RLS hardened; admin role management + deactivate/reactivate added;
  3 Vitest suites added; CI workflow removed.
- 2026-08-07 — Removed Lovable scaffolding (standard TanStack Start Vite
  config, scrubbed lockfile), updated docs, created this status document.

## Roadmap

1. Backfill `created_by` on pre-2026-08-21 tasks so they aren't stuck
   editable only by their assignee/an admin.
2. Add a deployment preset (Nitro) alongside the restored CI pipeline.
3. Add integration/e2e coverage for drag-and-drop, auth redirects, and the SSR
   error path.
4. Define a real HR evaluation model and author evaluation data.
5. Onboarding polish: more loading skeletons, empty states, optimistic UI
   coverage everywhere.
6. Move to `supabase db push`-driven migrations once the live project's
   schema history is reconciled with this repo's migration files.

## How to verify the app works

```sh
npm install          # first time (Node 22+)
npm run dev          # dev server (SSR)
# open the printed URL → you'll be redirected to /login → sign up/in
# browse /tasks — CRUD + drag-and-drop hit Supabase
npm run build        # production build sanity check
npm run lint         # lint
npm test             # Vitest unit suites
npx tsc --noEmit     # typecheck
```
