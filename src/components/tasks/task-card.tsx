import { AlertTriangle, CalendarDays, MessageSquare, Pencil } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { dueInfo, initials, PRIORITY_LABEL, PRIORITY_STYLES } from "@/lib/task-ui";
import type { ProfileRow, ProjectRow, TaskRow } from "@/lib/tasks-api";

interface Props {
  task: TaskRow;
  project: ProjectRow | undefined;
  assignee: ProfileRow | undefined;
  dragging?: boolean | undefined;
  onEdit: (task: TaskRow) => void;
}

export function TaskCard({ task, project, assignee, dragging, onEdit }: Props) {
  const due = dueInfo(task.due_date, task.status);
  const done = task.status === "completed";

  return (
    <Card
      onClick={() => onEdit(task)}
      className={cn(
        "group cursor-grab gap-0 rounded-xl border-border bg-card p-3 transition-all",
        "hover:border-primary/50 hover:shadow-[0_8px_28px_-18px_var(--primary)]",
        dragging && "rotate-[0.6deg] border-primary/60 shadow-[0_18px_44px_-20px_var(--primary)]",
        done && "border-mint/30",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 text-sm leading-snug font-semibold break-words">{task.title}</p>
        <Pencil className="mt-0.5 size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {project && (
          <span className="max-w-[60%] truncate rounded-md border border-border bg-muted/60 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground">
            {project.name}
          </span>
        )}
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-[0.08em] uppercase",
            PRIORITY_STYLES[task.priority],
          )}
        >
          {PRIORITY_LABEL[task.priority]}
        </span>
      </div>

      {task.description && (
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {task.description}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/70 pt-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full text-[10px] font-bold",
                  assignee
                    ? "bg-primary/15 text-primary ring-1 ring-primary/35"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {initials(assignee?.full_name ?? null, "–")}
              </span>
            </TooltipTrigger>
            <TooltipContent>{assignee?.full_name ?? "Unassigned"}</TooltipContent>
          </Tooltip>

          {due && (
            <span
              className={cn(
                "flex min-w-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium",
                due.overdue
                  ? "border border-destructive/45 text-destructive"
                  : "text-muted-foreground",
              )}
            >
              {due.overdue ? (
                <AlertTriangle className="size-3 shrink-0" />
              ) : (
                <CalendarDays className="size-3 shrink-0" />
              )}
              <span className="truncate">{due.label}</span>
            </span>
          )}
        </div>

        <span className="flex shrink-0 items-center gap-1 text-[10px] text-muted-foreground">
          <MessageSquare className="size-3" />
          {(task.description?.length ?? 0) % 5}
        </span>
      </div>
    </Card>
  );
}
