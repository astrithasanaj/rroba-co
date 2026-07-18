import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, MailCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/forgot-password")({
  ssr: false,
  component: ForgotPage,
});

const CREAM = "#ffffff";
const CARD = "#ffffff";
const INK = "#2d1521";
const MUTED = "#a89f94";
const CORAL = "#c65a7a";
const ERR = "#e53935";

function ForgotPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: window.location.origin + "/reset-password",
      });
      if (error) throw error;
      setSent(true);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Dërgimi dështoi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="w-full"
      style={{ position: "absolute", inset: 0, overflowY: "auto", background: CREAM }}
    >
      <div
        className="mx-auto w-full max-w-[420px] px-6 pt-4"
        style={{ paddingBottom: "calc(2.5rem + env(safe-area-inset-bottom))" }}
      >
        <button
          type="button"
          onClick={() => window.history.back()}
          aria-label="Kthehu"
          className="grid place-items-center rounded-full transition-transform duration-150 active:scale-90"
          style={{
            width: 36,
            height: 36,
            backgroundColor: "rgba(255,255,255,0.7)",
            border: "1px solid rgba(226,226,222,0.8)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          <ChevronLeft size={18} color="#2d1521" strokeWidth={2} />
        </button>

        {sent ? (
          <div className="mt-16 flex flex-col items-center text-center">
            <MailCheck size={56} color={CORAL} strokeWidth={1.6} />
            <h2 className="mt-4 text-xl font-bold" style={{ color: INK }}>
              Kontrollo emailin tënd
            </h2>
            <p className="mt-2 text-sm" style={{ color: MUTED }}>
              Dërguam një link në {email}. Kliko linkun për të rivendosur fjalëkalimin tënd.
            </p>
            <Link
              to="/auth/login"
              search={{ next: undefined }}
              className="mt-8 flex h-[54px] w-full items-center justify-center text-[15px] font-bold"
              style={{ background: CARD, color: INK, borderRadius: 14 }}
            >
              Kthehu te hyrja
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-4">
              <h1
                className="italic"
                style={{
                  fontFamily: '"Instrument Serif", serif',
                  fontSize: 28,
                  color: INK,
                  fontWeight: 400,
                }}
              >
                Rivendos fjalëkalimin
              </h1>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: MUTED }}>
                Shkruaj emailin tënd dhe do të dërgojmë një link për të rivendosur fjalëkalimin
              </p>
            </div>

            <form onSubmit={submit} className="mt-8 space-y-3" noValidate>
              <input
                id="forgot-email"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErr("");
                }}
                placeholder="adresa@email.com"
                autoComplete="email"
                inputMode="email"
                enterKeyHint="send"
                autoCapitalize="none"
                aria-label="Adresa e emailit"
                aria-invalid={err ? true : undefined}
                aria-describedby={err ? "forgot-email-err" : undefined}
                className="w-full text-[15px] outline-none focus-visible:shadow-[0_0_0_3px_rgba(198,90,122,0.35)]"
                style={{
                  background: CARD,
                  color: INK,
                  height: 52,
                  borderRadius: 12,
                  padding: "0 16px",
                  border: `1px solid ${err ? ERR : "#e2e2de"}`,
                  transition: "border-color 120ms ease, box-shadow 120ms ease",
                }}
              />
              {err && (
                <p
                  id="forgot-email-err"
                  role="alert"
                  className="px-1 text-xs"
                  style={{ color: ERR }}
                >
                  {err}
                </p>
              )}
              <button
                type="submit"
                disabled={loading || !email}
                className="mt-4 w-full text-[15px] font-bold transition disabled:opacity-50 active:scale-[0.98]"
                style={{
                  background: INK,
                  color: "#fff",
                  height: 54,
                  borderRadius: 14,
                }}
              >
                {loading ? "Duke dërguar..." : "Dërgo linkun"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
