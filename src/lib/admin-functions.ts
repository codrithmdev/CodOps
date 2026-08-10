import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const userIdSchema = z.object({
  userId: z.string().uuid(),
});

export const deactivateUser = createServerFn()
  .validator(userIdSchema)
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      ban_duration: "87600h",
    });
    if (error) throw error;
    return { success: true };
  });

export const reactivateUser = createServerFn()
  .validator(userIdSchema)
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      ban_duration: "none",
    });
    if (error) throw error;
    return { success: true };
  });
