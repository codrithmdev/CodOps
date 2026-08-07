import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { CircleDot, Hexagon, LogIn, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "Sign in — CodOps" }],
  }),
  component: LoginPage,
});

type Mode = "signin" | "signup";

function LoginPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const switchMode = (m: Mode) => {
    setMode(m);
    setEmail("");
    setPassword("");
    setName("");
  };

  const afterAuth = async () => {
    await qc.invalidateQueries({ queryKey: ["current-user"] });
    navigate({ to: "/" });
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await afterAuth();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        });
        if (error) throw error;
        if (data.session) {
          await afterAuth();
        } else {
          toast.success("Account created", {
            description: "Check your email to confirm your account, then sign in.",
          });
        }
      }
    } catch (err) {
      toast.error("Authentication failed", { description: (err as Error).message });
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

          <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl border border-border bg-muted/50 p-1">
            <button
              type="button"
              onClick={() => switchMode("signin")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                mode === "signin"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="inline-flex items-center gap-1.5">
                <LogIn className="size-3.5" /> Sign in
              </span>
            </button>
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                mode === "signup"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="inline-flex items-center gap-1.5">
                <UserPlus className="size-3.5" /> Sign up
              </span>
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Amara Dey"
                  autoComplete="name"
                  className="rounded-xl"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@codops.io"
                autoComplete="email"
                className="rounded-xl"
              />
            </div>

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
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                className="rounded-xl"
              />
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="glow-primary w-full gap-1.5 rounded-xl"
            >
              {mode === "signin" ? "Sign in to workspace" : "Create account"}
            </Button>
          </form>

          <p className="mt-4 text-center text-[11px] text-muted-foreground">
            {mode === "signin"
              ? "New here? Use the Sign up tab to create a workspace account."
              : "Already have an account? Switch to Sign in."}
          </p>
        </Card>
      </div>
    </div>
  );
}
