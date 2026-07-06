import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Returns the number of conversations that currently have at least one
 * unread message for the signed-in user. Uses the existing
 * conversations.last_read_(buyer|seller)_at columns — no schema change.
 */
export function useUnreadMessages() {
  const [count, setCount] = useState(0);
  const [me, setMe] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) setMe(data.user?.id ?? null);
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
      setCount(0);
      return;
    }

    const compute = async () => {
      const { data: convs } = await supabase
        .from("conversations")
        .select("id,buyer_id,seller_id,last_message_at,last_read_buyer_at,last_read_seller_at,archived_by_buyer,archived_by_seller")
        .or(`buyer_id.eq.${me},seller_id.eq.${me}`);
      const rows = convs ?? [];
      if (rows.length === 0) {
        setCount(0);
        return;
      }
      // Fetch latest message per conversation to know sender_id (skip self-authored)
      const ids = rows.map((r) => r.id);
      const { data: msgs } = await supabase
        .from("messages")
        .select("conversation_id,sender_id,created_at")
        .in("conversation_id", ids)
        .order("created_at", { ascending: false });
      const lastByConv = new Map<string, { sender_id: string; created_at: string }>();
      for (const m of msgs ?? []) {
        if (!lastByConv.has(m.conversation_id)) {
          lastByConv.set(m.conversation_id, { sender_id: m.sender_id, created_at: m.created_at });
        }
      }
      let unread = 0;
      for (const r of rows) {
        const isBuyer = r.buyer_id === me;
        const archived = isBuyer ? r.archived_by_buyer : r.archived_by_seller;
        if (archived) continue;
        const last = lastByConv.get(r.id);
        if (!last || last.sender_id === me) continue;
        const lastReadAt = isBuyer ? r.last_read_buyer_at : r.last_read_seller_at;
        if (!lastReadAt || new Date(last.created_at) > new Date(lastReadAt)) {
          unread += 1;
        }
      }
      setCount(unread);
    };

    compute();
    const ch = supabase
      .channel(`unread-${me}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => compute())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "conversations" }, () => compute())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [me]);

  return count;
}
