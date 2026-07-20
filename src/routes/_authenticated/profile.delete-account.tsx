import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { deleteMyAccount } from "@/lib/delete-account.functions";
import { MobileShell } from "@/components/marketplace/MobileShell";

export const Route = createFileRoute("/_authenticated/profile/delete-account")({
  ssr: false,
  component: DeleteAccountPage,
});

const SURFACE = "var(--brand-surface)";
const INK = "var(--brand-ink)";
const MUTED = "var(--brand-ink-secondary)";
const DANGER = "var(--brand-danger)";
const GLASS_BG = "rgba(255,255,255,0.7)";
const GLASS_BORDER = "rgba(226,226,222,0.8)";

function DeleteAccountPage() {
  const router = useRouter();
  const navigate = useNavigate();
  const deleteFn = useServerFn(deleteMyAccount);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    getCurrentUser().then((user) => {
      if (data.user?.email) setEmail(data.user.email);
      else navigate({ to: "/profile" });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goBack = () => {
    if (verifying || isDeleting) return;
    if (step === 2 || step === 3) {
      setStep((step - 1) as 1 | 2);
      setError(null);
      return;
    }
    if (window.history.length > 1) router.history.back();
    else navigate({ to: "/profile" });
  };

  const verifyPassword = async () => {
    if (!email || !password || verifying) return;
    setVerifying(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setVerifying(false);
    if (err) {
      setError("Fjalëkalimi është i gabuar");
      return;
    }
    setStep(3);
  };

  const performDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteFn();
      await supabase.auth.signOut();
      toast.success("Llogaria juaj u fshi me sukses.");
      navigate({ to: "/auth" });
    } catch (e) {
      console.error(e);
      toast.error("Diçka shkoi keq. Provo sërish ose kontakto mbështetjen.");
      setIsDeleting(false);
    }
  };

  const btnDanger: React.CSSProperties = {
    backgroundColor: DANGER,
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
    background: SURFACE,
    border: "1px solid var(--brand-border)",
    borderRadius: 12,
    padding: "0 16px",
    fontSize: 15,
    color: INK,
    outline: "none",
  };

  const title =
    step === 1 ? "Fshij llogarinë?" : step === 2 ? "Konfirmo identitetin tënd" : "A je i sigurt?";

  if (isDeleting) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed inset-0 z-[90] flex flex-col items-center justify-center"
        style={{ backgroundColor: SURFACE }}
      >
        <div
          aria-hidden="true"
          style={{
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontSize: 36,
            color: INK,
            animation: "rroba-shimmer 1.4s ease-in-out infinite",
          }}
        >
          Rroba
        </div>
        <div style={{ fontSize: 13, color: MUTED, marginTop: 12 }}>
          Duke fshirë llogarinë...
        </div>
      </div>
    );
  }

  return (
    <MobileShell>
      <div style={{ background: SURFACE, minHeight: "100dvh" }}>
        <header
          className="sticky top-0 z-10 flex items-center justify-between px-4 py-3"
          style={{ background: SURFACE }}
        >
          <button
            type="button"
            onClick={goBack}
            aria-label="Kthehu"
            className="grid place-items-center rounded-full transition-transform duration-150 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              width: 44,
              height: 44,
              backgroundColor: GLASS_BG,
              border: `1px solid ${GLASS_BORDER}`,
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          >
            <ChevronLeft aria-hidden="true" size={18} color="var(--brand-ink)" strokeWidth={2} />
          </button>
          <h1 className="text-[15px] font-semibold" style={{ color: INK }}>
            {title}
          </h1>
          <div className="w-11" />
        </header>

        <div className="px-5 pt-4 pb-10">
          {step === 1 && (
            <>
              <div style={{ fontSize: 13, color: INK, lineHeight: 1.55 }}>
                Ky veprim është i pakthyeshëm. Të gjitha të dhënat tuaja do të fshihen përgjithmonë, duke përfshirë:
              </div>
              <ul style={{ fontSize: 13, color: INK, marginTop: 8, paddingLeft: 20, lineHeight: 1.7 }}>
                <li>Të gjitha njoftimet tuaja aktive</li>
                <li>Historikun e mesazheve</li>
                <li>Ofertat e dërguara dhe të marra</li>
                <li>Fotot e ngarkuara</li>
                <li>Informacionin e profilit</li>
                <li>Të dhënat e vlerësimeve</li>
              </ul>
              <div style={{ fontSize: 13, color: MUTED, marginTop: 12 }}>
                Kjo nuk mund të zhbëhet.
              </div>
              <button
                type="button"
                style={{ ...btnDanger, marginTop: 24 }}
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                onClick={() => setStep(2)}
              >
                Vazhdo
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div style={{ fontSize: 13, color: INK, lineHeight: 1.55 }}>
                Për siguri, shkruaj fjalëkalimin tënd për të vazhduar.
              </div>
              <div style={{ position: "relative", marginTop: 18 }}>
                <label htmlFor="delete-account-pw" className="sr-only">
                  Fjalëkalimi juaj
                </label>
                <input
                  id="delete-account-pw"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="Fjalëkalimi juaj"
                  autoFocus
                  autoComplete="current-password"
                  aria-invalid={!!error}
                  aria-describedby={error ? "delete-account-pw-err" : undefined}
                  style={{ ...inputBox, paddingRight: 48 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "Fshih fjalëkalimin" : "Shfaq fjalëkalimin"}
                  aria-pressed={showPw}
                  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    position: "absolute",
                    right: 4,
                    top: 4,
                    bottom: 4,
                    width: 44,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "transparent",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                >
                  <i
                    className={`ti ${showPw ? "ti-eye-off" : "ti-eye"}`}
                    aria-hidden="true"
                    style={{ fontSize: 18, color: MUTED }}
                  />
                </button>
              </div>
              {error && (
                <div
                  id="delete-account-pw-err"
                  role="alert"
                  style={{ fontSize: 12, color: DANGER, marginTop: 8 }}
                >
                  {error}
                </div>
              )}
              <button
                type="button"
                style={{
                  ...btnDanger,
                  marginTop: 20,
                  opacity: verifying || !password ? 0.6 : 1,
                }}
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                disabled={verifying || !password}
                aria-busy={verifying}
                onClick={verifyPassword}
              >
                {verifying ? "Duke verifikuar…" : "Konfirmo dhe vazhdo"}
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <div style={{ fontSize: 14, color: INK, lineHeight: 1.55 }}>
                Llogaria juaj do të fshihet brenda 30 ditëve sipas rregullores GDPR të BE-së. Deri atëherë, mund të anuloni kërkesën duke na kontaktuar.
              </div>
              <button
                type="button"
                style={{ ...btnDanger, marginTop: 24, opacity: isDeleting ? 0.6 : 1 }}
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                disabled={isDeleting}
                aria-busy={isDeleting}
                onClick={performDelete}
              >
                Po, fshij llogarinë time
              </button>
            </>
          )}
        </div>
      </div>
    </MobileShell>
  );
}
