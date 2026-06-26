import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, Plus, MessageCircle, User } from "lucide-react";

type NavItem = {
  to: "/" | "/search" | "/sell" | "/messages" | "/profile";
  icon: typeof Home;
  label: string;
  center?: boolean;
  notify?: boolean;
};

const items: NavItem[] = [
  { to: "/", icon: Home, label: "Kreu" },
  { to: "/search", icon: Search, label: "Kërko" },
  { to: "/sell", icon: Plus, label: "Shit", center: true },
  { to: "/messages", icon: MessageCircle, label: "Mesazhe", notify: true },
  { to: "/profile", icon: User, label: "Profili" },
];

const CREAM = "#f6f1e7";
const DIVIDER = "#ddd8ce";
const INK = "#1a1a1a";
const MUTED = "#a89f94";
const CORAL = "#e8826a";

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40"
      style={{
        backgroundColor: CREAM,
        borderTop: `1px solid ${DIVIDER}`,
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="flex h-[60px] w-full items-center justify-around">
        {items.map(({ to, icon: Icon, label, center, notify }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              aria-label={label}
              className="flex flex-1 items-center justify-center transition-transform duration-100 ease-out active:scale-[0.88]"
              style={{ height: 60 }}
            >
              {center ? (
                <div
                  className="grid place-items-center rounded-full"
                  style={{
                    width: 48,
                    height: 48,
                    backgroundColor: INK,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  }}
                >
                  <Icon size={24} strokeWidth={1.8} color={CREAM} />
                </div>
              ) : (
                <div className="relative grid h-10 w-10 place-items-center">
                  <Icon
                    size={24}
                    strokeWidth={1.8}
                    color={active ? INK : MUTED}
                    style={{ transition: "color 150ms ease" }}
                  />
                  {notify && (
                    <span
                      className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor: CORAL,
                        border: `2px solid ${CREAM}`,
                      }}
                    />
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
