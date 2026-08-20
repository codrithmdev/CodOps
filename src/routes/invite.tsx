import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { CircleDot, Hexagon, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/invite")({
  head: () => ({
    meta: [{ title: "Accept invitation — CodOps" }],
  }),
  component: InvitePage,
});

type State = "checking" | "ready" | "expired";

function InvitePage() {
  const navigate = useNavigate();
  const [state, setState] = useState<State>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setState("ready");
    });
    // If the recovery session never materialises, the link is invalid/expired.
    const t = setTimeout(() => {
      setState((s) => (s === "ready" ? s : "expired"));
    }, 4000);
    return () => {
      data.subscription.unsubscribe();
      clearTimeout(t);
    };
  }, []);

  const afterActivation = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user?.id ?? "")
      .maybeSingle();
    navigate({ to: profile?.role === "admin" ? "/" : "/tasks" });
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords don't match", { description: "Both fields must be identical." });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Account activated", { description: "Welcome to CodOps!" });
      await afterActivation();
    } catch (err) {
      toast.error("Could not set password", { description: (err as Error).message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <Card className="gap-0 rounded-2xl border-border bg-card p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="relative grid size-10 shrink-0 place-items-center rounded-xl bg-primary/15 ring-1 ring-primary/40">
              <Hexagon className="size-6 text-primary" strokeWidth={2.4} />
              <CircleDot className="absolute -right-0.5 -bottom-0.5 size-3.5 rounded-full bg-card text-mint" />
            </div>
            <div>
              <p className="text-lg font-extrabold tracking-tight">CodOps</p>
              <p className="text-xs text-muted-foreground">Task & HR Intelligence</p>
            </div>
          </div>

          {state === "checking" ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Validating your invitation link…</p>
            </div>
          ) : state === "expired" ? (
            <>
              <h1 className="mb-1 text-lg font-bold tracking-tight">Invitation link issue</h1>
              <p className="mb-6 text-xs text-muted-foreground">
                This link is invalid or has expired. Ask a workspace admin to send you a fresh
                invitation.
              </p>
              <a
                href="/login"
                className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Go to sign in
              </a>
            </>
          ) : (
            <>
              <h1 className="mb-1 text-lg font-bold tracking-tight">Welcome to CodOps</h1>
              <p className="mb-6 text-xs text-muted-foreground">
                You've been invited to the workspace. Set a password to activate your account.
              </p>

              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm">Confirm password</Label>
                  <Input
                    id="confirm"
                    type="password"
                    required
                    minLength={6}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="rounded-xl"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="glow-primary w-full gap-1.5 rounded-xl"
                >
                  <KeyRound className="size-4" />
                  {submitting ? "Activating…" : "Activate account"}
                </Button>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
