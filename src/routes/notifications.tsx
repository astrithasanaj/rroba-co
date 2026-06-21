import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Heart, UserPlus, MessageCircle, Tag, CheckCircle2, Search } from "lucide-react";
import { MobileShell } from "@/components/marketplace/MobileShell";

export const Route = createFileRoute("/notifications")({
  component: Notifications,
});

const items = [
  {
    icon: Heart,
    title: "Erza M. pëlqeu Blazerin tënd",
    time: "5 min",
    color: "text-rose-500",
  },
  {
    icon: UserPlus,
    title: "Driton K. po të ndjek",
    time: "30 min",
    color: "text-blue-500",
  },
  {
    icon: MessageCircle,
    title: "Mesazh i ri nga Albulena R.",
    time: "1 orë",
    color: "text-foreground",
  },
  {
    icon: Tag,
    title: "Ofertë e re: €30 për Nike Air Max",
    time: "2 orë",
    color: "text-accent",
  },
  {
    icon: CheckCircle2,
    title: "Artikulli yt u shit! 🎉",
    time: "Dje",
    color: "text-emerald-600",
  },
  {
    icon: Search,
    title: "3 artikuj të rinj për 'vintage çantë'",
    time: "2 ditë",
    color: "text-foreground",
  },
];

function Notifications() {
  const navigate = useNavigate();
  return (
    <MobileShell>
      <header className="sticky top-0 z-30 flex items-center gap-3 bg-background/95 px-4 py-4 backdrop-blur">
        <button
          onClick={() => navigate({ to: "/" })}
          className="grid h-9 w-9 place-items-center rounded-full hover:bg-secondary"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="font-display text-2xl">Njoftimet</h1>
      </header>

      <ul className="divide-y divide-border">
        {items.map((n, i) => {
          const Icon = n.icon;
          return (
            <li key={i} className="flex items-center gap-3 px-5 py-4">
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary ${n.color}`}>
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm">{n.title}</p>
                <p className="text-[11px] text-muted-foreground">{n.time}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </MobileShell>
  );
}
