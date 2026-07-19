import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, Heart, MessageCircle, Tag, Loader2, CheckCircle2, UserPlus, Bell } from "lucide-react";
import { MobileShell } from "@/components/marketplace/MobileShell";
import { supabase } from "@/integrations/supabase/client";
import { SwipeBackWrapper } from "@/components/SwipeBackWrapper";

export const Route = createFileRoute("/notifications")({
  component: () => (<SwipeBackWrapper><NotificationsPage /></SwipeBackWrapper>),
});

// Design tokens (from src/styles.css)
const INK = "var(--brand-ink)";
const INK_SECONDARY = "var(--brand-ink-secondary)";
const SURFACE = "var(--brand-surface)";
const CREAM_SOFT = "var(--brand-cream)";
const DIVIDER = "var(--brand-border)";
const ROSE = "var(--brand-rose)";
const ROSE_SOFT = "var(--brand-rose-soft)";
// Documented specials — glass overlay for header back button (used app-wide)
const GLASS_BG = "rgba(255,255,255,0.7)";
const GLASS_BORDER = "rgba(226,226,222,0.8)";

const FOCUS_RING =
  "outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[color:var(--brand-rose)] focus-visible:ring-offset-[color:var(--brand-surface)]";

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
  const d = (n.data ?? {}) as Record<string, unknown>;
  const id =
    d.sender_id ??
    d.buyer_id ??
    d.follower_id ??
    d.actor_id ??
    d.liker_id ??
    null;
  return typeof id === "string" ? id : null;
}

function formatNotifTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "tani";
  if (min < 60) return `${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} d`;
  return d.toLocaleDateString("sq-AL", { day: "numeric", month: "short" });
}

