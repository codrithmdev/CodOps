import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { UserPlus, Users, Pencil, Trash2, MoreHorizontal } from "lucide-react";

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
import { requireAuth } from "@/lib/auth-guard";
import { initialsOf } from "@/lib/utils";
import {
  useProfiles,
  useTeamMembers,
  useTeams,
  useUpdateTeam,
  useDeleteTeam,
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
  const updateTeam = useUpdateTeam();
  const deleteTeam = useDeleteTeam();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTeam, setEditTeam] = useState<{
    id: string;
    name: string;
    description: string;
  } | null>(null);

  const teams = teamsQ.data ?? [];
  const teamMembers = membersQ.data ?? [];
  const profiles = profilesQ.data ?? [];

  const loading = teamsQ.isLoading || membersQ.isLoading || profilesQ.isLoading;

  const handleEditClick = (team: { id: string; name: string; description: string | null }) => {
    setEditTeam({ id: team.id, name: team.name, description: team.description ?? "" });
    setCreateOpen(true);
  };

  const handleDeleteClick = async (id: string) => {
    if (!confirm("Delete this team? This cannot be undone.")) return;
    deleteTeam.mutate(id);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teams"
        subtitle="Rosters, leads and role assignments sourced from team_members."
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
            <Card key={i} className="gap-0 rounded-2xl border-border bg-card p-5">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="mt-2 h-3.5 w-full" />
              <div className="mt-5 space-y-3">
                {[0, 1].map((j) => (
                  <div key={j} className="flex items-center gap-3">
                    <Skeleton className="size-8 rounded-lg" />
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
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {teams.map((team) => {
            const members = teamMembers.filter((m) => m.team_id === team.id);
            return (
              <Card key={team.id} className="gap-0 rounded-2xl border-border bg-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-bold tracking-tight">{team.name}</h2>
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
                        onClick={() => handleDeleteClick(team.id)}
                        className="flex items-center gap-2 text-destructive focus:text-destructive"
                      >
                        <Trash2 className="size-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mt-5 space-y-3">
                  {members.map((m) => {
                    const p = profiles.find((pr) => pr.id === m.user_id);
                    const name = p?.full_name ?? p?.email ?? "Unknown";
                    return (
                      <div key={m.id} className="flex min-w-0 items-center gap-3">
                        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/20 text-[10px] font-bold text-primary">
                          {initialsOf(name)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold">{name}</p>
                          <p className="truncate text-[10px] text-muted-foreground">{p?.email}</p>
                        </div>
                        <RolePill role={m.role_in_team} />
                      </div>
                    );
                  })}
                  {members.length === 0 && (
                    <p className="text-xs text-muted-foreground">No members yet.</p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
