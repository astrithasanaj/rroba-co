import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ArrowLeft, Heart, MessageCircle, Tag, Loader2, CheckCircle2, UserPlus } from "lucide-react";
import { MobileShell } from "@/components/marketplace/MobileShell";
import { supabase } from "@/integrations/supabase/client";
import { SwipeBackWrapper } from "@/components/SwipeBackWrapper";

export const Route = createFileRoute("/notifications")({
  component: () => (<SwipeBackWrapper><NotificationsPage /></SwipeBackWrapper>),
});

type Notif = {
  id: string;
  user_id: string;
  type: string;
  read: boolean;
  data: Record<string, unknown>;
  created_at: string;
};

type ActorProfile = { id: string; name: string | null; avatar_url: string | null };

function actorIdOf(n: Notif): string | null {
  const d = n.data ?? {};
  const id =
    (d as any).sender_id ??
    (d as any).buyer_id ??
    (d as any).follower_id ??
    (d as any).actor_id ??
    (d as any).liker_id ??
    null;
  return typeof id === "string" ? id : null;
}

function NotificationsPage() {
  const navigate = useNavigate();
  const [me, setMe] = useState<string | null>(null);
  const [items, setItems] = useState<Notif[]>([]);
  const [actors, setActors] = useState<Record<string, ActorProfile>>({});
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
      if (!active) return;
      const list = (data ?? []) as Notif[];
      setItems(list);
      setLoading(false);

      const ids = Array.from(
        new Set(list.map(actorIdOf).filter((x): x is string => !!x)),
      );
      if (ids.length) {
        const { data: profs } = await supabase
          .from("public_profiles")
          .select("id,name,avatar_url")
          .in("id", ids);
        if (!active) return;
        const map: Record<string, ActorProfile> = {};
        (profs ?? []).forEach((p: any) => (map[p.id] = p));
        setActors(map);
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

  const goToTarget = (n: Notif) => {
    markRead(n);
    if (n.type === "message" && n.data.conversation_id) {
      navigate({ to: "/messages", search: { thread: String(n.data.conversation_id) } as any });
      return;
    }
    if ((n.type === "offer" || n.type === "sold" || n.type === "like") && n.data.listing_id) {
      navigate({ to: "/product/$id", params: { id: String(n.data.listing_id) } });
      return;
    }
    if (n.type === "new_follower") {
      const aid = actorIdOf(n);
      if (aid) navigate({ to: "/user/$id", params: { id: aid } });
      return;
    }
    navigate({ to: "/" });
  };

  const goToActor = (e: React.MouseEvent, actorId: string, n: Notif) => {
    e.stopPropagation();
    markRead(n);
    navigate({ to: "/user/$id", params: { id: actorId } });
  };

  return (
    <MobileShell>
      <header className="sticky top-0 z-30 flex items-center gap-3 bg-background/95 px-4 py-4 backdrop-blur">
        <button
          type="button"
          onClick={() => window.history.back()}
          aria-label="Kthehu"
          className="grid place-items-center rounded-full transition-transform duration-150 active:scale-90"
          style={{
            width: 36,
            height: 36,
            backgroundColor: "rgba(255,255,255,0.7)",
            border: "1px solid rgba(226,226,222,0.8)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          <ChevronLeft size={18} color="#2d1521" strokeWidth={2} />
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
          {items.map((n) => (
            <NotificationRow
              key={n.id}
              n={n}
              actor={(() => {
                const aid = actorIdOf(n);
                return aid ? actors[aid] ?? null : null;
              })()}
              onOpen={() => goToTarget(n)}
              onActor={(e, id) => goToActor(e, id, n)}
            />
          ))}
        </ul>
      )}
    </MobileShell>
  );
}

function NotificationRow({
  n,
  actor,
  onOpen,
  onActor,
}: {
  n: Notif;
  actor: ActorProfile | null;
  onOpen: () => void;
  onActor: (e: React.MouseEvent, actorId: string) => void;
}) {
  const Icon =
    n.type === "offer"
      ? Tag
      : n.type === "message"
      ? MessageCircle
      : n.type === "sold"
      ? CheckCircle2
      : n.type === "new_follower"
      ? UserPlus
      : Heart;

  const actorId = actorIdOf(n);
  const actorName = actor?.name || (actorId ? "Përdorues" : null);

  const body = useMemo(() => {
    const nameEl = actorId && actorName ? (
      <button
        type="button"
        onClick={(e) => onActor(e, actorId)}
        className="font-semibold text-foreground hover:underline active:opacity-70"
      >
        {actorName}
      </button>
    ) : null;

    if (n.type === "offer") {
      return (
        <p className="text-sm">
          {nameEl ? <>{nameEl} bëri një ofertë: </> : "Ofertë e re: "}
          <span className="font-semibold">€{String(n.data.amount ?? "?")}</span>
        </p>
      );
    }
    if (n.type === "message") {
      return (
        <p className="text-sm">
          {nameEl ? <>{nameEl} të dërgoi një mesazh: </> : "Mesazh i ri: "}
          <span className="text-muted-foreground">{String(n.data.preview ?? "")}</span>
        </p>
      );
    }
    if (n.type === "sold") {
      return <p className="text-sm">Artikulli yt u shit! 🎉</p>;
    }
    if (n.type === "new_follower") {
      return (
        <p className="text-sm">
          {nameEl ?? "Dikush"} filloi të të ndjekë
        </p>
      );
    }
    if (n.type === "like") {
      return (
        <p className="text-sm">
          {nameEl ? <>{nameEl} pëlqeu artikullin tënd</> : "Dikush pëlqeu artikullin tënd"}
        </p>
      );
    }
    return <p className="text-sm">Njoftim</p>;
  }, [n, actorId, actorName, onActor]);

  return (
    <li>
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onOpen();
        }}
        className={`flex cursor-pointer items-center gap-3 px-5 py-4 transition-colors active:bg-secondary/60 ${
          n.read ? "" : "bg-accent/10"
        }`}
      >
        {actor?.avatar_url && actorId ? (
          <button
            type="button"
            onClick={(e) => onActor(e, actorId)}
            className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-secondary active:opacity-70"
            aria-label={actor.name ?? "Profili"}
          >
            <img src={actor.avatar_url} alt="" className="h-full w-full object-cover" />
          </button>
        ) : (
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary">
            <Icon className="h-4 w-4" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          {body}
          <p className="text-[11px] text-muted-foreground">
            {new Date(n.created_at).toLocaleString()}
          </p>
        </div>
        {!n.read && <span className="h-2 w-2 rounded-full bg-accent" />}
      </div>
    </li>
  );
}
