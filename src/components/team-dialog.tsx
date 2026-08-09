import { useEffect, useState } from "react";
import { Users } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { useCreateTeam, useUpdateTeam, type TeamInsert, type TeamUpdate } from "@/lib/tasks-api";

interface TeamData {
  id: string;
  name: string;
  description: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: TeamData | null;
}

export function TeamDialog({ open, onOpenChange, initialData }: Props) {
  const create = useCreateTeam();
  const update = useUpdateTeam();
  const isEditing = !!initialData;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description);
    } else {
      setName("");
      setDescription("");
    }
  }, [open, initialData]);

  const submit = () => {
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    const values = { name: name.trim(), description: description.trim() || null };
    if (isEditing && initialData) {
      update.mutate({ id: initialData.id, values } as { id: string; values: TeamUpdate }, {
        onSuccess: () => onOpenChange(false),
      });
    } else {
      create.mutate(values as TeamInsert, { onSuccess: () => onOpenChange(false) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit team" : "New team"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update team details." : "Create a new team and add members later."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="team-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="team-name"
              value={name}
              placeholder="e.g. Platform Core"
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="team-desc">Description</Label>
            <Textarea
              id="team-desc"
              rows={3}
              value={description}
              placeholder="What does this team do?"
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {error && <p className="text-xs font-medium text-destructive">{error}</p>}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={create.isPending || update.isPending}
            className="glow-primary gap-1.5"
          >
            <Users className="size-4" />
            {create.isPending || update.isPending
              ? "Saving…"
              : isEditing
                ? "Save changes"
                : "Create team"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
