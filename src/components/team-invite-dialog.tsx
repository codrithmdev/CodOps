import { useEffect, useMemo, useState } from "react";
import { UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAddTeamMember, useTeamMembers, useTeams, useProfiles } from "@/lib/tasks-api";

const NO_TEAM = "__none__";
const NO_USER = "__none__";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TeamInviteDialog({ open, onOpenChange }: Props) {
  const addMember = useAddTeamMember();

  const teamsQ = useTeams();
  const membersQ = useTeamMembers();
  const profilesQ = useProfiles();

  const [teamId, setTeamId] = useState(NO_TEAM);
  const [userId, setUserId] = useState(NO_USER);
  const [role, setRole] = useState<"member" | "lead">("member");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setTeamId(teamsQ.data?.[0]?.id ?? NO_TEAM);
    setUserId(NO_USER);
    setRole("member");
  }, [open, teamsQ.data]);

  const membersOfTeam = useMemo(
    () => (membersQ.data ?? []).filter((m) => m.team_id === teamId).map((m) => m.user_id),
    [membersQ.data, teamId],
  );

  const candidates = useMemo(
    () => (profilesQ.data ?? []).filter((p) => !membersOfTeam.includes(p.id)),
    [profilesQ.data, membersOfTeam],
  );

  const submit = () => {
    if (teamId === NO_TEAM) {
      setError("Pick a team first.");
      return;
    }
    if (userId === NO_USER) {
      setError("Pick a person to add.");
      return;
    }
    addMember.mutate(
      { teamId, userId, role },
      {
        onSuccess: () => onOpenChange(false),
        onError: (err) => setError((err as Error).message),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite team member</DialogTitle>
          <DialogDescription>Add someone to a team and set their role within it.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Team</Label>
            <Select value={teamId} onValueChange={setTeamId}>
              <SelectTrigger>
                <SelectValue placeholder="Select team" />
              </SelectTrigger>
              <SelectContent>
                {(teamsQ.data ?? []).map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Person</Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Select person" />
              </SelectTrigger>
              <SelectContent>
                {candidates.length === 0 && (
                  <SelectItem value={NO_USER} disabled>
                    No one left to add
                  </SelectItem>
                )}
                {candidates.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.full_name ?? p.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as "member" | "lead")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-xs font-medium text-destructive">{error}</p>}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <p className="hidden text-[11px] text-muted-foreground sm:block">
            Roles apply workspace-wide to membership.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={submit}
              disabled={addMember.isPending}
              className="glow-primary gap-1.5"
            >
              <UserPlus className="size-4" />
              {addMember.isPending ? "Adding…" : "Add member"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
