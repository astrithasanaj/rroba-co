import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
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

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [shrunk, setShrunk] = useState(false);
  const lastY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    lastY.current = window.scrollY;
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      window.requestAnimationFrame(() => {
        const y = window.scrollY;
        const dy = y - lastY.current;
        if (Math.abs(dy) > 6) {
          if (dy > 0 && y > 40) setShrunk(true);
          else if (dy < 0) setShrunk(false);
          lastY.current = y;
        }
        ticking.current = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 px-4"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
    >
      <div
        className="mx-auto flex items-center justify-between rounded-full backdrop-blur transition-all duration-200 ease-out"
        style={{
          backgroundColor: "#1a1a1a",
          boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
          padding: shrunk ? "6px 10px" : "10px 14px",
        }}
      >
        {items.map(({ to, icon: Icon, label, center, notify }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          const size = center ? (shrunk ? 38 : 46) : shrunk ? 34 : 40;
          const iconSize = center ? 22 : 20;
          return (
            <Link
              key={to}
              to={to}
              aria-label={label}
              className="relative grid place-items-center rounded-full transition-all duration-200 ease-out"
              style={{
                width: size,
                height: size,
                backgroundColor: active ? "#2e2a25" : "transparent",
                color: active ? "#f6f1e7" : "rgba(246,241,231,0.55)",
              }}
            >
              <Icon size={iconSize} strokeWidth={active ? 2.2 : 1.8} />
              {notify && (
                <span
                  className="absolute h-2 w-2 rounded-full"
                  style={{ backgroundColor: "#e8826a", top: 6, right: 6 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
