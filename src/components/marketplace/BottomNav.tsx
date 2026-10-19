import { Link, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "@/i18n";

type NavRoute = "/" | "/search" | "/sell" | "/messages" | "/profile";

export const BottomNav = () => {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { t } = useTranslation();

  const items: { icon: string; route: NavRoute; label: string }[] = [
    { icon: "ti-home", route: "/", label: t("home.nav_home") },
    { icon: "ti-search", route: "/search", label: t("home.nav_search") },
    { icon: "plus", route: "/sell", label: t("home.nav_sell") },
    { icon: "ti-message", route: "/messages", label: t("home.nav_messages") },
    { icon: "ti-user", route: "/profile", label: t("home.nav_profile") },
  ];

  return (
    <div
      className="nav-bar bottom-nav"
      style={{
        position: "fixed",
        bottom: "calc(12px + env(safe-area-inset-bottom, 0px) * 0.5)",
        left: "50%",
        transform: "translateX(-50%)",
        width: "calc(100% - 24px)",
        maxWidth: "456px",
        height: "76px",
        background: "var(--home-olive)",
        borderRadius: "38px",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
        zIndex: 99999,
        padding: "0 8px",
        margin: "0",
        boxSizing: "border-box",
        boxShadow: "0 10px 30px -12px rgba(31,33,25,0.45)",
      }}
    >
      {items.map((item) => {
        const isActive = path === item.route;
        const isSell = item.icon === "plus";

        return (
          <Link
            key={item.route}
            to={item.route}
            preload="intent"
            aria-label={item.label}
            className={`tap-icon ${isSell ? "nav-sell-btn" : "nav-item"}`}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              width: 60,
              height: 60,
              flexShrink: 0,
              borderRadius: "50%",
              textDecoration: "none",
              backgroundColor: isSell
                ? "var(--home-wine)"
                : isActive
                  ? "var(--home-ivory)"
                  : "transparent",
              color: isActive && !isSell ? "var(--home-ink)" : "var(--home-ivory)",
            }}
          >
            <i
              className={`ti ${isSell ? "ti-plus" : item.icon}`}
              style={{ fontSize: isSell ? 24 : 22, lineHeight: 1 }}
            />
            <span style={{ fontSize: 10.5, lineHeight: 1, fontWeight: 500 }}>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
};
