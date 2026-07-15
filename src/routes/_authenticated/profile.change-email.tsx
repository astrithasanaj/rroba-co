import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MobileShell } from "@/components/marketplace/MobileShell";

export const Route = createFileRoute("/_authenticated/profile/change-email")({
  ssr: false,
  component: ChangeEmailPage,
});

const CREAM = "#ffffff";
const CARD = "#ffffff";
const INK = "#1a1a1a";
const MUTED = "#a89f94";
const RED = "#e53935";

function ChangeEmailPage() {
  const router = useRouter();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [currentEmail, setCurrentEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState("");

  // Load current email on mount
  useState(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setCurrentEmail(data.user.email);
      else navigate({ to: "/profile" });
    });
  });

  const goBack = () => {
    if (verifying || submitting) return;
    if (step === 2) {
      setStep(1);
      setError(null);
      return;
    }
    if (step === 3) {
      navigate({ to: "/profile" });
      return;
    }
    if (window.history.length > 1) router.history.back();
    else navigate({ to: "/profile" });
  };

  const verifyPassword = async () => {
    if (!currentEmail || !password) return;
    setVerifying(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({
      email: currentEmail,
      password,
    });
    setVerifying(false);
    if (err) {
      setError("Fjalëkalimi është i gabuar");
      return;
    }
    setStep(2);
  };

  const submitEmail = async () => {
    const trimmed = newEmail.trim();
    if (!trimmed) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Email-i nuk është valid");
      return;
    }
    if (trimmed.toLowerCase() === currentEmail.toLowerCase()) {
      setError("Email-i i ri duhet të jetë ndryshe nga aktuali");
      return;
    }
    setSubmitting(true);
    setError(null);
    const { error: err } = await supabase.auth.updateUser({ email: trimmed });
    setSubmitting(false);
    if (err) {
      const msg = err.message?.toLowerCase() ?? "";
      if (
        msg.includes("already") ||
        msg.includes("registered") ||
        msg.includes("exists") ||
        msg.includes("taken")
      ) {
        setError("Ky email është tashmë në përdorim nga një llogari tjetër");
      } else if (msg.includes("invalid")) {
        setError("Email-i nuk është valid");
      } else {
        setError("Diçka shkoi keq. Provo sërish.");
      }
      return;
    }
    setSentTo(trimmed);
    setStep(3);
  };

  const btnDark: React.CSSProperties = {
    backgroundColor: INK,
    color: "#ffffff",
    height: 50,
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 600,
    width: "100%",
    border: "none",
    cursor: "pointer",
  };
  const inputBox: React.CSSProperties = {
    width: "100%",
    height: 52,
    background: "#f6f1e7",
    border: "none",
    borderRadius: 12,
    padding: "0 16px",
    fontSize: 15,
    color: INK,
    outline: "none",
  };

  const title =
    step === 1 ? "Konfirmo identitetin tënd" : step === 2 ? "Email-i i ri" : "Kontrollo email-in";

  return (
    <MobileShell>
      <div style={{ background: CREAM, minHeight: "100dvh" }}>
        <header
          className="sticky top-0 z-10 flex items-center justify-between px-4 py-3"
          style={{ background: CREAM }}
        >
          <button
            type="button"
            onClick={goBack}
            aria-label="Mbrapa"
            className="grid h-9 w-9 place-items-center rounded-full"
            style={{ background: CARD, color: INK }}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-[15px] font-semibold" style={{ color: INK }}>
            {title}
          </h1>
          <div className="w-9" />
        </header>

        <div className="px-5 pt-4 pb-10">
          {step === 1 && (
            <>
              <div style={{ fontSize: 13, color: INK, lineHeight: 1.55 }}>
                Për siguri, shkruaj fjalëkalimin tënd për të ndryshuar email-in.
              </div>
              <div style={{ position: "relative", marginTop: 18 }}>
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="Fjalëkalimi juaj"
                  autoFocus
                  autoComplete="current-password"
                  style={{ ...inputBox, paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "Fshih" : "Shfaq"}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: 0,
                    bottom: 0,
                    display: "flex",
                    alignItems: "center",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <i
                    className={`ti ${showPw ? "ti-eye-off" : "ti-eye"}`}
                    style={{ fontSize: 18, color: MUTED }}
                  />
                </button>
              </div>
              {error && (
                <div style={{ fontSize: 12, color: RED, marginTop: 8 }}>{error}</div>
              )}
              <button
                style={{
                  ...btnDark,
                  marginTop: 20,
                  opacity: verifying || !password ? 0.6 : 1,
                }}
                disabled={verifying || !password}
                onClick={verifyPassword}
              >
                {verifying ? "Duke verifikuar…" : "Vazhdo"}
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div style={{ fontSize: 13, color: INK, lineHeight: 1.55 }}>
                Do të dërgojmë një link konfirmimi te adresa e re. Email-i i llogarisë do të ndryshojë vetëm pasi ta klikosh atë link.
              </div>
              <div style={{ marginTop: 18 }}>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => {
                    setNewEmail(e.target.value);
                    setError(null);
                  }}
                  placeholder="email@shembull.com"
                  autoFocus
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  style={inputBox}
                />
              </div>
              {error && (
                <div style={{ fontSize: 12, color: RED, marginTop: 8 }}>{error}</div>
              )}
              <button
                style={{
                  ...btnDark,
                  marginTop: 20,
                  opacity: submitting || !newEmail.trim() ? 0.6 : 1,
                }}
                disabled={submitting || !newEmail.trim()}
                onClick={submitEmail}
              >
                {submitting ? "Duke dërguar…" : "Dërgo linkun e konfirmimit"}
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <div style={{ fontSize: 14, color: INK, lineHeight: 1.55 }}>
                Dërguam një link konfirmimi te <b>{sentTo}</b>. Kliko linkun për ta aktivizuar
                këtë email si adresën tënde të re.
              </div>
              <button
                style={{ ...btnDark, marginTop: 24 }}
                onClick={() => navigate({ to: "/profile" })}
              >
                Në rregull
              </button>
            </>
          )}
        </div>
      </div>
    </MobileShell>
  );
}
