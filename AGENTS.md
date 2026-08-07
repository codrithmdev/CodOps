# Agent guide — CodOps

Guidance for AI coding agents and contributors working in this repository.

## Stack

- **TanStack Start** (React 19, SSR, file-based routing in `src/routes/`)
- **TypeScript** (strict) + **Tailwind CSS v4** (`src/styles.css`)
- **Supabase** (Postgres + Auth) via `@supabase/supabase-js`
- **Bun** is the package manager — commit `bun.lock`, not a `package-lock.json`

## Commands

```sh
bun run dev       # dev server (SSR)
bun run build     # production build
bun run lint      # ESLint (project-configured)
bun run format    # Prettier write
npx tsc --noEmit  # typecheck
```

## Conventions

- **Routing**: file-based. Every `.tsx` in `src/routes/` is a route; the only
  layout is `src/routes/__root.tsx`. Never hand-edit `src/routeTree.gen.ts`.
  See `src/routes/README.md`.
- **Path alias**: use `@/` for `src/` imports.
- **Server-only code**: suffix files with `.server.ts` (e.g.
  `src/integrations/supabase/client.server.ts`). Route files ship to the client
  bundle — load server-only modules dynamically inside server handlers.
- **Auth**: `src/start.ts` registers `attachSupabaseAuth` (attaches the bearer
  token to serverFn RPCs) and a CSRF middleware. `requireSupabaseAuth` in
  `src/integrations/supabase/auth-middleware.ts` protects server functions.
- **Data**: use the TanStack Query hooks in `src/lib/tasks-api.ts` rather than
  calling `supabase` directly from components.
- **Design system**: all colors live as oklch tokens in `src/styles.css`
  (`:root` light, `.dark`). Add new semantic colors there and register them in
  `@theme inline`; never hard-code hex values.
- **UI**: reuse `src/components/ui/*` primitives; keep the existing
  card/border/rounded-2xl visual language.

## Supabase

- Schema lives in `supabase/migrations/`; `src/integrations/supabase/types.ts`
  is generated from it (`supabase gen types typescript …`).
- The app requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
  (see `.env.example`). It throws a clear error when they are missing.

## Git

- Keep commits focused and the branch working at all times.
- Do not rewrite published git history.
