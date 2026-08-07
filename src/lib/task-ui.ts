import { differenceInCalendarDays, format, isValid, parseISO } from "date-fns";

import type { TaskPriorityDb, TaskStatusDb } from "./tasks-api";

export const PRIORITIES: TaskPriorityDb[] = ["low", "medium", "high", "critical"];

export const PRIORITY_LABEL: Record<TaskPriorityDb, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const PRIORITY_STYLES: Record<TaskPriorityDb, string> = {
  low: "border-border bg-muted/60 text-muted-foreground",
  medium: "border-primary/40 bg-primary/10 text-primary",
  high: "border-warning/45 bg-warning/10 text-warning",
  critical: "border-destructive/50 bg-destructive/12 text-destructive pulse-critical",
};

export const COLUMNS: { id: TaskStatusDb; label: string }[] = [
  { id: "backlog", label: "Backlog" },
  { id: "in_progress", label: "In Progress" },
  { id: "under_review", label: "Under Review" },
  { id: "completed", label: "Completed" },
];

export function initials(name: string | null, fallback = "?") {
  if (!name) return fallback;
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

export interface DueInfo {
  label: string;
  overdue: boolean;
}

export function dueInfo(due: string | null, status: TaskStatusDb): DueInfo | null {
  if (!due) return null;
  const date = parseISO(due);
  if (!isValid(date)) return null;
  const days = differenceInCalendarDays(date, new Date());
  if (status !== "completed" && days < 0) {
    const n = Math.abs(days);
    return { label: `Overdue by ${n} day${n === 1 ? "" : "s"}`, overdue: true };
  }
  if (status !== "completed" && days === 0) return { label: "Due today", overdue: false };
  if (status !== "completed" && days === 1) return { label: "Due tomorrow", overdue: false };
  return { label: format(date, "MMM d"), overdue: false };
}
