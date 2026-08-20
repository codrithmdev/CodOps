import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    // New Supabase API keys are opaque strings, not bearer JWTs.
    if (
      isNewSupabaseApiKey(supabaseKey) &&
      headers.get("Authorization") === `Bearer ${supabaseKey}`
    ) {
      headers.delete("Authorization");
    }

    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

function parseCookies(cookieHeader: string | null | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim();
    if (!key) continue;
    out[key] = decodeURIComponent(part.slice(eq + 1).trim());
  }
  return out;
}

const SESSION_COOKIE = "codops-session";

const getAuthStatus = createServerFn().handler(async () => {
  const SUPABASE_URL = process.env["VITE_SUPABASE_URL"] || process.env["SUPABASE_URL"];
  const SUPABASE_PUBLISHABLE_KEY =
    process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] || process.env["SUPABASE_PUBLISHABLE_KEY"];

  const request = getRequest();
  const cookies = parseCookies(request?.headers?.get("cookie"));
  const authHeader = request?.headers?.get("authorization");
  const token =
    cookies[SESSION_COOKIE] ||
    (authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined);

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY || !token) {
    return { authenticated: false, role: null };
  }

  const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: {
      fetch: createSupabaseFetch(SUPABASE_PUBLISHABLE_KEY),
      headers: { Authorization: `Bearer ${token}` },
    },
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return { authenticated: false, role: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  return { authenticated: true, role: profile?.role ?? null };
});

/**
 * Route-level guard. Throw it from `beforeLoad` on any protected route:
 *   beforeLoad: requireAuth
 * Unauthenticated users are redirected to /login. The session token is read
 * from the `codops-session` cookie (set by the client auth listener) or the
 * bearer Authorization header, then validated against Supabase.
 */
export async function requireAuth() {
  const { authenticated } = await getAuthStatus();
  if (!authenticated) {
    throw redirect({ to: "/login" });
  }
}

/**
 * Admin-only guard. Non-admins are sent back to the Task Board. Members and
 * leads are restricted to the Task Board, Projects and Teams views.
 */
export async function requireAdmin() {
  const { authenticated, role } = await getAuthStatus();
  if (!authenticated) {
    throw redirect({ to: "/login" });
  }
  if (role !== "admin") {
    throw redirect({ to: "/tasks" });
  }
}
