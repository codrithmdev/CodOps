import { createFileRoute } from "@tanstack/react-router";
import { Filter, SlidersHorizontal } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { KanbanBoard } from "@/components/kanban-board";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/board")({
  head: () => ({
    meta: [
      { title: "Kanban Board — CodOps" },
      {
        name: "description",
        content: "Drag-ready kanban across backlog, in progress, review and completed task states.",
      },
      { property: "og:title", content: "Kanban Board — CodOps" },
      {
        property: "og:description",
        content: "Track every task across backlog, progress, review and completion.",
      },
    ],
  }),
  component: BoardPage,
});

function BoardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Kanban Board"
        subtitle="Every task across your projects, grouped by workflow state."
        action={
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 rounded-xl">
              <Filter className="size-3.5" /> Filter
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 rounded-xl">
              <SlidersHorizontal className="size-3.5" /> Group
            </Button>
          </div>
        }
      />
      <KanbanBoard />
    </div>
  );
}
