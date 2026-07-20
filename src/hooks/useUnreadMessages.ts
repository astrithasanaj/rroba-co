import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser } from "@/hooks/useCurrentUser";

/**
 * Returns true when the signed-in user has at least one unread message
 * across their conversations. Uses the `messages.read` flag.
 */
export function useUnreadMessages() {
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
      const { data: convs } = await supabase
        .from("conversations")
        .select("id")
        .or(`buyer_id.eq.${me},seller_id.eq.${me}`);
      const ids = (convs ?? []).map((c) => c.id);
      if (ids.length === 0) {
        setHasUnread(false);
        return;
      }
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .in("conversation_id", ids)
        .neq("sender_id", me)
        .eq("read", false);
      setHasUnread((count ?? 0) > 0);
    };

    check();
    const channel = supabase
      .channel(`unread-${me}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, check)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [me]);

  return hasUnread;
}
