import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { CircleDot, Hexagon, KeyRound } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [{ title: "Reset password — CodOps" }],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

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
      toast.success("Password updated", { description: "Sign in with your new password." });
      navigate({ to: "/login" });
    } catch (err) {
      toast.error("Could not update password", { description: (err as Error).message });
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

          <h1 className="mb-1 text-lg font-bold tracking-tight">Set a new password</h1>
          <p className="mb-6 text-xs text-muted-foreground">
            Choose a strong password for your workspace account.
          </p>

          {ready ? (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                {submitting ? "Updating…" : "Update password"}
              </Button>
            </form>
          ) : (
            <p className="text-xs text-muted-foreground">
              Invalid or expired link. Request a fresh password reset from the{" "}
              <a href="/login" className="font-semibold text-primary underline underline-offset-4">
                sign in page
              </a>
              .
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
