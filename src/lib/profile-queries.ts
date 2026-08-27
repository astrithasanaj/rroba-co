import type { QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { hydrateListings, type ListingRow, type ListingView } from "@/lib/listings";

export type PublicProfile = {
  id: string;
  name: string;
  username: string | null;
  avatar_url: string | null;
  city: string;
  bio: string;
  rating_avg: number;
  rating_count: number;
  created_at?: string;
};

export type ListingWithLikes = ListingView & { _likes: number };

// Stable query keys — shared between the profile page and prefetchers so a
// prefetched entry always lands in the same cache slot the page reads.
export const publicProfileKey = (id: string) => ["user-public-profile", id] as const;
export const publicProfileListingsKey = (id: string) => ["user-public-listings", id] as const;
export const publicProfileStatsKey = (id: string) => ["user-public-stats", id] as const;

export async function fetchPublicProfile(id: string): Promise<PublicProfile | null> {
  const { data } = await supabase
    .from("public_profiles")
    .select("id,name,username,avatar_url,city,bio,rating_avg,rating_count,created_at")
    .eq("id", id)
    .maybeSingle();
  return (data as PublicProfile | null) ?? null;
}

export async function fetchUserPublicListings(id: string): Promise<{
  listings: ListingWithLikes[];
  hasSale: boolean;
  totalLikes: number;
}> {
  const { data } = await supabase
    .from("listings")
    .select("*")
    .eq("user_id", id)
    .in("status", ["active", "sold"])
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as ListingRow[];
  const hydrated = await hydrateListings(rows, { thumbnail: true, mode: "cover" });

  const ids = rows.map((r) => r.id);
  const likesMap: Record<string, number> = {};
  let totalLikes = 0;
  if (ids.length) {
    const { data: lk } = await supabase
      .from("listing_likes")
      .select("listing_id")
      .in("listing_id", ids);
    for (const row of lk ?? []) {
      likesMap[row.listing_id] = (likesMap[row.listing_id] ?? 0) + 1;
      totalLikes++;
    }
  }
  return {
    listings: hydrated.map((h) => ({ ...h, _likes: likesMap[h.id] ?? 0 })),
    hasSale: rows.some((r) => r.status === "sold"),
    totalLikes,
  };
}

export async function fetchUserStats(
  id: string,
): Promise<{ followers: number; following: number; articles: number }> {
  const [fRes, gRes, aRes] = await Promise.all([
    supabase.from("followers").select("*", { count: "exact", head: true }).eq("following_id", id),
    supabase.from("followers").select("*", { count: "exact", head: true }).eq("follower_id", id),
    supabase
      .from("listings")
      .select("*", { count: "exact", head: true })
      .eq("user_id", id)
      .eq("status", "active"),
  ]);
  return {
    followers: fRes.count ?? 0,
    following: gRes.count ?? 0,
    articles: aRes.count ?? 0,
  };
}

/**
 * Intent-based prefetch of the public profile a link points at. Uses the same
 * keys/fetchers as the profile page, so navigation paints from cache.
 */
export function prefetchPublicProfile(queryClient: QueryClient, id: string): void {
  if (!id) return;
  void queryClient.prefetchQuery({
    queryKey: publicProfileKey(id),
    queryFn: () => fetchPublicProfile(id),
    staleTime: 60_000,
  });
  void queryClient.prefetchQuery({
    queryKey: publicProfileStatsKey(id),
    queryFn: () => fetchUserStats(id),
    staleTime: 30_000,
  });
}
