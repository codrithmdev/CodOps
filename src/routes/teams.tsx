import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { UserPlus, Users, Pencil, Trash2, MoreHorizontal, UserX, UsersRound } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { RolePill } from "@/components/role-pill";
import { TeamInviteDialog } from "@/components/team-invite-dialog";
import { TeamDialog } from "@/components/team-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { requireAuth } from "@/lib/auth-guard";
import { initialsOf } from "@/lib/utils";
import {
  useCurrentUser,
  useProfiles,
  useTeamMembers,
  useTeams,
  useUpdateTeam,
  useDeleteTeam,
  useUpdateTeamMemberRole,
  useRemoveTeamMember,
} from "@/lib/tasks-api";

export const Route = createFileRoute("/teams")({
  beforeLoad: requireAuth,
  head: () => ({
    meta: [
      { title: "Teams — CodOps" },
      {
        name: "description",
        content: "Team rosters, leads and membership roles across the organization.",
      },
      { property: "og:title", content: "Teams — CodOps" },
      { property: "og:description", content: "Team rosters, leads and membership roles." },
    ],
  }),
  component: TeamsPage,
});

function TeamsPage() {
  const teamsQ = useTeams();
  const membersQ = useTeamMembers();
  const profilesQ = useProfiles();
  const currentUserQ = useCurrentUser();
  const updateTeam = useUpdateTeam();
  const deleteTeam = useDeleteTeam();
  const updateMemberRole = useUpdateTeamMemberRole();
  const removeMember = useRemoveTeamMember();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTeam, setEditTeam] = useState<{
    id: string;
    name: string;
    description: string;
  } | null>(null);
  const [removeConfirm, setRemoveConfirm] = useState<{
    memberId: string;
    userName: string;
  } | null>(null);

  const teams = teamsQ.data ?? [];
  const teamMembers = membersQ.data ?? [];
  const profiles = profilesQ.data ?? [];
  const currentUser = currentUserQ.data;

  const loading =
    teamsQ.isLoading || membersQ.isLoading || profilesQ.isLoading || currentUserQ.isLoading;

  const canManageTeam = (teamId: string) => {
    if (!currentUser) return false;
    if (currentUser.role === "admin") return true;
    return teamMembers.some(
      (m) => m.team_id === teamId && m.user_id === currentUser.id && m.role_in_team === "lead",
    );
  };

  const handleEditClick = (team: { id: string; name: string; description: string | null }) => {
    setEditTeam({ id: team.id, name: team.name, description: team.description ?? "" });
    setCreateOpen(true);
  };

  const handleDeleteClick = (id: string, name: string) => {
    if (confirm(`Delete team "${name}"? This cannot be undone.`)) {
      deleteTeam.mutate(id);
    }
  };

  const handleRemoveMember = () => {
    if (removeConfirm) {
      removeMember.mutate(removeConfirm.memberId);
      setRemoveConfirm(null);
    }
  };

  const roleOptions = [
    { value: "member", label: "Member" },
    { value: "lead", label: "Lead" },
  ] as const;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teams"
        subtitle="Rosters, leads and role assignments."
        action={
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setEditTeam(null);
                setCreateOpen(true);
              }}
              className="glow-primary shrink-0 gap-1.5 rounded-xl"
            >
              <Users className="size-4" /> New Team
            </Button>
            <Button
              onClick={() => setInviteOpen(true)}
              className="glow-primary shrink-0 gap-1.5 rounded-xl"
            >
              <UserPlus className="size-4" /> Invite
            </Button>
          </div>
        }
      />
      <TeamInviteDialog open={inviteOpen} onOpenChange={setInviteOpen} />
      <TeamDialog
        open={createOpen}
        onOpenChange={(open) => {
          if (!open) setEditTeam(null);
          setCreateOpen(open);
        }}
        initialData={editTeam}
      />

      {teamsQ.isError && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          Couldn't load teams: {(teamsQ.error as Error).message}
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="rounded-2xl border-border bg-card p-5">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="mt-2 h-3.5 w-full" />
              <div className="mt-5 space-y-3">
                {[0, 1].map((j) => (
                  <div key={j} className="flex items-center gap-3">
                    <Skeleton className="size-8 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      ) : teams.length === 0 ? (
        <Card className="rounded-2xl border-border bg-card">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="grid size-14 place-items-center rounded-2xl bg-muted">
              <UsersRound className="size-7 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-foreground">No teams yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first team to start organizing members.
            </p>
            <Button
              onClick={() => {
                setEditTeam(null);
                setCreateOpen(true);
              }}
              className="mt-4 glow-primary gap-1.5 rounded-xl"
            >
              <Users className="size-4" /> Create Team
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {teams.map((team) => {
            const members = teamMembers.filter((m) => m.team_id === team.id);
            const canManage = canManageTeam(team.id);
            return (
              <Card key={team.id} className="rounded-2xl border-border bg-card">
                <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold tracking-tight">{team.name}</h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">{team.description}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <MoreHorizontal className="size-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-[140px]">
                      <DropdownMenuItem
                        onClick={() => handleEditClick(team)}
                        className="flex items-center gap-2"
                      >
                        <Pencil className="size-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(team.id, team.name)}
                        className="flex items-center gap-2 text-destructive focus:text-destructive"
                      >
                        <Trash2 className="size-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="divide-y divide-border">
                  {members.map((m) => {
                    const p = profiles.find((pr) => pr.id === m.user_id);
                    const name = p?.full_name ?? p?.email ?? "Unknown";
                    return (
                      <div
                        key={m.id}
                        className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/30"
                      >
                        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-[10px] font-bold text-primary">
                          {initialsOf(name)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{name}</p>
                          <p className="truncate text-xs text-muted-foreground">{p?.email}</p>
                        </div>
                        {canManage ? (
                          <div className="flex items-center gap-1.5">
                            <Select
                              value={m.role_in_team}
                              onValueChange={(value) =>
                                updateMemberRole.mutate({
                                  id: m.id,
                                  role: value as "member" | "lead",
                                })
                              }
                              disabled={updateMemberRole.isPending}
                            >
                              <SelectTrigger className="w-[100px] shrink-0">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {roleOptions.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                                >
                                  <UserX className="size-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    setRemoveConfirm({
                                      memberId: m.id,
                                      userName: name,
                                    })
                                  }
                                  className="flex items-center gap-2 text-destructive focus:text-destructive"
                                >
                                  <UserX className="size-4" /> Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        ) : (
                          <RolePill role={m.role_in_team} />
                        )}
                      </div>
                    );
                  })}
                  {members.length === 0 && (
                    <p className="px-5 py-4 text-xs text-muted-foreground">No members yet.</p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!removeConfirm} onOpenChange={() => setRemoveConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove member?</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {removeConfirm?.userName} from this team?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRemoveConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveMember}
              disabled={removeMember.isPending}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
