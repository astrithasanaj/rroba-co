import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronLeft, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { CityPicker } from "@/components/marketplace/CityPicker";

export const Route = createFileRoute("/auth/signup-full")({
  ssr: false,
  component: SignupFullPage,
});

const CREAM = "var(--brand-surface)";
const CARD = "var(--brand-surface)";
const INK = "var(--brand-ink)";
const MUTED = "var(--brand-ink-muted)";
const CORAL = "var(--brand-rose)";
const DIVIDER = "var(--brand-border)";
const ERR = "var(--brand-danger)";

const COUNTRY_CODES: { code: string; flag: string; name: string }[] = [
  { code: "+383", flag: "🇽🇰", name: "Kosovo" },
  { code: "+355", flag: "🇦🇱", name: "Shqipëri" },
  { code: "+389", flag: "🇲🇰", name: "Maqedoni e V." },
  { code: "+47", flag: "🇳🇴", name: "Norvegji" },
  { code: "+46", flag: "🇸🇪", name: "Suedi" },
  { code: "+45", flag: "🇩🇰", name: "Danimarkë" },
  { code: "+49", flag: "🇩🇪", name: "Gjermani" },
  { code: "+41", flag: "🇨🇭", name: "Zvicër" },
  { code: "+43", flag: "🇦🇹", name: "Austri" },
  { code: "+39", flag: "🇮🇹", name: "Itali" },
  { code: "+33", flag: "🇫🇷", name: "Francë" },
  { code: "+44", flag: "🇬🇧", name: "Britani" },
  { code: "+1", flag: "🇺🇸", name: "SHBA" },
];

// City list moved to DB — see CityPicker/useCities

type Gender = "female" | "male";

type StrengthResult = {
  checks: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    notCommon: boolean;
  };
  score: number;
  isCommon: boolean;
  level: "weak" | "medium" | "good" | "strong";
};

const COMMON_PASSWORDS = [
  "password",
  "password1",
  "password123",
  "password1!",
  "12345678",
  "123456789",
  "1234567890",
  "qwerty",
  "qwerty123",
  "qwertyuiop",
  "abc12345",
  "iloveyou",
  "admin123",
  "admin1234",
  "letmein",
  "welcome1",
  "welcome123",
  "monkey123",
  "dragon",
  "master",
  "sunshine",
  "princess",
  "football",
  "shadow",
  "superman",
  "batman",
  "michael",
  "jessica",
  "jennifer",
  "111111111",
  "000000000",
  "aaaaaaaaa",
  "asdfghjkl",
  "zxcvbnm",
];

function checkPasswordStrength(password: string): StrengthResult {
  const lower = password.toLowerCase();
  const isCommon =
    password.length > 0 && COMMON_PASSWORDS.some((c) => lower === c || lower.includes(c));

  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    notCommon: !isCommon,
  };

  const passed = Object.values(checks).filter(Boolean).length;

  return {
    checks,
    score: passed,
    isCommon,
    level:
      isCommon || passed <= 2 ? "weak" : passed === 3 ? "medium" : passed === 4 ? "good" : "strong",
  };
}

