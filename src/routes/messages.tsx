import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Loader2, Send, Search as SearchIcon, Trash2, Inbox, X } from "lucide-react";
import { MobileShell } from "@/components/marketplace/MobileShell";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser } from "@/hooks/useCurrentUser";
import { signPaths } from "@/lib/listings";
import { toast } from "sonner";
import { useTranslation } from "@/i18n";

// Design tokens (from src/styles.css)
const INK = "var(--brand-ink)";
const INK_SECONDARY = "var(--brand-ink-secondary)";
const SURFACE = "var(--brand-surface)";
const CREAM_SOFT = "var(--brand-cream)";
const DIVIDER = "var(--brand-border)";
const ROSE = "var(--brand-rose)";
// Documented specials — kept intentionally
const GLASS_BG = "rgba(255,255,255,0.7)";
const GLASS_BORDER = "rgba(226,226,222,0.8)";
const BRAND_GRADIENT = "linear-gradient(120deg, var(--brand-coral), var(--brand-rose))";

const FOCUS_RING =
  "outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[color:var(--brand-rose)] focus-visible:ring-offset-[color:var(--brand-surface)]";

type View = "list" | "archive" | "new";
type MessagesSearch = { thread: string | undefined; view: View; tab: "all" | "buy" | "sell" };

export const Route = createFileRoute("/messages")({
  validateSearch: (s: Record<string, unknown>) => ({
    thread: typeof s.thread === "string" ? s.thread : undefined,
    view: (s.view === "archive" || s.view === "new" ? s.view : "list") as View,
    tab: (s.tab === "buy" || s.tab === "sell" ? s.tab : "all") as "all" | "buy" | "sell",
  }),
  component: MessagesPage,
});

type ThreadRow = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  last_message_at: string;
  archived_by_buyer: boolean;
  archived_by_seller: boolean;
  last_read_buyer_at: string | null;
  last_read_seller_at: string | null;
};

type ThreadView = {
  id: string;
  otherId: string;
  otherName: string;
  otherAvatar: string;
  listingId: string;
  listingTitle: string;
  listingPrice: number | null;
  listingCover: string;
  lastPreview: string;
  lastAt: string;
  unread: boolean;
  isBuyer: boolean;
  archived: boolean;
};

function MessagesPage() {
  const { thread, view, tab } = useSearch({ from: "/messages" });
  const navigate = useNavigate({ from: "/messages" });
  const [me, setMe] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser().then((user) => {
      if (!user) navigate({ to: "/auth" });
      else setMe(user!.id);
    });
  }, [navigate]);

  if (!me) {
    return (
      <MobileShell>
        <div
          className="grid h-[60dvh] place-items-center"
          style={{ backgroundColor: SURFACE }}
          role="status"
          aria-live="polite"
        >
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: INK_SECONDARY }} aria-hidden="true" />
          <span className="sr-only">Duke ngarkuar…</span>
        </div>
      </MobileShell>
    );
  }

  if (thread) return <Thread id={thread} me={me} />;
  if (view === "archive") return <ConversationList me={me} mode="archive" tab={tab} />;
  if (view === "new") return <NewMessage me={me} />;
  return <ConversationList me={me} mode="inbox" tab={tab} />;
}

