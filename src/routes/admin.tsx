import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { RolePill } from "@/components/role-pill";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { initialsOf } from "@/lib/utils";
import { useCurrentUser, useProfiles } from "@/lib/tasks-api";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Controls — CodOps" },
      {
        name: "description",
        content: "Manage member roles, workspace policies and evaluation cycle settings.",
      },
      { property: "og:title", content: "Admin Controls — CodOps" },
      {
        property: "og:description",
        content: "Manage roles, workspace policies and evaluation cycles.",
      },
    ],
  }),
  component: AdminPage,
});

const policies = [
  { label: "Require lead approval on task completion", on: true },
  { label: "Auto-archive completed projects after 30 days", on: false },
  { label: "Publish quarterly evaluation scores to members", on: true },
  { label: "Enforce SSO for all workspace members", on: true },
];

function AdminPage() {
  const currentUserQ = useCurrentUser();
  const profilesQ = useProfiles();
  const profiles = profilesQ.data ?? [];

  if (currentUserQ.isPending) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Admin Controls"
          subtitle="Role assignment and workspace policy governance."
        />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }

  const isAdmin = currentUserQ.data?.role === "admin";
  if (!isAdmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md text-center">
          <ShieldCheck className="mx-auto size-10 text-muted-foreground" />
          <h1 className="mt-4 text-xl font-semibold tracking-tight text-foreground">
            Admin access only
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This page is restricted to workspace admins. Contact an admin to be granted access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Controls"
        subtitle="Role assignment and workspace policy governance."
        action={<RolePill role="admin" className="shrink-0" />}
      />

      {profilesQ.isError && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          Couldn't load members: {(profilesQ.error as Error).message}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="gap-0 rounded-2xl border-border bg-card p-5">
          <h2 className="text-sm font-bold tracking-tight">Member Roles</h2>
          <p className="text-xs text-muted-foreground">profiles.role</p>
          <div className="mt-5 space-y-3">
            {profilesQ.isLoading
              ? [0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-xl border border-border p-3"
                  >
                    <Skeleton className="size-8 rounded-lg" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))
              : profiles.map((p) => (
                  <div
                    key={p.id}
                    className="flex min-w-0 items-center gap-3 rounded-xl border border-border p-3"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/20 text-[10px] font-bold text-primary">
                      {initialsOf(p.full_name ?? p.email)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold">{p.full_name}</p>
                      <p className="truncate text-[10px] text-muted-foreground">{p.email}</p>
                    </div>
                    <RolePill role={p.role} />
                  </div>
                ))}
          </div>
        </Card>

        <Card className="gap-0 rounded-2xl border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-mint" />
            <h2 className="text-sm font-bold tracking-tight">Workspace Policies</h2>
          </div>
          <div className="mt-5 space-y-1">
            {policies.map((p) => (
              <label
                key={p.label}
                className="flex min-w-0 cursor-pointer items-center justify-between gap-4 rounded-xl px-2 py-3 transition-colors hover:bg-muted/50"
              >
                <span className="min-w-0 text-xs">{p.label}</span>
                <Switch defaultChecked={p.on} className="shrink-0" />
              </label>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
