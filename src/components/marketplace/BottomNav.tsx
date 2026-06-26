import { Link, useRouterState } from "@tanstack/react-router";
import { Search, Plus, MessageSquareText, User } from "lucide-react";
import { useEffect, useState } from "react";

const CREAM = "#f6f1e7";
const INK = "#1a1a1a";
const CORAL = "#e8826a";
const BUBBLE = "rgba(255,255,255,0.08)";
const INACTIVE = "rgba(246,241,231,0.55)";

type NavItem = {
  to: "/" | "/search" | "/sell" | "/messages" | "/profile";
  icon: React.ComponentType<{ className?: string; size?: number; color?: string; strokeWidth?: number; fill?: string }>;
  label: string;
  center?: boolean;
  notify?: boolean;
};

const items: NavItem[] = [
  { to: "/", icon: HomeIcon, label: "Kreu" },
  { to: "/search", icon: Search, label: "Kërko" },
  { to: "/sell", icon: Plus, label: "Shit", center: true },
  { to: "/messages", icon: MessageSquareText, label: "Mesazhe", notify: true },
  { to: "/profile", icon: User, label: "Profili" },
];

function HomeIcon({ size = 24, color = INK, className }: { size?: number; color?: string; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 2.5L2.5 10.5H5.5V20.5H10V14.5H14V20.5H18.5V10.5H21.5L12 2.5Z"
        fill={color}
      />
    </svg>
  );
}

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [shrunk, setShrunk] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y < 20) {
          setShrunk(false);
        } else if (y > lastY + 8) {
          setShrunk(true);
        } else if (y < lastY - 8) {
          setShrunk(false);
        }
        lastY = y;
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex justify-center px-4"
      style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
    >
      <div
        className="flex items-center justify-between gap-1 rounded-full transition-all duration-200 ease-out"
        style={{
          backgroundColor: INK,
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          borderRadius: 40,
          height: shrunk ? 54 : 64,
          padding: shrunk ? "6px 10px" : "10px 14px",
          width: "100%",
          maxWidth: 420,
        }}
      >
        {items.map(({ to, icon: Icon, label, center, notify }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              aria-label={label}
              className="relative flex flex-1 items-center justify-center transition-transform duration-100 ease-out active:scale-[0.88]"
              style={{ height: "100%" }}
            >
              {center ? (
                <div
                  className="grid place-items-center rounded-[12px]"
                  style={{
                    width: 44,
                    height: 44,
                    backgroundColor: CREAM,
                    boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                  }}
                >
                  <Plus size={24} strokeWidth={2} color={INK} />
                </div>
              ) : (
                <div className="relative grid h-10 w-12 place-items-center">
                  {active && (
                    <div
                      className="absolute inset-0 rounded-xl transition-opacity duration-150 ease-out"
                      style={{ backgroundColor: BUBBLE }}
                    />
                  )}
                  {to === "/" ? (
                    <Icon
                      size={24}
                      color={active ? CORAL : INACTIVE}
                      className="relative z-10"
                      style={{ transition: "color 150ms ease" }}
                    />
                  ) : (
                    <Icon
                      size={24}
                      strokeWidth={1.5}
                      color={active ? CORAL : INACTIVE}
                      className="relative z-10"
                      style={{ transition: "color 150ms ease" }}
                    />
                  )}
                  {notify && (
                    <span
                      className="absolute right-1 top-0 h-[7px] w-[7px] rounded-full"
                      style={{
                        backgroundColor: CORAL,
                        border: `2px solid ${INK}`,
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
