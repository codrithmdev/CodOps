import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

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
