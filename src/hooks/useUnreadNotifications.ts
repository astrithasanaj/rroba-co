import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser } from "@/hooks/useCurrentUser";

/**
 * Returns true when the signed-in user has at least one unread row in
 * `public.notifications`. Subscribes to realtime INSERT/UPDATE for that user.
 */
export function useUnreadNotifications() {
  const [hasUnread, setHasUnread] = useState(false);
  const [me, setMe] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getCurrentUser().then((user) => {
      if (!cancelled) setMe(user?.id ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setMe(session?.user?.id ?? null);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!me) {
      setHasUnread(false);
      return;
    }

    const check = async () => {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", me)
        .eq("read", false);
      setHasUnread((count ?? 0) > 0);
    };

    check();
    const channel = supabase
      .channel(`unread-notif-${me}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${me}` },
        check,
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${me}` },
        check,
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [me]);

  return hasUnread;
}
