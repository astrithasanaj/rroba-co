import { useNavigate, useRouterState } from "@tanstack/react-router";

type NavRoute = "/" | "/search" | "/sell" | "/messages" | "/profile";

export const BottomNav = () => {
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  const items: { icon: string; route: NavRoute }[] = [
    { icon: "ti-home", route: "/" },
    { icon: "ti-search", route: "/search" },
    { icon: "plus", route: "/sell" },
    { icon: "ti-message", route: "/messages" },
    { icon: "ti-user", route: "/profile" },
  ];

  return (
    <div
      className="nav-bar bottom-nav"
      style={{
        position: "fixed",
        bottom: "16px",
        left: "16px",
        right: "16px",
        height: "68px",
        background: "rgba(45,21,33,0.88)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "0.5px solid rgba(255,255,255,0.08)",
        borderRadius: "40px",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
        zIndex: 99999,
        padding: "0",
        margin: "0",
        boxSizing: "border-box",
        overflow: "hidden",
        flexShrink: 0,
        flexGrow: 0,
      }}
    >
      {items.map((item) => {
        const isActive = path === item.route;

        if (item.icon === "plus") {
          return (
            <button
              key={item.route}
              onClick={() => navigate({ to: item.route })}
              className="nav-sell-btn tap-icon"
              style={{
                width: "52px",
                height: "52px",
                minWidth: "52px",
                maxWidth: "52px",
                minHeight: "52px",
                maxHeight: "52px",
                backgroundColor: "transparent",
                border: "1.5px solid #ffffff",
                borderRadius: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                padding: "0",
                margin: "0",
                flexShrink: 0,
              }}
            >
              <i
                className="ti ti-plus"
                style={{
                  fontSize: "24px",
                  color: "#ffffff",
                  lineHeight: 1,
                }}
              />
            </button>
          );
        }

        return (
          <button
            key={item.route}
            onClick={() => navigate({ to: item.route })}
            className="nav-item tap-icon"
            style={{
              width: "52px",
              height: "52px",
              minWidth: "52px",
              maxWidth: "52px",
              minHeight: "52px",
              maxHeight: "52px",
              backgroundColor: isActive ? "rgba(255,255,255,0.22)" : "transparent",
              border: "none",
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              padding: "0",
              margin: "0",
              flexShrink: 0,
            }}
          >
            <i
              className={`ti ${item.icon}`}
              style={{
                fontSize: "24px",
                color: "#ffffff",
                lineHeight: 1,
                display: "block",
                width: "24px",
                height: "24px",
              }}
            />
          </button>
        );
      })}
    </div>
  );
};
