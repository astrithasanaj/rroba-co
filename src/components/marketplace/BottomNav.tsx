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
        height: "58px",
        backgroundColor: "#1a1a1a",
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
              className="nav-sell-btn"
              style={{
                width: "44px",
                height: "44px",
                minWidth: "44px",
                maxWidth: "44px",
                minHeight: "44px",
                maxHeight: "44px",
                backgroundColor: "#f6f1e7",
                border: "none",
                borderRadius: "12px",
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
                  fontSize: "20px",
                  color: "#1a1a1a",
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
            className="nav-item"
            style={{
              width: "48px",
              height: "48px",
              minWidth: "48px",
              maxWidth: "48px",
              minHeight: "48px",
              maxHeight: "48px",
              backgroundColor: isActive ? "rgba(255,255,255,0.12)" : "transparent",
              border: "none",
              borderRadius: "50%",
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
                fontSize: "20px",
                color: isActive ? "#f6f1e7" : "rgba(255,255,255,0.5)",
                lineHeight: 1,
                display: "block",
                width: "20px",
                height: "20px",
              }}
            />
          </button>
        );
      })}
    </div>
  );
};
