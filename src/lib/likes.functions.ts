import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getListingLikeInfo = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ listingId: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { count, error: countError } = await supabaseAdmin
      .from("listing_likes")
      .select("*", { count: "exact", head: true })
      .eq("listing_id", data.listingId);

    if (countError || !count || count === 0) {
      return { count: 0, recentLiker: null, recentLikerId: null };
    }

    const { data: likes } = await supabaseAdmin
      .from("listing_likes")
      .select("user_id, created_at")
      .eq("listing_id", data.listingId)
      .order("created_at", { ascending: false })
      .limit(1);

    const recentUserId = likes?.[0]?.user_id ?? null;
    let recentLiker: string | null = null;

    if (recentUserId) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("name")
        .eq("id", recentUserId)
        .maybeSingle();
      if (profile?.name) recentLiker = profile.name;
    }

    return { count, recentLiker, recentLikerId: recentUserId };
  });
