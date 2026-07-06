import { Link, useRouterState } from "@tanstack/react-router";
import { Search, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";

const CREAM = "#f6f1e7";
const CORAL = "#ff8a73";
const BUBBLE = "rgba(255,255,255,0.12)";
const PILL_BG = "rgba(30,28,26,0.72)";

type IconProps = {
  className?: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
};

type NavItem = {
  to: "/" | "/search" | "/sell" | "/messages" | "/profile";
  icon: React.ComponentType<IconProps>;
  label: string;
  center?: boolean;
  notify?: boolean;
};

function HomeIcon({ size = 26, color = CREAM, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={style}>
      <path d="M12 3.2L3 11.2c-.3.3-.1.8.3.8H5v7.5c0 .4.3.7.7.7H9.5c.4 0 .7-.3.7-.7v-4.3c0-.4.3-.8.8-.8h2c.4 0 .8.3.8.8v4.3c0 .4.3.7.7.7h3.8c.4 0 .7-.3.7-.7V12h1.7c.4 0 .6-.5.3-.8L12 3.2z" />
    </svg>
  );
}

function PlusSquareIcon({ size = 26, color = CREAM, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3.5" stroke={color} strokeWidth="1.6" />
      <path d="M12 8v8M8 12h8" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function MessageIcon({ size = 26, color = CREAM, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <path
        d="M4 5.5C4 4.7 4.7 4 5.5 4h13c.8 0 1.5.7 1.5 1.5v10c0 .8-.7 1.5-1.5 1.5H10l-4 3.5v-3.5H5.5C4.7 17 4 16.3 4 15.5v-10z"
        stroke={color}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M8 9h6M8 12h4" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

const items: NavItem[] = [
  { to: "/", icon: HomeIcon, label: "Kreu" },
  { to: "/search", icon: Search, label: "Kërko" },
  { to: "/sell", icon: PlusSquareIcon, label: "Shit", center: true },
  { to: "/messages", icon: MessageIcon, label: "Mesazhe", notify: true },
  { to: "/profile", icon: User, label: "Profili" },
];

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [shrunk, setShrunk] = useState(false);
  const unreadCount = useUnreadMessages();

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y < 20) setShrunk(false);
        else if (y > lastY + 8) setShrunk(true);
        else if (y < lastY - 8) setShrunk(false);
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
        className="flex items-center justify-between rounded-full transition-all duration-200 ease-out"
        style={{
          backgroundColor: PILL_BG,
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          boxShadow: "0 6px 24px rgba(0,0,0,0.25)",
          borderRadius: 999,
          height: shrunk ? 56 : 66,
          padding: shrunk ? "6px 8px" : "8px 10px",
          width: "100%",
          maxWidth: 420,
        }}
      >
        {items.map(({ to, icon: Icon, label, notify }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          const iconSize = shrunk ? 22 : 26;
          return (
            <Link
              key={to}
              to={to}
              aria-label={label}
              className="relative flex flex-1 items-center justify-center transition-transform duration-100 ease-out active:scale-[0.9]"
              style={{ height: "100%" }}
            >
              <div
                className="relative grid place-items-center transition-all duration-200"
                style={{
                  width: active ? 64 : 48,
                  height: shrunk ? 42 : 50,
                  borderRadius: 999,
                  backgroundColor: active ? BUBBLE : "transparent",
                }}
              >
                <Icon
                  size={iconSize}
                  color={CREAM}
                  style={{ transition: "color 150ms ease" }}
                />
                {notify && unreadCount > 0 && (
                  <span
                    className="absolute right-2 top-1.5 h-[7px] w-[7px] rounded-full"
                    style={{ backgroundColor: CORAL, border: "2px solid rgba(30,28,26,0.9)" }}
                  />
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
