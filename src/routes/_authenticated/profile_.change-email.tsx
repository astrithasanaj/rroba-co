import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser } from "@/hooks/useCurrentUser";
import { MobileShell } from "@/components/marketplace/MobileShell";
import { useTranslation } from "@/i18n";

export const Route = createFileRoute("/_authenticated/profile_/change-email")({
  ssr: false,
  component: ChangeEmailPage,
});

const CREAM = "#ffffff";
const INK = "#2d1521";
const MUTED = "#a89f94";
const RED = "#e53935";

function ChangeEmailPage() {
  const router = useRouter();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [currentEmail, setCurrentEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState("");

  useEffect(() => {
    getCurrentUser().then((user) => {
      if (user?.email) setCurrentEmail(user!.email);
      else navigate({ to: "/profile" });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      setError(t("membership_page.change_email_wrong_password"));
      return;
    }
    setStep(2);
  };

  const submitEmail = async () => {
    const trimmed = newEmail.trim();
    if (!trimmed) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError(t("membership_page.change_email_invalid"));
      return;
    }
    if (trimmed.toLowerCase() === currentEmail.toLowerCase()) {
      setError(t("membership_page.change_email_same"));
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
        setError(t("membership_page.change_email_taken"));
      } else if (msg.includes("invalid")) {
        setError(t("membership_page.change_email_invalid"));
      } else {
        setError(t("membership_page.change_email_generic_error"));
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
    background: "#ffffff",
    border: "none",
    borderRadius: 12,
    padding: "0 16px",
    fontSize: 15,
    color: INK,
    outline: "none",
  };

  const title =
    step === 1
      ? t("membership_page.change_email_title_step1")
      : step === 2
        ? t("membership_page.change_email_title_step2")
        : t("membership_page.change_email_title_step3");

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
            aria-label={t("membership_page.change_email_back")}
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
            <ChevronLeft size={22} color="#2d1521" strokeWidth={2} />
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
                {t("membership_page.change_email_step1_desc")}
              </div>
              <div style={{ position: "relative", marginTop: 18 }}>
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder={t("membership_page.change_email_password_ph")}
                  autoFocus
                  autoComplete="current-password"
                  style={{ ...inputBox, paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={
                    showPw
                      ? t("membership_page.change_email_hide")
                      : t("membership_page.change_email_show")
                  }
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
                {verifying
                  ? t("membership_page.change_email_verifying")
                  : t("membership_page.change_email_continue")}
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div style={{ fontSize: 13, color: INK, lineHeight: 1.55 }}>
                {t("membership_page.change_email_step2_desc")}
              </div>
              <div style={{ marginTop: 18 }}>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => {
                    setNewEmail(e.target.value);
                    setError(null);
                  }}
                  placeholder={t("membership_page.change_email_new_ph")}
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
                {submitting
                  ? t("membership_page.change_email_sending")
                  : t("membership_page.change_email_send_link")}
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <div
                style={{ fontSize: 14, color: INK, lineHeight: 1.55 }}
                dangerouslySetInnerHTML={{
                  __html: t("membership_page.change_email_step3_desc", { email: sentTo }),
                }}
              />
              <button
                style={{ ...btnDark, marginTop: 24 }}
                onClick={() => navigate({ to: "/profile" })}
              >
                {t("membership_page.change_email_ok")}
              </button>
            </>
          )}
        </div>
      </div>
    </MobileShell>
  );
}
