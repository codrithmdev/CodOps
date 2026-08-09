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
import { useCreateTeam, type TeamInsert } from "@/lib/tasks-api";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TeamDialog({ open, onOpenChange }: Props) {
  const create = useCreateTeam();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setName("");
    setDescription("");
  }, [open]);

  const submit = () => {
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    create.mutate(
      {
        name: name.trim(),
        description: description.trim() || null,
      } as TeamInsert,
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New team</DialogTitle>
          <DialogDescription>Create a new team and add members later.</DialogDescription>
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
          <Button onClick={submit} disabled={create.isPending} className="glow-primary gap-1.5">
            <Users className="size-4" />
            {create.isPending ? "Creating…" : "Create team"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
