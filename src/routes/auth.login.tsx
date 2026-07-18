import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/auth/login")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    next: typeof s.next === "string" ? s.next : undefined,
  }),
  component: LoginPage,
});

function safeNext(next: string | undefined): string | null {
  if (!next) return null;
  if (!next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

const CREAM = "var(--brand-surface)";
const CARD = "var(--brand-surface)";
const INK = "var(--brand-ink)";
const MUTED = "var(--brand-ink-muted)";
const CORAL = "var(--brand-rose)";
const DIVIDER = "var(--brand-border)";
const ERR = "var(--brand-danger)";
const FOCUS_RING = "0 0 0 3px rgba(198,90,122,0.35)";

function AuthField({
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  right,
  autoComplete,
  ariaLabel,
  id,
  errorId,
  inputMode,
  enterKeyHint,
}: {
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: boolean;
  right?: React.ReactNode;
  autoComplete?: string;
  ariaLabel?: string;
  id?: string;
  errorId?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  enterKeyHint?: React.HTMLAttributes<HTMLInputElement>["enterKeyHint"];
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        enterKeyHint={enterKeyHint}
        autoCapitalize="none"
        autoCorrect="off"
        aria-label={ariaLabel ?? placeholder}
        aria-invalid={error || undefined}
        aria-describedby={error && errorId ? errorId : undefined}
        className="w-full text-[15px] outline-none"
        style={{
          background: CARD,
          color: INK,
          height: 52,
          borderRadius: 12,
          padding: right ? "0 44px 0 16px" : "0 16px",
          border: `1px solid ${error ? ERR : focused ? INK : DIVIDER}`,
          boxShadow: focused && !error ? `0 0 0 3px ${CORAL}33` : "none",
          transition: "border-color 120ms ease, box-shadow 120ms ease",
        }}
      />
      {right ? <div className="absolute right-3 top-1/2 -translate-y-1/2">{right}</div> : null}
    </div>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const { next } = Route.useSearch();
  const nextPath = safeNext(next);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailErr, setEmailErr] = useState("");
  const [passErr, setPassErr] = useState("");
  const [appleErr, setAppleErr] = useState("");
  const [appleLoading, setAppleLoading] = useState(false);

  const handleApple = async () => {
    setAppleErr("");
    setAppleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("apple", {
        redirect_uri: `${window.location.origin}/auth/callback`,
      });
      if (result.error) {
        setAppleErr("Diçka shkoi keq me hyrjen përmes Apple. Provo përsëri.");
        setAppleLoading(false);
        return;
      }
      if (result.redirected) return;
      navigate({ to: "/auth/callback", replace: true });
    } catch {
      setAppleErr("Diçka shkoi keq me hyrjen përmes Apple. Provo përsëri.");
      setAppleLoading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailErr("");
    setPassErr("");
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) throw error;
      if (!data.session) throw new Error("no session");
      const { data: prof } = await supabase
        .from("profiles")
        .select("onboarding_completed, is_blocked" as any)
        .eq("id", data.user!.id)
        .maybeSingle();
      if ((prof as any)?.is_blocked) {
        await supabase.auth.signOut();
        navigate({ to: "/blocked", replace: true });
        return;
      }
      await router.invalidate();
      if (nextPath) {
        window.location.href = nextPath;
        return;
      }
      if ((prof as any)?.onboarding_completed) {
        navigate({ to: "/", replace: true });
      } else {
        navigate({ to: "/onboarding", replace: true });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message.toLowerCase() : "";
      if (msg.includes("invalid login") || msg.includes("invalid")) {
        setPassErr("Fjalëkalimi është i gabuar");
      } else if (msg.includes("not found") || msg.includes("user")) {
        setEmailErr("Nuk gjetëm asnjë llogari me këtë email");
      } else {
        setPassErr("Hyrja dështoi. Provo përsëri.");
      }
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

        <div className="mt-4">
          <h1
            className="italic"
            style={{
              fontFamily: '"Instrument Serif", serif',
              fontSize: 30,
              color: INK,
              fontWeight: 400,
            }}
          >
            Hyr
          </h1>
          <p className="mt-1 text-sm" style={{ color: MUTED }}>
            Mirë se vjen përsëri
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={handleApple}
            disabled={appleLoading}
            className="flex h-[52px] w-full items-center justify-center gap-2 text-[15px] font-semibold transition disabled:opacity-60 active:scale-[0.98]"
            style={{ background: "#000", color: "#fff", borderRadius: 14 }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 384 512"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zM256.6 84.4c30.2-35.8 27.5-68.4 26.6-80.4-26.7 1.5-57.6 18.2-75.2 38.7-19.4 22-30.8 49.2-28.4 79.9 28.9 2.2 55.3-12.6 76.9-38.2z" />
            </svg>
            {appleLoading ? "Duke hyrë..." : "Vazhdo me Apple"}
          </button>
          {appleErr && (
            <p className="px-1 text-xs" style={{ color: ERR }}>
              {appleErr}
            </p>
          )}
          <div className="flex items-center gap-3 pt-1">
            <div className="h-px flex-1" style={{ background: DIVIDER }} />
            <span className="text-[12px]" style={{ color: MUTED }}>
              ose
            </span>
            <div className="h-px flex-1" style={{ background: DIVIDER }} />
          </div>
        </div>

        <form onSubmit={submit} className="mt-8 space-y-3" noValidate>
          <AuthField
            id="login-email"
            type="email"
            value={email}
            onChange={(v) => {
              setEmail(v);
              setEmailErr("");
            }}
            placeholder="adresa@email.com"
            ariaLabel="Adresa e emailit"
            error={!!emailErr}
            errorId="login-email-err"
            autoComplete="email"
            inputMode="email"
            enterKeyHint="next"
          />
          {emailErr && (
            <p id="login-email-err" role="alert" className="px-1 text-xs" style={{ color: ERR }}>
              {emailErr}
            </p>
          )}
          <AuthField
            id="login-password"
            type={showPass ? "text" : "password"}
            value={password}
            onChange={(v) => {
              setPassword(v);
              setPassErr("");
            }}
            placeholder="Fjalëkalimi"
            ariaLabel="Fjalëkalimi"
            error={!!passErr}
            errorId="login-pass-err"
            autoComplete="current-password"
            enterKeyHint="go"
            right={
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                aria-label={showPass ? "Fshih fjalëkalimin" : "Shfaq fjalëkalimin"}
                aria-pressed={showPass}
                className="grid h-11 w-11 place-items-center rounded-full transition active:scale-90"
                style={{ color: MUTED }}
              >
                {showPass ? (
                  <EyeOff size={18} aria-hidden="true" />
                ) : (
                  <Eye size={18} aria-hidden="true" />
                )}
              </button>
            }
          />
          {passErr && (
            <p id="login-pass-err" role="alert" className="px-1 text-xs" style={{ color: ERR }}>
              {passErr}
            </p>
          )}

          <div className="flex justify-end pt-1">
            <Link
              to="/auth/forgot-password"
              className="text-[13px] underline"
              style={{ color: INK }}
            >
              Ke harruar fjalëkalimin?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="mt-4 w-full text-[15px] font-bold transition disabled:opacity-50 active:scale-[0.98]"
            style={{
              background: INK,
              color: "#fff",
              height: 54,
              borderRadius: 14,
            }}
          >
            {loading ? "Duke pritur..." : "Hyr"}
          </button>

          <p className="pt-3 text-center text-sm" style={{ color: MUTED }}>
            Nuk ke llogari?{" "}
            <Link to="/auth/signup-full" className="font-semibold" style={{ color: CORAL }}>
              Regjistrohu
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
