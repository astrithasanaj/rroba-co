import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { UserPlus, LogIn, AlertTriangle } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/")({
  ssr: false,
  validateSearch: z.object({ error: z.string().optional() }),
  component: AuthLanding,
});

const CREAM = "#f6f1e7";
const CARD = "#ede8de";
const INK = "#1a1a1a";
const MUTED = "#a89f94";

function AuthLanding() {
  const navigate = useNavigate();
  const { error: authError } = Route.useSearch();
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/", replace: true });
    });
  }, [navigate]);

  return (
    <div className="min-h-screen w-full" style={{ background: CREAM }}>
      <div className="mx-auto flex min-h-screen w-full max-w-[420px] flex-col px-6 pb-10 pt-[60px]">
        <div className="text-center">
          <div
            className="italic"
            style={{
              fontFamily: '"Instrument Serif", serif',
              fontSize: 52,
              lineHeight: 1,
              color: INK,
              fontWeight: 400,
            }}
          >
            Rroba
          </div>
          <p className="mt-3 text-sm" style={{ color: MUTED }}>
            Moda e përdorur. Rilindur.
          </p>
        </div>

        <div className="mx-auto mt-auto flex w-full max-w-[320px] flex-col gap-3 pt-16">
          <Link
            to="/auth/signup-full"
            className="flex h-[54px] w-full items-center justify-center gap-2 text-[15px] font-bold transition active:scale-[0.98]"
            style={{ background: INK, color: "#fff", borderRadius: 14 }}
          >
            <UserPlus size={18} />
            Krijo llogari të re
          </Link>

          <Link
            to="/auth/login"
            className="flex h-[54px] w-full items-center justify-center gap-2 text-[15px] font-bold transition active:scale-[0.98]"
            style={{ background: CARD, color: INK, borderRadius: 14 }}
          >
            <LogIn size={18} />
            Hyr me llogari ekzistuese
          </Link>

          <button
            onClick={() => navigate({ to: "/", replace: true })}
            className="pt-3 text-center text-sm"
            style={{ color: MUTED, background: "transparent" }}
          >
            Vazhdo si vizitor
          </button>
        </div>
      </div>
    </div>
  );
}
