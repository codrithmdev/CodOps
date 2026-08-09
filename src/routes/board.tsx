import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Filter, SlidersHorizontal } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { KanbanBoard, type BoardGroupBy } from "@/components/kanban-board";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { requireAuth } from "@/lib/auth-guard";
import { PRIORITIES, PRIORITY_LABEL } from "@/lib/task-ui";
import type { TaskPriorityDb } from "@/lib/tasks-api";

export const Route = createFileRoute("/board")({
  beforeLoad: requireAuth,
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

const ALL = "all";

function BoardPage() {
  const [groupBy, setGroupBy] = useState<BoardGroupBy>("status");
  const [priority, setPriority] = useState<TaskPriorityDb | typeof ALL>(ALL);

  const toggleGroup = () => setGroupBy((g) => (g === "status" ? "priority" : "status"));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kanban Board"
        subtitle="Every task across your projects, grouped by workflow state."
        action={
          <div className="flex shrink-0 gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 rounded-xl">
                  <Filter className="size-3.5" /> Filter
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56" align="end">
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Priority</Label>
                    <Select
                      value={priority}
                      onValueChange={(v) => setPriority(v as TaskPriorityDb | typeof ALL)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All priorities" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL}>All priorities</SelectItem>
                        {PRIORITIES.map((p) => (
                          <SelectItem key={p} value={p}>
                            {PRIORITY_LABEL[p]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {priority !== ALL && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => setPriority(ALL)}
                    >
                      Clear filter
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-xl"
              onClick={toggleGroup}
            >
              <SlidersHorizontal className="size-3.5" />{" "}
              {groupBy === "status" ? "Group: Status" : "Group: Priority"}
            </Button>
          </div>
        }
      />
      <KanbanBoard groupBy={groupBy} priorityFilter={priority} />
    </div>
  );
}
