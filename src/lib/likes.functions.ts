import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

/**
 * Returns true only when the caller presents a valid Supabase access token.
 * Anonymous callers get the aggregate like count, never liker identity.
 */
async function isAuthenticatedCaller(): Promise<boolean> {
  try {
    const request = getRequest();
    const authHeader = request?.headers?.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return false;

    const token = authHeader.slice("Bearer ".length);
    if (token.split(".").length !== 3) return false;

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) return false;

    const { createClient } = await import("@supabase/supabase-js");
    const client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await client.auth.getClaims(token);
    return !error && !!data?.claims?.sub;
  } catch {
    return false;
  }
}

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

    // Liker identity is only ever disclosed to authenticated callers.
    if (!(await isAuthenticatedCaller())) {
      return { count, recentLiker: null, recentLikerId: null };
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