function Field({
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  right,
  autoComplete,
  inputMode,
  enterKeyHint,
  disabled,
  ariaLabel,
  id,
  errorId,
}: {
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: boolean;
  right?: React.ReactNode;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  enterKeyHint?: React.HTMLAttributes<HTMLInputElement>["enterKeyHint"];
  disabled?: boolean;
  ariaLabel?: string;
  id?: string;
  errorId?: string;
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
        disabled={disabled}
        aria-label={ariaLabel ?? placeholder}
        aria-invalid={error || undefined}
        aria-describedby={error && errorId ? errorId : undefined}
        autoCapitalize={
          type === "email" || type === "password" || inputMode === "tel" ? "none" : "words"
        }
        autoCorrect="off"
        className="w-full text-[15px] outline-none disabled:opacity-60"
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

function Header({ step, onBack, title }: { step: 1 | 2 | 3; onBack: () => void; title: string }) {
  return (
    <>
      <button
        type="button"
        onClick={onBack}
        aria-label="Kthehu"
        className="grid h-11 w-11 place-items-center rounded-full transition-transform duration-150 active:scale-[0.97] focus:outline-none focus-visible:shadow-[0_0_0_3px_rgba(198,90,122,0.35)]"
        style={{
          color: INK,
          backgroundColor: "rgba(255,255,255,0.7)",
          border: "1px solid rgba(226,226,222,0.8)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
      >
        <ChevronLeft size={18} strokeWidth={2} aria-hidden="true" />
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
          {title}
        </h1>
        <p className="mt-1 text-sm" style={{ color: MUTED }}>
          Hapi {step} nga 3
        </p>
      </div>
    </>
  );
}

function SignupFullPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [globalErr, setGlobalErr] = useState("");
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

  // Step 1
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showP, setShowP] = useState(false);
  const [showC, setShowC] = useState(false);
  const [step1Err, setStep1Err] = useState<{
    email?: string;
    password?: string;
    confirm?: string;
  }>({});
  const strength = useMemo(() => checkPasswordStrength(password), [password]);
  const [supabasePasswordError, setSupabasePasswordError] = useState<string | null>(null);
  const [isCheckingPassword, setIsCheckingPassword] = useState(false);

  useEffect(() => {
    if (strength.level !== "strong" || password !== confirm) {
      setSupabasePasswordError(null);
      setIsCheckingPassword(false);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setIsCheckingPassword(true);
      try {
        const testEmail = `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@validation-check.invalid`;
        const { error } = await supabase.auth.signUp({
          email: testEmail,
          password,
        });
        if (cancelled) return;
        if (error) {
          const msg = error.message.toLowerCase();
          if (
            msg.includes("weak") ||
            msg.includes("easy to guess") ||
            msg.includes("pwned") ||
            msg.includes("compromised") ||
            (msg.includes("password") && !msg.includes("email"))
          ) {
            setSupabasePasswordError(
              "Fjalëkalimi është shumë i zakonshëm. Provo një kombinim të ndryshëm.",
            );
          } else {
            setSupabasePasswordError(null);
          }
        } else {
          setSupabasePasswordError(null);
        }
      } catch {
        if (!cancelled) setSupabasePasswordError(null);
      } finally {
        if (!cancelled) setIsCheckingPassword(false);
      }
    }, 800);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [password, confirm, strength.level]);

  // Step 2
  const [countryCode, setCountryCode] = useState("+383");
  const [phone, setPhone] = useState("");
  const [phoneErr, setPhoneErr] = useState("");

  // Step 3
  const [dob, setDob] = useState("");
  const [city, setCity] = useState("");
  const [cityId, setCityId] = useState<string | null>(null);
  const [gender, setGender] = useState<Gender | "">("");
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "ok" | "taken" | "invalid"
  >("idle");
  const [terms, setTerms] = useState(false);
  const [ageErr, setAgeErr] = useState("");

  const maxDob = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 16);
    return d.toISOString().slice(0, 10);
  }, []);

  // Real-time username availability
  const usernameDebounce = useRef<number | null>(null);
  useEffect(() => {
    if (!username) {
      setUsernameStatus("idle");
      return;
    }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      setUsernameStatus("invalid");
      return;
    }
    setUsernameStatus("checking");
    if (usernameDebounce.current) window.clearTimeout(usernameDebounce.current);
    usernameDebounce.current = window.setTimeout(async () => {
      const { data, error } = await supabase.rpc("is_username_available" as any, {
        _username: username,
      });
      if (error) {
        setUsernameStatus("idle");
        return;
      }
      setUsernameStatus(data ? "ok" : "taken");
    }, 350);
    return () => {
      if (usernameDebounce.current) window.clearTimeout(usernameDebounce.current);
    };
  }, [username]);

  const validateStep1 = () => {
    const e: typeof step1Err = {};
    if (!email.trim()) e.email = "Emaili është i detyrueshëm";
    if (strength.level !== "strong")
      e.password = "Fjalëkalimi duhet të përmbushë të gjitha kriteret";
    if (password !== confirm) e.confirm = "Fjalëkalimet nuk përputhen";
    setStep1Err(e);
    return Object.keys(e).length === 0;
  };

  const step1Filled =
    firstName.trim() &&
    lastName.trim() &&
    email.trim() &&
    strength.level === "strong" &&
    password === confirm &&
    supabasePasswordError === null &&
    !isCheckingPassword;

  const step2Filled = phone.trim().length >= 6;

  const validateAge = (d: string) => {
    if (!d) return false;
    const dob = new Date(d);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age -= 1;
    return age >= 16;
  };

  const step3Filled =
    dob && cityId && gender && username && usernameStatus === "ok" && terms && validateAge(dob);

  const nextFromStep1 = () => {
    if (!validateStep1() || !step1Filled) return;
    setGlobalErr("");
    setStep(2);
  };

  const nextFromStep2 = async () => {
    setPhoneErr("");
    setGlobalErr("");
    if (!step2Filled) return;
    const fullPhone = countryCode + phone.replace(/\s+/g, "");
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("is_signup_blocked" as any, {
        _email: email.trim().toLowerCase(),
        _phone: fullPhone,
      });
      if (error) throw error;
      if (data) {
        setGlobalErr(
          "Ky account është bllokuar. Nëse mendoni se kjo është gabim, kontaktoni support@rroba.app",
        );
        return;
      }
      setStep(3);
    } catch (err) {
      setGlobalErr(err instanceof Error ? err.message : "Gabim");
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    setGlobalErr("");
    setAgeErr("");
    setStep1Err({});
    if (!validateAge(dob)) {
      setAgeErr("Duhet të jesh të paktën 16 vjeç për t'u regjistruar.");
      return;
    }
    if (!terms || usernameStatus !== "ok") return;
    setLoading(true);
    const fullPhone = countryCode + phone.replace(/\s+/g, "");
    try {
      const emailLc = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signUp({
        email: emailLc,
        password,
        options: {
          emailRedirectTo: window.location.origin + "/auth/callback",
          data: {
            full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
            first_name: firstName.trim(),
            last_name: lastName.trim(),
          },
        },
      });
      if (error) throw error;
      if (!data.user) throw new Error("Regjistrimi dështoi");

      const nameFull = `${firstName.trim()} ${lastName.trim()}`.trim();
      const genderMap: Record<Gender, string> = {
        female: "Femër",
        male: "Mashkull",
        unspecified: "Preferoj të mos specifikoj",
      };
      const patch: Record<string, unknown> = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        name: nameFull,
        display_name: nameFull,
        username,
        phone: fullPhone,
        phone_verified: false,
        date_of_birth: dob,
        city,
        city_id: cityId,
        gender: genderMap[gender as Gender],
        signup_device:
          typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : "unknown",
        terms_accepted_at: new Date().toISOString(),
      };

      if (data.session) {
        const { error: upErr } = await supabase
          .from("profiles")
          .update(patch as any)
          .eq("id", data.user.id);
        if (upErr) console.error(upErr);
        await router.invalidate();
        navigate({ to: "/onboarding", replace: true });
      } else {
        try {
          localStorage.setItem("rroba_pending_profile", JSON.stringify(patch));
          localStorage.setItem("rroba_pending_email", emailLc);
        } catch {
          /* ignore */
        }
        navigate({ to: "/auth/confirm-email", search: { email: emailLc } as any, replace: true });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message.toLowerCase() : "";
      const isWeakPassword =
        (err &&
          typeof err === "object" &&
          "code" in err &&
          (err as { code?: string }).code === "weak_password") ||
        msg.includes("pwned") ||
        msg.includes("weak") ||
        msg.includes("easy to guess");

      if (isWeakPassword) {
        setStep1Err({
          password:
            "Ky fjalëkalim është identifikuar si i pasigurt (është gjetur në rrjedhje të dhënash të mëparshme). Ju lutem zgjidhni një fjalëkalim tjetër.",
        });
      } else if (msg.includes("already") || msg.includes("registered")) {
        setGlobalErr("Ky email është tashmë i regjistruar.");
      } else {
        setGlobalErr("Diçka shkoi keq. Provo sërish ose kontakto mbështetjen.");
      }
    } finally {
      setLoading(false);
    }
  };

  const back = () => {
    if (step === 1) window.history.back();
    else setStep((s) => (s === 3 ? 2 : 1));
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
        <Header
          step={step}
          onBack={back}
          title={
            step === 1 ? "Krijo llogarinë" : step === 2 ? "Numri i telefonit" : "Detajet e profilit"
          }
        />

        {/* Step 1 */}
        {step === 1 && (
          <>
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
            <form
              onSubmit={(e) => {
                e.preventDefault();
                nextFromStep1();
              }}
              className="mt-4 space-y-3"
            >
              <Field
                value={firstName}
                onChange={setFirstName}
                placeholder="Emri"
                autoComplete="given-name"
              />
              <Field
                value={lastName}
                onChange={setLastName}
                placeholder="Mbiemri"
                autoComplete="family-name"
              />
              <Field
                type="email"
                value={email}
                onChange={(v) => {
                  setEmail(v);
                  setStep1Err((s) => ({ ...s, email: undefined }));
                }}
                placeholder="Email"
                autoComplete="email"
                error={!!step1Err.email}
              />
              {step1Err.email && (
                <p className="px-1 text-xs" style={{ color: ERR }}>
                  {step1Err.email}
                </p>
              )}
              <Field
                type={showP ? "text" : "password"}
                value={password}
                onChange={(v) => {
                  setPassword(v);
                  setStep1Err((s) => ({ ...s, password: undefined, confirm: undefined }));
                }}
                placeholder="Fjalëkalimi (min 8)"
                autoComplete="new-password"
                error={!!step1Err.password}
                right={
                  <button
                    type="button"
                    onClick={() => setShowP((v) => !v)}
                    aria-label={showP ? "Fshih fjalëkalimin" : "Shfaq fjalëkalimin"}
                    aria-pressed={showP}
                    className="grid h-11 w-11 place-items-center rounded-full transition active:scale-[0.97] disabled:active:scale-100 focus:outline-none focus-visible:shadow-[0_0_0_3px_rgba(198,90,122,0.35)]"
                    style={{ color: MUTED }}
                  >
                    {showP ? (
                      <EyeOff size={18} aria-hidden="true" />
                    ) : (
                      <Eye size={18} aria-hidden="true" />
                    )}
                  </button>
                }
              />
              {step1Err.password && (
                <p className="px-1 text-xs" style={{ color: ERR }}>
                  {step1Err.password}
                </p>
              )}
              {password.length > 0 && (
                <div className="space-y-2 px-1 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-medium" style={{ color: INK }}>
                      {strength.level === "weak" && "Fjalëkalim shumë i dobët"}
                      {strength.level === "medium" && "Fjalëkalim i mesëm"}
                      {strength.level === "good" && "Fjalëkalim i mirë"}
                      {strength.level === "strong" && "Fjalëkalim i fortë ✓"}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {[0, 1, 2, 3, 4].map((i) => {
                      const filled = i < strength.score;
                      const color =
                        strength.isCommon || strength.score <= 2
                          ? "var(--brand-danger)"
                          : strength.score === 3
                            ? "var(--brand-warning)"
                            : strength.score === 4
                              ? "var(--brand-rose)"
                              : "var(--brand-success)";
                      return (
                        <div
                          key={i}
                          className="h-1.5 flex-1 rounded-full transition-all"
                          style={{ background: filled ? color : DIVIDER }}
                        />
                      );
                    })}
                  </div>
                  <div className="space-y-1 pt-1">
                    {[
                      { key: "length", label: "Të paktën 8 karaktere" },
                      { key: "uppercase", label: "Të paktën 1 shkronjë e madhe (A-Z)" },
                      { key: "lowercase", label: "Të paktën 1 shkronjë e vogël (a-z)" },
                      { key: "number", label: "Të paktën 1 numër (0-9)" },
                      { key: "notCommon", label: "Nuk është fjalëkalim i zakonshëm" },
                    ].map((item) => {
                      const ok = strength.checks[item.key as keyof typeof strength.checks];
                      return (
                        <div
                          key={item.key}
                          className="flex items-center gap-2 text-[12px]"
                          style={{ color: ok ? "var(--brand-success)" : MUTED }}
                        >
                          <span
                            className="flex h-4 w-4 items-center justify-center rounded-full text-[10px]"
                            style={{
                              background: ok ? "var(--brand-success)" : "transparent",
                              color: ok ? "#fff" : MUTED,
                              border: ok ? "none" : `1px solid ${DIVIDER}`,
                            }}
                          >
                            {ok ? "✓" : ""}
                          </span>
                          {item.label}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <Field
                type={showC ? "text" : "password"}
                value={confirm}
                onChange={(v) => {
                  setConfirm(v);
                  setStep1Err((s) => ({ ...s, confirm: undefined }));
                }}
                placeholder="Konfirmo fjalëkalimin"
                autoComplete="new-password"
                error={!!step1Err.confirm}
                right={
                  <button
                    type="button"
                    onClick={() => setShowC((v) => !v)}
                    aria-label={showC ? "Fshih fjalëkalimin" : "Shfaq fjalëkalimin"}
                    aria-pressed={showC}
                    className="grid h-11 w-11 place-items-center rounded-full transition active:scale-[0.97] disabled:active:scale-100 focus:outline-none focus-visible:shadow-[0_0_0_3px_rgba(198,90,122,0.35)]"
                    style={{ color: MUTED }}
                  >
                    {showC ? (
                      <EyeOff size={18} aria-hidden="true" />
                    ) : (
                      <Eye size={18} aria-hidden="true" />
                    )}
                  </button>
                }
              />
              {step1Err.confirm && (
                <p className="px-1 text-xs" style={{ color: ERR }}>
                  {step1Err.confirm}
                </p>
              )}
              <p className="px-1 text-[12px]" style={{ color: MUTED }}>
                Emri dhe mbiemri do të shfaqen në profilin tuaj publik.
              </p>
              {strength.level === "strong" && password === confirm && confirm.length > 0 && (
                <div
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-[12.5px]"
                  style={{
                    background: isCheckingPassword
                      ? CARD
                      : supabasePasswordError
                        ? "#fdecea"
                        : "#e8f5e9",
                    color: isCheckingPassword
                      ? MUTED
                      : supabasePasswordError
                        ? "var(--brand-danger)"
                        : "var(--brand-success)",
                  }}
                >
                  {isCheckingPassword ? (
                    <>
                      <span
                        style={{
                          width: 12,
                          height: 12,
                          border: `2px solid ${MUTED}`,
                          borderTopColor: "transparent",
                          borderRadius: "50%",
                          display: "inline-block",
                          animation: "signupSpin 700ms linear infinite",
                        }}
                      />
                      <span>Duke kontrolluar fjalëkalimin...</span>
                    </>
                  ) : supabasePasswordError ? (
                    <span>⚠️ {supabasePasswordError}</span>
                  ) : (
                    <span>Fjalëkalimi u pranua ✓</span>
                  )}
                </div>
              )}
              <style>{`@keyframes signupSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
              <button
                type="submit"
                disabled={!step1Filled}
                className="mt-2 w-full text-[15px] font-bold text-white transition disabled:opacity-50 active:scale-[0.98]"
                style={{ background: INK, color: "#fff", height: 52, borderRadius: 14 }}
              >
                {isCheckingPassword ? "Duke kontrolluar..." : "Vazhdo →"}
              </button>
              <p className="pt-3 text-center text-sm" style={{ color: MUTED }}>
                Ke tashmë llogari?{" "}
                <Link
                  to="/auth/login"
                  search={{ next: undefined }}
                  className="font-semibold"
                  style={{ color: CORAL }}
                >
                  Hyr
                </Link>
              </p>
            </form>
          </>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="mt-8 space-y-3">
            <div className="flex gap-2">
              <div className="relative">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  aria-label="Kodi i vendit"
                  className="appearance-none text-[15px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-rose)]/40"
                  style={{
                    background: CARD,
                    color: INK,
                    height: 52,
                    borderRadius: 12,
                    padding: "0 32px 0 12px",
                    minWidth: 110,
                    border: `1px solid ${DIVIDER}`,
                  }}
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <Field
                  value={phone}
                  onChange={(v) => {
                    setPhone(v.replace(/[^\d\s]/g, ""));
                    setPhoneErr("");
                  }}
                  placeholder="4X XXX XXX"
                  inputMode="tel"
                  autoComplete="tel-national"
                  error={!!phoneErr}
                />
              </div>
            </div>
            {phoneErr && (
              <p className="px-1 text-xs" style={{ color: ERR }}>
                {phoneErr}
              </p>
            )}
            <p className="px-1 text-[12px]" style={{ color: MUTED }}>
              Numri i telefonit do të lidhet me llogarinë tuaj për siguri shtesë.
            </p>
            {globalErr && (
              <p className="px-1 text-xs" style={{ color: ERR }}>
                {globalErr}
              </p>
            )}
            <button
              onClick={nextFromStep2}
              disabled={!step2Filled || loading}
              className="mt-2 w-full text-[15px] font-bold text-white transition disabled:opacity-50 active:scale-[0.98]"
              style={{ background: INK, color: "#fff", height: 52, borderRadius: 14 }}
            >
              {loading ? "Duke kontrolluar..." : "Vazhdo →"}
            </button>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="mt-8 space-y-4">
            <div>
              <label className="mb-1 block px-1 text-[13px]" style={{ color: MUTED }}>
                Data e lindjes
              </label>
              <input
                type="date"
                value={dob}
                max={maxDob}
                onChange={(e) => {
                  setDob(e.target.value);
                  setAgeErr("");
                }}
                className="w-full text-[15px] outline-none"
                style={{
                  background: CARD,
                  color: INK,
                  height: 52,
                  borderRadius: 12,
                  padding: "0 16px",
                }}
              />
              {ageErr && (
                <p className="mt-1 px-1 text-xs" style={{ color: ERR }}>
                  {ageErr}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block px-1 text-[13px]" style={{ color: MUTED }}>
                Qyteti
              </label>
              <CityPicker
                value={cityId}
                onChange={(id, c) => {
                  setCityId(id);
                  setCity(c.name);
                }}
              />
            </div>

            <div>
              <label className="mb-2 block px-1 text-[13px]" style={{ color: MUTED }}>
                Gjinia
              </label>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { v: "female", l: "Femër" },
                    { v: "male", l: "Mashkull" },
                    { v: "unspecified", l: "Preferoj të mos specifikoj" },
                  ] as { v: Gender; l: string }[]
                ).map((g) => (
                  <button
                    key={g.v}
                    type="button"
                    onClick={() => setGender(g.v)}
                    aria-pressed={gender === g.v}
                    className="min-h-11 text-[14px] transition active:scale-95"
                    style={{
                      background: gender === g.v ? INK : CARD,
                      color: gender === g.v ? "#fff" : INK,
                      borderRadius: 22,
                      padding: "0 18px",
                      border: `1px solid ${gender === g.v ? INK : DIVIDER}`,
                    }}
                  >
                    {g.l}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block px-1 text-[13px]" style={{ color: MUTED }}>
                Emri i shfaqur (@handle)
              </label>
              <div className="relative">
                <input
                  value={username}
                  onChange={(e) =>
                    setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase())
                  }
                  placeholder="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  className="w-full text-[15px] outline-none"
                  style={{
                    background: CARD,
                    color: INK,
                    height: 52,
                    borderRadius: 12,
                    padding: "0 44px 0 32px",
                  }}
                />
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[15px]"
                  style={{ color: MUTED }}
                >
                  @
                </span>
                <div
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                  style={{
                    color:
                      usernameStatus === "ok"
                        ? "var(--brand-success)"
                        : usernameStatus === "taken" || usernameStatus === "invalid"
                          ? ERR
                          : MUTED,
                  }}
                >
                  {usernameStatus === "checking"
                    ? "..."
                    : usernameStatus === "ok"
                      ? "✓"
                      : usernameStatus === "taken"
                        ? "e zënë"
                        : usernameStatus === "invalid"
                          ? "3–20 shkr."
                          : ""}
                </div>
              </div>
            </div>

            <label className="flex items-start gap-3 px-1 pt-2">
              <button
                type="button"
                role="checkbox"
                aria-checked={terms}
                aria-label="Pranoj kushtet e shërbimit dhe politikën e privatësisë"
                onClick={() => setTerms((v) => !v)}
                className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center transition active:scale-[0.97] focus:outline-none focus-visible:shadow-[0_0_0_3px_rgba(198,90,122,0.35)]"
                style={{
                  background: terms ? INK : "transparent",
                  border: `1.5px solid ${terms ? INK : DIVIDER}`,
                  borderRadius: 5,
                }}
              >
                {terms && <Check size={14} color="#fff" aria-hidden="true" />}
              </button>
              <span className="text-[13px]" style={{ color: INK }}>
                Pranoj{" "}
                <Link to="/terms" className="underline" onClick={(e) => e.stopPropagation()}>
                  kushtet e shërbimit
                </Link>{" "}
                dhe{" "}
                <Link to="/privacy" className="underline" onClick={(e) => e.stopPropagation()}>
                  politikën e privatësisë
                </Link>{" "}
                së Rroba.
              </span>
            </label>

            {globalErr && (
              <p
                className="rounded-xl px-3 py-2 text-[13px]"
                style={{ background: "#fdecea", color: "#b71c1c" }}
              >
                ⚠️ {globalErr}
              </p>
            )}

            <button
              onClick={submit}
              disabled={!step3Filled || loading}
              className="mt-2 w-full text-[15px] font-bold text-white transition disabled:opacity-50 active:scale-[0.98]"
              style={{ background: CORAL, color: "#fff", height: 54, borderRadius: 14 }}
            >
              {loading ? "Duke krijuar..." : "Krijo llogarinë →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
