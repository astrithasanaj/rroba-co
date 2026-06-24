import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { MobileShell } from "@/components/marketplace/MobileShell";
import { supabase } from "@/integrations/supabase/client";
import { signPaths } from "@/lib/listings";

export const Route = createFileRoute("/messages")({
  validateSearch: (s: Record<string, unknown>) => ({
    thread: typeof s.thread === "string" ? s.thread : undefined,
  }),
  component: MessagesPage,
});

type ThreadRow = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  last_message_at: string;
};

type ThreadView = {
  id: string;
  otherId: string;
  otherName: string;
  otherAvatar: string;
  listingTitle: string;
  listingCover: string;
  lastPreview: string;
  lastAt: string;
};

function MessagesPage() {
  const { thread } = useSearch({ from: "/messages" });
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
        <div className="grid h-[60vh] place-items-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </MobileShell>
    );
  }

  return thread ? <Thread id={thread} me={me} /> : <ThreadList me={me} />;
}

function ThreadList({ me }: { me: string }) {
  const [threads, setThreads] = useState<ThreadView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data: convs } = await supabase
        .from("conversations")
        .select("*")
        .or(`buyer_id.eq.${me},seller_id.eq.${me}`)
        .order("last_message_at", { ascending: false });
      const rows = (convs ?? []) as ThreadRow[];
      if (rows.length === 0) {
        if (active) {
          setThreads([]);
          setLoading(false);
        }
        return;
      }
      const otherIds = Array.from(new Set(rows.map((r) => (r.buyer_id === me ? r.seller_id : r.buyer_id))));
      const listingIds = Array.from(new Set(rows.map((r) => r.listing_id)));
      const [profs, listings, lastMsgs] = await Promise.all([
        supabase.from("profiles").select("id,name,avatar_url").in("id", otherIds),
        supabase.from("listings").select("id,title,image_paths").in("id", listingIds),
        supabase.from("messages").select("conversation_id,content,created_at").in("conversation_id", rows.map((r) => r.id)).order("created_at", { ascending: false }),
      ]);
      const profMap = new Map((profs.data ?? []).map((p) => [p.id, p]));
      const listingMap = new Map((listings.data ?? []).map((l) => [l.id, l]));
      const lastMap = new Map<string, string>();
      for (const m of lastMsgs.data ?? []) {
        if (!lastMap.has(m.conversation_id)) lastMap.set(m.conversation_id, m.content);
      }
      const allCovers = (listings.data ?? []).flatMap((l) => l.image_paths?.[0] ? [l.image_paths[0]] : []);
      const urls = await signPaths(allCovers);

      const views: ThreadView[] = rows.map((r) => {
        const otherId = r.buyer_id === me ? r.seller_id : r.buyer_id;
        const prof = profMap.get(otherId);
        const listing = listingMap.get(r.listing_id);
        const cover = listing?.image_paths?.[0] ?? "";
        return {
          id: r.id,
          otherId,
          otherName: prof?.name || "Përdorues",
          otherAvatar: prof?.avatar_url || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(prof?.name || "U")}`,
          listingTitle: listing?.title || "Artikull",
          listingCover: urls[cover] || "",
          lastPreview: lastMap.get(r.id) || "Bisedë e re",
          lastAt: r.last_message_at,
        };
      });
      if (active) {
        setThreads(views);
        setLoading(false);
      }
    };
    load();
    const ch = supabase
      .channel("messages-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => load())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => load())
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(ch);
    };
  }, [me]);

  return (
    <MobileShell>
      <header className="sticky top-0 z-30 bg-background/95 px-5 py-4 backdrop-blur">
        <h1 className="font-display text-3xl">Mesazhet</h1>
      </header>
      {loading ? (
        <div className="grid place-items-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : threads.length === 0 ? (
        <div className="mx-5 mt-6 rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Ende nuk ke biseda.
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {threads.map((t) => (
            <li key={t.id}>
              <Link
                to="/messages"
                search={{ thread: t.id }}
                className="flex items-center gap-3 px-5 py-4"
              >
                <div className="relative shrink-0">
                  <img src={t.otherAvatar} alt={t.otherName} className="h-12 w-12 rounded-full object-cover" />
                  {t.listingCover && (
                    <img src={t.listingCover} alt="" className="absolute -bottom-1 -right-1 h-5 w-5 rounded border-2 border-background object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-semibold">{t.otherName}</p>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {new Date(t.lastAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">Re: {t.listingTitle}</p>
                  <p className="mt-0.5 truncate text-sm text-foreground/80">{t.lastPreview}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </MobileShell>
  );
}

type MessageRow = { id: string; sender_id: string; content: string; created_at: string };

function Thread({ id, me }: { id: string; me: string }) {
  const navigate = useNavigate();
  const [info, setInfo] = useState<{ otherName: string; otherAvatar: string; listingTitle: string } | null>(null);
  const [msgs, setMsgs] = useState<MessageRow[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data: conv } = await supabase.from("conversations").select("*").eq("id", id).maybeSingle();
      if (!conv) {
        if (active) setLoading(false);
        return;
      }
      const otherId = conv.buyer_id === me ? conv.seller_id : conv.buyer_id;
      const [prof, listing, msgRes] = await Promise.all([
        supabase.from("profiles").select("name,avatar_url").eq("id", otherId).maybeSingle(),
        supabase.from("listings").select("title").eq("id", conv.listing_id).maybeSingle(),
        supabase.from("messages").select("*").eq("conversation_id", id).order("created_at", { ascending: true }),
      ]);
      if (!active) return;
      setInfo({
        otherName: prof.data?.name || "Përdorues",
        otherAvatar: prof.data?.avatar_url || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(prof.data?.name || "U")}`,
        listingTitle: listing.data?.title || "Artikull",
      });
      setMsgs((msgRes.data ?? []) as MessageRow[]);
      setLoading(false);
    };
    load();
    const ch = supabase
      .channel(`thread-${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${id}` },
        (payload) => {
          setMsgs((prev) => [...prev, payload.new as MessageRow]);
        },
      )
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(ch);
    };
  }, [id, me]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput("");
    await supabase.from("messages").insert({ conversation_id: id, sender_id: me, content: text });
  };

  return (
    <MobileShell hideNav>
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <button
          onClick={() => navigate({ to: "/messages" })}
          className="grid h-9 w-9 place-items-center rounded-full"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        {info && (
          <>
            <img src={info.otherAvatar} alt="" className="h-9 w-9 rounded-full object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{info.otherName}</p>
              <p className="truncate text-[11px] text-muted-foreground">Re: {info.listingTitle}</p>
            </div>
          </>
        )}
      </header>

      {loading ? (
        <div className="grid place-items-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="flex flex-col gap-2 px-4 py-4 pb-32">
          {msgs.map((m) => (
            <div
              key={m.id}
              className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                m.sender_id === me
                  ? "ml-auto bg-foreground text-background"
                  : "mr-auto bg-secondary text-foreground"
              }`}
            >
              {m.content}
            </div>
          ))}
          <div ref={endRef} />
        </div>
      )}

      <form
        onSubmit={send}
        className="fixed bottom-0 left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 border-t border-border bg-background/95 p-3 backdrop-blur"
      >
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Shkruaj një mesazh..."
            className="flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-foreground"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="grid h-10 w-10 place-items-center rounded-full bg-foreground text-background disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </form>
    </MobileShell>
  );
}
