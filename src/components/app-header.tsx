import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, Moon, Plus, Search, Sun, ChevronDown, LogOut, User, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RolePill } from "@/components/role-pill";
import { initialsOf } from "@/lib/utils";
import { useCurrentUser } from "@/lib/tasks-api";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

function useTheme() {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  return { dark, toggle: () => setDark((d) => !d) };
}

export function AppHeader({ onCommand }: { onCommand: () => void }) {
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const currentUser = useCurrentUser().data ?? null;

  const name = currentUser?.full_name ?? "Workspace";
  const email = currentUser?.email ?? "Not signed in";
  const role = currentUser?.role ?? "member";
  const initials = initialsOf(name);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    qc.clear();
    navigate({ to: "/login" });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-3 py-3 sm:px-5">
        <SidebarTrigger className="shrink-0" />

        <button
          onClick={onCommand}
          className="flex min-w-0 items-center gap-2 rounded-xl border border-border bg-card/60 px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground md:max-w-md"
        >
          <Search className="size-4 shrink-0" />
          <span className="hidden truncate sm:inline">Search tasks, projects, people…</span>
          <span className="ml-auto hidden shrink-0 rounded-md border border-border px-1.5 py-0.5 font-mono text-[10px] md:inline">
            ⌘K
          </span>
        </button>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            onClick={() => toast.success("New task composer", { description: "Shell demo action" })}
            className="glow-primary h-9 gap-1.5 rounded-xl px-3 font-semibold transition-shadow hover:shadow-[0_0_0_1px_var(--primary),0_10px_34px_-6px_var(--primary)]"
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">New Task</span>
          </Button>

          <RolePill role={role} className="hidden lg:inline-flex" />

          <Button variant="ghost" size="icon" className="size-9 rounded-xl" onClick={toggle}>
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>

          <Button variant="ghost" size="icon" className="relative size-9 rounded-xl">
            <Bell className="size-4" />
            <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-mint" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-xl border border-border px-1.5 py-1 transition-colors hover:border-primary/50">
                <span className="grid size-7 place-items-center rounded-lg bg-primary/20 text-[11px] font-bold text-primary">
                  {initials}
                </span>
                <ChevronDown className="hidden size-3.5 text-muted-foreground sm:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex flex-col">
                <span>{name}</span>
                <span className="text-xs font-normal text-muted-foreground">{email}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="size-4" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="size-4" /> Preferences
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                <LogOut className="size-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
