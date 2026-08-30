import type { QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { hydrateListings, type ListingRow, type ListingView } from "@/lib/listings";

export type ProductListingResult = ListingView | "unavailable" | null;

// Single source of truth for product listing data: the product page and the
// intent-prefetch both read/write this React Query key.
export const productListingKey = (id: string) => ["product-listing", id] as const;

export const PRODUCT_LISTING_STALE_MS = 30_000;

export async function fetchProductListing(id: string): Promise<ProductListingResult> {
  const { data: row } = await supabase.from("listings").select("*").eq("id", id).maybeSingle();
  if (!row) return null;
  if (["expired", "removed", "flagged"].includes((row as ListingRow).status)) return "unavailable";
  const [hydrated] = await hydrateListings([row as ListingRow]);
  return hydrated;
}

/** Intent-based prefetch that lands in the exact cache slot the page reads. */
export function prefetchProductListing(queryClient: QueryClient, id: string): void {
  if (!id) return;
  void queryClient.prefetchQuery({
    queryKey: productListingKey(id),
    queryFn: () => fetchProductListing(id),
    staleTime: PRODUCT_LISTING_STALE_MS,
  });
}
