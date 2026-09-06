import { createFileRoute } from "@tanstack/react-router";

const AASA = {
  applinks: {
    apps: [],
    details: [
      {
        appID: "ANM4H8784L.com.despia.rroba",
        paths: ["/auth/callback", "/auth/callback/*", "/reset-password", "/reset-password/*"],
      },
    ],
  },
};

export const Route = createFileRoute("/.well-known/apple-app-site-association")({
  server: {
    handlers: {
      GET: async () => {
        return new Response(JSON.stringify(AASA), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
