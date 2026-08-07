import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addDays, getISOWeek, startOfWeek, subWeeks } from "date-fns";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { IndividualPerformance, ProjectHealth } from "./types";

export type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];
export type TaskInsert = Database["public"]["Tables"]["tasks"]["Insert"];
export type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type TeamRow = Database["public"]["Tables"]["teams"]["Row"];
export type TaskStatusDb = Database["public"]["Enums"]["task_status"];
export type TaskPriorityDb = Database["public"]["Enums"]["task_priority"];

export const taskKeys = {
  tasks: ["tasks"] as const,
  projects: ["projects"] as const,
  profiles: ["profiles"] as const,
  teams: ["teams"] as const,
};

export function useTasks() {
  return useQuery({
    queryKey: taskKeys.tasks,
    queryFn: async (): Promise<TaskRow[]> => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useProjects() {
  return useQuery({
    queryKey: taskKeys.projects,
    queryFn: async (): Promise<ProjectRow[]> => {
      const { data, error } = await supabase.from("projects").select("*").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useProfiles() {
  return useQuery({
    queryKey: taskKeys.profiles,
    queryFn: async (): Promise<ProfileRow[]> => {
      const { data, error } = await supabase.from("profiles").select("*").order("full_name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useTeams() {
  return useQuery({
    queryKey: taskKeys.teams,
    queryFn: async (): Promise<TeamRow[]> => {
      const { data, error } = await supabase.from("teams").select("*").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export type TeamMemberRow = Database["public"]["Tables"]["team_members"]["Row"];

export function useTeamMembers() {
  return useQuery({
    queryKey: ["team-members"],
    queryFn: async (): Promise<TeamMemberRow[]> => {
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .order("joined_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

const todayIso = () => new Date().toISOString().slice(0, 10);

/** Per-project health derived from the live `projects` + `tasks` tables. */
export function useProjectHealth() {
  return useQuery({
    queryKey: [...taskKeys.tasks, "project-health"],
    queryFn: async (): Promise<ProjectHealth[]> => {
      const [projectsRes, tasksRes] = await Promise.all([
        supabase.from("projects").select("*"),
        supabase.from("tasks").select("*"),
      ]);
      if (projectsRes.error) throw projectsRes.error;
      if (tasksRes.error) throw tasksRes.error;

      const projects = projectsRes.data ?? [];
      const tasks = tasksRes.data ?? [];
      const today = todayIso();

      return projects.map((p) => {
        const projectTasks = tasks.filter((t) => t.project_id === p.id);
        const total = projectTasks.length;
        const completed = projectTasks.filter((t) => t.status === "completed").length;
        const overdue = projectTasks.filter(
          (t) => t.status !== "completed" && t.due_date !== null && t.due_date < today,
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
    },
  });
}

/** Per-assignee evaluation metrics derived from the live `tasks` table. */
export function useIndividualPerformance() {
  return useQuery({
    queryKey: [...taskKeys.tasks, "individual-performance"],
    queryFn: async (): Promise<IndividualPerformance[]> => {
      const [profilesRes, tasksRes] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("tasks").select("*"),
      ]);
      if (profilesRes.error) throw profilesRes.error;
      if (tasksRes.error) throw tasksRes.error;

      const profiles = profilesRes.data ?? [];
      const tasks = tasksRes.data ?? [];
      const today = todayIso();

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
            (t) => t.status !== "completed" && t.due_date !== null && t.due_date < today,
          ).length;
          return {
            user_id: p.id,
            full_name: p.full_name,
            email: p.email,
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
    },
  });
}

export interface ThroughputPoint {
  week: string;
  created: number;
  completed: number;
}

/** Created vs completed tasks per ISO week, for the last 8 weeks. */
export function useThroughput() {
  return useQuery({
    queryKey: [...taskKeys.tasks, "throughput"],
    queryFn: async (): Promise<ThroughputPoint[]> => {
      const { data, error } = await supabase.from("tasks").select("created_at, completed_at");
      if (error) throw error;

      const rows = data ?? [];
      const now = new Date();
      const points: ThroughputPoint[] = [];

      for (let i = 7; i >= 0; i--) {
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
    },
  });
}

/** Optimistic drag-and-drop status change. */
export function useUpdateTaskStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatusDb }) => {
      const { error } = await supabase
        .from("tasks")
        .update({
          status,
          completed_at: status === "completed" ? new Date().toISOString() : null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: taskKeys.tasks });
      const previous = qc.getQueryData<TaskRow[]>(taskKeys.tasks);
      qc.setQueryData<TaskRow[]>(taskKeys.tasks, (old) =>
        (old ?? []).map((t) =>
          t.id === id
            ? {
                ...t,
                status,
                completed_at: status === "completed" ? new Date().toISOString() : null,
              }
            : t,
        ),
      );
      return { previous };
    },
    onError: (error, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(taskKeys.tasks, ctx.previous);
      toast.error("Couldn't move that task", { description: (error as Error).message });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: taskKeys.tasks }),
  });
}

export function useSaveTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string | undefined; values: TaskInsert }) => {
      if (id) {
        const { error } = await supabase.from("tasks").update(values).eq("id", id);
        if (error) throw error;
        return "updated" as const;
      }
      const { error } = await supabase.from("tasks").insert(values);
      if (error) throw error;
      return "created" as const;
    },
    onSuccess: (result) => {
      toast.success(result === "created" ? "Task created" : "Task updated");
      qc.invalidateQueries({ queryKey: taskKeys.tasks });
    },
    onError: (error) => {
      toast.error("Save failed", { description: (error as Error).message });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Task deleted");
      qc.invalidateQueries({ queryKey: taskKeys.tasks });
    },
    onError: (error) => toast.error("Delete failed", { description: (error as Error).message }),
  });
}
