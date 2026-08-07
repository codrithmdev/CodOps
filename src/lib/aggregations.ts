import { addDays, getISOWeek, startOfWeek, subWeeks } from "date-fns";

import type { IndividualPerformance, ProjectHealth } from "./types";

/** Pure aggregation helpers shared by the TanStack Query hooks in tasks-api.ts.
 *  Kept free of Supabase/React so the logic can be unit-tested in isolation. */

export interface ThroughputPoint {
  week: string;
  created: number;
  completed: number;
}

export interface DashboardMetrics {
  totalTasks: number;
  completedTasks: number;
  completedOnTime: number;
  onTimeCompletionPct: number;
  overdueTasks: number;
  activeTeams: number;
  totalTeams: number;
}

interface TaskLike {
  id: string;
  project_id: string | null;
  assigned_to: string | null;
  status: string;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
}

interface ProjectLike {
  id: string;
  name: string;
  team_id: string | null;
}

interface ProfileLike {
  id: string;
  email: string | null;
  full_name: string | null;
}

export type { TaskLike, ProjectLike, ProfileLike };

export function computeProjectHealth(
  projects: ProjectLike[],
  tasks: TaskLike[],
  todayIso: string,
): ProjectHealth[] {
  return projects.map((p) => {
    const projectTasks = tasks.filter((t) => t.project_id === p.id);
    const total = projectTasks.length;
    const completed = projectTasks.filter((t) => t.status === "completed").length;
    const overdue = projectTasks.filter(
      (t) => t.status !== "completed" && t.due_date !== null && t.due_date < todayIso,
    ).length;
    return {
      project_id: p.id,
      project_name: p.name,
      team_id: p.team_id ?? "",
      total_tasks: total,
      completed_tasks: completed,
      overdue_tasks: overdue,
      project_progress_pct: total === 0 ? 0 : Math.round((completed / total) * 10000) / 100,
    };
  });
}

export function computeIndividualPerformance(
  profiles: ProfileLike[],
  tasks: TaskLike[],
  todayIso: string,
): IndividualPerformance[] {
  return profiles
    .map((p) => {
      const assigned = tasks.filter((t) => t.assigned_to === p.id);
      const total = assigned.length;
      const completed = assigned.filter((t) => t.status === "completed");
      const completedOnTime = completed.filter(
        (t) =>
          t.completed_at !== null &&
          t.due_date !== null &&
          t.completed_at.slice(0, 10) <= t.due_date,
      ).length;
      const overdue = assigned.filter(
        (t) => t.status !== "completed" && t.due_date !== null && t.due_date < todayIso,
      ).length;
      return {
        user_id: p.id,
        full_name: p.full_name,
        email: p.email ?? "",
        total_assigned_tasks: total,
        completed_tasks: completed.length,
        completed_on_time: completedOnTime,
        overdue_tasks: overdue,
        on_time_completion_rate_pct:
          completed.length === 0
            ? 0
            : Math.round((completedOnTime / completed.length) * 10000) / 100,
      };
    })
    .filter((p) => p.total_assigned_tasks > 0);
}

export function computeThroughput(
  rows: { created_at: string; completed_at: string | null }[],
  now: Date,
  weeks = 8,
): ThroughputPoint[] {
  const points: ThroughputPoint[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const start = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
    const startTs = start.getTime();
    const endTs = startTs + 7 * 86_400_000;

    const created = rows.filter((r) => {
      const t = new Date(r.created_at).getTime();
      return t >= startTs && t < endTs;
    }).length;
    const completed = rows.filter((r) => {
      if (!r.completed_at) return false;
      const t = new Date(r.completed_at).getTime();
      return t >= startTs && t < endTs;
    }).length;

    points.push({ week: `W${getISOWeek(addDays(start, 0))}`, created, completed });
  }
  return points;
}

export function computeDashboardMetrics(
  tasks: TaskLike[],
  projects: Pick<ProjectLike, "id" | "team_id">[],
  teams: { id: string }[],
  todayIso: string,
): DashboardMetrics {
  const completed = tasks.filter((t) => t.status === "completed");
  const completedOnTime = completed.filter(
    (t) =>
      t.completed_at !== null && t.due_date !== null && t.completed_at.slice(0, 10) <= t.due_date,
  ).length;
  const overdue = tasks.filter(
    (t) => t.status !== "completed" && t.due_date !== null && t.due_date < todayIso,
  ).length;
  const activeTeams = new Set(
    tasks
      .map((t) => (t.project_id ? projects.find((p) => p.id === t.project_id)?.team_id : null))
      .filter((id): id is string => Boolean(id)),
  ).size;

  return {
    totalTasks: tasks.length,
    completedTasks: completed.length,
    completedOnTime,
    onTimeCompletionPct:
      completed.length === 0 ? 0 : Math.round((completedOnTime / completed.length) * 10000) / 100,
    overdueTasks: overdue,
    activeTeams,
    totalTeams: teams.length,
  };
}
