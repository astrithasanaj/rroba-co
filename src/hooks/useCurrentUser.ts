import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// Module-scope cache — shared across the whole app so that repeated
// navigations don't re-hit the network for the same identity.
let cachedUser: User | null = null;
let initialized = false;
let initPromise: Promise<User | null> | null = null;
const listeners = new Set<(u: User | null) => void>();

function ensureInit(): Promise<User | null> {
  if (initialized) return Promise.resolve(cachedUser);
  if (initPromise) return initPromise;
  initPromise = supabase.auth.getSession().then(({ data }) => {
    cachedUser = data.session?.user ?? null;
    initialized = true;
    return cachedUser;
  });
  return initPromise;
}

// Single global listener — keeps the module cache in sync with
// login / logout / token refresh events.
supabase.auth.onAuthStateChange((_event, session) => {
  cachedUser = session?.user ?? null;
  initialized = true;
  for (const l of listeners) l(cachedUser);
});

// Kick off the initial session read eagerly on module load.
void ensureInit();

/** Async accessor for imperative code (event handlers, effects). */
export async function getCurrentUser(): Promise<User | null> {
  if (initialized) return cachedUser;
  return ensureInit();
}

export async function getCurrentUserId(): Promise<string | null> {
  const u = await getCurrentUser();
  return u?.id ?? null;
}

/** Synchronous peek — returns null if not yet initialized. */
export function getCachedUser(): User | null {
  return cachedUser;
}

/** React hook for components that need reactive auth state. */
export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(cachedUser);
  const [loading, setLoading] = useState(!initialized);

  useEffect(() => {
    let mounted = true;
    if (!initialized) {
      ensureInit().then((u) => {
        if (!mounted) return;
        setUser(u);
        setLoading(false);
      });
    } else {
      setUser(cachedUser);
      setLoading(false);
    }
    const listener = (u: User | null) => {
      if (!mounted) return;
      setUser(u);
      setLoading(false);
    };
    listeners.add(listener);
    return () => {
      mounted = false;
      listeners.delete(listener);
    };
  }, []);

  return { user, loading, isAuthenticated: !!user };
}
