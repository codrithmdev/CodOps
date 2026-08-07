import { createFileRoute } from "@tanstack/react-router";
import { UserPlus } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { RolePill } from "@/components/role-pill";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { initialsOf, profiles, teamMembers, teams } from "@/lib/mock-data";

export const Route = createFileRoute("/teams")({
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
  return (
    <div className="space-y-6">
      <PageHeader
        title="Teams"
        subtitle="Rosters, leads and role assignments sourced from team_members."
        action={
          <Button className="glow-primary shrink-0 gap-1.5 rounded-xl">
            <UserPlus className="size-4" /> Invite
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {teams.map((team) => {
          const members = teamMembers.filter((m) => m.team_id === team.id);
          return (
            <Card key={team.id} className="gap-0 rounded-2xl border-border bg-card p-5">
              <h2 className="truncate text-base font-bold tracking-tight">{team.name}</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">{team.description}</p>

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
    </div>
  );
}
