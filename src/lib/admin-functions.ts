import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * All handlers in this file use the service-role client, which bypasses RLS.
 * `requireSupabaseAuth` only proves the caller is a signed-in user — it does
 * not check role — so every handler must independently confirm the caller's
 * profile role is 'admin' before doing anything privileged.
 */
async function requireCallerIsAdmin(userId: string) {
  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  if (profile?.role !== "admin") {
    throw new Error("Forbidden: admin role required");
  }
}

const userIdSchema = z.object({
  userId: z.string().uuid(),
});

export const deactivateUser = createServerFn()
  .middleware([requireSupabaseAuth])
  .validator(userIdSchema)
  .handler(async ({ data, context }) => {
    await requireCallerIsAdmin(context.userId);
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      ban_duration: "87600h",
    });
    if (error) throw error;
    return { success: true };
  });

export const reactivateUser = createServerFn()
  .middleware([requireSupabaseAuth])
  .validator(userIdSchema)
  .handler(async ({ data, context }) => {
    await requireCallerIsAdmin(context.userId);
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      ban_duration: "none",
    });
    if (error) throw error;
    return { success: true };
  });

/** Permanently delete a member: removes the auth account and the profile row. */
export const deleteUser = createServerFn()
  .middleware([requireSupabaseAuth])
  .validator(userIdSchema)
  .handler(async ({ data, context }) => {
    await requireCallerIsAdmin(context.userId);
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (authError) throw authError;
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", data.userId);
    if (profileError) throw profileError;
    return { success: true };
  });

const inviteUserSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "lead", "member"]),
});

/** Send an email invitation. The invitee sets their own password via /invite. */
export const inviteUser = createServerFn()
  .middleware([requireSupabaseAuth])
  .validator(inviteUserSchema)
  .handler(async ({ data, context }) => {
    await requireCallerIsAdmin(context.userId);
    const request = getRequest();
    const origin = request?.url ? new URL(request.url).origin : process.env["APP_URL"];
    const options = origin
      ? { redirectTo: `${origin}/invite`, data: { role: data.role } }
      : { data: { role: data.role } };
    const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email, options);
    if (error) throw error;
    return { success: true };
  });
