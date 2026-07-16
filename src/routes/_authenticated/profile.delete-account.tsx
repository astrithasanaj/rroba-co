import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { deleteMyAccount } from "@/lib/delete-account.functions";
import { MobileShell } from "@/components/marketplace/MobileShell";

export const Route = createFileRoute("/_authenticated/profile/delete-account")({
  ssr: false,
  component: DeleteAccountPage,
});

const CREAM = "#ffffff";
const CARD = "#ffffff";
const INK = "#2d1521";
const MUTED = "#a89f94";
const RED = "#e53935";

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
    supabase.auth.getUser().then(({ data }) => {
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
    if (!email || !password) return;
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

  const btnRed: React.CSSProperties = {
    backgroundColor: RED,
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
    step === 1 ? "Fshij llogarinë?" : step === 2 ? "Konfirmo identitetin tënd" : "A je i sigurt?";

  if (isDeleting) {
    return (
      <div
        className="fixed inset-0 z-[90] flex flex-col items-center justify-center"
        style={{ backgroundColor: CREAM }}
      >
        <div
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
              <button style={{ ...btnRed, marginTop: 24 }} onClick={() => setStep(2)}>
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
                  ...btnRed,
                  marginTop: 20,
                  opacity: verifying || !password ? 0.6 : 1,
                }}
                disabled={verifying || !password}
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
              <button style={{ ...btnRed, marginTop: 24 }} onClick={performDelete}>
                Po, fshij llogarinë time
              </button>
            </>
          )}
        </div>
      </div>
    </MobileShell>
  );
}
