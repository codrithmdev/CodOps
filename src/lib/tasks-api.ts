import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { IndividualPerformance, ProjectHealth } from "./types";
import {
  computeDashboardMetrics,
  computeIndividualPerformance,
  computeProjectHealth,
  computeThroughput,
  type DashboardMetrics,
  type ThroughputPoint,
} from "./aggregations";

export type { DashboardMetrics, ThroughputPoint } from "./aggregations";

export type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];
export type TaskInsert = Database["public"]["Tables"]["tasks"]["Insert"];
export type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type TeamRow = Database["public"]["Tables"]["teams"]["Row"];
export type TeamInsert = Database["public"]["Tables"]["teams"]["Insert"];
export type TeamUpdate = Database["public"]["Tables"]["teams"]["Update"];
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

/** The signed-in user's profile row, or null when unauthenticated. */
export function useCurrentUser(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: async (): Promise<ProfileRow | null> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
    enabled: options?.enabled ?? true,
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

      return computeProjectHealth(projects, tasks, todayIso());
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

      return computeIndividualPerformance(profiles, tasks, todayIso());
    },
  });
}

/** Created vs completed tasks per ISO week, for the last 8 weeks. */
export function useThroughput() {
  return useQuery({
    queryKey: [...taskKeys.tasks, "throughput"],
    queryFn: async (): Promise<ThroughputPoint[]> => {
      const { data, error } = await supabase.from("tasks").select("created_at, completed_at");
      if (error) throw error;

      return computeThroughput(data ?? [], new Date());
    },
  });
}

/** Headline dashboard metrics derived from the live tables. */
export function useDashboardMetrics() {
  return useQuery({
    queryKey: [...taskKeys.tasks, "metrics"],
    queryFn: async (): Promise<DashboardMetrics> => {
      const [tasksRes, projectsRes, teamsRes] = await Promise.all([
        supabase.from("tasks").select("*"),
        supabase.from("projects").select("id, team_id"),
        supabase.from("teams").select("id"),
      ]);
      if (tasksRes.error) throw tasksRes.error;
      if (projectsRes.error) throw projectsRes.error;
      if (teamsRes.error) throw teamsRes.error;

      const tasks = tasksRes.data ?? [];
      const projects = projectsRes.data ?? [];
      const teams = teamsRes.data ?? [];

      return computeDashboardMetrics(tasks, projects, teams, todayIso());
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

export type AppRoleDb = Database["public"]["Enums"]["app_role"];

interface AddTeamMemberInput {
  teamId: string;
  userId: string;
  role: AppRoleDb;
}

/** Add a user to a team as a member or lead (RLS-gated to admins and team leads). */
export function useAddTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ teamId, userId, role }: AddTeamMemberInput) => {
      const { error } = await supabase
        .from("team_members")
        .insert({ team_id: teamId, user_id: userId, role_in_team: role });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Member added to team");
      qc.invalidateQueries({ queryKey: ["team-members"] });
    },
    onError: (error) =>
      toast.error("Couldn't add member", { description: (error as Error).message }),
  });
}

export type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];
export type ProjectUpdate = Database["public"]["Tables"]["projects"]["Update"];

/** Create a project (RLS-gated to admins and owning team leads). */
export function useSaveProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: ProjectInsert) => {
      const { error } = await supabase.from("projects").insert(values);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Project created");
      qc.invalidateQueries({ queryKey: taskKeys.projects });
    },
    onError: (error) =>
      toast.error("Couldn't create project", { description: (error as Error).message }),
  });
}

/** Update a project (RLS-gated to admins and owning team leads). */
export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: ProjectUpdate }) => {
      const { error } = await supabase.from("projects").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Project updated");
      qc.invalidateQueries({ queryKey: taskKeys.projects });
    },
    onError: (error) =>
      toast.error("Couldn't update project", { description: (error as Error).message }),
  });
}

