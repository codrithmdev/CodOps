// Mirrors the Supabase schema (see src/integrations/supabase/types.ts).

export type AppRole = "admin" | "lead" | "member";
export type TaskPriority = "low" | "medium" | "high" | "critical";
export type TaskStatus = "backlog" | "in_progress" | "under_review" | "completed";
export type ProjectStatus = "planning" | "active" | "on_hold" | "completed";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: AppRole;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role_in_team: AppRole;
  joined_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  team_id: string;
  start_date: string | null;
  due_date: string | null;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  project_id: string;
  assigned_to: string | null;
  created_by: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

/** public.v_individual_performance */
export interface IndividualPerformance {
  user_id: string;
  full_name: string | null;
  email: string;
  total_assigned_tasks: number;
  completed_tasks: number;
  completed_on_time: number;
  overdue_tasks: number;
  on_time_completion_rate_pct: number | null;
}

/** public.v_project_health */
export interface ProjectHealth {
  project_id: string;
  project_name: string;
  team_id: string;
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  project_progress_pct: number | null;
}

export const ROLE_LABEL: Record<AppRole, string> = {
  admin: "ADMIN",
  lead: "TEAM LEAD",
  member: "MEMBER",
};

export const STATUS_COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: "backlog", label: "Backlog" },
  { id: "in_progress", label: "In Progress" },
  { id: "under_review", label: "Under Review" },
  { id: "completed", label: "Completed" },
];
