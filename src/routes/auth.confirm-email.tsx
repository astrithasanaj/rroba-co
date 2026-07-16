import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/confirm-email")({
  ssr: false,
  validateSearch: z.object({ email: z.string().optional() }),
  component: ConfirmEmailPage,
});

const CREAM = "#ffffff";
const CARD = "#ffffff";
const INK = "#2d1521";
const MUTED = "#a89f94";
const CORAL = "#c65a7a";

function ConfirmEmailPage() {
  const navigate = useNavigate();
  const { email: emailParam } = Route.useSearch();
  const [email, setEmail] = useState<string>(emailParam ?? "");

  useEffect(() => {
    if (!email && typeof window !== "undefined") {
      const stored = localStorage.getItem("rroba_pending_email");
      if (stored) setEmail(stored);
    }
  }, [email]);

  const steps = [
    "Hap emailin tënd",
    "Kërko emailin nga Rroba",
    "Kliko linkun e konfirmimit",
    "Do të ridrejtohesh automatikisht",
  ];

  return (
    <div className="w-full" style={{ position: "absolute", inset: 0, overflowY: "auto", background: CREAM }}>

      <div className="mx-auto flex w-full max-w-[420px] flex-col items-center px-6 pb-12 pt-[60px] text-center">
        <div
          className="italic"
          style={{
            fontFamily: '"Instrument Serif", serif',
            fontSize: 44,
            lineHeight: 1,
            color: INK,
            fontWeight: 400,
          }}
        >
          Rroba
        </div>

        <div
          className="mt-10 flex h-20 w-20 items-center justify-center rounded-full"
          style={{ background: CARD }}
        >
          <Mail size={34} style={{ color: CORAL }} />
        </div>

        <h1
          className="mt-6 italic"
          style={{
            fontFamily: '"Instrument Serif", serif',
            fontSize: 30,
            color: INK,
            fontWeight: 400,
          }}
        >
          Kontrollo emailin tënd
        </h1>

        <p className="mt-3 text-[14px]" style={{ color: MUTED }}>
          Dërguam një link konfirmimi te
        </p>
        <p
          className="mt-1 text-[15px]"
          style={{ color: INK, fontWeight: 600, wordBreak: "break-all" }}
        >
          {email || "email-in tënd"}
        </p>

        <div
          className="mt-8 w-full space-y-3 rounded-2xl p-5 text-left"
          style={{ background: CARD }}
        >
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold"
                style={{ background: INK, color: "#fff" }}
              >
                {i + 1}
              </div>
              <span className="text-[14px]" style={{ color: INK }}>
                {step}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-8 w-full">
          <ResendButton email={email} />
        </div>

        <button
          type="button"
          onClick={() => navigate({ to: "/auth/signup-full", replace: true })}
          style={{
            background: "none",
            border: "none",
            fontSize: 13,
            color: MUTED,
            cursor: "pointer",
            marginTop: 16,
            textDecoration: "underline",
          }}
        >
          Email i gabuar? Kthehu dhe ndrysho
        </button>
      </div>
    </div>
  );
}

function ResendButton({ email }: { email: string }) {
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (canResend) return;
    const t = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(t);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [canResend]);

  const handleResend = async () => {
    if (!canResend || !email) return;
    setResending(true);
    setErr(null);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: window.location.origin + "/auth/callback",
      },
    });
    setResending(false);
    if (error) {
      setErr("Nuk mund të ridërgohej. Provo pas pak.");
      return;
    }
    setResent(true);
    setCanResend(false);
    setCountdown(60);
    setTimeout(() => setResent(false), 4000);
  };

  const label = resending
    ? "Duke dërguar..."
    : resent
      ? "✓ Email-i u ridërgua"
      : canResend
        ? "Ridërgo email-in e konfirmimit"
        : `Ridërgo pas ${countdown}s`;

  return (
    <>
      <button
        type="button"
        disabled={!canResend || resending || !email}
        onClick={handleResend}
        className="h-[52px] w-full rounded-[14px] text-[15px] font-semibold transition active:scale-[0.98] disabled:opacity-60"
        style={{
          background: canResend ? CORAL : CARD,
          color: canResend ? "#fff" : MUTED,
        }}
      >
        {label}
      </button>
      {err && (
        <p className="mt-2 text-xs" style={{ color: "#e53935" }}>
          {err}
        </p>
      )}
    </>
  );
}
