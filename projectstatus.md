# Project Status — CodOps

> Status document for **CodOps — Team Tasks & HR Analytics**.
> Last updated: 2026-08-18. Keep this file in sync with significant changes.

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
| Admin (`/admin`)                                      | ✅ Done      | Live member roster, role assignment, deactivate/reactivate (server fn), policy toggles (UI-only)        |
| Role-based access                                      | ✅ Done      | Members/leads restricted to Task Board, Projects, Teams; Dashboard, Analytics and Admin are admin-only (`requireAdmin` + sidebar filtering) |
| Admin management                                       | ✅ Done      | Admins get full Supabase control: member role change, deactivate/reactivate, permanent member removal, project create/edit/delete, and email invitations |
| RLS hardening                                         | ✅ Done      | `20260807170000_harden_rls.sql` — role/ownership policies, anon privileges revoked; `20260820000000_admin_full_control.sql` grants admins INSERT/DELETE on `profiles` |
| Role management                                       | ✅ Done      | `useUpdateUserRole`, `useUpdateTeamMemberRole`, `useAddTeamMember`, `useRemoveTeamMember`               |
| Unit tests                                            | 🟡 Partial   | 3 Vitest suites (`aggregations`, `task-ui`, `tasks-api`); no e2e                                        |
| CI / deployment pipeline                              | ❌ None      | CI workflow was removed; typecheck/lint/build run only on demand                                       |

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
  against `supabaseAdmin` (`client.server.ts`) to ban/unban auth accounts.
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
  - `tasks`: all members read/create/update; delete admin-only. (Any member
    can move a card — acceptable for now, noted as a tightening target.)
- Note: `supabase/seed.sql` does not exist; seed lives in the initial
  migration. `supabase/config.toml` still points at project ref
  `sitjxrepzfwakpgbxqjw` — confirm before `supabase db push`.

## Known gaps & risks

1. **Admin policies are UI-only** — the toggles in the Admin → Policies card
   are hard-coded (`admin.tsx`) and not persisted anywhere.
2. **No CI** — the workflow was intentionally removed; nothing runs
   typecheck/lint/test/build on push.
3. **Test coverage is unit-only** — 3 Vitest suites exist; no integration or
   e2e coverage (highest-risk areas: drag-and-drop mutations, auth redirects,
   SSR error path).
4. **Tasks writes are open to all members** — `tasks_update`/`tasks_insert`
   have no ownership/assignee scoping (per migration comment). Tighten when
   per-task ownership is required.
5. **HR evaluation metrics are derived, not authored** — analytics aggregates
   the live `tasks` table; there is still no formal evaluation model.
6. **Email flows depend on the Supabase project** — sign-up confirmation and
   password reset require email provider settings in the Supabase project.
7. **`.env` is gitignored** — must be provisioned locally (see `.env.example`)
   for `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`.
8. **Node 22+ required** — `package.json` `engines` pins `>=22`; the lockfile
   was regenerated for Node 22.

## Recent changes

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

1. Persist admin policies (new table + UI wiring) instead of hard-coded toggles.
2. Tighten `tasks` RLS to assignee/owner/lead writes.
3. Restore a CI pipeline (typecheck → lint → test → build) and add a
   deployment preset (Nitro).
4. Add integration/e2e coverage for drag-and-drop, auth redirects, and the SSR
   error path.
5. Define a real HR evaluation model and author evaluation data.
6. Onboarding polish: more loading skeletons, empty states, optimistic UI
   coverage everywhere.

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
