import { useEffect, useMemo, useState } from "react";
import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";
import { Plus, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskCard } from "@/components/tasks/task-card";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { cn } from "@/lib/utils";
import { COLUMNS, PRIORITIES, PRIORITY_LABEL } from "@/lib/task-ui";
import {
  useProfiles,
  useProjects,
  useTasks,
  useTeams,
  useUpdateTaskStatus,
  type TaskRow,
  type TaskStatusDb,
} from "@/lib/tasks-api";

const ALL = "all";

export function TasksBoard() {
  const tasksQ = useTasks();
  const projectsQ = useProjects();
  const profilesQ = useProfiles();
  const teamsQ = useTeams();
  const updateStatus = useUpdateTaskStatus();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [search, setSearch] = useState("");
  const [project, setProject] = useState(ALL);
  const [team, setTeam] = useState(ALL);
  const [assignee, setAssignee] = useState(ALL);
  const [priority, setPriority] = useState(ALL);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TaskRow | null>(null);

  const projects = projectsQ.data ?? [];
  const profiles = profilesQ.data ?? [];
  const teams = teamsQ.data ?? [];

  const projectById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);
  const profileById = useMemo(() => new Map(profiles.map((p) => [p.id, p])), [profiles]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (tasksQ.data ?? []).filter((t) => {
      if (q && !`${t.title} ${t.description ?? ""}`.toLowerCase().includes(q)) return false;
      if (project !== ALL && t.project_id !== project) return false;
      if (assignee !== ALL && t.assigned_to !== assignee) return false;
      if (priority !== ALL && t.priority !== priority) return false;
      if (team !== ALL) {
        const p = t.project_id ? projectById.get(t.project_id) : undefined;
        if (!p || p.team_id !== team) return false;
      }
      return true;
    });
  }, [tasksQ.data, search, project, assignee, priority, team, projectById]);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (task: TaskRow) => {
    setEditing(task);
    setDialogOpen(true);
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination || destination.droppableId === source.droppableId) return;
    updateStatus.mutate({ id: draggableId, status: destination.droppableId as TaskStatusDb });
  };

  const filtersActive =
    search !== "" || project !== ALL || team !== ALL || assignee !== ALL || priority !== ALL;

  const resetFilters = () => {
    setSearch("");
    setProject(ALL);
    setTeam(ALL);
    setAssignee(ALL);
    setPriority(ALL);
  };

  const loading = tasksQ.isLoading || !mounted;

  return (
    <div className="space-y-5">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card/60 p-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks by title or description…"
            className="pl-9"
          />
        </div>

        <Select value={project} onValueChange={setProject}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All projects</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={team} onValueChange={setTeam}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Team" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All teams</SelectItem>
            {teams.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={assignee} onValueChange={setAssignee}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All assignees</SelectItem>
            {profiles.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.full_name ?? p.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger className="w-[135px]">
            <SelectValue placeholder="Priority" />
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

        {filtersActive && (
          <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1">
            <X className="size-3.5" /> Clear
          </Button>
        )}

        <Button onClick={openCreate} className="gap-1.5 glow-primary">
          <Plus className="size-4" /> Create Task
        </Button>
      </div>

      {tasksQ.isError && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          Couldn't load tasks: {(tasksQ.error as Error).message}
          <Button variant="outline" size="sm" className="ml-3" onClick={() => tasksQ.refetch()}>
            Retry
          </Button>
        </div>
      )}

      {loading ? (
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
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {COLUMNS.map((col) => {
              const items = filtered.filter((t) => t.status === col.id);
              const done = col.id === "completed";
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
                              done ? "bg-mint" : "bg-primary",
                            )}
                          />
                          <h3 className="truncate text-xs font-bold tracking-[0.1em] uppercase">
                            {col.label}
                          </h3>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold",
                            done ? "mint-badge" : "bg-muted text-muted-foreground",
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
      )}

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editing}
        projects={projects}
        profiles={profiles}
      />
    </div>
  );
}
