// In-memory cache for profile stat counts, keyed by user id.
// Used to avoid "0 → real value" flash across navigations by seeding
// previously-known counts synchronously on mount.

export type ProfileStatsCacheEntry = {
  followers?: number;
  following?: number;
};

const cache = new Map<string, ProfileStatsCacheEntry>();

export function getProfileStats(id: string | null | undefined): ProfileStatsCacheEntry | null {
  if (!id) return null;
  return cache.get(id) ?? null;
}

export function setProfileStats(id: string, patch: ProfileStatsCacheEntry): void {
  const prev = cache.get(id) ?? {};
  cache.set(id, { ...prev, ...patch });
}
