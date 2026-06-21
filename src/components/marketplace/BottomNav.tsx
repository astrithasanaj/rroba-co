import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, PlusSquare, MessageCircle, User } from "lucide-react";

const items = [
  { to: "/", icon: Home, label: "Kreu" },
  { to: "/search", icon: Search, label: "Kërko" },
  { to: "/sell", icon: PlusSquare, label: "Shit" },
  { to: "/messages", icon: MessageCircle, label: "Mesazhe" },
  { to: "/profile", icon: User, label: "Profili" },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 border-t border-border bg-background/95 backdrop-blur">
      <ul className="grid grid-cols-5">
        {items.map(({ to, icon: Icon, label }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          const isSell = to === "/sell";
          return (
            <li key={to} className="flex">
              <Link
                to={to}
                className="flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-medium text-muted-foreground data-[active=true]:text-foreground"
                data-active={active}
              >
                {isSell ? (
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-foreground text-background">
                    <Icon className="h-4 w-4" />
                  </span>
                ) : (
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.6} />
                )}
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