function NotificationsPage() {
  const navigate = useNavigate();
  const [me, setMe] = useState<string | null>(null);
  const [items, setItems] = useState<Notif[]>([]);
  const [actors, setActors] = useState<Record<string, ActorProfile>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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
      const { data, error: qErr } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", me)
        .order("created_at", { ascending: false })
        .limit(100);
      if (!active) return;
      if (qErr) {
        setError(true);
        setLoading(false);
        return;
      }
      const list = (data ?? []) as Notif[];
      // Dedupe by id defensively (realtime may fire during load)
      const seen = new Set<string>();
      const deduped = list.filter((n) => (seen.has(n.id) ? false : (seen.add(n.id), true)));
      setItems(deduped);
      setError(false);
      setLoading(false);

      const ids = Array.from(
        new Set(deduped.map(actorIdOf).filter((x): x is string => !!x)),
      );
      if (ids.length) {
        const { data: profs } = await supabase
          .from("public_profiles")
          .select("id,name,avatar_url")
          .in("id", ids);
        if (!active) return;
        const map: Record<string, ActorProfile> = {};
        (profs ?? []).forEach((p) => { if (p.id) map[p.id] = p as ActorProfile; });
        setActors((prev) => ({ ...prev, ...map }));
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
    // Optimistic update
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    const { error: uErr } = await supabase.from("notifications").update({ read: true }).eq("id", n.id);
    if (uErr) {
      // Rollback on failure
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: false } : x)));
    }
  };

  const goToTarget = (n: Notif) => {
    markRead(n);
    if (n.type === "message" && n.data.conversation_id) {
      navigate({ to: "/messages", search: { thread: String(n.data.conversation_id), view: "list", tab: "all" } });
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

  const goToActor = (e: React.MouseEvent | React.KeyboardEvent, actorId: string, n: Notif) => {
    e.stopPropagation();
    markRead(n);
    navigate({ to: "/user/$id", params: { id: actorId } });
  };

  return (
    <MobileShell>
      <header
        className="sticky top-0 z-30 flex items-center gap-3 px-4 py-4"
        style={{ backgroundColor: SURFACE, borderBottom: `1px solid ${DIVIDER}` }}
      >
        <button
          type="button"
          onClick={() => window.history.back()}
          aria-label="Kthehu"
          className={`grid h-11 w-11 place-items-center rounded-full transition-transform duration-150 active:scale-[0.97] ${FOCUS_RING}`}
          style={{
            backgroundColor: GLASS_BG,
            border: `1px solid ${GLASS_BORDER}`,
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          <ChevronLeft size={22} strokeWidth={2} aria-hidden="true" style={{ color: INK }} />
        </button>
        <h1 className="font-display text-2xl" style={{ color: INK }}>Njoftimet</h1>
      </header>

      {loading ? (
        <>
          <span className="sr-only" role="status" aria-live="polite">Duke ngarkuar njoftimet…</span>
          <ul aria-hidden="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <li
                key={i}
                className="flex items-center gap-3 px-5 py-4"
                style={{ borderBottom: `1px solid ${DIVIDER}`, minHeight: 72 }}
              >
                <div className="h-10 w-10 shrink-0 rounded-full" style={{ backgroundColor: CREAM_SOFT }} />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-3/4 rounded" style={{ backgroundColor: CREAM_SOFT }} />
                  <div className="h-2.5 w-1/4 rounded" style={{ backgroundColor: CREAM_SOFT }} />
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : error ? (
        <div
          role="alert"
          className="mx-5 mt-6 rounded-2xl border border-dashed p-10 text-center text-sm"
          style={{ borderColor: DIVIDER, color: INK_SECONDARY }}
        >
          Diçka shkoi keq. Provo më vonë.
        </div>
      ) : items.length === 0 ? (
        <div
          role="status"
          aria-live="polite"
          className="mx-5 mt-6 rounded-2xl border border-dashed p-10 text-center text-sm"
          style={{ borderColor: DIVIDER, color: INK_SECONDARY }}
        >
          <Bell className="mx-auto mb-3 h-8 w-8" style={{ color: INK_SECONDARY }} aria-hidden="true" />
          Ende nuk ke njoftime.
        </div>
      ) : (
        <ul>
          {items.map((n) => {
            const aid = actorIdOf(n);
            return (
              <NotificationRow
                key={n.id}
                n={n}
                actor={aid ? actors[aid] ?? null : null}
                onOpen={() => goToTarget(n)}
                onActor={(e, id) => goToActor(e, id, n)}
              />
            );
          })}
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
  onActor: (e: React.MouseEvent | React.KeyboardEvent, actorId: string) => void;
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
      : n.type === "like"
      ? Heart
      : Bell;

  const actorId = actorIdOf(n);
  const actorName = actor?.name || (actorId ? "Përdorues" : null);

  const body = useMemo(() => {
    const nameEl = actorId && actorName ? (
      <button
        type="button"
        onClick={(e) => onActor(e, actorId)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); } }}
        className={`font-semibold hover:underline active:opacity-70 ${FOCUS_RING}`}
        style={{ color: INK }}
      >
        {actorName}
      </button>
    ) : null;

    if (n.type === "offer") {
      return (
        <p className="text-sm" style={{ color: INK }}>
          {nameEl ? <>{nameEl} bëri një ofertë: </> : "Ofertë e re: "}
          <span className="font-semibold">€{String(n.data.amount ?? "?")}</span>
        </p>
      );
    }
    if (n.type === "message") {
      return (
        <p className="text-sm" style={{ color: INK }}>
          {nameEl ? <>{nameEl} të dërgoi një mesazh: </> : "Mesazh i ri: "}
          <span style={{ color: INK_SECONDARY }}>{String(n.data.preview ?? "")}</span>
        </p>
      );
    }
    if (n.type === "sold") {
      return <p className="text-sm" style={{ color: INK }}>Artikulli yt u shit! 🎉</p>;
    }
    if (n.type === "new_follower") {
      return (
        <p className="text-sm" style={{ color: INK }}>
          {nameEl ?? "Dikush"} filloi të të ndjekë
        </p>
      );
    }
    if (n.type === "like") {
      return (
        <p className="text-sm" style={{ color: INK }}>
          {nameEl ? <>{nameEl} pëlqeu artikullin tënd</> : "Dikush pëlqeu artikullin tënd"}
        </p>
      );
    }
    return <p className="text-sm" style={{ color: INK }}>Njoftim</p>;
  }, [n, actorId, actorName, onActor]);

  return (
    <li style={{ borderBottom: `1px solid ${DIVIDER}` }}>
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen();
          }
        }}
        aria-label={`${n.read ? "" : "E palexuar. "}Hap njoftimin`}
        className={`flex cursor-pointer items-center gap-3 px-5 py-4 transition-colors ${FOCUS_RING}`}
        style={{
          backgroundColor: n.read ? SURFACE : ROSE_SOFT,
          minHeight: 72,
        }}
      >
        {actor?.avatar_url && actorId ? (
          <button
            type="button"
            onClick={(e) => onActor(e, actorId)}
            className={`relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full active:opacity-70 ${FOCUS_RING}`}
            style={{ backgroundColor: CREAM_SOFT }}
            aria-label={actor.name ? `Profili i ${actor.name}` : "Profili"}
          >
            <img
              src={actor.avatar_url}
              alt=""
              loading="lazy"
              decoding="async"
              width={44}
              height={44}
              className="h-full w-full object-cover"
            />
            <span
              aria-hidden="true"
              className="absolute -bottom-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full"
              style={{ backgroundColor: SURFACE, border: `1px solid ${DIVIDER}` }}
            >
              <Icon className="h-3 w-3" style={{ color: INK_SECONDARY }} />
            </span>
          </button>
        ) : (
          <span
            aria-hidden="true"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full"
            style={{ backgroundColor: CREAM_SOFT }}
          >
            <Icon className="h-4 w-4" style={{ color: INK_SECONDARY }} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate">{body}</div>
          <p className="text-[11px]" style={{ color: INK_SECONDARY, marginTop: 2 }}>
            <time dateTime={n.created_at} title={new Date(n.created_at).toLocaleString("sq-AL")}>
              {formatNotifTime(n.created_at)}
            </time>
          </p>
        </div>
        {!n.read && (
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: ROSE }}
            aria-label="E palexuar"
          />
        )}
      </div>
    </li>
  );
}
