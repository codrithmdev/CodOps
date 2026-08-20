import type { Session } from "@supabase/supabase-js";

export const SESSION_COOKIE = "codops-session";
export const SESSION_COOKIE_AGE = 60 * 60 * 24 * 7; // 7 days

/**
 * Encode a Supabase session into the cookie payload. Stores both the short-lived
 * access token and the refresh token so the server guard can recover expired
 * sessions instead of bouncing the user to /login.
 */
export function serializeSessionCookie(session: Session | null | undefined): string {
  if (!session?.access_token) return "";
  const payload = JSON.stringify({
    a: session.access_token,
    r: session.refresh_token ?? "",
  });
  return encodeURIComponent(payload);
}

export function parseSessionCookie(value: string | null | undefined): {
  accessToken: string;
  refreshToken: string;
} {
  if (!value) return { accessToken: "", refreshToken: "" };
  try {
    const parsed = JSON.parse(decodeURIComponent(value));
    return {
      accessToken: typeof parsed.a === "string" ? parsed.a : "",
      refreshToken: typeof parsed.r === "string" ? parsed.r : "",
    };
  } catch {
    // Legacy cookie: the raw access token.
    return { accessToken: value, refreshToken: "" };
  }
}

/** Client-only: write (or clear) the session cookie read by server-side guards. */
export function syncSessionCookie(session: Session | null | undefined) {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  const value = serializeSessionCookie(session);
  document.cookie = `${SESSION_COOKIE}=${value}; path=/; max-age=${
    session?.access_token ? SESSION_COOKIE_AGE : 0
  }; samesite=lax${secure}`;
}
