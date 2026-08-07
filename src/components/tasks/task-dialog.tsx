import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { CalendarIcon, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { COLUMNS, PRIORITIES, PRIORITY_LABEL } from "@/lib/task-ui";
import {
  useDeleteTask,
  useSaveTask,
  type ProfileRow,
  type ProjectRow,
  type TaskPriorityDb,
  type TaskRow,
  type TaskStatusDb,
} from "@/lib/tasks-api";

const UNASSIGNED = "__none__";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: TaskRow | null;
  projects: ProjectRow[];
  profiles: ProfileRow[];
}

export function TaskDialog({ open, onOpenChange, task, projects, profiles }: Props) {
  const save = useSaveTask();
  const remove = useDeleteTask();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState<string>(UNASSIGNED);
  const [assignedTo, setAssignedTo] = useState<string>(UNASSIGNED);
  const [priority, setPriority] = useState<TaskPriorityDb>("medium");
  const [status, setStatus] = useState<TaskStatusDb>("backlog");
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setTitle(task?.title ?? "");
    setDescription(task?.description ?? "");
    setProjectId(task?.project_id ?? projects[0]?.id ?? UNASSIGNED);
    setAssignedTo(task?.assigned_to ?? UNASSIGNED);
    setPriority(task?.priority ?? "medium");
    setStatus(task?.status ?? "backlog");
    setDueDate(task?.due_date ? parseISO(task.due_date) : undefined);
  }, [open, task, projects]);

  const submit = () => {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    save.mutate(
      {
        id: task ? task.id : undefined,
        values: {
          title: title.trim(),
          description: description.trim() || null,
          project_id: projectId === UNASSIGNED ? null : projectId,
          assigned_to: assignedTo === UNASSIGNED ? null : assignedTo,
          priority,
          status,
          due_date: dueDate ? format(dueDate, "yyyy-MM-dd") : null,
          completed_at:
            status === "completed" ? (task?.completed_at ?? new Date().toISOString()) : null,
        },
      },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{task ? "Edit task" : "Create task"}</DialogTitle>
          <DialogDescription>
            {task ? "Update the details and save your changes." : "Add a new task to the board."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="task-title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="task-title"
              value={title}
              placeholder="e.g. Shard the billing event stream"
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-desc">Description</Label>
            <Textarea
              id="task-desc"
              rows={3}
              value={description}
              placeholder="What needs to happen?"
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Project</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNASSIGNED}>No project</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Assignee</Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.full_name ?? p.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriorityDb)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRIORITY_LABEL[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as TaskStatusDb)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COLUMNS.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Due date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dueDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 size-4" />
                  {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                  className={cn("pointer-events-auto p-3")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {error && <p className="text-xs font-medium text-destructive">{error}</p>}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {task ? (
            <Button
              variant="ghost"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={remove.isPending}
              onClick={() => remove.mutate(task.id, { onSuccess: () => onOpenChange(false) })}
            >
              <Trash2 className="size-4" /> Delete
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={save.isPending}>
              {save.isPending ? "Saving…" : task ? "Save changes" : "Create task"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