/** Delete a project (RLS-gated to admins and owning team leads). */
export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Project deleted");
      qc.invalidateQueries({ queryKey: taskKeys.projects });
    },
    onError: (error) =>
      toast.error("Couldn't delete project", { description: (error as Error).message }),
  });
}

/** Create a team (RLS-gated to admins). */
export function useCreateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: TeamInsert) => {
      const { error } = await supabase.from("teams").insert(values);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Team created");
      qc.invalidateQueries({ queryKey: taskKeys.teams });
    },
    onError: (error) =>
      toast.error("Couldn't create team", { description: (error as Error).message }),
  });
}

/** Update a team (RLS-gated to admins). */
export function useUpdateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: TeamUpdate }) => {
      const { error } = await supabase.from("teams").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Team updated");
      qc.invalidateQueries({ queryKey: taskKeys.teams });
    },
    onError: (error) =>
      toast.error("Couldn't update team", { description: (error as Error).message }),
  });
}

/** Delete a team (RLS-gated to admins). */
export function useDeleteTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("teams").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Team deleted");
      qc.invalidateQueries({ queryKey: taskKeys.teams });
    },
    onError: (error) =>
      toast.error("Couldn't delete team", { description: (error as Error).message }),
  });
}
export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRoleDb }) => {
      const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Role updated");
      qc.invalidateQueries({ queryKey: taskKeys.profiles });
    },
    onError: (error) =>
      toast.error("Couldn't update role", { description: (error as Error).message }),
  });
}

/** Update a team member's role (admin or team lead). */
export function useUpdateTeamMemberRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: AppRoleDb }) => {
      const { error } = await supabase
        .from("team_members")
        .update({ role_in_team: role })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Member role updated");
      qc.invalidateQueries({ queryKey: ["team-members"] });
    },
    onError: (error) =>
      toast.error("Couldn't update role", { description: (error as Error).message }),
  });
}

/** Remove a team member (admin or team lead). */
export function useRemoveTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("team_members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Member removed from team");
      qc.invalidateQueries({ queryKey: ["team-members"] });
    },
    onError: (error) =>
      toast.error("Couldn't remove member", { description: (error as Error).message }),
  });
}

import { deactivateUser, reactivateUser, deleteUser, inviteUser } from "./admin-functions";

/** Deactivate a user (admin only) - bans the auth account. */
export function useDeactivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      await deactivateUser({ data: { userId } });
    },
    onSuccess: () => {
      toast.success("User deactivated");
      qc.invalidateQueries({ queryKey: taskKeys.profiles });
    },
    onError: (error) =>
      toast.error("Couldn't deactivate user", { description: (error as Error).message }),
  });
}

/** Reactivate a user (admin only). */
export function useReactivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      await reactivateUser({ data: { userId } });
    },
    onSuccess: () => {
      toast.success("User reactivated");
      qc.invalidateQueries({ queryKey: taskKeys.profiles });
    },
    onError: (error) =>
      toast.error("Couldn't reactivate user", { description: (error as Error).message }),
  });
}

/** Permanently remove a member (admin only) - deletes the auth account and profile. */
export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      await deleteUser({ data: { userId } });
    },
    onSuccess: () => {
      toast.success("Member removed");
      qc.invalidateQueries({ queryKey: taskKeys.profiles });
    },
    onError: (error) =>
      toast.error("Couldn't remove member", { description: (error as Error).message }),
  });
}

/** Invite a new member by email (admin only) - they set a password at /invite. */
export function useInviteUser() {
  return useMutation({
    mutationFn: async (input: { email: string; role: AppRoleDb }) => {
      await inviteUser({ data: input });
    },
    onSuccess: () => {
      toast.success("Invitation sent", {
        description: "The invite email is on its way to their inbox.",
      });
    },
    onError: (error) =>
      toast.error("Couldn't send invitation", { description: (error as Error).message }),
  });
}
