import type {
  IndividualPerformance,
  Profile,
  Project,
  ProjectHealth,
  Task,
  Team,
  TeamMember,
} from "./types";

export { initialsOf } from "./utils";

const iso = (d: string) => new Date(d).toISOString();

export const currentUser: Profile = {
  id: "u1",
  email: "amara.dey@codops.io",
  full_name: "Amara Dey",
  role: "admin",
  created_at: iso("2025-11-02"),
  updated_at: iso("2026-07-30"),
};

export const profiles: Profile[] = [
  currentUser,
  {
    id: "u2",
    email: "leo.marsh@codops.io",
    full_name: "Leo Marsh",
    role: "lead",
    created_at: iso("2025-11-14"),
    updated_at: iso("2026-07-22"),
  },
  {
    id: "u3",
    email: "sana.iqbal@codops.io",
    full_name: "Sana Iqbal",
    role: "member",
    created_at: iso("2026-01-08"),
    updated_at: iso("2026-07-28"),
  },
  {
    id: "u4",
    email: "tom.okafor@codops.io",
    full_name: "Tom Okafor",
    role: "member",
    created_at: iso("2026-02-19"),
    updated_at: iso("2026-08-01"),
  },
  {
    id: "u5",
    email: "rin.tanaka@codops.io",
    full_name: "Rin Tanaka",
    role: "lead",
    created_at: iso("2026-03-03"),
    updated_at: iso("2026-08-04"),
  },
];

export const teams: Team[] = [
  {
    id: "t1",
    name: "Platform Core",
    description: "Runtime, APIs and infrastructure",
    created_at: iso("2025-11-02"),
    updated_at: iso("2026-06-11"),
  },
  {
    id: "t2",
    name: "Growth Studio",
    description: "Acquisition surfaces and lifecycle",
    created_at: iso("2025-12-10"),
    updated_at: iso("2026-07-02"),
  },
  {
    id: "t3",
    name: "People Ops",
    description: "Hiring, evaluation and enablement",
    created_at: iso("2026-01-20"),
    updated_at: iso("2026-07-18"),
  },
];

export const teamMembers: TeamMember[] = [
  { id: "tm1", team_id: "t1", user_id: "u2", role_in_team: "lead", joined_at: iso("2025-11-14") },
  { id: "tm2", team_id: "t1", user_id: "u3", role_in_team: "member", joined_at: iso("2026-01-08") },
  { id: "tm3", team_id: "t2", user_id: "u5", role_in_team: "lead", joined_at: iso("2026-03-03") },
  { id: "tm4", team_id: "t2", user_id: "u4", role_in_team: "member", joined_at: iso("2026-02-19") },
  { id: "tm5", team_id: "t3", user_id: "u1", role_in_team: "admin", joined_at: iso("2026-01-20") },
];

export const projects: Project[] = [
  {
    id: "p1",
    name: "Realtime Sync Engine",
    description: "Conflict-free task sync across clients",
    team_id: "t1",
    start_date: iso("2026-04-01"),
    due_date: iso("2026-09-15"),
    status: "active",
    created_at: iso("2026-04-01"),
    updated_at: iso("2026-08-05"),
  },
  {
    id: "p2",
    name: "Onboarding Revamp",
    description: "Activation funnel rebuild",
    team_id: "t2",
    start_date: iso("2026-05-12"),
    due_date: iso("2026-08-29"),
    status: "active",
    created_at: iso("2026-05-12"),
    updated_at: iso("2026-08-06"),
  },
  {
    id: "p3",
    name: "Quarterly Evaluations",
    description: "HR scoring cycle Q3",
    team_id: "t3",
    start_date: iso("2026-06-01"),
    due_date: iso("2026-08-20"),
    status: "planning",
    created_at: iso("2026-06-01"),
    updated_at: iso("2026-07-30"),
  },
  {
    id: "p4",
    name: "Billing Migration",
    description: "Move to usage-based metering",
    team_id: "t1",
    start_date: iso("2026-02-10"),
    due_date: iso("2026-07-01"),
    status: "on_hold",
    created_at: iso("2026-02-10"),
    updated_at: iso("2026-07-01"),
  },
];

