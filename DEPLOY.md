# Deploy to Netlify + connect Supabase

This runbook takes the repo from a local app to a live Site on **Netlify**,
backed by a **Supabase** Postgres database. You will need free accounts for
both.

## 0. Prereqs

- A **GitHub** repository containing this project (Netlify deploys from Git).
- A **Supabase** account.
- A **Netlify** account.

---

## 1. Create + prepare the Supabase project

1. In the [Supabase dashboard](https://supabase.com/dashboard), click **New
   project**, name it (e.g. `codops`), set a strong DB password, and choose a
   region near your users.
2. Note the **project ref** (the subdomain in your URL, e.g.
   `sitjxrepzfwakpgbxqjw`) — it's already in `supabase/config.toml`.

### Apply the migrations

The schema lives in `supabase/migrations/`. Apply them to the remote DB **in
order**:

| File | Purpose |
| ---- | ------- |
| `20260807114326_*.sql` | Base schema: enums, tables, `set_updated_at`, 12-task seed |
| `20260807160000_link_auth_to_profiles.sql` | Create a `profiles` row on sign-up |
| `20260807170000_harden_rls.sql` | Role/ownership RLS, revoke `anon` writes |

Option A — **Supabase CLI** (the project ref is already in `config.toml`):

```sh
npx supabase link --project-ref <PROJECT_REF>
npx supabase db push        # prompts for the DB password
npx supabase db reset       # optional: rebuild + re-seed from scratch
```

Option B — **SQL Editor**: open **SQL Editor → New query**, paste each file's
contents in order, and click **Run**. The [supabase](https://supabase.com) dashboard
can also run them directly.

### Get the publishable key

In the project dashboard, go to **Settings → API**. Copy:
- **Project URL** → used as `VITE_SUPABASE_URL`
- **Publishable (anon) key** → used as `VITE_SUPABASE_PUBLISHABLE_KEY`

These values are **safe to expose to the browser** (Supabase's RLS governs data
access).

---

## 2. Deploy to Netlify

1. Push this repo to GitHub.
2. In [Netlify](https://app.netlify.com), click **Add new site → Import an
   existing project** and select the GitHub repo.
3. The build settings are auto-detected from `netlify.toml`:
   - **Build command:** `vite build`
   - **Publish directory:** `dist/client`
   - **Functions:** `dist/server` (the SSR handler → Netlify Function)

4. Under **Site configuration → Environment variables**, add:

   | Key                        | Value                     |
   | -------------------------- | ------------------------- |
   | `VITE_SUPABASE_URL`        | your Supabase project URL |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | your publishable key  |

   (Both the client and the Netlify Function read `VITE_*` at build time.)

5. Click **Deploy site**. Every future push to the connected branch redeploys
   automatically.

---

## 3. First login + make yourself an admin

The base seed has no user accounts. Create your account in the app, then promote
yourself to admin so `/admin` (role-guarded) is accessible:

1. Sign up via `/login` with your email (check for the confirmation email if
   email confirmation is enabled).
2. In the Supabase **SQL Editor**, promote yourself:

```sql
update public.profiles
set role = 'admin'
where email = '<your-email>@...';
```

> RLS note: `profiles_update_self` currently lets any signed-in user set the row
> `role` to any value, so it is possible to self-promote. When per-workspace
> ownership matters, tighten `profiles_update_self` with a `WITH CHECK` that
> prevents changing `role` (see Hardening).

3. Sign out and back in, then open `/admin`.

---

## 4. Verify the live app

- `/` (dashboard), `/board`, `/projects`, `/teams`, `/analytics` — all read
  live Supabase rows under RLS.
- Create an account → create tasks on the Kanban board → drag cards between
  columns (optimistic + RLS-backed update).
- Anonymous users hitting any protected route are redirected to `/login`.

---

## Troubleshooting

- **Build fails on missing env vars** — the Supabase client throws when
  `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` are unset. Add them in
  the Netlify env settings before the build.
- **A view is empty** — migrations probably weren't run, or you're signed out
  (RLS hides rows from `anon`/unauthenticated sessions). Sign in, and confirm
  `supabase/migrations/*` all executed.
- **`/admin` says "Admin access only"** — your role isn't `admin`; run the
  `update` above.
- **SSR 500 but client works** — check Netlify Function logs (`Site → Logs →
  Functions`) and the SSR env vars; SSR uses the same `VITE_*` values at build.