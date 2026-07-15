import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Loader2, Send, Search as SearchIcon, Trash2, Inbox, X } from "lucide-react";
import { MobileShell } from "@/components/marketplace/MobileShell";
import { supabase } from "@/integrations/supabase/client";
import { signPaths } from "@/lib/listings";
import { toast } from "sonner";

const CREAM = "#ffffff";
const CREAM_ALT = "#ffffff";
const INK = "#1a1a1a";
const MUTED = "#a89f94";
const DIVIDER = "#ddd8ce";
const CORAL = "#e8826a";

type View = "list" | "archive" | "new";

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
  const navigate = useNavigate();
  const [me, setMe] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) navigate({ to: "/auth" });
      else setMe(data.user.id);
    });
  }, [navigate]);

  if (!me) {
    return (
      <MobileShell>
        <div className="grid h-[60vh] place-items-center" style={{ backgroundColor: CREAM }}>
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: MUTED }} />
        </div>
      </MobileShell>
    );
  }

  if (thread) return <Thread id={thread} me={me} />;
  if (view === "archive") return <ConversationList me={me} mode="archive" tab={tab} />;
  if (view === "new") return <NewMessage me={me} />;
  return <ConversationList me={me} mode="inbox" tab={tab} />;
}

function InboxIcon({ size = 18, color = CREAM }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 13l2-7h12l2 7M4 13v5a1 1 0 001 1h14a1 1 0 001-1v-5M4 13h5l1 2h4l1-2h5"
        stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 3v6m0 0l-2-2m2 2l2-2" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ComposeIcon({ size = 18, color = CREAM }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M14 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-7"
        stroke={color} strokeWidth="1.7" strokeLinecap="round"/>
      <path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"
        stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ConversationList({ me, mode, tab }: { me: string; mode: "inbox" | "archive"; tab: "all" | "buy" | "sell" }) {
  const navigate = useNavigate();
  const [threads, setThreads] = useState<ThreadView[]>([]);
  const [loading, setLoading] = useState(true);
  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [swipeId, setSwipeId] = useState<string | null>(null);
  const touchStartX = useRef(0);

  const load = async () => {
    const { data: convs } = await supabase
      .from("conversations")
      .select("*")
      .or(`buyer_id.eq.${me},seller_id.eq.${me}`)
      .order("last_message_at", { ascending: false });
    const rows = (convs ?? []) as ThreadRow[];
    if (rows.length === 0) {
      setThreads([]);
      setLoading(false);
      return;
    }
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
    const urls = await signPaths(allCovers);

    const views: ThreadView[] = rows.map((r) => {
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
    setThreads(views);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("messages-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => load())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  const filtered = useMemo(() => {
    let list = threads.filter((t) => (mode === "archive" ? t.archived : !t.archived));
    if (tab === "buy") list = list.filter((t) => t.isBuyer);
    else if (tab === "sell") list = list.filter((t) => !t.isBuyer);
    return list;
  }, [threads, mode, tab]);

  const setArchived = async (t: ThreadView, archived: boolean) => {
    const patch = t.isBuyer ? { archived_by_buyer: archived } : { archived_by_seller: archived };
    setThreads((prev) => prev.map((x) => (x.id === t.id ? { ...x, archived } : x)));
    const { error } = await supabase.from("conversations").update(patch).eq("id", t.id);
    if (error) {
      toast.error("Diçka shkoi keq");
      load();
    } else {
      toast.success(archived ? "U arkivua" : "U çarkivua");
    }
  };

  const deleteThread = async (t: ThreadView) => {
    setThreads((prev) => prev.filter((x) => x.id !== t.id));
    const { error } = await supabase.from("conversations").delete().eq("id", t.id);
    if (error) { toast.error("Diçka shkoi keq"); load(); }
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

  const title = mode === "archive" ? "Arkiva" : "Mesazhe";
  const emptyMsg = mode === "archive" ? "Asnjë bisedë e arkivuar" : "Ende nuk ke biseda.";

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
          backgroundColor: CREAM,
        }}
      >
        <header
          className="flex items-center justify-between px-5 pt-5 pb-3"
          style={{ backgroundColor: CREAM, flexShrink: 0 }}
        >
          {mode === "archive" ? (
            <button onClick={() => navigate({ to: "/messages", search: { view: "list", tab } })} className="grid h-10 w-10 place-items-center rounded-full" style={{ backgroundColor: CREAM_ALT }}>
              <ArrowLeft className="h-5 w-5" style={{ color: INK }} />
            </button>
          ) : <div className="w-10" />}
          <h1 className="text-[22px] font-bold" style={{ color: INK }}>{title}</h1>
          {mode === "inbox" ? (
            <div className="flex items-center gap-1 rounded-full px-2 py-1.5" style={{ backgroundColor: INK }}>
              <button onClick={() => navigate({ to: "/messages", search: { view: "archive", tab } })} aria-label="Arkiva" className="grid h-11 w-11 place-items-center rounded-full transition-transform active:scale-90">
                <InboxIcon />
              </button>
              <button onClick={() => navigate({ to: "/messages", search: { view: "new", tab } })} aria-label="Mesazh i ri" className="grid h-11 w-11 place-items-center rounded-full transition-transform active:scale-90">
                <ComposeIcon />
              </button>
            </div>
          ) : <div className="w-10" />}
        </header>

        {mode === "inbox" && (
          <div className="px-5 pb-3" style={{ flexShrink: 0, height: 68 }}>
            <div
              className="relative flex rounded-full p-1"
              style={{ backgroundColor: CREAM_ALT, height: 48 }}
            >
              {/* Sliding indicator — transform only, no reflow */}
              <div
                aria-hidden
                className="absolute top-1 bottom-1 rounded-full transition-transform duration-200 ease-out"
                style={{
                  left: 4,
                  width: "calc((100% - 8px) / 3)",
                  backgroundColor: INK,
                  transform: `translateX(${tab === "all" ? 0 : tab === "buy" ? 100 : 200}%)`,
                }}
              />
              {(["all", "buy", "sell"] as const).map((t) => {
                const active = tab === t;
                const label = t === "all" ? "Të gjitha" : t === "buy" ? "Blerje" : "Shitje";
                return (
                  <button
                    key={t}
                    onClick={() => navigate({ to: "/messages", search: { tab: t, view: "list" } })}
                    className="relative z-10 flex-1 rounded-full text-sm font-medium transition-colors duration-200"
                    style={{
                      color: active ? "#fff" : MUTED,
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
          {loading ? (
            <ul>
              {Array.from({ length: 6 }).map((_, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 px-5"
                  style={{ height: 72, borderBottom: `1px solid ${DIVIDER}` }}
                >
                  <div
                    className="h-12 w-12 shrink-0 rounded-full"
                    style={{ backgroundColor: CREAM_ALT }}
                  />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-1/2 rounded" style={{ backgroundColor: CREAM_ALT }} />
                    <div className="h-3 w-3/4 rounded" style={{ backgroundColor: CREAM_ALT }} />
                    <div className="h-2.5 w-1/3 rounded" style={{ backgroundColor: CREAM_ALT }} />
                  </div>
                </li>
              ))}
            </ul>
          ) : filtered.length === 0 ? (
            <div className="mx-5 mt-10 rounded-2xl border border-dashed p-10 text-center text-sm" style={{ borderColor: DIVIDER, color: MUTED }}>
              {emptyMsg}
            </div>
          ) : (
            <ul>
              {filtered.map((t) => (
                <li key={t.id} className="relative overflow-hidden" style={{ borderBottom: `1px solid ${DIVIDER}`, minHeight: 72 }}>
                  {/* swipe action */}
                  <button
                    onClick={() => { setSwipeId(null); mode === "archive" ? setArchived(t, false) : setArchived(t, true); }}
                    className="absolute right-0 top-0 flex h-full items-center justify-center px-6 text-sm font-semibold text-white transition-opacity"
                    style={{ backgroundColor: CORAL, opacity: swipeId === t.id ? 1 : 0, pointerEvents: swipeId === t.id ? "auto" : "none" }}
                  >
                    {mode === "archive" ? "Zharkivo" : "Arkivo"}
                  </button>
                  <div
                    className="relative flex items-center gap-3 px-5 py-3.5 transition-transform duration-200 ease-out active:scale-[0.98]"
                    style={{
                      backgroundColor: t.unread ? CREAM_ALT : CREAM,
                      transform: swipeId === t.id ? "translateX(-100px)" : "translateX(0)",
                    }}
                    onTouchStart={(e) => { onTouchStart(e); startPress(t.id, e); }}
                    onTouchEnd={(e) => { endPress(); onTouchEnd(t.id)(e); }}
                    onTouchMove={endPress}
                    onMouseDown={(e) => startPress(t.id, e)}
                    onMouseUp={endPress}
                    onMouseLeave={endPress}
                    onContextMenu={(e) => { e.preventDefault(); setMenu({ id: t.id, x: e.clientX, y: e.clientY }); }}
                    onClick={() => { if (swipeId === t.id) { setSwipeId(null); return; } navigate({ to: "/messages", search: { thread: t.id } }); }}
                  >
                    <div className="relative shrink-0">
                      <img src={t.otherAvatar} alt={t.otherName} className="h-12 w-12 rounded-full object-cover" />
                      {t.listingCover && (
                        <img src={t.listingCover} alt="" className="absolute -bottom-1 -right-1 h-5 w-5 rounded border-2 object-cover" style={{ borderColor: CREAM }} />
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
                          color: t.unread ? INK : MUTED,
                          fontWeight: t.unread ? 500 : 400,
                          fontStyle: t.unread ? "normal" : "italic",
                          marginTop: 2,
                        }}
                      >
                        {t.lastPreview}
                      </p>
                      <p className="truncate text-xs" style={{ color: MUTED, marginTop: 2 }}>{t.listingTitle}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <span className="text-[12px]" style={{ color: MUTED }}>{formatTime(t.lastAt)}</span>
                      {t.unread && (
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            backgroundColor: CORAL,
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
            <div className="fixed inset-0 z-40" onClick={() => setMenu(null)} />
            <div
              className="fixed z-50 overflow-hidden rounded-xl shadow-2xl animate-scale-in"
              style={{
                top: Math.min(menu.y, window.innerHeight - 140),
                left: Math.min(menu.x, window.innerWidth - 200),
                backgroundColor: CREAM,
                border: `1px solid ${DIVIDER}`,
                minWidth: 180,
              }}
            >
              <button
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm"
                style={{ color: INK }}
                onClick={() => { const t = threads.find((x) => x.id === menu.id); if (t) setArchived(t, !t.archived); setMenu(null); }}
              >
                <Inbox className="h-4 w-4" />
                {mode === "archive" ? "Zharkivo" : "Arkivo"}
              </button>
              <div style={{ height: 1, backgroundColor: DIVIDER }} />
              <button
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm"
                style={{ color: CORAL }}
                onClick={() => { const t = threads.find((x) => x.id === menu.id); if (t) deleteThread(t); setMenu(null); }}
              >
                <Trash2 className="h-4 w-4" />
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
  const navigate = useNavigate();
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
    // Find any existing conversation between me and other
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .or(`and(buyer_id.eq.${me},seller_id.eq.${otherId}),and(buyer_id.eq.${otherId},seller_id.eq.${me})`)
      .order("last_message_at", { ascending: false })
      .limit(1);
    if (existing && existing.length > 0) {
      navigate({ to: "/messages", search: { thread: existing[0].id } });
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
          backgroundColor: CREAM,
        }}
      >
        <header className="sticky top-0 z-30 flex items-center gap-3 px-5 pt-5 pb-3" style={{ backgroundColor: `${CREAM}f2` }}>
          <button onClick={() => navigate({ to: "/messages", search: { view: "list", tab: "all" } })} className="grid h-10 w-10 place-items-center rounded-full" style={{ backgroundColor: CREAM_ALT }}>
            <X className="h-5 w-5" style={{ color: INK }} />
          </button>
          <h1 className="text-[18px] font-bold" style={{ color: INK }}>Mesazh i ri</h1>
        </header>
        <div className="px-5 pb-3">
          <div className="flex items-center gap-2 rounded-full px-4 py-2.5" style={{ backgroundColor: CREAM_ALT }}>
            <SearchIcon className="h-4 w-4" style={{ color: MUTED }} />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Kërko përdoruesin..."
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: INK }}
            />
          </div>
        </div>
        {!q.trim() && recent.length > 0 && (
          <p className="px-5 pb-2 pt-2 text-xs font-semibold uppercase tracking-wide" style={{ color: MUTED }}>Kontaktet e fundit</p>
        )}
        {loading ? (
          <div className="grid place-items-center py-10"><Loader2 className="h-5 w-5 animate-spin" style={{ color: MUTED }} /></div>
        ) : list.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm" style={{ color: MUTED }}>
            {q.trim() ? "Asnjë përdorues u gjet" : "Ende nuk ke kontakte"}
          </p>
        ) : (
          <ul>
            {list.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => startChat(p.id)}
                  className="flex w-full items-center gap-3 px-5 py-3 text-left transition-transform active:scale-[0.98]"
                  style={{ borderBottom: `1px solid ${DIVIDER}` }}
                >
                  <img
                    src={p.avatar_url || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(p.name || "U")}`}
                    alt=""
                    className="h-11 w-11 rounded-full object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold" style={{ color: INK }}>{p.name || "Përdorues"}</p>
                    {p.city && <p className="truncate text-xs" style={{ color: MUTED }}>{p.city}</p>}
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
  const navigate = useNavigate();
  const [info, setInfo] = useState<{
    otherName: string; otherAvatar: string; listingId: string; listingTitle: string; listingPrice: number | null; listingCover: string; isBuyer: boolean;
  } | null>(null);
  const [msgs, setMsgs] = useState<MessageRow[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputBarRef = useRef<HTMLFormElement>(null);
  const didInitialScroll = useRef(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data: conv } = await supabase.from("conversations").select("*").eq("id", id).maybeSingle();
      if (!conv) { if (active) setLoading(false); return; }
      const isBuyer = conv.buyer_id === me;
      const otherId = isBuyer ? conv.seller_id : conv.buyer_id;
      const [prof, listing, msgRes] = await Promise.all([
        supabase.from("public_profiles").select("name,avatar_url").eq("id", otherId).maybeSingle(),
        supabase.from("listings").select("title,price,image_paths").eq("id", conv.listing_id).maybeSingle(),
        supabase.from("messages").select("*").eq("conversation_id", id).order("created_at", { ascending: true }),
      ]);
      const cover = listing.data?.image_paths?.[0] ?? "";
      const urls = cover ? await signPaths([cover]) : {};
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
      setMsgs((msgRes.data ?? []) as MessageRow[]);
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
        (payload) => setMsgs((prev) => [...prev, payload.new as MessageRow]))
      .subscribe();
    return () => { active = false; supabase.removeChannel(ch); };
  }, [id, me]);

  // Scroll to bottom: instant on first paint, smooth for new messages
  useEffect(() => {
    if (loading) return;
    const el = scrollRef.current;
    if (!el) return;
    if (!didInitialScroll.current) {
      el.scrollTop = el.scrollHeight;
      didInitialScroll.current = true;
    } else {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [msgs, loading]);

  // Keyboard-aware input bar via visualViewport (iOS PWA)
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const bar = inputBarRef.current;
    const onResize = () => {
      if (!bar) return;
      const offset = Math.max(0, window.innerHeight - vv.height - (vv.offsetTop || 0));
      bar.style.transform = `translateY(-${offset}px)`;
      // Keep the latest message visible when keyboard opens
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    };
    vv.addEventListener("resize", onResize);
    vv.addEventListener("scroll", onResize);
    return () => {
      vv.removeEventListener("resize", onResize);
      vv.removeEventListener("scroll", onResize);
      if (bar) bar.style.transform = "";
    };
  }, []);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput("");
    await supabase.from("messages").insert({ conversation_id: id, sender_id: me, content: text });
  };

  return (
    <MobileShell fixed>
      <div
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
          backgroundColor: CREAM,
        }}
      >
        <header
          className="flex items-center gap-3 px-4 py-3"
          style={{
            backgroundColor: CREAM,
            borderBottom: `1px solid ${DIVIDER}`,
            flexShrink: 0,
            paddingTop: "calc(env(safe-area-inset-top) + 12px)",
          }}
        >
          <button onClick={() => navigate({ to: "/messages", search: { view: "list", tab: "all" } })} className="grid h-11 w-11 place-items-center rounded-full">
            <ArrowLeft className="h-5 w-5" style={{ color: INK }} />
          </button>
          {info ? (
            <>
              <img src={info.otherAvatar} alt="" className="h-9 w-9 rounded-full object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold" style={{ color: INK }}>{info.otherName}</p>
              </div>
              {info.listingCover && (
                <Link to="/product/$id" params={{ id: info.listingId }}>
                  <img src={info.listingCover} alt="" className="h-9 w-9 rounded-lg object-cover" />
                </Link>
              )}
            </>
          ) : (
            <>
              <div className="h-9 w-9 rounded-full" style={{ backgroundColor: CREAM_ALT }} />
              <div className="min-w-0 flex-1">
                <div className="h-3 w-24 rounded" style={{ backgroundColor: CREAM_ALT }} />
              </div>
              <div className="h-9 w-9 rounded-lg" style={{ backgroundColor: CREAM_ALT }} />
            </>
          )}
        </header>

        {/* Product banner — skeleton until ready so no layout shift */}
        <div style={{ flexShrink: 0, padding: "12px 16px 0" }}>
          {info ? (
            <Link
              to="/product/$id"
              params={{ id: info.listingId }}
              className="flex items-center gap-3 rounded-xl p-2.5"
              style={{ backgroundColor: CREAM_ALT }}
            >
              {info.listingCover ? (
                <img src={info.listingCover} alt="" className="h-12 w-12 rounded-lg object-cover" />
              ) : (
                <div className="h-12 w-12 rounded-lg" style={{ backgroundColor: DIVIDER }} />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold" style={{ color: INK }}>{info.listingTitle}</p>
                {info.listingPrice != null && <p className="text-sm" style={{ color: MUTED }}>{info.listingPrice} €</p>}
              </div>
            </Link>
          ) : (
            <div
              className="flex items-center gap-3 rounded-xl p-2.5"
              style={{ backgroundColor: CREAM_ALT, height: 72 }}
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
            <div className="grid flex-1 place-items-center"><Loader2 className="h-6 w-6 animate-spin" style={{ color: MUTED }} /></div>
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
                        backgroundColor: mine ? INK : CREAM_ALT,
                        color: mine ? CREAM : INK,
                        borderRadius: mine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                      }}
                    >
                      {m.content}
                    </div>
                    {showTime && (
                      <span className="mt-0.5 px-1 text-[10px]" style={{ color: MUTED }}>{formatTime(m.created_at)}</span>
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
          style={{
            flexShrink: 0,
            backgroundColor: CREAM,
            borderTop: `1px solid ${DIVIDER}`,
            padding: "12px 12px calc(env(safe-area-inset-bottom) + 12px)",
            willChange: "transform",
          }}
        >
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Shkruaj një mesazh..."
              className="flex-1 rounded-full px-4 outline-none"
              style={{ backgroundColor: CREAM_ALT, color: INK, fontSize: 16, height: 44 }}
            />
            {input.trim() && (
              <button type="submit" className="grid h-10 w-10 place-items-center rounded-full transition-transform active:scale-90" style={{ backgroundColor: INK }}>
                <Send className="h-4 w-4" style={{ color: CREAM }} />
              </button>
            )}
          </div>
        </form>
      </div>
    </MobileShell>
  );
}
