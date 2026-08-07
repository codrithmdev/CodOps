import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useProjectHealth, useProjects, useTeams } from "@/lib/tasks-api";
import type { ProjectStatus } from "@/lib/types";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Projects — CodOps" },
      {
        name: "description",
        content: "Project portfolio with progress, owning team, due dates and delivery risk.",
      },
      { property: "og:title", content: "Projects — CodOps" },
      {
        property: "og:description",
        content: "Portfolio view of project progress, owners and delivery risk.",
      },
    ],
  }),
  component: ProjectsPage,
});

const statusStyle: Record<ProjectStatus, string> = {
  planning: "text-primary bg-primary/10 border-primary/40",
  active: "mint-badge",
  on_hold: "text-warning bg-warning/10 border-warning/40",
  completed: "text-muted-foreground bg-muted border-border",
};

function ProjectsPage() {
  const projectsQ = useProjects();
  const healthQ = useProjectHealth();
  const teamsQ = useTeams();

  const projects = projectsQ.data ?? [];
  const healthById = new Map((healthQ.data ?? []).map((h) => [h.project_id, h]));
  const teams = teamsQ.data ?? [];

  const loading = projectsQ.isLoading || healthQ.isLoading || teamsQ.isLoading;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        subtitle="Portfolio delivery across every team in the organization."
        action={
          <Button className="glow-primary shrink-0 gap-1.5 rounded-xl">
            <Plus className="size-4" /> New Project
          </Button>
        }
      />

      {projectsQ.isError && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          Couldn't load projects: {(projectsQ.error as Error).message}
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="gap-0 rounded-2xl border-border bg-card p-5">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="mt-2 h-3.5 w-full" />
              <Skeleton className="mt-6 h-2 w-full" />
              <div className="mt-5 flex gap-4">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => {
            const health = healthQ.data?.find((h) => h.project_id === p.id);
            const team = teams.find((t) => t.id === p.team_id);
            return (
              <Card
                key={p.id}
                className="gap-0 rounded-2xl border-border bg-card p-5 transition-colors hover:border-primary/40"
              >
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-bold tracking-tight">{p.name}</h2>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{p.description}</p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase",
                      statusStyle[p.status],
                    )}
                  >
                    {p.status.replace("_", " ")}
                  </span>
                </div>

                <div className="mt-5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-mono font-bold text-mint">
                      {health?.project_progress_pct ?? 0}%
                    </span>
                  </div>
                  <Progress value={health?.project_progress_pct ?? 0} className="mt-2 h-1.5" />
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                  <span>{team?.name}</span>
                  <span>Due {p.due_date ? new Date(p.due_date).toLocaleDateString() : "—"}</span>
                  <span className="text-destructive">{health?.overdue_tasks ?? 0} overdue</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
