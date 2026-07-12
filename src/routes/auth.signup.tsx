import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/signup")({
  ssr: false,
  component: SignupPage,
});

const CREAM = "#f6f1e7";
const CARD = "#ede8de";
const INK = "#1a1a1a";
const MUTED = "#a89f94";
const CORAL = "#e8826a";
const DIVIDER = "#ddd8ce";
const ERR = "#e53935";

function Field({
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
        autoCapitalize={type === "email" || type === "password" ? "none" : "words"}
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
      {right ? <div className="absolute right-3 top-1/2 -translate-y-1/2">{right}</div> : null}
    </div>
  );
}

function SignupPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showP, setShowP] = useState(false);
  const [showC, setShowC] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ field?: "email" | "password" | "confirm"; msg: string; withLogin?: boolean } | null>(null);

  const allFilled =
    displayName.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 8 &&
    confirm.length >= 8;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError({ field: "password", msg: "Fjalëkalimi duhet të ketë të paktën 8 karaktere" });
      return;
    }
    if (password !== confirm) {
      setError({ field: "confirm", msg: "Fjalëkalimet nuk përputhen" });
      return;
    }
    setLoading(true);
    try {
      const { data, error: authErr } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: window.location.origin + "/onboarding",
          data: { full_name: displayName.trim() },
        },
      });
      if (authErr) throw authErr;
      if (data.session) {
        await router.invalidate();
        navigate({ to: "/onboarding", replace: true });
      } else {
        setError({ msg: "Kontrollo emailin për të konfirmuar llogarinë" });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message.toLowerCase() : "";
      if (msg.includes("already") || msg.includes("registered")) {
        setError({
          field: "email",
          msg: "Ky email është tashmë i regjistruar.",
          withLogin: true,
        });
      } else {
        setError({ msg: err instanceof Error ? err.message : "Regjistrimi dështoi" });
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
            Regjistrohu
          </h1>
          <p className="mt-1 text-sm" style={{ color: MUTED }}>
            Krijo llogarinë tënde falas
          </p>
        </div>

        <form onSubmit={submit} className="mt-8 space-y-3">
          <Field
            value={displayName}
            onChange={setDisplayName}
            placeholder="Astrit Hasanaj"
            autoComplete="name"
          />
          <Field
            type="email"
            value={email}
            onChange={(v) => {
              setEmail(v);
              if (error?.field === "email") setError(null);
            }}
            placeholder="adresa@email.com"
            error={error?.field === "email"}
            autoComplete="email"
          />
          {error?.field === "email" && (
            <p className="px-1 text-xs" style={{ color: ERR }}>
              {error.msg}
              {error.withLogin && (
                <>
                  {" "}
                  <Link to="/auth/login" className="font-semibold underline" style={{ color: CORAL }}>
                    Hyr këtu
                  </Link>
                </>
              )}
            </p>
          )}
          <Field
            type={showP ? "text" : "password"}
            value={password}
            onChange={(v) => {
              setPassword(v);
              if (error?.field === "password" || error?.field === "confirm") setError(null);
            }}
            placeholder="Fjalëkalimi (min 8)"
            error={error?.field === "password"}
            autoComplete="new-password"
            right={
              <button type="button" onClick={() => setShowP((v) => !v)} style={{ color: MUTED }}>
                {showP ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />
          {error?.field === "password" && (
            <p className="px-1 text-xs" style={{ color: ERR }}>
              {error.msg}
            </p>
          )}
          <Field
            type={showC ? "text" : "password"}
            value={confirm}
            onChange={(v) => {
              setConfirm(v);
              if (error?.field === "confirm") setError(null);
            }}
            placeholder="Konfirmo fjalëkalimin"
            error={error?.field === "confirm"}
            autoComplete="new-password"
            right={
              <button type="button" onClick={() => setShowC((v) => !v)} style={{ color: MUTED }}>
                {showC ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />
          {error?.field === "confirm" && (
            <p className="px-1 text-xs" style={{ color: ERR }}>
              {error.msg}
            </p>
          )}
          {error && !error.field && (
            <p className="px-1 text-xs" style={{ color: ERR }}>
              {error.msg}
            </p>
          )}

          <p className="pt-2 text-center text-xs" style={{ color: MUTED }}>
            Duke u regjistruar, pranon{" "}
            <a className="underline" style={{ color: MUTED }} href="#">
              Kushtet e shërbimit
            </a>{" "}
            dhe{" "}
            <a className="underline" style={{ color: MUTED }} href="#">
              Politikën e privatësisë
            </a>
          </p>

          <button
            type="submit"
            disabled={!allFilled || loading}
            className="mt-2 w-full text-[15px] font-bold text-white transition active:scale-[0.98]"
            style={{
              background: allFilled ? CORAL : DIVIDER,
              color: "#fff",
              height: 54,
              borderRadius: 14,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Duke krijuar..." : "Krijo llogari"}
          </button>

          <p className="pt-3 text-center text-sm" style={{ color: MUTED }}>
            Ke tashmë llogari?{" "}
            <Link to="/auth/login" className="font-semibold" style={{ color: CORAL }}>
              Hyr
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
