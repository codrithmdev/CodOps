import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Mail,
  ShieldCheck,
  UserX,
  UserCheck,
  Trash2,
  MoreVertical,
  Users,
  Settings,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { RolePill } from "@/components/role-pill";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth-guard";
import { initialsOf } from "@/lib/utils";
import {
  useCurrentUser,
  useProfiles,
  useUpdateUserRole,
  useDeactivateUser,
  useReactivateUser,
  useDeleteUser,
  useInviteUser,
  useWorkspacePolicies,
  useUpdateWorkspacePolicy,
} from "@/lib/tasks-api";
import type { AppRole } from "@/lib/types";

export const Route = createFileRoute("/admin")({
  beforeLoad: requireAdmin,
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

function AdminPage() {
  const currentUserQ = useCurrentUser();
  const profilesQ = useProfiles();
  const updateRole = useUpdateUserRole();
  const deactivateUser = useDeactivateUser();
  const reactivateUser = useReactivateUser();
  const deleteUser = useDeleteUser();
  const inviteUser = useInviteUser();
  const policiesQ = useWorkspacePolicies();
  const updatePolicy = useUpdateWorkspacePolicy();
  const profiles = profilesQ.data ?? [];
  const policies = policiesQ.data ?? [];

  const [confirmAction, setConfirmAction] = useState<{
    type: "deactivate" | "reactivate" | "remove";
    userId: string;
    userName: string;
  } | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AppRole>("member");

  const submitInvite = (e: FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    inviteUser.mutate(
      { email: inviteEmail.trim(), role: inviteRole },
      {
        onSuccess: () => {
          setInviteOpen(false);
          setInviteEmail("");
          setInviteRole("member");
        },
      },
    );
  };

  if (currentUserQ.isPending) {
    return (
      <div className="space-y-6">
        <PageHeader title="Admin Controls" subtitle="Manage your workspace." />
        <div className="grid gap-4 xl:grid-cols-2">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  const isAdmin = currentUserQ.data?.role === "admin";
  if (!isAdmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-sm text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-muted">
            <ShieldCheck className="size-7 text-muted-foreground" />
          </div>
          <h1 className="mt-5 text-lg font-semibold tracking-tight text-foreground">
            Admin access only
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            This page is restricted to workspace admins. Contact an admin to be granted access.
          </p>
        </div>
      </div>
    );
  }

  const roleOptions: { value: AppRole; label: string }[] = [
    { value: "admin", label: "Admin" },
    { value: "lead", label: "Team Lead" },
    { value: "member", label: "Member" },
  ];

  const pendingAction =
    deactivateUser.isPending || reactivateUser.isPending || deleteUser.isPending;
  const currentUserId = currentUserQ.data?.id;

  const handleConfirm = () => {
    if (!confirmAction) return;
    if (confirmAction.type === "deactivate") {
      deactivateUser.mutate(confirmAction.userId);
    } else if (confirmAction.type === "reactivate") {
      reactivateUser.mutate(confirmAction.userId);
    } else {
      deleteUser.mutate(confirmAction.userId);
    }
    setConfirmAction(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Controls"
        subtitle="Manage members, roles, and workspace settings."
        action={<RolePill role="admin" className="shrink-0" />}
      />

      {profilesQ.isError && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          Couldn't load members: {(profilesQ.error as Error).message}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="rounded-2xl border-border bg-card">
          <div className="flex items-center gap-3 border-b border-border px-5 py-4">
            <div className="grid size-9 place-items-center rounded-xl bg-primary/10">
              <Users className="size-4 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-tight">Members</h2>
              <p className="text-xs text-muted-foreground">{profiles.length} total</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto shrink-0 gap-1.5 rounded-lg"
              onClick={() => setInviteOpen(true)}
            >
              <Mail className="size-3.5" /> Invite member
            </Button>
          </div>

          <div className="divide-y divide-border">
            {profilesQ.isLoading
              ? [0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                    <Skeleton className="size-9 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-28" />
                      <Skeleton className="h-3 w-36" />
                    </div>
                    <Skeleton className="h-8 w-24 rounded-lg" />
                  </div>
                ))
              : profiles.map((p) => {
                  const isCurrentUser = p.id === currentUserId;
                  return (
                    <div
                      key={p.id}
                      className={`flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-muted/30 ${
                        isCurrentUser ? "bg-primary/5" : ""
                      }`}
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-xs font-bold text-primary">
                        {initialsOf(p.full_name ?? p.email)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-medium">{p.full_name ?? "Unnamed"}</p>
                          {isCurrentUser && (
                            <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                              You
                            </span>
                          )}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{p.email}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Select
                          value={p.role}
                          onValueChange={(value) =>
                            updateRole.mutate({ userId: p.id, role: value as AppRole })
                          }
                          disabled={updateRole.isPending || pendingAction}
                        >
                          <SelectTrigger className="w-[110px] shrink-0">
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
                        {!isCurrentUser && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                                <MoreVertical className="size-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem
                                onClick={() =>
                                  setConfirmAction({
                                    type: "deactivate",
                                    userId: p.id,
                                    userName: p.full_name ?? p.email,
                                  })
                                }
                                disabled={pendingAction}
                                className="flex items-center gap-2 text-destructive focus:text-destructive"
                              >
                                <UserX className="size-4" /> Deactivate
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  setConfirmAction({
                                    type: "reactivate",
                                    userId: p.id,
                                    userName: p.full_name ?? p.email,
                                  })
                                }
                                disabled={pendingAction}
                                className="flex items-center gap-2 text-emerald-600 focus:text-emerald-600"
                              >
                                <UserCheck className="size-4" /> Reactivate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  setConfirmAction({
                                    type: "remove",
                                    userId: p.id,
                                    userName: p.full_name ?? p.email,
                                  })
                                }
                                disabled={pendingAction}
                                className="flex items-center gap-2 text-destructive focus:text-destructive"
                              >
                                <Trash2 className="size-4" /> Remove from workspace
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  );
                })}
          </div>
        </Card>

        <Card className="rounded-2xl border-border bg-card">
          <div className="flex items-center gap-3 border-b border-border px-5 py-4">
            <div className="grid size-9 place-items-center rounded-xl bg-emerald-500/10">
              <Settings className="size-4 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-tight">Policies</h2>
              <p className="text-xs text-muted-foreground">Workspace settings</p>
            </div>
          </div>

          <div className="divide-y divide-border">
            {policiesQ.isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between gap-4 px-5 py-4">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-5 w-9 rounded-full" />
                  </div>
                ))
              : policies.map((p) => (
                  <label
                    key={p.key}
                    className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/30"
                  >
                    <span className="text-sm text-foreground">{p.label}</span>
                    <Switch
                      checked={p.enabled}
                      disabled={updatePolicy.isPending}
                      onCheckedChange={(enabled) => updatePolicy.mutate({ key: p.key, enabled })}
                      className="shrink-0"
                    />
                  </label>
                ))}
          </div>
        </Card>
      </div>

      <Dialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirmAction?.type === "deactivate"
                ? "Deactivate user?"
                : confirmAction?.type === "reactivate"
                  ? "Reactivate user?"
                  : "Remove member?"}
            </DialogTitle>
            <DialogDescription>
              {confirmAction?.type === "deactivate"
                ? `Are you sure you want to deactivate ${confirmAction?.userName}? They will lose access to the workspace.`
                : confirmAction?.type === "reactivate"
                  ? `Restore access for ${confirmAction?.userName}? They will be able to sign in again.`
                  : `Permanently delete ${confirmAction?.userName}? Their account, profile and memberships will be removed. This cannot be undone.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmAction(null)}>
              Cancel
            </Button>
            <Button
              variant={confirmAction?.type === "remove" ? "destructive" : "default"}
              onClick={handleConfirm}
              disabled={pendingAction}
            >
              {confirmAction?.type === "deactivate"
                ? "Deactivate"
                : confirmAction?.type === "reactivate"
                  ? "Reactivate"
                  : "Remove member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite a member</DialogTitle>
            <DialogDescription>
              Send an email invitation. They'll set their own password and join the workspace.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitInvite} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="invite-email">Email address</Label>
              <Input
                id="invite-email"
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="you@codops.io"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as AppRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="lead">Team Lead</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={inviteUser.isPending}
                className="glow-primary gap-1.5"
              >
                <Mail className="size-4" />
                {inviteUser.isPending ? "Sending…" : "Send invitation"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
