// Image warming only. Listing/profile prefetch lives in React Query
// (see product-queries.ts and profile-queries.ts) so there is exactly one
// cache per datatype.

export function warmImage(url: string) {
  if (!url) return;
  const img = new Image();
  img.decoding = "async";
  img.src = url;
}
