import { supabase } from "@/integrations/supabase/client";
import { hydrateListings, type ListingRow, type ListingView } from "@/lib/listings";

// Lightweight in-memory cache for prefetched listings.
// Populated on card hover/touchstart so the product page opens instantly.

const listingCache = new Map<string, { at: number; view: ListingView }>();
const inflight = new Map<string, Promise<ListingView | null>>();
const TTL_MS = 5 * 60 * 1000;

export function getCachedListing(id: string): ListingView | null {
  const hit = listingCache.get(id);
  if (!hit) return null;
  if (Date.now() - hit.at > TTL_MS) {
    listingCache.delete(id);
    return null;
  }
  return hit.view;
}

export function prefetchListing(id: string): Promise<ListingView | null> {
  const cached = getCachedListing(id);
  if (cached) return Promise.resolve(cached);
  const existing = inflight.get(id);
  if (existing) return existing;
  const p = (async () => {
    const { data } = await supabase.from("listings").select("*").eq("id", id).maybeSingle();
    if (!data) return null;
    const [view] = await hydrateListings([data as ListingRow]);
    listingCache.set(id, { at: Date.now(), view });
    return view;
  })().finally(() => inflight.delete(id));
  inflight.set(id, p);
  return p;
}

export function warmImage(url: string) {
  if (!url) return;
  const img = new Image();
  img.decoding = "async";
  img.src = url;
}
