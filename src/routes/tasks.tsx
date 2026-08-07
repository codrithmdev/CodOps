import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/page-header";
import { TasksBoard } from "@/components/tasks/tasks-board";

export const Route = createFileRoute("/tasks")({
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
  return (
    <div className="space-y-6">
      <PageHeader
        title="Task Board"
        subtitle="Drag cards between columns to update status instantly across your workspace."
      />
      <TasksBoard />
    </div>
  );
}
