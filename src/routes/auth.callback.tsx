import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  component: AuthCallbackPage,
});

const CREAM = "#f6f1e7";
const INK = "#1a1a1a";
const MUTED = "#a89f94";

async function applyPendingProfile(userId: string) {
  try {
    const raw = localStorage.getItem("rroba_pending_profile");
    if (!raw) return;
    const patch = JSON.parse(raw);
    const { error } = await supabase
      .from("profiles")
      .update(patch as any)
      .eq("id", userId);
    if (!error) {
      localStorage.removeItem("rroba_pending_profile");
      localStorage.removeItem("rroba_pending_email");
    } else {
      console.error("pending profile update failed", error);
    }
  } catch (e) {
    console.error("applyPendingProfile", e);
  }
}

function AuthCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"working" | "error">("working");

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        // Case 1: implicit flow tokens in hash
        const hash = window.location.hash?.replace(/^#/, "");
        if (hash) {
          const hp = new URLSearchParams(hash);
          const errCode = hp.get("error") || hp.get("error_code");
          if (errCode) {
            navigate({ to: "/auth", search: { error: "confirmation_failed" } as any, replace: true });
            return;
          }
          const accessToken = hp.get("access_token");
          const refreshToken = hp.get("refresh_token");
          if (accessToken && refreshToken) {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (error) {
              navigate({ to: "/auth", search: { error: "confirmation_failed" } as any, replace: true });
              return;
            }
          }
        }

        // Case 2: PKCE code in query
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
          if (error) {
            navigate({ to: "/auth", search: { error: "confirmation_failed" } as any, replace: true });
            return;
          }
        }
        if (params.get("error")) {
          navigate({ to: "/auth", search: { error: "confirmation_failed" } as any, replace: true });
          return;
        }

        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          navigate({ to: "/auth", replace: true });
          return;
        }

        const userId = data.session.user.id;
        await applyPendingProfile(userId);

        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("id", userId)
          .maybeSingle();

        if (cancelled) return;
        if ((profile as { onboarding_completed?: boolean } | null)?.onboarding_completed) {
          navigate({ to: "/", replace: true });
        } else {
          navigate({ to: "/onboarding", replace: true });
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) setStatus("error");
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div
      className="w-full"
      style={{ position: "absolute", inset: 0, overflowY: "auto", background: CREAM }}
    >

      <div
        className="italic"
        style={{
          fontFamily: '"Instrument Serif", serif',
          fontSize: 44,
          color: INK,
          fontWeight: 400,
        }}
      >
        Rroba
      </div>
      <p className="mt-6 text-sm" style={{ color: MUTED }}>
        {status === "working" ? "Duke konfirmuar llogarinë..." : "Diçka shkoi keq. Provo sërish."}
      </p>
    </div>
  );
}
