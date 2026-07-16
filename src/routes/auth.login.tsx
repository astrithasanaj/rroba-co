import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

const CREAM = "#ffffff";
const CARD = "#ffffff";
const INK = "#2d1521";
const MUTED = "#a89f94";
const CORAL = "#c65a7a";
const ERR = "#e53935";

function AuthField({
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  right,
  autoComplete,
}: {
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: boolean;
  right?: React.ReactNode;
  autoComplete?: string;
}) {
  return (
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        autoCapitalize="none"
        autoCorrect="off"
        className="w-full text-[15px] outline-none"
        style={{
          background: CARD,
          color: INK,
          height: 52,
          borderRadius: 12,
          padding: right ? "0 44px 0 16px" : "0 16px",
          outline: error ? `2px solid ${ERR}` : undefined,
        }}
      />
      {right ? (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">{right}</div>
      ) : null}
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
    <div className="w-full" style={{ position: "absolute", inset: 0, overflowY: "auto", background: CREAM }}>

      <div className="mx-auto w-full max-w-[420px] px-6 pb-10 pt-4">
        <button
          onClick={() => window.history.back()}
          aria-label="Kthehu"
          className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full"
          style={{ color: INK }}
        >
          <ArrowLeft size={22} />
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

        <form onSubmit={submit} className="mt-8 space-y-3">
          <AuthField
            type="email"
            value={email}
            onChange={(v) => {
              setEmail(v);
              setEmailErr("");
            }}
            placeholder="adresa@email.com"
            error={!!emailErr}
            autoComplete="email"
          />
          {emailErr && (
            <p className="px-1 text-xs" style={{ color: ERR }}>
              {emailErr}
            </p>
          )}
          <AuthField
            type={showPass ? "text" : "password"}
            value={password}
            onChange={(v) => {
              setPassword(v);
              setPassErr("");
            }}
            placeholder="Fjalëkalimi"
            error={!!passErr}
            autoComplete="current-password"
            right={
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                aria-label="Toggle"
                style={{ color: MUTED }}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />
          {passErr && (
            <p className="px-1 text-xs" style={{ color: ERR }}>
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
