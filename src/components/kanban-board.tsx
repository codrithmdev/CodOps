import { useEffect, useMemo, useState } from "react";
import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { TaskCard } from "@/components/tasks/task-card";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { cn } from "@/lib/utils";
import { COLUMNS, PRIORITIES, PRIORITY_LABEL } from "@/lib/task-ui";
import {
  useProfiles,
  useProjects,
  useTasks,
  useUpdateTaskStatus,
  type TaskPriorityDb,
  type TaskRow,
  type TaskStatusDb,
} from "@/lib/tasks-api";

export type BoardGroupBy = "status" | "priority";

interface KanbanBoardProps {
  groupBy?: BoardGroupBy;
  priorityFilter?: TaskPriorityDb | "all";
}

export function KanbanBoard({ groupBy = "status", priorityFilter = "all" }: KanbanBoardProps) {
  const tasksQ = useTasks();
  const projectsQ = useProjects();
  const profilesQ = useProfiles();
  const updateStatus = useUpdateTaskStatus();

  const [mounted, setMounted] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TaskRow | null>(null);
  useEffect(() => setMounted(true), []);

  const projectById = useMemo(
    () => new Map((projectsQ.data ?? []).map((p) => [p.id, p])),
    [projectsQ.data],
  );
  const profileById = useMemo(
    () => new Map((profilesQ.data ?? []).map((p) => [p.id, p])),
    [profilesQ.data],
  );

  const filtered = useMemo(
    () =>
      (tasksQ.data ?? []).filter((t) =>
        priorityFilter === "all" ? true : t.priority === priorityFilter,
      ),
    [tasksQ.data, priorityFilter],
  );

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination || destination.droppableId === source.droppableId) return;
    // Status columns use the status id as droppableId; priority groups are not
    // drop targets for status changes, so only update when grouping by status.
    if (groupBy === "priority") return;
    updateStatus.mutate({ id: draggableId, status: destination.droppableId as TaskStatusDb });
  };

  const loading = tasksQ.isLoading || !mounted;

  if (tasksQ.isError) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
        Couldn't load tasks: {(tasksQ.error as Error).message}
        <Button variant="outline" size="sm" className="ml-3" onClick={() => tasksQ.refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((c) => (
          <div key={c.id} className="space-y-3 rounded-2xl border border-border bg-card/50 p-3">
            <Skeleton className="h-4 w-24" />
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  const groups =
    groupBy === "priority"
      ? PRIORITIES.map((p) => ({ id: p, label: PRIORITY_LABEL[p], done: false }))
      : COLUMNS.map((c) => ({ id: c.id, label: c.label, done: c.id === "completed" }));

  const openEdit = (task: TaskRow) => {
    setEditing(task);
    setDialogOpen(true);
  };

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {groups.map((col) => {
            const items = filtered.filter((t) =>
              groupBy === "priority" ? t.priority === col.id : t.status === col.id,
            );
            return (
              <Droppable droppableId={col.id} key={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "flex min-h-[220px] min-w-0 flex-col rounded-2xl border border-border bg-card/50 p-3 transition-colors",
                      snapshot.isDraggingOver && "border-primary/60 bg-primary/5",
                    )}
                  >
                    <div className="mb-3 flex items-center justify-between gap-2 px-1">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className={cn(
                            "size-2 shrink-0 rounded-full",
                            col.done ? "bg-mint" : "bg-primary",
                          )}
                        />
                        <h3 className="truncate text-xs font-bold tracking-[0.1em] uppercase">
                          {col.label}
                        </h3>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold",
                          col.done ? "mint-badge" : "bg-muted text-muted-foreground",
                        )}
                      >
                        {items.length}
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col gap-2.5">
                      {items.map((task, index) => (
                        <Draggable draggableId={task.id} index={index} key={task.id}>
                          {(dragProvided, dragSnapshot) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                            >
                              <TaskCard
                                task={task}
                                project={
                                  task.project_id ? projectById.get(task.project_id) : undefined
                                }
                                assignee={
                                  task.assigned_to ? profileById.get(task.assigned_to) : undefined
                                }
                                dragging={dragSnapshot.isDragging}
                                onEdit={openEdit}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {items.length === 0 && !snapshot.isDraggingOver && (
                        <p className="rounded-xl border border-dashed border-border/70 px-3 py-6 text-center text-xs text-muted-foreground">
                          Nothing here
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </Droppable>
            );
          })}
        </div>
      </DragDropContext>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editing}
        projects={projectsQ.data ?? []}
        profiles={profilesQ.data ?? []}
      />
    </>
  );
}
