import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("is_admin", { _uid: userId });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}

export const blockUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        userId: z.string().uuid(),
        reason: z.string().min(1).max(500),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Load profile
    const { data: profile, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("id, phone")
      .eq("id", data.userId)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!profile) throw new Error("Profile not found");

    // Load email from auth
    const { data: authUser, error: aErr } = await supabaseAdmin.auth.admin.getUserById(
      data.userId,
    );
    if (aErr) throw new Error(aErr.message);
    const email = authUser?.user?.email?.toLowerCase() ?? null;

    // Mark profile as blocked (soft block)
    await supabaseAdmin
      .from("profiles")
      .update({
        is_blocked: true,
        blocked_at: new Date().toISOString(),
        blocked_reason: data.reason,
      } as any)
      .eq("id", data.userId);

    // Block email
    if (email) {
      await supabaseAdmin
        .from("blocked_identifiers")
        .upsert(
          { type: "email", value: email, reason: data.reason, blocked_by: context.userId },
          { onConflict: "type,value" },
        );
    }
    // Block phone
    const phone = (profile as any).phone as string | null;
    if (phone) {
      await supabaseAdmin
        .from("blocked_identifiers")
        .upsert(
          { type: "phone", value: phone, reason: data.reason, blocked_by: context.userId },
          { onConflict: "type,value" },
        );
    }

    // Remove all their listings
    await supabaseAdmin
      .from("listings")
      .update({ status: "removed" })
      .eq("user_id", data.userId);

    // Revoke sessions (does not delete the account)
    try {
      await supabaseAdmin.auth.admin.signOut(data.userId);
    } catch {
      // ignore
    }

    return { ok: true };
  });

export const unblockUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("phone")
      .eq("id", data.userId)
      .maybeSingle();
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(data.userId);
    const email = authUser?.user?.email?.toLowerCase() ?? null;
    const phone = (profile as any)?.phone as string | null;

    await supabaseAdmin
      .from("profiles")
      .update({ is_blocked: false, blocked_at: null, blocked_reason: null } as any)
      .eq("id", data.userId);

    if (email) {
      await supabaseAdmin
        .from("blocked_identifiers")
        .delete()
        .eq("type", "email")
        .eq("value", email);
    }
    if (phone) {
      await supabaseAdmin
        .from("blocked_identifiers")
        .delete()
        .eq("type", "phone")
        .eq("value", phone);
    }
    return { ok: true };
  });