export const tasks: Task[] = [
  ["k1", "Design CRDT merge strategy", "p1", "u2", "critical", "in_progress", "2026-08-12"],
  ["k2", "Presence channel rate limits", "p1", "u3", "high", "backlog", "2026-08-22"],
  ["k3", "Offline queue replay tests", "p1", "u3", "medium", "under_review", "2026-08-10"],
  ["k4", "Ship websocket fallback", "p1", "u2", "high", "completed", "2026-07-28"],
  ["k5", "New activation checklist", "p2", "u4", "high", "in_progress", "2026-08-15"],
  ["k6", "Lifecycle email templates", "p2", "u5", "medium", "backlog", "2026-08-30"],
  ["k7", "Signup funnel instrumentation", "p2", "u4", "low", "completed", "2026-07-20"],
  ["k8", "Draft evaluation rubric", "p3", "u1", "critical", "under_review", "2026-08-08"],
  ["k9", "Calibration session invites", "p3", "u1", "low", "backlog", "2026-08-25"],
  ["k10", "Legacy invoice reconciliation", "p4", "u2", "medium", "backlog", "2026-07-05"],
  ["k11", "Metering event schema", "p4", "u3", "high", "completed", "2026-06-30"],
  ["k12", "Kanban drag persistence", "p1", "u4", "medium", "in_progress", "2026-08-18"],
].map(([id, title, project_id, assigned_to, priority, status, due_date]) => ({
  id,
  title,
  description: null,
  project_id,
  assigned_to,
  created_by: "u1",
  priority,
  status,
  due_date: iso(due_date as string),
  completed_at: status === "completed" ? iso(due_date as string) : null,
  created_at: iso("2026-06-01"),
  updated_at: iso("2026-08-06"),
})) as Task[];

export const individualPerformance: IndividualPerformance[] = [
  {
    user_id: "u2",
    full_name: "Leo Marsh",
    email: "leo.marsh@codops.io",
    total_assigned_tasks: 34,
    completed_tasks: 28,
    completed_on_time: 26,
    overdue_tasks: 1,
    on_time_completion_rate_pct: 92.86,
  },
  {
    user_id: "u3",
    full_name: "Sana Iqbal",
    email: "sana.iqbal@codops.io",
    total_assigned_tasks: 41,
    completed_tasks: 33,
    completed_on_time: 29,
    overdue_tasks: 2,
    on_time_completion_rate_pct: 87.88,
  },
  {
    user_id: "u4",
    full_name: "Tom Okafor",
    email: "tom.okafor@codops.io",
    total_assigned_tasks: 27,
    completed_tasks: 19,
    completed_on_time: 14,
    overdue_tasks: 4,
    on_time_completion_rate_pct: 73.68,
  },
  {
    user_id: "u5",
    full_name: "Rin Tanaka",
    email: "rin.tanaka@codops.io",
    total_assigned_tasks: 30,
    completed_tasks: 25,
    completed_on_time: 24,
    overdue_tasks: 0,
    on_time_completion_rate_pct: 96.0,
  },
];

export const projectHealth: ProjectHealth[] = [
  {
    project_id: "p1",
    project_name: "Realtime Sync Engine",
    team_id: "t1",
    total_tasks: 48,
    completed_tasks: 31,
    overdue_tasks: 3,
    project_progress_pct: 64.58,
  },
  {
    project_id: "p2",
    project_name: "Onboarding Revamp",
    team_id: "t2",
    total_tasks: 36,
    completed_tasks: 27,
    overdue_tasks: 1,
    project_progress_pct: 75.0,
  },
  {
    project_id: "p3",
    project_name: "Quarterly Evaluations",
    team_id: "t3",
    total_tasks: 18,
    completed_tasks: 6,
    overdue_tasks: 2,
    project_progress_pct: 33.33,
  },
  {
    project_id: "p4",
    project_name: "Billing Migration",
    team_id: "t1",
    total_tasks: 22,
    completed_tasks: 20,
    overdue_tasks: 1,
    project_progress_pct: 90.91,
  },
];

export const throughputSeries = [
  { week: "W23", completed: 34, created: 41 },
  { week: "W24", completed: 41, created: 38 },
  { week: "W25", completed: 37, created: 44 },
  { week: "W26", completed: 52, created: 47 },
  { week: "W27", completed: 48, created: 40 },
  { week: "W28", completed: 61, created: 55 },
  { week: "W29", completed: 57, created: 49 },
  { week: "W30", completed: 68, created: 58 },
];

export const nameOf = (id: string | null) =>
  profiles.find((p) => p.id === id)?.full_name ?? "Unassigned";
