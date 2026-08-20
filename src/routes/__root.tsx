import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useNavigate,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { CommandPalette, useCommandPalette } from "@/components/command-palette";
import { useCurrentUser } from "@/lib/tasks-api";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { syncSessionCookie } from "@/lib/session-cookie";

const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // auto-logout after 5 minutes of inactivity
const IDLE_CHECK_INTERVAL_MS = 15_000;

function useAutoLogout(enabled: boolean) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: user } = useCurrentUser({ enabled });

  useEffect(() => {
    if (!user) return;

    let lastActivity = Date.now();
    const onActivity = () => {
      lastActivity = Date.now();
    };
    const events: (keyof WindowEventMap)[] = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
    ];
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));

    const timer = setInterval(() => {
      if (Date.now() - lastActivity >= IDLE_TIMEOUT_MS) {
        supabase.auth.signOut().then(() => {
          syncSessionCookie(null);
          qc.clear();
          navigate({ to: "/login" });
        });
      }
    }, IDLE_CHECK_INTERVAL_MS);

    return () => {
      clearInterval(timer);
      events.forEach((e) => window.removeEventListener(e, onActivity));
    };
  }, [user, navigate, qc]);
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "CodOps — Team Tasks & HR Analytics" },
      {
        name: "description",
        content:
          "Enterprise team task management and HR evaluation analytics for modern engineering orgs.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap",
      },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "icon", href: "/favicon.ico", sizes: "any", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { open, setOpen } = useCommandPalette();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAuthPage =
    pathname === "/login" || pathname === "/reset-password" || pathname === "/invite";

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      syncSessionCookie(session);
    });
    // Seed the cookie from the persisted session on first load.
    supabase.auth.getSession().then(({ data: sessionData }) => {
      syncSessionCookie(sessionData.session);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppShell isAuthPage={isAuthPage} open={open} onOpenChange={setOpen} />
    </QueryClientProvider>
  );
}

function AppShell({
  isAuthPage,
  open,
  onOpenChange,
}: {
  isAuthPage: boolean;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useAutoLogout(mounted);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        {isAuthPage ? null : <AppSidebar />}
        <div className="flex min-w-0 flex-1 flex-col">
          {isAuthPage ? null : <AppHeader onCommand={() => onOpenChange(true)} />}
          <main className={cn("flex min-w-0 flex-1 flex-col p-4 sm:p-6", isAuthPage && "p-0")}>
            {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
            <Outlet />
            <AuthGate />
          </main>
        </div>
      </div>
      {isAuthPage ? null : <CommandPalette open={open} onOpenChange={onOpenChange} />}
      <Toaster />
    </SidebarProvider>
  );
}

function AuthGate() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { data: user, isPending } = useCurrentUser({
    enabled: mounted,
  });

  useEffect(() => {
    if (!mounted || isPending) return;
    if (
      !user &&
      pathname !== "/login" &&
      pathname !== "/reset-password" &&
      pathname !== "/invite"
    ) {
      navigate({ to: "/login" });
    } else if (user && pathname === "/login") {
      navigate({ to: user.role === "admin" ? "/" : "/tasks" });
    }
  }, [mounted, isPending, user, pathname, navigate]);

  if (!mounted) return null;

  return null;
}
