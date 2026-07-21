import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type CurrentProfile = {
  id: string;
  name: string;
  avatar_url: string | null;
  city: string;
  city_id: string | null;
  bio: string;
  rating_avg: number;
  rating_count: number;
  height_cm: number | null;
  created_at?: string;
};

// Cache keyed by user.id — never a single global profile without an id.
const cache = new Map<string, CurrentProfile | null>();
const inflight = new Map<string, Promise<CurrentProfile | null>>();
const listeners = new Map<string, Set<(p: CurrentProfile | null) => void>>();

function notify(userId: string) {
  const set = listeners.get(userId);
  if (!set) return;
  const value = cache.get(userId) ?? null;
  for (const l of set) l(value);
}

/** Fetch the profile row for `userId`, deduplicating concurrent calls. */
export function preloadCurrentProfile(userId: string): Promise<CurrentProfile | null> {
  if (!userId) return Promise.resolve(null);
  const existing = inflight.get(userId);
  if (existing) return existing;

  const p: Promise<CurrentProfile | null> = (async () => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      const row = data as CurrentProfile | null;
      const safe = row && row.id === userId ? row : null;
      cache.set(userId, safe);
      notify(userId);
      return safe;
    } finally {
      inflight.delete(userId);
    }
  })();

  inflight.set(userId, p);
  return p;
}


/** Synchronous peek — returns cached value if present, else undefined. */
export function getCachedCurrentProfile(userId: string): CurrentProfile | null | undefined {
  return cache.get(userId);
}

/** Merge patch into the cached profile after an edit; notifies subscribers. */
export function updateCurrentProfileCache(
  userId: string,
  patch: Partial<CurrentProfile>,
): void {
  const current = cache.get(userId) ?? null;
  const next = current ? { ...current, ...patch, id: userId } : null;
  cache.set(userId, next);
  notify(userId);
}

/** Replace the cached profile entirely. */
export function setCurrentProfileCache(userId: string, profile: CurrentProfile | null): void {
  const safe = profile && profile.id === userId ? profile : null;
  cache.set(userId, safe);
  notify(userId);
}

/** Drop everything — used on sign-out. */
export function clearCurrentProfileCache(): void {
  cache.clear();
  inflight.clear();
  for (const set of listeners.values()) {
    for (const l of set) l(null);
  }
}

// Wire logout to cache eviction once.
supabase.auth.onAuthStateChange((event) => {
  if (event === "SIGNED_OUT") clearCurrentProfileCache();
});

/**
 * Hook returning the current user's profile. Reads synchronously from the
 * cache on first render (so navigation to /profile paints the correct name
 * immediately when the cache is warm) and refreshes in the background.
 */
export function useCurrentProfile(userId: string | null | undefined) {
  const initial = userId ? (cache.get(userId) ?? null) : null;
  const [profile, setProfile] = useState<CurrentProfile | null>(initial);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      return;
    }

    // Seed from cache synchronously.
    const cached = cache.get(userId);
    if (cached !== undefined) setProfile(cached);

    // Subscribe to future updates for this userId.
    let set = listeners.get(userId);
    if (!set) {
      set = new Set();
      listeners.set(userId, set);
    }
    const listener = (p: CurrentProfile | null) => setProfile(p);
    set.add(listener);

    // Kick off / dedupe network refresh.
    void preloadCurrentProfile(userId);

    return () => {
      set!.delete(listener);
      if (set!.size === 0) listeners.delete(userId);
    };
  }, [userId]);

  return profile;
}
