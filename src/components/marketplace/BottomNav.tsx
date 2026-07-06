import { Link, useRouterState } from "@tanstack/react-router";
import { Search, User } from "lucide-react";

const CREAM = "#f6f1e7";
const MUTED = "#a89f94";

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
};

function HomeIcon({ size = 20, color = "currentColor", style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={style}>
      <path d="M12 3.2L3 11.2c-.3.3-.1.8.3.8H5v7.5c0 .4.3.7.7.7H9.5c.4 0 .7-.3.7-.7v-4.3c0-.4.3-.8.8-.8h2c.4 0 .8.3.8.8v4.3c0 .4.3.7.7.7h3.8c.4 0 .7-.3.7-.7V12h1.7c.4 0 .6-.5.3-.8L12 3.2z" />
    </svg>
  );
}

function PlusSquareIcon({ size = 20, color = "currentColor", style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3.5" stroke={color} strokeWidth="1.6" />
      <path d="M12 8v8M8 12h8" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function MessageIcon({ size = 20, color = "currentColor", style }: IconProps) {
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
  { to: "/messages", icon: MessageIcon, label: "Mesazhe" },
  { to: "/profile", icon: User, label: "Profili" },
];

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      className="nav-bar bottom-nav"
      aria-label="Navigimi kryesor"
    >
      {items.map(({ to, icon: Icon, label, center }) => {
        const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
        return (
          <Link
            key={to}
            to={to}
            aria-label={label}
            className={center ? "nav-item nav-sell-btn" : "nav-item"}
            style={{ color: active ? CREAM : MUTED }}
          >
            <Icon size={20} />
          </Link>
        );
      })}
    </nav>
  );
}
