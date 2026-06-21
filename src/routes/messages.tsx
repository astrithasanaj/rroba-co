import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Image as ImageIcon, Send } from "lucide-react";
import { MobileShell } from "@/components/marketplace/MobileShell";

export const Route = createFileRoute("/messages")({
  validateSearch: (s: Record<string, unknown>) => ({
    thread: typeof s.thread === "string" ? s.thread : undefined,
  }),
  component: MessagesPage,
});

const threads = [
  {
    id: "1",
    name: "Erza M.",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    last: "A është ende në dispozicion?",
    time: "2 min",
    product: "Blazer i zi Zara",
    unread: 2,
  },
  {
    id: "2",
    name: "Driton K.",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    last: "Mund të takohemi nesër në qendër.",
    time: "1 orë",
    product: "Nike Air Max 90",
    unread: 0,
  },
  {
    id: "3",
    name: "Albulena R.",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80",
    last: "Faleminderit për blerjen! 💛",
    time: "Dje",
    product: "Çantë vintage",
    unread: 0,
  },
];

const suggestions = [
  "A është ende në dispozicion?",
  "A mund të bëj ofertë?",
  "A mund të takohemi në Prishtinë?",
];

function MessagesPage() {
  const { thread } = useSearch({ from: "/messages" });
  if (thread) return <Thread id={thread} />;

  return (
    <MobileShell>
      <header className="sticky top-0 z-30 bg-background/95 px-5 py-4 backdrop-blur">
        <h1 className="font-display text-3xl">Mesazhet</h1>
      </header>

      <ul className="divide-y divide-border">
        {threads.map((t) => (
          <li key={t.id}>
            <Link
              to="/messages"
              search={{ thread: t.id }}
              className="flex items-center gap-3 px-5 py-4"
            >
              <img
                src={t.avatar}
                alt={t.name}
                className="h-12 w-12 shrink-0 rounded-full object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="truncate text-sm font-semibold">{t.name}</p>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {t.time}
                  </span>
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  Re: {t.product}
                </p>
                <p className="mt-0.5 truncate text-sm text-foreground/80">
                  {t.last}
                </p>
              </div>
              {t.unread > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[10px] font-semibold">
                  {t.unread}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </MobileShell>
  );
}

function Thread({ id }: { id: string }) {
  const t = threads.find((x) => x.id === id) ?? threads[0];
  const navigate = useNavigate();
  const [msgs, setMsgs] = useState([
    { from: "them", text: "Përshëndetje! A është ende në dispozicion?" },
    { from: "me", text: "Po, është ende këtu :)" },
    { from: "them", text: "Shumë mirë. A pranon ofertë €30?" },
  ]);
  const [input, setInput] = useState("");

  return (
    <MobileShell hideNav>
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <button
          onClick={() => navigate({ to: "/messages" })}
          className="grid h-9 w-9 place-items-center rounded-full"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <img src={t.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{t.name}</p>
          <p className="truncate text-[11px] text-muted-foreground">Re: {t.product}</p>
        </div>
      </header>

      <div className="flex flex-col gap-2 px-4 py-4">
        {msgs.map((m, i) => (
          <div
            key={i}
            className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
              m.from === "me"
                ? "ml-auto bg-foreground text-background"
                : "mr-auto bg-secondary text-foreground"
            }`}
          >
            {m.text}
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 border-t border-border bg-background/95 backdrop-blur">
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pt-3">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => setInput(s)}
              className="shrink-0 rounded-full border border-border bg-background px-3 py-1.5 text-xs"
            >
              {s}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!input.trim()) return;
            setMsgs([...msgs, { from: "me", text: input }]);
            setInput("");
          }}
          className="flex items-center gap-2 p-3"
        >
          <button type="button" className="grid h-10 w-10 place-items-center rounded-full bg-secondary">
            <ImageIcon className="h-4 w-4" />
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Shkruaj një mesazh..."
            className="flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-foreground"
          />
          <button
            type="submit"
            className="grid h-10 w-10 place-items-center rounded-full bg-foreground text-background"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </MobileShell>
  );
}
