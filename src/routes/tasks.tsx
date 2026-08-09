import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { PageHeader } from "@/components/page-header";
import { TasksBoard } from "@/components/tasks/tasks-board";
import { requireAuth } from "@/lib/auth-guard";

const taskSearchSchema = z.object({
  new: z.boolean().optional(),
});

export const Route = createFileRoute("/tasks")({
  beforeLoad: requireAuth,
  validateSearch: taskSearchSchema,
  head: () => ({
    meta: [
      { title: "Task Board — CodOps Workspace" },
      {
        name: "description",
        content:
          "Drag-and-drop Kanban board for backlog, in-progress, review and completed work with live filters by project, team, assignee and priority.",
      },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Task Board — CodOps Workspace" },
      {
        property: "og:description",
        content: "Plan, assign and move work across four workflow columns in real time.",
      },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TasksPage,
});

function TasksPage() {
  const { new: isNew } = Route.useSearch();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Task Board"
        subtitle="Drag cards between columns to update status instantly across your workspace."
      />
      <TasksBoard autoOpenNew={isNew} />
    </div>
  );
}