function InboxIcon({ size = 18, color = "#ffffff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 13l2-7h12l2 7M4 13v5a1 1 0 001 1h14a1 1 0 001-1v-5M4 13h5l1 2h4l1-2h5"
        stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 3v6m0 0l-2-2m2 2l2-2" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ComposeIcon({ size = 18, color = "#ffffff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M14 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-7"
        stroke={color} strokeWidth="1.7" strokeLinecap="round"/>
      <path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"
        stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function BackButton({ onClick, label = "Kthehu" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`grid h-11 w-11 place-items-center rounded-full transition-transform duration-150 active:scale-[0.97] ${FOCUS_RING}`}
      style={{
        backgroundColor: GLASS_BG,
        border: `1px solid ${GLASS_BORDER}`,
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      <ChevronLeft size={22} strokeWidth={2} aria-hidden="true" style={{ color: "var(--brand-ink)" }} />
    </button>
  );
}

async function fetchThreads(me: string): Promise<ThreadView[]> {
  const { data: convs, error } = await supabase
    .from("conversations")
    .select("*")
    .or(`buyer_id.eq.${me},seller_id.eq.${me}`)
    .order("last_message_at", { ascending: false });
  if (error) throw error;
  const rows = (convs ?? []) as ThreadRow[];
  if (rows.length === 0) return [];
  const otherIds = Array.from(new Set(rows.map((r) => (r.buyer_id === me ? r.seller_id : r.buyer_id))));
  const listingIds = Array.from(new Set(rows.map((r) => r.listing_id)));
  const [profs, listings, lastMsgs] = await Promise.all([
    supabase.from("public_profiles").select("id,name,avatar_url").in("id", otherIds),
    supabase.from("listings").select("id,title,image_paths,price").in("id", listingIds),
    supabase.from("messages").select("conversation_id,content,created_at,sender_id").in("conversation_id", rows.map((r) => r.id)).order("created_at", { ascending: false }),
  ]);
  const profMap = new Map((profs.data ?? []).map((p) => [p.id, p]));
  const listingMap = new Map((listings.data ?? []).map((l) => [l.id, l]));
  const lastMap = new Map<string, { content: string; created_at: string; sender_id: string }>();
  for (const m of lastMsgs.data ?? []) {
    if (!lastMap.has(m.conversation_id)) lastMap.set(m.conversation_id, m);
  }
  const allCovers = (listings.data ?? []).flatMap((l) => l.image_paths?.[0] ? [l.image_paths[0]] : []);
  const urls = await signPaths(allCovers, { thumbnail: true });

  return rows.map((r) => {
    const isBuyer = r.buyer_id === me;
    const otherId = isBuyer ? r.seller_id : r.buyer_id;
    const prof = profMap.get(otherId);
    const listing = listingMap.get(r.listing_id);
    const cover = listing?.image_paths?.[0] ?? "";
    const last = lastMap.get(r.id);
    const lastReadAt = isBuyer ? r.last_read_buyer_at : r.last_read_seller_at;
    const unread = !!last && last.sender_id !== me && (!lastReadAt || new Date(last.created_at) > new Date(lastReadAt));
    const archived = isBuyer ? r.archived_by_buyer : r.archived_by_seller;
    return {
      id: r.id,
      otherId,
      otherName: prof?.name || "Përdorues",
      otherAvatar: prof?.avatar_url || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(prof?.name || "U")}`,
      listingId: r.listing_id,
      listingTitle: listing?.title || "Artikull",
      listingPrice: listing?.price ?? null,
      listingCover: urls[cover] || "",
      lastPreview: last?.content || "Bisedë e re",
      lastAt: r.last_message_at,
      unread,
      isBuyer,
      archived,
    };
  });
}

function ConversationList({ me, mode, tab }: { me: string; mode: "inbox" | "archive"; tab: "all" | "buy" | "sell" }) {
  const navigate = useNavigate({ from: "/messages" });
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const queryKey = useMemo(() => ["messages-threads", me] as const, [me]);

  const {
    data: threads = [],
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => fetchThreads(me),
    staleTime: 30_000,
    // Keep showing previous data while background refetching.
    placeholderData: (prev) => prev,
  });

  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [swipeId, setSwipeId] = useState<string | null>(null);
  const touchStartX = useRef(0);

  // Debounce realtime-triggered refetches to avoid parallel bursts.
  const refetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleRefetch = () => {
    if (refetchTimerRef.current) return;
    refetchTimerRef.current = setTimeout(() => {
      refetchTimerRef.current = null;
      queryClient.invalidateQueries({ queryKey });
    }, 300);
  };

  useEffect(() => {
    const ch = supabase
      .channel(`messages-list:${me}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, scheduleRefetch)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, scheduleRefetch)
      .subscribe();
    return () => {
      if (refetchTimerRef.current) {
        clearTimeout(refetchTimerRef.current);
        refetchTimerRef.current = null;
      }
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  // First-visit skeleton shows from the first frame; on cached returns
  // `threads` is already populated and skeleton never appears.
  const showInitialSkeleton = isPending && threads.length === 0;
  const loadError = isError && threads.length === 0;


  const filtered = useMemo(() => {
    let list = threads.filter((t) => (mode === "archive" ? t.archived : !t.archived));
    if (tab === "buy") list = list.filter((t) => t.isBuyer);
    else if (tab === "sell") list = list.filter((t) => !t.isBuyer);
    return list;
  }, [threads, mode, tab]);

  const setArchived = async (t: ThreadView, archived: boolean) => {
    const patch = t.isBuyer ? { archived_by_buyer: archived } : { archived_by_seller: archived };
    queryClient.setQueryData<ThreadView[]>(queryKey, (prev) =>
      (prev ?? []).map((x) => (x.id === t.id ? { ...x, archived } : x)),
    );
    const { error } = await supabase.from("conversations").update(patch).eq("id", t.id);
    if (error) {
      toast.error("Diçka shkoi keq");
      refetch();
    } else {
      toast.success(archived ? "U arkivua" : "U çarkivua");
    }
  };

  const deleteThread = async (t: ThreadView) => {
    queryClient.setQueryData<ThreadView[]>(queryKey, (prev) =>
      (prev ?? []).filter((x) => x.id !== t.id),
    );
    const { error } = await supabase.from("conversations").delete().eq("id", t.id);
    if (error) { toast.error("Diçka shkoi keq"); refetch(); }
    else toast.success("U fshi");
  };

  const startPress = (id: string, e: React.TouchEvent | React.MouseEvent) => {
    const pt = "touches" in e ? e.touches[0] : (e as React.MouseEvent);
    longPressRef.current = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(10);
      setMenu({ id, x: pt.clientX, y: pt.clientY });
    }, 500);
  };
  const endPress = () => {
    if (longPressRef.current) clearTimeout(longPressRef.current);
  };

  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (id: string) => (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx < -60) setSwipeId(id);
    else if (dx > 30) setSwipeId(null);
  };

  const title = mode === "archive" ? t("messages.title_archive") : t("messages.title");
  const emptyMsg = mode === "archive" ? t("messages.empty_archived") : t("messages.empty_inbox");

  const openThread = (t: ThreadView) => {
    if (swipeId === t.id) { setSwipeId(null); return; }
    navigate({ to: "/messages", search: (prev: MessagesSearch) => ({ ...prev, thread: t.id }) });
  };

  return (
    <MobileShell fixed>
      <div
        className="messages-page"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          backgroundColor: SURFACE,
        }}
      >
        <header
          className="flex items-center justify-between px-5 pt-5 pb-3"
          style={{ backgroundColor: SURFACE, flexShrink: 0 }}
        >
          {mode === "archive" ? (
            <BackButton onClick={() => navigate({ to: "/messages", search: (prev: MessagesSearch) => ({ ...prev, view: "list", tab }) })} />
          ) : <div className="w-11" aria-hidden="true" />}
          <h1 className="text-[22px] font-bold" style={{ color: INK }}>{title}</h1>
          {mode === "inbox" ? (
            <div className="flex items-center gap-1 rounded-full px-2 py-1.5" style={{ backgroundColor: INK }}>
              <button
                type="button"
                onClick={() => navigate({ to: "/messages", search: (prev: MessagesSearch) => ({ ...prev, view: "archive", tab }) })}
                aria-label="Arkiva"
                className={`grid h-11 w-11 place-items-center rounded-full transition-transform active:scale-[0.97] ${FOCUS_RING}`}
              >
                <InboxIcon />
              </button>
              <button
                type="button"
                onClick={() => navigate({ to: "/messages", search: (prev: MessagesSearch) => ({ ...prev, view: "new", tab }) })}
                aria-label="Mesazh i ri"
                className={`grid h-11 w-11 place-items-center rounded-full transition-transform active:scale-[0.97] ${FOCUS_RING}`}
              >
                <ComposeIcon />
              </button>
            </div>
          ) : <div className="w-11" aria-hidden="true" />}
        </header>

        {mode === "inbox" && (
          <div className="px-5 pb-3" style={{ flexShrink: 0, height: 68 }}>
            <div
              role="tablist"
              aria-label="Filtro biseda"
              className="relative flex rounded-full p-1"
              style={{ backgroundColor: CREAM_SOFT, height: 48 }}
            >
              <div
                aria-hidden="true"
                className="absolute top-1 bottom-1 rounded-full transition-transform duration-200 ease-out"
                style={{
                  left: 4,
                  width: "calc((100% - 8px) / 3)",
                  background: BRAND_GRADIENT,
                  transform: `translateX(${tab === "all" ? 0 : tab === "buy" ? 100 : 200}%)`,
                }}
              />
              {(["all", "buy", "sell"] as const).map((t) => {
                const active = tab === t;
                const label = t === "all" ? "Të gjitha" : t === "buy" ? "Blerje" : "Shitje";
                return (
                  <button
                    key={t}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => navigate({ to: "/messages", search: (prev: MessagesSearch) => ({ ...prev, tab: t, view: "list" }) })}
                    className={`relative z-10 flex-1 rounded-full text-sm font-medium transition-colors duration-200 ${FOCUS_RING}`}
                    style={{
                      color: active ? "#ffffff" : INK_SECONDARY,
                      backgroundColor: "transparent",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div
          className="messages-list"
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            paddingBottom: 90,
          }}
        >
          {showInitialSkeleton ? (
            <>
              <span className="sr-only" role="status" aria-live="polite">Duke ngarkuar biseda…</span>
              <ul aria-hidden="true">
                {Array.from({ length: 6 }).map((_, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 px-5"
                    style={{ height: 72, borderBottom: `1px solid ${DIVIDER}` }}
                  >
                    <div className="h-12 w-12 shrink-0 rounded-full" style={{ backgroundColor: CREAM_SOFT }} />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-1/2 rounded" style={{ backgroundColor: CREAM_SOFT }} />
                      <div className="h-3 w-3/4 rounded" style={{ backgroundColor: CREAM_SOFT }} />
                      <div className="h-2.5 w-1/3 rounded" style={{ backgroundColor: CREAM_SOFT }} />
                    </div>
                  </li>
                ))}
              </ul>
            </>
          ) : loadError ? (
            <div
              role="alert"
              className="mx-5 mt-10 rounded-2xl border border-dashed p-8 text-center text-sm"
              style={{ borderColor: DIVIDER, color: INK_SECONDARY }}
            >
              <div className="mb-3">Diçka shkoi keq gjatë ngarkimit.</div>
              <button
                type="button"
                onClick={() => { refetch(); }}
                className={`rounded-full px-4 py-2 text-sm font-semibold text-white ${FOCUS_RING}`}
                style={{ background: BRAND_GRADIENT }}
              >
                Provo përsëri
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div
              role="status"
              aria-live="polite"
              className="mx-5 mt-10 rounded-2xl border border-dashed p-10 text-center text-sm"
              style={{ borderColor: DIVIDER, color: INK_SECONDARY }}
            >
              {emptyMsg}
            </div>
          ) : (
            <ul>
              {filtered.map((t) => (
                <li key={t.id} className="relative overflow-hidden" style={{ borderBottom: `1px solid ${DIVIDER}`, minHeight: 72 }}>
                  <button
                    type="button"
                    onClick={() => { setSwipeId(null); setArchived(t, mode !== "archive"); }}
                    aria-label={mode === "archive" ? "Zharkivo bisedën" : "Arkivo bisedën"}
                    className="absolute right-0 top-0 flex h-full items-center justify-center px-6 text-sm font-semibold text-white transition-opacity"
                    style={{ backgroundColor: ROSE, opacity: swipeId === t.id ? 1 : 0, pointerEvents: swipeId === t.id ? "auto" : "none" }}
                  >
                    {mode === "archive" ? "Zharkivo" : "Arkivo"}
                  </button>
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label={`Bisedë me ${t.otherName}${t.unread ? ", i palexuar" : ""}`}
                    className={`relative flex items-center gap-3 px-5 py-3.5 transition-transform duration-200 ease-out active:scale-[0.98] ${FOCUS_RING}`}
                    style={{
                      backgroundColor: t.unread ? CREAM_SOFT : SURFACE,
                      transform: swipeId === t.id ? "translateX(-100px)" : "translateX(0)",
                      minHeight: 72,
                    }}
                    onTouchStart={(e) => { onTouchStart(e); startPress(t.id, e); }}
                    onTouchEnd={(e) => { endPress(); onTouchEnd(t.id)(e); }}
                    onTouchMove={endPress}
                    onMouseDown={(e) => startPress(t.id, e)}
                    onMouseUp={endPress}
                    onMouseLeave={endPress}
                    onContextMenu={(e) => { e.preventDefault(); setMenu({ id: t.id, x: e.clientX, y: e.clientY }); }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openThread(t); }
                    }}
                    onClick={() => openThread(t)}
                  >
                    <div className="relative shrink-0" style={{ width: 48, height: 48 }}>
                      <img
                        src={t.otherAvatar}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        width={48}
                        height={48}
                        className="h-12 w-12 rounded-full object-cover"
                        style={{ backgroundColor: CREAM_SOFT }}
                      />
                      {t.listingCover && (
                        <img
                          src={t.listingCover}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="absolute -bottom-1 -right-1 h-5 w-5 rounded border-2 object-cover"
                          style={{ borderColor: SURFACE, backgroundColor: CREAM_SOFT }}
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className="truncate text-[15px]"
                        style={{ color: INK, fontWeight: t.unread ? 700 : 500 }}
                      >
                        {t.otherName}
                      </p>
                      <p
                        className="truncate text-sm"
                        style={{
                          color: t.unread ? INK : INK_SECONDARY,
                          fontWeight: t.unread ? 500 : 400,
                          fontStyle: t.unread ? "normal" : "italic",
                          marginTop: 2,
                        }}
                      >
                        {t.lastPreview}
                      </p>
                      <p className="truncate text-xs" style={{ color: INK_SECONDARY, marginTop: 2 }}>{t.listingTitle}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <span className="text-[12px]" style={{ color: INK_SECONDARY }}>
                        <time dateTime={t.lastAt}>{formatTime(t.lastAt)}</time>
                      </span>
                      {t.unread && (
                        <span
                          aria-label="I palexuar"
                          style={{
                            width: 10,
                            height: 10,
                            backgroundColor: ROSE,
                            borderRadius: "50%",
                            display: "block",
                          }}
                        />
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {menu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenu(null)} aria-hidden="true" />
            <div
              role="menu"
              className="fixed z-50 overflow-hidden rounded-xl shadow-2xl animate-scale-in"
              style={{
                top: Math.min(menu.y, window.innerHeight - 140),
                left: Math.min(menu.x, window.innerWidth - 200),
                backgroundColor: SURFACE,
                border: `1px solid ${DIVIDER}`,
                minWidth: 180,
              }}
            >
              <button
                type="button"
                role="menuitem"
                className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm ${FOCUS_RING}`}
                style={{ color: INK, minHeight: 44 }}
                onClick={() => { const t = threads.find((x) => x.id === menu.id); if (t) setArchived(t, !t.archived); setMenu(null); }}
              >
                <Inbox className="h-4 w-4" aria-hidden="true" />
                {mode === "archive" ? "Zharkivo" : "Arkivo"}
              </button>
              <div style={{ height: 1, backgroundColor: DIVIDER }} />
              <button
                type="button"
                role="menuitem"
                className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm ${FOCUS_RING}`}
                style={{ color: ROSE, minHeight: 44 }}
                onClick={() => { const t = threads.find((x) => x.id === menu.id); if (t) deleteThread(t); setMenu(null); }}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Fshij
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes pulse-soft { 0%,100% { opacity: 1 } 50% { opacity: .5 } }
        .animate-pulse-soft { animation: pulse-soft 2s ease-in-out infinite; }
      `}</style>
    </MobileShell>
  );
}


function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.floor((startOfDay(now) - startOfDay(d)) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return d.toLocaleTimeString("sq-AL", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Dje";
  if (diffDays < 7) return d.toLocaleDateString("sq-AL", { weekday: "long" });
  return d.toLocaleDateString("sq-AL", { day: "numeric", month: "short" });
}

type ProfileResult = { id: string; name: string | null; avatar_url: string | null; username?: string | null; city?: string | null };

function NewMessage({ me }: { me: string }) {
  const navigate = useNavigate({ from: "/messages" });
  const [q, setQ] = useState("");
  const [results, setResults] = useState<ProfileResult[]>([]);
  const [recent, setRecent] = useState<ProfileResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: convs } = await supabase
        .from("conversations")
        .select("buyer_id,seller_id,last_message_at")
        .or(`buyer_id.eq.${me},seller_id.eq.${me}`)
        .order("last_message_at", { ascending: false })
        .limit(20);
      const others = Array.from(new Set((convs ?? []).map((c) => (c.buyer_id === me ? c.seller_id : c.buyer_id)))).slice(0, 5);
      if (others.length) {
        const { data: profs } = await supabase.from("public_profiles").select("id,name,avatar_url").in("id", others);
        setRecent((profs ?? []) as ProfileResult[]);
      }
    })();
  }, [me]);

  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    const handle = setTimeout(async () => {
      const { data } = await supabase
        .from("public_profiles")
        .select("id,name,avatar_url")
        .neq("id", me)
        .ilike("name", `%${q.trim()}%`)
        .limit(20);
      setResults((data ?? []) as ProfileResult[]);
      setLoading(false);
    }, 200);
    return () => clearTimeout(handle);
  }, [q, me]);

  const startChat = async (otherId: string) => {
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .or(`and(buyer_id.eq.${me},seller_id.eq.${otherId}),and(buyer_id.eq.${otherId},seller_id.eq.${me})`)
      .order("last_message_at", { ascending: false })
      .limit(1);
    if (existing && existing.length > 0) {
      navigate({ to: "/messages", search: (prev: MessagesSearch) => ({ ...prev, thread: existing[0].id }) });
      return;
    }
    toast.error("Nis një bisedë nga faqja e produktit");
  };

  const list = q.trim() ? results : recent;

  return (
    <MobileShell fixed>
      <div
        className="messages-page"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          backgroundColor: SURFACE,
        }}
      >
        <header
          className="sticky top-0 z-30 flex items-center gap-3 px-5 pt-5 pb-3"
          style={{ backgroundColor: SURFACE }}
        >
          <button
            type="button"
            onClick={() => navigate({ to: "/messages", search: (prev: MessagesSearch) => ({ ...prev, view: "list", tab: "all" }) })}
            aria-label="Mbyll"
            className={`grid h-11 w-11 place-items-center rounded-full ${FOCUS_RING}`}
            style={{ backgroundColor: CREAM_SOFT }}
          >
            <X className="h-5 w-5" style={{ color: INK }} aria-hidden="true" />
          </button>
          <h1 className="text-[18px] font-bold" style={{ color: INK }}>Mesazh i ri</h1>
        </header>
        <div className="px-5 pb-3">
          <label className="sr-only" htmlFor="new-message-search">Kërko përdoruesin</label>
          <div className="flex items-center gap-2 rounded-full px-4" style={{ backgroundColor: CREAM_SOFT, minHeight: 44 }}>
            <SearchIcon className="h-4 w-4" style={{ color: INK_SECONDARY }} aria-hidden="true" />
            <input
              id="new-message-search"
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Kërko përdoruesin..."
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: INK, minHeight: 44 }}
              inputMode="search"
              enterKeyHint="search"
            />
          </div>
        </div>
        {!q.trim() && recent.length > 0 && (
          <p className="px-5 pb-2 pt-2 text-xs font-semibold uppercase tracking-wide" style={{ color: INK_SECONDARY }}>Kontaktet e fundit</p>
        )}
        {loading ? (
          <div className="grid place-items-center py-10" role="status" aria-live="polite">
            <Loader2 className="h-5 w-5 animate-spin" style={{ color: INK_SECONDARY }} aria-hidden="true" />
            <span className="sr-only">Duke kërkuar…</span>
          </div>
        ) : list.length === 0 ? (
          <p role="status" aria-live="polite" className="px-5 py-10 text-center text-sm" style={{ color: INK_SECONDARY }}>
            {q.trim() ? "Asnjë përdorues u gjet" : "Ende nuk ke kontakte"}
          </p>
        ) : (
          <ul>
            {list.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => startChat(p.id)}
                  className={`flex w-full items-center gap-3 px-5 py-3 text-left transition-transform active:scale-[0.98] ${FOCUS_RING}`}
                  style={{ borderBottom: `1px solid ${DIVIDER}`, minHeight: 60 }}
                >
                  <img
                    src={p.avatar_url || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(p.name || "U")}`}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-11 w-11 rounded-full object-cover"
                    style={{ backgroundColor: CREAM_SOFT }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold" style={{ color: INK }}>{p.name || "Përdorues"}</p>
                    {p.city && <p className="truncate text-xs" style={{ color: INK_SECONDARY }}>{p.city}</p>}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </MobileShell>
  );
}

type MessageRow = { id: string; sender_id: string; content: string; created_at: string };

function Thread({ id, me }: { id: string; me: string }) {
  const [info, setInfo] = useState<{
    otherName: string; otherAvatar: string; listingId: string; listingTitle: string; listingPrice: number | null; listingCover: string; isBuyer: boolean;
  } | null>(null);
  const [msgs, setMsgs] = useState<MessageRow[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputBarRef = useRef<HTMLFormElement>(null);
  const chatPageRef = useRef<HTMLDivElement>(null);
  const didInitialScroll = useRef(false);
  const nearBottomRef = useRef(true);
  const lastOwnSendRef = useRef(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data: conv, error: convErr } = await supabase.from("conversations").select("*").eq("id", id).maybeSingle();
      if (convErr || !conv) { if (active) { setLoading(false); setLoadError(!conv); } return; }
      const isBuyer = conv.buyer_id === me;
      const otherId = isBuyer ? conv.seller_id : conv.buyer_id;
      const [prof, listing, msgRes] = await Promise.all([
        supabase.from("public_profiles").select("name,avatar_url").eq("id", otherId).maybeSingle(),
        supabase.from("listings").select("title,price,image_paths").eq("id", conv.listing_id).maybeSingle(),
        supabase.from("messages").select("*").eq("conversation_id", id).order("created_at", { ascending: true }),
      ]);
      const cover = listing.data?.image_paths?.[0] ?? "";
      const urls = cover ? await signPaths([cover], { thumbnail: true }) : {};
      if (!active) return;
      setInfo({
        otherName: prof.data?.name || "Përdorues",
        otherAvatar: prof.data?.avatar_url || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(prof.data?.name || "U")}`,
        listingId: conv.listing_id,
        listingTitle: listing.data?.title || "Artikull",
        listingPrice: listing.data?.price ?? null,
        listingCover: urls[cover] || "",
        isBuyer,
      });
      const loaded = (msgRes.data ?? []) as MessageRow[];
      setMsgs(loaded);
      if (loaded.length === 0 && isBuyer) {
        setInput("Përshëndetje! A është ende në dispozicion?");
      }
      setLoading(false);

      const readPatch = isBuyer
        ? { last_read_buyer_at: new Date().toISOString() }
        : { last_read_seller_at: new Date().toISOString() };
      supabase.from("conversations").update(readPatch).eq("id", id);
      supabase
        .from("messages")
        .update({ read: true })
        .eq("conversation_id", id)
        .neq("sender_id", me)
        .eq("read", false)
        .then(() => {});
    };
    load();
    const ch = supabase
      .channel(`thread-${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${id}` },
        (payload) => setMsgs((prev) => {
          const next = payload.new as MessageRow;
          if (prev.some((m) => m.id === next.id)) return prev;
          return [...prev, next];
        }))
      .subscribe();
    return () => { active = false; supabase.removeChannel(ch); };
  }, [id, me]);

  // Track scroll position to avoid forcing users to bottom while reading history
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
      nearBottomRef.current = distance < 120;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll to bottom: instant on first paint; on new messages only if user is near bottom or just sent
  useEffect(() => {
    if (loading) return;
    const el = scrollRef.current;
    if (!el) return;
    if (!didInitialScroll.current) {
      el.scrollTop = el.scrollHeight;
      didInitialScroll.current = true;
      nearBottomRef.current = true;
      return;
    }
    const justSent = Date.now() - lastOwnSendRef.current < 1500;
    if (nearBottomRef.current || justSent) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [msgs, loading]);

  // Keyboard-aware chat container via visualViewport (iOS PWA).
  // Keep the chat-page anchored to its parent (inset:0) and translate any
  // keyboard occlusion into a `bottom` inset. Never override `height`/`top`,
  // otherwise the container can exceed the clipped MobileShell and push the
  // composer out of the visible area.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const page = chatPageRef.current;
      if (!page) return;
      const keyboard = Math.max(
        0,
        window.innerHeight - vv.height - vv.offsetTop,
      );
      page.style.bottom = keyboard > 0 ? `${keyboard}px` : "";
      const el = scrollRef.current;
      if (el && nearBottomRef.current) el.scrollTop = el.scrollHeight;
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      const page = chatPageRef.current;
      if (page) {
        page.style.bottom = "";
        page.style.height = "";
        page.style.top = "";
      }
    };
  }, []);


  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput("");
    lastOwnSendRef.current = Date.now();
    const { error } = await supabase.from("messages").insert({ conversation_id: id, sender_id: me, content: text });
    if (error) {
      // Restore user's text so they don't lose their message
      setInput(text);
      toast.error("Mesazhi nuk u dërgua");
    }
    setSending(false);
  };

  return (
    <MobileShell fixed>
      <div
        ref={chatPageRef}
        className="chat-page"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          backgroundColor: SURFACE,
        }}
      >
        <header
          className="flex items-center gap-3 px-4 py-3"
          style={{
            backgroundColor: SURFACE,
            borderBottom: `1px solid ${DIVIDER}`,
            flexShrink: 0,
            paddingTop: "calc(env(safe-area-inset-top) + 12px)",
          }}
        >
          <BackButton onClick={() => window.history.back()} />
          {info ? (
            <>
              <img
                src={info.otherAvatar}
                alt=""
                loading="eager"
                decoding="async"
                className="h-9 w-9 rounded-full object-cover"
                style={{ backgroundColor: CREAM_SOFT }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold" style={{ color: INK }}>{info.otherName}</p>
              </div>
              {info.listingCover && (
                <Link
                  to="/product/$id"
                  params={{ id: info.listingId }}
                  aria-label={`Shiko artikullin ${info.listingTitle}`}
                  className={`grid h-11 w-11 place-items-center rounded-lg ${FOCUS_RING}`}
                >
                  <img
                    src={info.listingCover}
                    alt=""
                    loading="eager"
                    decoding="async"
                    className="h-9 w-9 rounded-lg object-cover"
                    style={{ backgroundColor: CREAM_SOFT }}
                  />
                </Link>
              )}
            </>
          ) : (
            <>
              <div className="h-9 w-9 rounded-full" style={{ backgroundColor: CREAM_SOFT }} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <div className="h-3 w-24 rounded" style={{ backgroundColor: CREAM_SOFT }} aria-hidden="true" />
              </div>
              <div className="h-9 w-9 rounded-lg" style={{ backgroundColor: CREAM_SOFT }} aria-hidden="true" />
            </>
          )}
        </header>

        <div style={{ flexShrink: 0, padding: "12px 16px 0" }}>
          {info ? (
            <Link
              to="/product/$id"
              params={{ id: info.listingId }}
              aria-label={`Artikull: ${info.listingTitle}`}
              className={`flex items-center gap-3 rounded-xl p-2.5 ${FOCUS_RING}`}
              style={{ backgroundColor: CREAM_SOFT }}
            >
              {info.listingCover ? (
                <img
                  src={info.listingCover}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-12 w-12 rounded-lg object-cover"
                  style={{ backgroundColor: DIVIDER }}
                />
              ) : (
                <div className="h-12 w-12 rounded-lg" style={{ backgroundColor: DIVIDER }} aria-hidden="true" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold" style={{ color: INK }}>{info.listingTitle}</p>
                {info.listingPrice != null && <p className="text-sm" style={{ color: INK_SECONDARY }}>{info.listingPrice} €</p>}
              </div>
            </Link>
          ) : (
            <div
              aria-hidden="true"
              className="flex items-center gap-3 rounded-xl p-2.5"
              style={{ backgroundColor: CREAM_SOFT, height: 72 }}
            >
              <div className="h-12 w-12 rounded-lg" style={{ backgroundColor: DIVIDER }} />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-2/3 rounded" style={{ backgroundColor: DIVIDER }} />
                <div className="h-3 w-1/4 rounded" style={{ backgroundColor: DIVIDER }} />
              </div>
            </div>
          )}
        </div>

        <div
          ref={scrollRef}
          role="log"
          aria-live="polite"
          aria-label="Mesazhet e bisedës"
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            padding: "12px 16px 16px",
          }}
        >
          {loading ? (
            <div className="grid flex-1 place-items-center" role="status" aria-live="polite">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: INK_SECONDARY }} aria-hidden="true" />
              <span className="sr-only">Duke ngarkuar mesazhet…</span>
            </div>
          ) : loadError ? (
            <div role="alert" className="grid flex-1 place-items-center px-6 text-center text-sm" style={{ color: INK_SECONDARY }}>
              Biseda nuk u gjet.
            </div>
          ) : msgs.length === 0 ? (
            <div role="status" aria-live="polite" className="grid flex-1 place-items-center px-6 text-center text-sm" style={{ color: INK_SECONDARY }}>
              Filloni bisedën me një mesazh.
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {msgs.map((m, i) => {
                const mine = m.sender_id === me;
                const showTime = i === msgs.length - 1 || new Date(msgs[i + 1].created_at).getTime() - new Date(m.created_at).getTime() > 5 * 60 * 1000;
                return (
                  <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                    <div
                      className="max-w-[80%] px-3.5 py-2 text-sm"
                      style={{
                        backgroundColor: mine ? INK : CREAM_SOFT,
                        color: mine ? "#ffffff" : INK,
                        borderRadius: mine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                        border: mine ? "none" : `1px solid ${DIVIDER}`,
                        overflowWrap: "anywhere",
                        wordBreak: "break-word",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      <span className="sr-only">{mine ? "Ti: " : `${info?.otherName ?? "Përdoruesi"}: `}</span>
                      {m.content}
                    </div>
                    {showTime && (
                      <span className="mt-0.5 px-1 text-[10px]" style={{ color: INK_SECONDARY }}>
                        <time dateTime={m.created_at}>{formatTime(m.created_at)}</time>
                      </span>
                    )}
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>
          )}
        </div>

        <form
          ref={inputBarRef}
          onSubmit={send}
          aria-busy={sending}
          style={{
            flexShrink: 0,
            backgroundColor: SURFACE,
            borderTop: `1px solid ${DIVIDER}`,
            padding: "12px 12px calc(env(safe-area-inset-bottom) + 12px)",
            willChange: "transform",
          }}
        >
          <label htmlFor="thread-composer" className="sr-only">Shkruaj një mesazh</label>
          <div className="flex items-center gap-2">
            <input
              id="thread-composer"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Shkruaj një mesazh..."
              aria-label="Shkruaj një mesazh"
              enterKeyHint="send"
              disabled={sending}
              className={`flex-1 rounded-full px-4 ${FOCUS_RING}`}
              style={{ backgroundColor: CREAM_SOFT, color: INK, fontSize: 16, height: 44, border: `1px solid ${DIVIDER}` }}
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              aria-label="Dërgo mesazhin"
              className={`grid h-11 w-11 place-items-center rounded-full transition-transform active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100 ${FOCUS_RING}`}
              style={{ backgroundColor: INK }}
            >
              {sending
                ? <Loader2 className="h-4 w-4 animate-spin" style={{ color: "#ffffff" }} aria-hidden="true" />
                : <Send className="h-4 w-4" style={{ color: "#ffffff" }} aria-hidden="true" />}
            </button>
          </div>
        </form>
      </div>
    </MobileShell>
  );
}
