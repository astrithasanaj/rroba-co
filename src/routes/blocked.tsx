import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/blocked")({
  ssr: false,
  component: BlockedPage,
});

const CREAM = "#f6f1e7";
const INK = "#1a1a1a";
const MUTED = "#a89f94";
const CORAL = "#e8826a";
const ERR = "#e53935";

function BlockedPage() {
  useEffect(() => {
    // Ensure session is cleared
    supabase.auth.signOut().catch(() => {});
  }, []);

  return (
    <div
      className="flex min-h-screen w-full flex-col items-center justify-center px-6"
      style={{ background: CREAM }}
    >
      <div className="flex flex-col items-center text-center" style={{ maxWidth: 340 }}>
        <div
          className="mb-4 flex items-center justify-center"
          style={{ width: 72, height: 72, borderRadius: 36, background: "#ede8de" }}
        >
          <Lock size={40} color={ERR} strokeWidth={2} />
        </div>
        <h1 className="text-[20px] font-bold" style={{ color: INK }}>
          Llogaria është bllokuar
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed" style={{ color: MUTED }}>
          Llogaria juaj është bllokuar për shkelje të kushteve të Rroba. Nëse mendoni se kjo
          është gabim, na kontaktoni.
        </p>
        <a
          href="mailto:support@rroba.app"
          className="mt-4 text-[14px] font-semibold"
          style={{ color: CORAL }}
        >
          support@rroba.app
        </a>
        <Link
          to="/auth/login"
          className="mt-8 text-[13px] underline"
          style={{ color: INK }}
        >
          Kthehu te hyrja
        </Link>
      </div>
    </div>
  );
}
