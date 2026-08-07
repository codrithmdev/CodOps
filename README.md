# CodOps — Team Tasks & HR Analytics

CodOps is a full-stack workspace for modern engineering orgs: a drag-and-drop
task board backed by Supabase, plus portfolio, team and HR-evaluation analytics.

Built with **TanStack Start** (SSR + file-based routing), **React 19**,
**TypeScript** and **Tailwind CSS v4**, with **Supabase** (Postgres + Auth) as
the data layer.

## Features

- **Dashboard** (`/`) — live throughput chart, project health and delivery metrics
- **Kanban Board** (`/board`) — all tasks grouped by workflow state
- **Task Board** (`/tasks`) — full CRUD task board with:
  - drag-and-drop status updates (optimistic, persisted to Supabase)
  - search and filters by project, team, assignee and priority
  - create / edit / delete dialog with due-date picker
- **Projects** (`/projects`) — portfolio view with progress and delivery risk
- **Teams** (`/teams`) — rosters, leads and role assignments
- **HR Analytics** (`/analytics`) — per-member on-time completion, throughput and overdue load
- **Admin Controls** (`/admin`) — role governance and workspace policies
- ⌘K command palette, dark/light theme, collapsible sidebar

## Tech stack

| Layer           | Technology                                                                              |
| --------------- | --------------------------------------------------------------------------------------- |
| Framework       | [TanStack Start](https://tanstack.com/start) (React 19, SSR, file-based routes)         |
| Routing         | TanStack Router (`src/router.tsx`, generated `src/routeTree.gen.ts`)                    |
| Data fetching   | TanStack Query + Supabase (`@supabase/supabase-js`)                                     |
| Database        | Supabase (Postgres) — schema in `supabase/migrations/`                                  |
| UI              | shadcn/ui-style components (`src/components/ui/`), Radix primitives, lucide-react icons |
| Styling         | Tailwind CSS v4 (`src/styles.css`, oklch design tokens)                                 |
| Charts          | Recharts                                                                                |
| Drag & drop     | `@hello-pangea/dnd`                                                                     |     | Forms | react-hook-form, zod (available via `ui/form.tsx`) |
| Package manager | [npm](https://www.npmjs.com) (`package-lock.json`)                                      |

## Prerequisites

- [Node.js](https://nodejs.org) 20+
- npm (bundled with Node.js)
- A Supabase project (cloud or local via `supabase start`)

## Getting started

```sh
git clone https://github.com/umaisadeel/CodOps.git
cd CodOps
npm install
npm run dev
```

The app runs at the port printed by Vite (default `http://localhost:3000`).

### Environment variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

| Variable                        | Required                  | Purpose                                                            |
| ------------------------------- | ------------------------- | ------------------------------------------------------------------ |
| `VITE_SUPABASE_URL`             | yes                       | Supabase project URL (client + SSR)                                |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | yes                       | Publishable (anon) key (client + SSR)                              |
| `SUPABASE_URL`                  | optional                  | Fallback for SSR                                                   |
| `SUPABASE_PUBLISHABLE_KEY`      | optional                  | Fallback for SSR                                                   |
| `SUPABASE_SERVICE_ROLE_KEY`     | only for admin server ops | Service-role key for `client.server.ts` — never ship to the client |

### Database setup

The schema lives in `supabase/migrations/`. To apply it to a remote project:

```sh
supabase link --project-ref <your-project-ref>
supabase db push
```

It creates:

- Enums: `app_role`, `task_priority`, `task_status`, `project_status`
- Tables: `profiles`, `teams`, `team_members`, `projects`, `tasks`
- `updated_at` trigger, RLS with open workspace access, and seed data

The typed Supabase client (`src/integrations/supabase/types.ts`) mirrors this
schema. Regenerate it after schema changes with:

```sh
supabase gen types typescript --project-id <your-project-ref> > src/integrations/supabase/types.ts
```

## Scripts

| Command           | Description                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Start the Vite dev server (with SSR) |
| `npm run build`   | Production build (client + SSR)      |
| `npm run preview` | Preview the production build         |
| `npm run lint`    | ESLint over the project              |
| `npm run format`  | Prettier write over the project      |

## Project structure

```
src/
  components/          App components (sidebar, header, kanban, task board…)
    ui/                shadcn/ui-style primitives
    tasks/             Task board feature components
  hooks/               Shared hooks
  integrations/supabase/  Supabase clients, auth middleware, generated types
  lib/                 Types, mock data, task API hooks, error handling
  routes/              File-based routes (see src/routes/README.md)
  router.tsx           TanStack Router setup
  server.ts            SSR entry with catastrophic-error normalization
  start.ts             TanStack Start instance (middleware, CSRF)
  styles.css           Tailwind v4 entry + design tokens
supabase/
  config.toml          Supabase project config
  migrations/          SQL schema + seed
```

> **Note on data sources:** the dashboard, kanban, projects, teams, analytics
> and admin views currently render seeded **mock data** (`src/lib/mock-data.ts`),
> while the **Task Board** (`/tasks`) reads and writes real Supabase tables via
> `src/lib/tasks-api.ts`. See `projectstatus.md` for the migration roadmap.

## SSR error handling

`src/server.ts` wraps the TanStack Start server entry so that thrown errors
(including ones swallowed by h3) render a friendly error page instead of a bare
500, and `src/lib/error-capture.ts` preserves full stack traces for logs.

## Deployment

`npm run build` compiles the client to `dist/client/` and the SSR entry to
`dist/server/server.js`, which exports a `fetch` handler.

**Recommended preset: `node-server`** — a self-contained Node HTTP server that
runs on any Node 20+ host (VM, Docker, a bare `node dist/server/server.js`).
Follow `npm run build` with `npx nitro build --preset node-server`; the output
lands in `.nitro/` and is launched with `node .nitro/output/server/index.mjs`.

**PaaS/serverless alternatives** (pick one, then document it):

- **Vercel** — build with the `vercel` preset; Vercel auto-detects the output.
- **Cloudflare Workers** — build with the `cloudflare-workers` preset and
  `wrangler deploy`, an edge-optimized path suitable for the Workers runtime.

Whichever preset is chosen, ensure the Supabase environment variables
(`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`) are set in the host
environment, since the client-side data layer authenticates the browser's
Supabase client and relies on row-level security.

CI runs the full pipeline (`typecheck → lint → test → build`) on every push and
PR via `.github/workflows/ci.yml`.

## License

Private project. See repository owner for licensing questions.
