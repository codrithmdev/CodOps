import { describe, expect, it } from "vitest";

import {
  computeDashboardMetrics,
  computeIndividualPerformance,
  computeProjectHealth,
  computeThroughput,
  type TaskLike,
} from "./aggregations";

const TODAY = "2026-08-07";

describe("computeProjectHealth", () => {
  const projects = [{ id: "p1", name: "Atlas", team_id: "t1" }];

  it("tallies total, completed and overdue per project", () => {
    const tasks: TaskLike[] = [
      {
        id: "a",
        project_id: "p1",
        assigned_to: null,
        status: "completed",
        due_date: "2026-07-01",
        completed_at: "2026-06-30T00:00:00Z",
        created_at: "2026-01-01T00:00:00Z",
      },
      {
        id: "b",
        project_id: "p1",
        assigned_to: null,
        status: "in_progress",
        due_date: "2026-07-10",
        completed_at: null,
        created_at: "2026-01-02T00:00:00Z",
      },
      {
        id: "c",
        project_id: "p1",
        assigned_to: null,
        status: "backlog",
        due_date: "2026-08-30",
        completed_at: null,
        created_at: "2026-01-03T00:00:00Z",
      },
    ];
    const health = computeProjectHealth(projects, tasks, TODAY)[0]!;
    expect(health.total_tasks).toBe(3);
    expect(health.completed_tasks).toBe(1);
    expect(health.overdue_tasks).toBe(1);
  });

  it("reports 0% progress for projects with no tasks", () => {
    const health = computeProjectHealth(projects, [], TODAY)[0]!;
    expect(health.project_progress_pct).toBe(0);
  });
});

describe("computeIndividualPerformance", () => {
  const profiles = [{ id: "u1", email: "a@x.io", full_name: "Amara" }];

  it("computes on-time completion rate among completed tasks", () => {
    const tasks: TaskLike[] = [
      {
        id: "a",
        project_id: "p1",
        assigned_to: "u1",
        status: "completed",
        due_date: "2026-08-01",
        completed_at: "2026-07-30T00:00:00Z",
        created_at: "2026-01-01T00:00:00Z",
      },
      {
        id: "b",
        project_id: "p1",
        assigned_to: "u1",
        status: "completed",
        due_date: "2026-08-01",
        completed_at: "2026-08-05T00:00:00Z",
        created_at: "2026-01-02T00:00:00Z",
      },
    ];
    const row = computeIndividualPerformance(profiles, tasks, TODAY)[0]!;
    expect(row.total_assigned_tasks).toBe(2);
    expect(row.completed_tasks).toBe(2);
    expect(row.on_time_completion_rate_pct).toBe(50);
  });

  it("excludes people with no assigned work", () => {
    const rows = computeIndividualPerformance(profiles, [], TODAY);
    expect(rows).toHaveLength(0);
  });
});

describe("computeDashboardMetrics", () => {
  const tasks: TaskLike[] = [
    {
      id: "1",
      project_id: "p1",
      assigned_to: null,
      status: "completed",
      due_date: "2026-08-01",
      completed_at: "2026-07-30T00:00:00Z",
      created_at: "2026-01-01T00:00:00Z",
    },
    {
      id: "2",
      project_id: "p1",
      assigned_to: null,
      status: "completed",
      due_date: "2026-08-10",
      completed_at: "2026-09-01T00:00:00Z",
      created_at: "2026-01-02T00:00:00Z",
    },
    {
      id: "3",
      project_id: "p2",
      assigned_to: null,
      status: "in_progress",
      due_date: "2026-08-01",
      completed_at: null,
      created_at: "2026-01-03T00:00:00Z",
    },
    {
      id: "4",
      project_id: null,
      assigned_to: null,
      status: "backlog",
      due_date: "2026-08-20",
      completed_at: null,
      created_at: "2026-01-04T00:00:00Z",
    },
  ];

  it("counts tasks, on-time completion, overdue and active teams", () => {
    const m = computeDashboardMetrics(
      tasks,
      [
        { id: "p1", team_id: "t1" },
        { id: "p2", team_id: "t2" },
      ],
      [{ id: "t1" }, { id: "t2" }, { id: "t3" }],
      TODAY,
    );
    expect(m.totalTasks).toBe(4);
    expect(m.completedTasks).toBe(2);
    expect(m.overdueTasks).toBe(1);
    expect(m.activeTeams).toBe(2);
    expect(m.totalTeams).toBe(3);
  });
});

describe("computeThroughput", () => {
  it("returns the last N weeks as points with created/completed counts", () => {
    const now = new Date(Date.UTC(2026, 7, 7)); // 2026-08-07
    const rows = [
      { created_at: "2026-08-03T00:00:00Z", completed_at: "2026-08-03T12:00:00Z" },
      { created_at: "2026-08-04T00:00:00Z", completed_at: null },
    ];
    const points = computeThroughput(rows, now, 8);
    expect(points).toHaveLength(8);
    const mostRecent = points[7]!;
    expect(mostRecent.created + mostRecent.completed).toBe(3);
    expect(mostRecent.week).toMatch(/^W\d+$/);
  });
});
