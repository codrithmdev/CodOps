import { CalendarDays, Flag } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { initialsOf, nameOf, projects, tasks } from "@/lib/mock-data";
import { STATUS_COLUMNS, type TaskPriority } from "@/lib/types";

const priorityStyles: Record<TaskPriority, string> = {
  low: "text-muted-foreground border-border",
  medium: "text-primary border-primary/40 bg-primary/10",
  high: "text-warning border-warning/40 bg-warning/10",
  critical: "text-destructive border-destructive/40 bg-destructive/10",
};

export function KanbanBoard() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {STATUS_COLUMNS.map((col) => {
        const items = tasks.filter((t) => t.status === col.id);
        return (
          <div
            key={col.id}
            className="flex min-w-0 flex-col rounded-2xl border border-border bg-card/50 p-3"
          >
            <div className="mb-3 flex items-center justify-between gap-2 px-1">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className={cn(
                    "size-2 shrink-0 rounded-full",
                    col.id === "completed" ? "bg-mint" : "bg-primary",
                  )}
                />
                <h3 className="truncate text-xs font-bold tracking-[0.1em] uppercase">
                  {col.label}
                </h3>
              </div>
              <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 font-mono text-[10px] font-bold text-muted-foreground">
                {items.length}
              </span>
            </div>

            <div className="space-y-2.5">
              {items.map((t) => {
                const project = projects.find((p) => p.id === t.project_id);
                const assignee = nameOf(t.assigned_to);
                return (
                  <Card
                    key={t.id}
                    className="cursor-grab gap-0 rounded-xl border-border bg-card p-3 transition-all hover:-translate-y-0.5 hover:border-primary/50"
                  >
                    <p className="text-sm leading-snug font-semibold">{t.title}</p>
                    <p className="mt-1 truncate text-[11px] text-muted-foreground">
                      {project?.name}
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase",
                          priorityStyles[t.priority],
                        )}
                      >
                        <Flag className="size-2.5" />
                        {t.priority}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <CalendarDays className="size-3" />
                          {t.due_date
                            ? new Date(t.due_date).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              })
                            : "—"}
                        </span>
                        <span
                          title={assignee}
                          className="grid size-6 place-items-center rounded-full bg-primary/20 text-[9px] font-bold text-primary"
                        >
                          {initialsOf(assignee)}
                        </span>
                      </div>
                    </div>
                  </Card>
                );
              })}
              {items.length === 0 && (
                <div className="rounded-xl border border-dashed border-border p-6 text-center text-[11px] text-muted-foreground">
                  Drop tasks here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
