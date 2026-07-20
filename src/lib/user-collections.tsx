import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

type Ctx = {
  userId: string | null;
  likes: Set<string>;
  saves: Set<string>;
  toggleLike: (listingId: string) => Promise<boolean>;
  toggleSave: (listingId: string) => Promise<boolean>;
};

const UserCollectionsContext = createContext<Ctx | null>(null);

export function UserCollectionsProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [likes, setLikes] = useState<Set<string>>(new Set());
  const [saves, setSaves] = useState<Set<string>>(new Set());

  useEffect(() => {
    getCurrentUserId().then((id) => setUserId(id));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const reload = useCallback(async (uid: string) => {
    const [l, s] = await Promise.all([
      supabase.from("listing_likes").select("listing_id").eq("user_id", uid),
      supabase.from("listing_saves").select("listing_id").eq("user_id", uid),
    ]);
    setLikes(new Set((l.data ?? []).map((r) => r.listing_id)));
    setSaves(new Set((s.data ?? []).map((r) => r.listing_id)));
  }, []);

  useEffect(() => {
    if (!userId) {
      setLikes(new Set());
      setSaves(new Set());
      return;
    }
    reload(userId);
    const ch = supabase
      .channel(`user-collections-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "listing_likes", filter: `user_id=eq.${userId}` }, () => reload(userId))
      .on("postgres_changes", { event: "*", schema: "public", table: "listing_saves", filter: `user_id=eq.${userId}` }, () => reload(userId))
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [userId, reload]);

  const toggleLike = useCallback(
    async (listingId: string) => {
      if (!userId) return false;
      const isLiked = likes.has(listingId);
      setLikes((prev) => {
        const next = new Set(prev);
        isLiked ? next.delete(listingId) : next.add(listingId);
        return next;
      });
      if (isLiked) {
        await supabase.from("listing_likes").delete().eq("user_id", userId).eq("listing_id", listingId);
      } else {
        await supabase.from("listing_likes").insert({ user_id: userId, listing_id: listingId });
      }
      return !isLiked;
    },
    [userId, likes],
  );

  const toggleSave = useCallback(
    async (listingId: string) => {
      if (!userId) return false;
      const isSaved = saves.has(listingId);
      setSaves((prev) => {
        const next = new Set(prev);
        isSaved ? next.delete(listingId) : next.add(listingId);
        return next;
      });
      if (isSaved) {
        await supabase.from("listing_saves").delete().eq("user_id", userId).eq("listing_id", listingId);
      } else {
        await supabase.from("listing_saves").insert({ user_id: userId, listing_id: listingId });
      }
      return !isSaved;
    },
    [userId, saves],
  );

  const value = useMemo(
    () => ({ userId, likes, saves, toggleLike, toggleSave }),
    [userId, likes, saves, toggleLike, toggleSave],
  );

  return <UserCollectionsContext.Provider value={value}>{children}</UserCollectionsContext.Provider>;
}

export function useUserCollections() {
  const ctx = useContext(UserCollectionsContext);
  if (!ctx) throw new Error("useUserCollections must be used within UserCollectionsProvider");
  return ctx;
}
