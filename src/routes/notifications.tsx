import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Heart, MessageCircle, Tag, Loader2, CheckCircle2 } from "lucide-react";
import { MobileShell } from "@/components/marketplace/MobileShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/notifications")({
  component: NotificationsPage,
});

type Notif = {
  id: string;
  user_id: string;
  type: string;
  read: boolean;
  data: Record<string, unknown>;
  created_at: string;
};

function NotificationsPage() {
  const navigate = useNavigate();
  const [me, setMe] = useState<string | null>(null);
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) navigate({ to: "/auth" });
      else setMe(data.user.id);
    });
  }, [navigate]);

  useEffect(() => {
    if (!me) return;
    let active = true;
    const load = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", me)
        .order("created_at", { ascending: false })
        .limit(100);
      if (active) {
        setItems((data ?? []) as Notif[]);
        setLoading(false);
      }
    };
    load();
    const ch = supabase
      .channel(`notif-${me}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${me}` },
        () => load(),
      )
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(ch);
    };
  }, [me]);

  const markRead = async (n: Notif) => {
    if (n.read) return;
    await supabase.from("notifications").update({ read: true }).eq("id", n.id);
  };

  const targetFor = (n: Notif): { to: string; params?: Record<string, string>; search?: Record<string, string> } => {
    if (n.type === "message" && n.data.conversation_id) {
      return { to: "/messages", search: { thread: String(n.data.conversation_id) } };
    }
    if (n.type === "offer" && n.data.listing_id) {
      return { to: "/product/$id", params: { id: String(n.data.listing_id) } };
    }
    return { to: "/" };
  };

  return (
    <MobileShell>
      <header className="sticky top-0 z-30 flex items-center gap-3 bg-background/95 px-4 py-4 backdrop-blur">
        <button
          onClick={() => window.history.back()}
          className="grid h-9 w-9 place-items-center rounded-full hover:bg-secondary"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="font-display text-2xl">Njoftimet</h1>
      </header>

      {loading ? (
        <div className="grid place-items-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="mx-5 mt-6 rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Ende nuk ke njoftime.
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((n) => {
            const Icon = n.type === "offer" ? Tag : n.type === "message" ? MessageCircle : n.type === "sold" ? CheckCircle2 : Heart;
            const title =
              n.type === "offer"
                ? `Ofertë e re: €${n.data.amount ?? "?"}`
                : n.type === "message"
                ? `Mesazh i ri: ${String(n.data.preview ?? "")}`
                : n.type === "sold"
                ? "Artikulli yt u shit! 🎉"
                : "Njoftim";
            const target = targetFor(n);
            return (
              <li key={n.id}>
                <Link
                  {...(target as any)}
                  onClick={() => markRead(n)}
                  className={`flex items-center gap-3 px-5 py-4 ${n.read ? "" : "bg-accent/10"}`}
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">{title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                  {!n.read && <span className="h-2 w-2 rounded-full bg-accent" />}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </MobileShell>
  );
}
