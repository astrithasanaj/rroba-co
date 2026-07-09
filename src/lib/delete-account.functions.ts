import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Permanently delete the authenticated user's account and all associated data.
 * GDPR-compliant hard delete: purges DB rows, storage objects, auth user, and
 * writes an audit row to `gdpr_deletion_log`.
 */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Audit row (pending)
    const { data: logRow } = await supabaseAdmin
      .from("gdpr_deletion_log")
      .insert({ user_id: userId, requested_at: new Date().toISOString(), status: "pending" })
      .select("id")
      .single();

    // Fetch user email for farewell mail
    const { data: userInfo } = await supabaseAdmin.auth.admin.getUserById(userId);
    const email = userInfo?.user?.email ?? null;

    try {
      // 1. Storage: listing photos + avatar (bucket `photos`)
      const { data: myListings } = await supabaseAdmin
        .from("listings")
        .select("image_paths")
        .eq("user_id", userId);

      const paths: string[] = [];
      for (const l of myListings ?? []) {
        for (const p of (l as { image_paths: string[] | null }).image_paths ?? []) {
          if (p) paths.push(p);
        }
      }

      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("avatar_url")
        .eq("id", userId)
        .maybeSingle();

      if (profile?.avatar_url) {
        const m = profile.avatar_url.match(/\/storage\/v1\/object\/public\/photos\/(.+)$/);
        if (m) paths.push(m[1]);
        else if (!profile.avatar_url.startsWith("http")) paths.push(profile.avatar_url);
      }

      if (paths.length) {
        // Chunk removals to be safe
        for (let i = 0; i < paths.length; i += 100) {
          await supabaseAdmin.storage.from("photos").remove(paths.slice(i, i + 100));
        }
      }

      // 2. Database rows (respect FK order)
      await supabaseAdmin.from("notifications").delete().eq("user_id", userId);
      await supabaseAdmin.from("listing_likes").delete().eq("user_id", userId);
      await supabaseAdmin.from("listing_saves").delete().eq("user_id", userId);
      await supabaseAdmin.from("reports").delete().eq("reporter_id", userId);
      await supabaseAdmin
        .from("followers")
        .delete()
        .or(`follower_id.eq.${userId},following_id.eq.${userId}`);
      await supabaseAdmin
        .from("offers")
        .delete()
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);

      const { data: convs } = await supabaseAdmin
        .from("conversations")
        .select("id")
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);
      const convIds = (convs ?? []).map((c) => (c as { id: string }).id);
      if (convIds.length) {
        await supabaseAdmin.from("messages").delete().in("conversation_id", convIds);
        await supabaseAdmin.from("conversations").delete().in("id", convIds);
      }

      await supabaseAdmin.from("listings").delete().eq("user_id", userId);
      await supabaseAdmin
        .from("ratings")
        .delete()
        .or(`seller_id.eq.${userId},rater_id.eq.${userId}`);
      await supabaseAdmin.from("admin_users").delete().eq("user_id", userId);
      await supabaseAdmin.from("profiles").delete().eq("id", userId);

      // 3. Auth user
      const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (authErr) throw authErr;

      // 4. Mark log completed
      if (logRow?.id) {
        await supabaseAdmin
          .from("gdpr_deletion_log")
          .update({ status: "completed", completed_at: new Date().toISOString() })
          .eq("id", logRow.id);
      }

      // 5. Farewell email (best-effort, non-blocking failure)
      const resendKey = process.env.RESEND_API_KEY;
      if (resendKey && email) {
        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "Rroba <noreply@rroba.app>",
              to: email,
              subject: "Llogaria juaj u fshi — Rroba",
              html: `
                <p>Llogaria juaj Rroba u fshi me sukses.</p>
                <p>Të gjitha të dhënat tuaja personale janë fshirë në përputhje me Rregulloren GDPR të BE-së.</p>
                <p>Nëse keni pyetje, na kontaktoni në support@rroba.app</p>
                <p>Faleminderit që keni përdorur Rroba.</p>
              `,
            }),
          });
        } catch (e) {
          console.error("[delete-account] farewell email failed", e);
        }
      }

      return { success: true };
    } catch (err) {
      console.error("[delete-account] error", err);
      if (logRow?.id) {
        await supabaseAdmin
          .from("gdpr_deletion_log")
          .update({ status: "failed", completed_at: new Date().toISOString() })
          .eq("id", logRow.id);
      }
      throw new Error("Deletion failed");
    }
  });
