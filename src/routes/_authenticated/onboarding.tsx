import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, Bell, Camera, Check, MessageCircle, Search, Shirt, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { compressImage, AVATAR_OPTIONS } from "@/utils/compressImage";
import { CityPicker } from "@/components/marketplace/CityPicker";
import { useCityById } from "@/hooks/useCities";

export const Route = createFileRoute("/_authenticated/onboarding")({
  ssr: false,
  component: OnboardingFlow,
});

const CREAM = "#ffffff";
const CHIP_BG = "#ffffff";
const DARK = "#2d1521";
const MUTED = "#a89f94";
const CORAL = "#c65a7a";
const DIVIDER = "#e2e2de";
const ERR = "#c94a3b";
const SUCCESS = "#2f9e6b";
const FOCUS_RING = "0 0 0 3px rgba(198,90,122,0.35)";
const SAFE_BOTTOM = "calc(1.5rem + env(safe-area-inset-bottom))";

// City list moved to DB — see CityPicker/useCities
const GENDERS = [
  { id: "women", label: "Femra" },
  { id: "men", label: "Meshkuj" },
  { id: "both", label: "Të dyja" },
];
const CATEGORIES = [
  "Veshje",
  "Këpucë",
  "Çanta",
  "Aksesorë",
  "Vintage",
  "Designer/Premium",
  "Outdoor & sport",
  "Fëmijë & bebe",
];
const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const SHOE_SIZES = ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45"];

const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function StepIndicator({ n }: { n: number }) {
  return (
    <span
      role="progressbar"
      aria-valuenow={n}
      aria-valuemin={1}
      aria-valuemax={5}
      aria-label={`Hapi ${n} nga 5`}
      className="text-xs font-medium"
      style={{ color: MUTED }}
    >
      {n} / 5
    </span>
  );
}

function TopBar({
  onBack,
  onSkip,
  step,
}: {
  onBack?: () => void;
  onSkip?: () => void;
  step: number;
}) {
  return (
    <div className="flex items-center justify-between px-5 pt-4 pb-2">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          aria-label="Kthehu"
          className="grid place-items-center rounded-full transition-transform duration-150 active:scale-90 focus:outline-none focus-visible:shadow-[0_0_0_3px_rgba(198,90,122,0.35)]"
          style={{
            width: 44,
            height: 44,
            backgroundColor: "rgba(255,255,255,0.7)",
            border: `1px solid ${DIVIDER}`,
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          <ChevronLeft size={18} color={DARK} strokeWidth={2} aria-hidden="true" />
        </button>
      ) : (
        <div className="h-11 w-11" />
      )}
      <div className="flex items-center gap-4">
        <StepIndicator n={step} />
        {onSkip ? (
          <button
            type="button"
            onClick={onSkip}
            aria-label="Kalo këtë hap"
            className="min-h-11 px-2 text-sm font-medium transition active:scale-95 focus:outline-none focus-visible:shadow-[0_0_0_3px_rgba(198,90,122,0.35)] rounded-md"
            style={{ color: MUTED, background: "transparent" }}
          >
            Kalo
          </button>
        ) : null}
      </div>
    </div>
  );
}

function BigButton({
  children,
  disabled,
  loading,
  onClick,
  variant = "primary",
  type = "button",
}: {
  children: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  variant?: "primary" | "ghost";
  type?: "button" | "submit";
}) {
  const isDisabled = disabled || loading;
  const base =
    "relative w-full rounded-full text-[15px] font-semibold transition disabled:opacity-40 disabled:active:scale-100 enabled:active:scale-[0.98] focus:outline-none focus-visible:shadow-[0_0_0_3px_rgba(198,90,122,0.35)]";
  const height = { height: 54, minHeight: 54 } as const;
  if (variant === "ghost") {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={base}
        style={{ background: "transparent", color: MUTED, ...height }}
      >
        <span style={{ visibility: loading ? "hidden" : "visible" }}>{children}</span>
        {loading && <Spinner colorHex={MUTED} />}
      </button>
    );
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={base}
      style={{ background: DARK, color: "#fff", ...height }}
    >
      <span style={{ visibility: loading ? "hidden" : "visible" }}>{children}</span>
      {loading && <Spinner colorHex="#ffffff" />}
    </button>
  );
}

function Spinner({ colorHex }: { colorHex: string }) {
  return (
    <span
      aria-hidden="true"
      className="absolute left-1/2 top-1/2 inline-block h-5 w-5 -translate-x-1/2 -translate-y-1/2 animate-spin rounded-full border-2"
      style={{ borderColor: colorHex, borderTopColor: "transparent" }}
    />
  );
}

function Chip({
  active,
  onClick,
  children,
  ariaLabel,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={ariaLabel}
      className="min-h-11 rounded-full px-4 text-sm font-medium transition active:scale-95 focus:outline-none focus-visible:shadow-[0_0_0_3px_rgba(198,90,122,0.35)]"
      style={{
        background: active ? DARK : CHIP_BG,
        color: active ? "#fff" : DARK,
        border: `1px solid ${active ? DARK : DIVIDER}`,
      }}
    >
      {children}
    </button>
  );
}


function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h1
      className="italic"
      style={{
        fontFamily: '"Instrument Serif", serif',
        fontSize: 32,
        lineHeight: 1.1,
        color: DARK,
        fontWeight: 400,
      }}
    >
      {children}
    </h1>
  );
}

function SubText({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm" style={{ color: MUTED }}>
      {children}
    </p>
  );
}

/* ---------- Step 0: Splash ---------- */
function StepSplash({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2000);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center"
      style={{ background: DARK }}
    >
      <div
        className="italic"
        style={{
          fontFamily: '"Instrument Serif", serif',
          color: CREAM,
          fontSize: 64,
          lineHeight: 1,
        }}
      >
        Rroba
      </div>
      <div className="mt-3 text-sm" style={{ color: MUTED }}>
        Moda e përdorur. Rilindur.
      </div>
      <div className="mt-8 flex items-center justify-center">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full animate-pulse"
          style={{ background: CORAL }}
        />
      </div>
    </div>
  );
}

/* ---------- Step 1: City ---------- */
function StepCity({
  value,
  onChange,
  onNext,
}: {
  value: string | null;
  onChange: (cityId: string, cityName: string) => void;
  onNext: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <TopBar step={1} />
      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-6">
        <Heading>Mirë se vjen!</Heading>
        <div className="mt-2">
          <SubText>Le të personalizojmë përvojën tënde</SubText>
        </div>
        <div className="mt-8">
          <div className="mb-3 text-sm font-semibold" style={{ color: DARK }}>
            Ku jeton?
          </div>
          <CityPicker
            value={value}
            onChange={(id, c) => onChange(id, c.name)}
          />
        </div>
      </div>
      <div className="px-5 pt-2" style={{ paddingBottom: SAFE_BOTTOM }}>
        <BigButton disabled={!value} onClick={onNext}>
          Vazhdo
        </BigButton>
      </div>
    </div>
  );
}


/* ---------- Step 2: Profile ---------- */
function StepProfile({
  userId,
  authName,
  displayName,
  setDisplayName,
  username,
  setUsername,
  avatarUrl,
  setAvatarUrl,
  bio,
  setBio,
  height,
  setHeight,
  onBack,
  onNext,
}: {
  userId: string;
  authName: string;
  displayName: string;
  setDisplayName: (v: string) => void;
  username: string;
  setUsername: (v: string) => void;
  avatarUrl: string | null;
  setAvatarUrl: (v: string | null) => void;
  bio: string;
  setBio: (v: string) => void;
  height: string;
  setHeight: (v: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("idle");

  useEffect(() => {
    if (!displayName && authName) setDisplayName(authName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced username check
  useEffect(() => {
    const raw = username.replace(/^@/, "").trim().toLowerCase();
    if (!raw) {
      setUsernameStatus("idle");
      return;
    }
    if (!/^[a-z0-9_.]{3,24}$/.test(raw)) {
      setUsernameStatus("invalid");
      return;
    }
    setUsernameStatus("checking");
    const t = setTimeout(async () => {
      const { data, error } = await supabase.rpc("is_username_available", { _username: raw });
      if (error) {
        setUsernameStatus("idle");
        return;
      }
      setUsernameStatus(data ? "available" : "taken");
    }, 400);
    return () => clearTimeout(t);
  }, [username, userId]);

  const pickAvatar = () => fileRef.current?.click();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!ALLOWED_MIME[file.type]) {
      toast.error("Përdor JPG, PNG ose WEBP");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Foto duhet të jetë nën 5MB");
      return;
    }
    setUploading(true);
    try {
      const compressed = await compressImage(file, AVATAR_OPTIONS);
      const ext = compressed.type === "image/webp" ? "webp" : "jpg";
      const path = `${userId}/avatar-${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("photos")
        .upload(path, compressed, { contentType: compressed.type, upsert: false });
      if (error) throw error;
      setAvatarUrl(path);
      const { data: signed } = await supabase.storage
        .from("photos")
        .createSignedUrl(path, 60 * 60);
      if (signed?.signedUrl) setAvatarPreview(signed.signedUrl);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ngarkimi dështoi");
    } finally {
      setUploading(false);
    }
  };

  const initials = (displayName || authName || "?")
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const canContinue =
    displayName.trim().length > 0 &&
    username.replace(/^@/, "").trim().length > 0 &&
    usernameStatus === "available";

  return (
    <div className="flex h-full flex-col">
      <TopBar step={2} onBack={onBack} />
      <div className="flex-1 overflow-y-auto px-5 pt-2 pb-6">
        <h1
          className="italic"
          style={{
            fontFamily: '"Instrument Serif", serif',
            fontSize: 28,
            color: DARK,
            fontWeight: 400,
          }}
        >
          Krijo profilin tënd
        </h1>

        <div className="mt-6 flex flex-col items-center">
          <button
            onClick={pickAvatar}
            disabled={uploading}
            className="relative flex h-[90px] w-[90px] items-center justify-center overflow-hidden rounded-full"
            style={{ background: CHIP_BG }}
          >
            {avatarPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarPreview}
                alt="Avatar"
                className="h-full w-full object-cover"
              />
            ) : initials ? (
              <span
                className="text-2xl font-semibold"
                style={{ color: DARK, opacity: 0.75 }}
              >
                {initials}
              </span>
            ) : (
              <Camera size={26} color={MUTED} />
            )}
            <span
              className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2"
              style={{ background: DARK, borderColor: CREAM }}
            >
              <Camera size={14} color="#fff" />
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={onFile}
          />
          <div className="mt-2 text-xs" style={{ color: MUTED }}>
            {uploading ? "Duke ngarkuar..." : "Opsionale"}
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: DARK }}>
              Emri i shfaqur
            </label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value.slice(0, 40))}
              placeholder="Emri yt"
              className="w-full rounded-2xl border-0 px-4 py-3 text-sm outline-none"
              style={{ background: CHIP_BG, color: DARK }}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: DARK }}>
              Emri i përdoruesit
            </label>
            <div className="relative">
              <input
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value.replace(/[^a-zA-Z0-9_.@]/g, "").slice(0, 25))
                }
                placeholder="@emri_yt"
                autoCapitalize="none"
                autoCorrect="off"
                className="w-full rounded-2xl border-0 px-4 py-3 pr-10 text-sm outline-none"
                style={{ background: CHIP_BG, color: DARK }}
              />
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                {usernameStatus === "checking" && (
                  <span
                    className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-t-transparent"
                    style={{ borderColor: MUTED, borderTopColor: "transparent" }}
                  />
                )}
                {usernameStatus === "available" && (
                  <Check size={18} color="#2f9e6b" />
                )}
                {(usernameStatus === "taken" || usernameStatus === "invalid") && (
                  <X size={18} color="#c94a3b" />
                )}
              </div>
            </div>
            {usernameStatus === "invalid" && (
              <div className="mt-1 text-xs" style={{ color: "#c94a3b" }}>
                3–24 karaktere: a-z, 0-9, _ ose .
              </div>
            )}
            {usernameStatus === "taken" && (
              <div className="mt-1 text-xs" style={{ color: "#c94a3b" }}>
                Ky emër është i zënë
              </div>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: DARK }}>
              Bio <span style={{ color: MUTED }}>(opsionale)</span>
            </label>
            <div className="relative">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 150))}
                placeholder="Trego diçka për veten..."
                rows={3}
                className="w-full resize-none rounded-2xl border-0 px-4 py-3 text-sm outline-none"
                style={{ background: CHIP_BG, color: DARK }}
              />
              <div
                className="pointer-events-none absolute bottom-2 right-3 text-[11px]"
                style={{ color: MUTED }}
              >
                {bio.length}/150
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: DARK }}>
              Gjatësia <span style={{ color: MUTED }}>(opsionale)</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                inputMode="numeric"
                value={height}
                onChange={(e) => setHeight(e.target.value.replace(/[^0-9]/g, "").slice(0, 3))}
                placeholder="170"
                className="w-24 rounded-2xl border-0 px-4 py-3 text-sm outline-none"
                style={{ background: CHIP_BG, color: DARK }}
              />
              <span className="text-sm" style={{ color: MUTED }}>
                cm
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="px-5 pt-2" style={{ paddingBottom: SAFE_BOTTOM }}>
        <BigButton disabled={!canContinue} onClick={onNext}>
          Vazhdo
        </BigButton>
      </div>
    </div>
  );
}

/* ---------- Step 3: Style prefs ---------- */
function StepStyle({
  genders,
  toggleGender,
  cats,
  toggleCat,
  sizes,
  toggleSize,
  onBack,
  onSkip,
  onNext,
}: {
  genders: string[];
  toggleGender: (v: string) => void;
  cats: string[];
  toggleCat: (v: string) => void;
  sizes: string[];
  toggleSize: (v: string) => void;
  onBack: () => void;
  onSkip: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <TopBar step={3} onBack={onBack} onSkip={onSkip} />
      <div className="flex-1 overflow-y-auto px-5 pt-2 pb-6">
        <Heading>Cili është stili yt?</Heading>
        <div className="mt-2">
          <SubText>Do të shohësh artikuj të zgjedhur bazuar në preferencat e tua</SubText>
        </div>

        <div className="mt-6">
          <div className="mb-3 text-sm font-semibold" style={{ color: DARK }}>
            Po kërkon për?
          </div>
          <div className="flex flex-wrap gap-2">
            {GENDERS.map((g) => (
              <Chip
                key={g.id}
                active={genders.includes(g.id)}
                onClick={() => toggleGender(g.id)}
              >
                {g.label}
              </Chip>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-3 text-sm font-semibold" style={{ color: DARK }}>
            Çfarë të intereson?
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <Chip key={c} active={cats.includes(c)} onClick={() => toggleCat(c)}>
                {c}
              </Chip>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-3 text-sm font-semibold" style={{ color: DARK }}>
            Madhësia jote?
          </div>
          <div className="mb-2 text-xs" style={{ color: MUTED }}>
            Rroba
          </div>
          <div className="flex flex-wrap gap-2">
            {CLOTHING_SIZES.map((s) => (
              <Chip key={s} active={sizes.includes(s)} onClick={() => toggleSize(s)}>
                {s}
              </Chip>
            ))}
          </div>
          <div className="mb-2 mt-4 text-xs" style={{ color: MUTED }}>
            Këpucë
          </div>
          <div className="flex flex-wrap gap-2">
            {SHOE_SIZES.map((s) => (
              <Chip
                key={`sh-${s}`}
                active={sizes.includes(`shoe:${s}`)}
                onClick={() => toggleSize(`shoe:${s}`)}
              >
                {s}
              </Chip>
            ))}
          </div>
        </div>
      </div>
      <div className="px-5 pt-2" style={{ paddingBottom: SAFE_BOTTOM }}>
        <BigButton onClick={onNext}>Vazhdo</BigButton>
        <div className="mt-2 text-center text-xs" style={{ color: MUTED }}>
          Mund t'i ndryshosh gjithmonë në cilësime
        </div>
      </div>
    </div>
  );
}

/* ---------- Step 4: How it works ---------- */
function StepHow({
  onBack,
  onSkip,
  onNext,
}: {
  onBack: () => void;
  onSkip: () => void;
  onNext: () => void;
}) {
  const rows = [
    {
      Icon: Search,
      title: "Eksploro",
      body: "Shfleto mijëra artikuj të përdorur nga shitës lokalë",
    },
    {
      Icon: MessageCircle,
      title: "Lidhu",
      body: "Dërgo mesazh, bëj ofertë dhe bli direkt me shitësin",
    },
    {
      Icon: Shirt,
      title: "Shit",
      body: "Listo rrobat e tua brenda minutave dhe gjej blerësin e duhur",
    },
  ];
  return (
    <div className="flex h-full flex-col">
      <TopBar step={4} onBack={onBack} onSkip={onSkip} />
      <div className="flex-1 overflow-y-auto px-5 pt-2 pb-6">
        <Heading>Si funksionon Rroba?</Heading>
        <div className="mt-6 space-y-3">
          {rows.map((r) => (
            <div
              key={r.title}
              className="flex items-start gap-4 rounded-2xl p-4"
              style={{ background: CHIP_BG }}
            >
              <div
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full"
                style={{ background: CREAM }}
              >
                <r.Icon size={22} color={DARK} />
              </div>
              <div className="pt-0.5">
                <div className="text-[15px] font-semibold" style={{ color: DARK }}>
                  {r.title}
                </div>
                <div className="mt-1 text-sm leading-snug" style={{ color: MUTED }}>
                  {r.body}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="px-5 pt-2" style={{ paddingBottom: SAFE_BOTTOM }}>
        <BigButton onClick={onNext}>Vazhdo</BigButton>
      </div>
    </div>
  );
}

/* ---------- Step 5: Notifications ---------- */
function StepNotify({
  onBack,
  onSkip,
  onEnable,
}: {
  onBack: () => void;
  onSkip: () => void;
  onEnable: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const handleEnable = async () => {
    setBusy(true);
    try {
      if (typeof Notification !== "undefined") {
        try {
          await Notification.requestPermission();
        } catch {
          /* ignore */
        }
      }
    } finally {
      setBusy(false);
      onEnable();
    }
  };
  return (
    <div className="flex h-full flex-col">
      <TopBar step={5} onBack={onBack} onSkip={onSkip} />
      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-6">
        <div className="flex justify-center">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-full"
            style={{ background: CHIP_BG }}
          >
            <Bell size={40} color={DARK} />
          </div>
        </div>
        <div className="mt-6 text-center">
          <Heading>Qëndro i informuar</Heading>
        </div>
        <div className="mt-3 text-center">
          <SubText>
            Merr njoftime kur dikush bën ofertë, dërgon mesazh ose artikulli yt shitet
          </SubText>
        </div>
        <div className="mx-auto mt-8 max-w-xs space-y-3">
          {["Oferta të reja", "Mesazhe të reja", "Artikulli u shit"].map((t) => (
            <div key={t} className="flex items-center gap-3">
              <div
                className="flex h-6 w-6 items-center justify-center rounded-full"
                style={{ background: DARK }}
              >
                <Check size={14} color="#fff" />
              </div>
              <span className="text-sm" style={{ color: DARK }}>
                {t}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-2 px-5 pt-2" style={{ paddingBottom: SAFE_BOTTOM }}>
        <BigButton disabled={busy} onClick={handleEnable}>
          Aktivizo njoftimet
        </BigButton>
        <BigButton variant="ghost" onClick={onSkip}>
          Tani jo
        </BigButton>
      </div>
    </div>
  );
}

/* ---------- Completion ---------- */
function StepDone({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1500);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center"
      style={{ background: DARK }}
    >
      <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
        <circle
          cx="48"
          cy="48"
          r="44"
          stroke={CORAL}
          strokeWidth="4"
          strokeDasharray="276"
          strokeDashoffset="276"
          style={{ animation: "rroba-circle 700ms ease-out forwards" }}
        />
        <path
          d="M28 50 L44 66 L70 34"
          stroke={CORAL}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray="80"
          strokeDashoffset="80"
          style={{ animation: "rroba-check 500ms 500ms ease-out forwards" }}
        />
      </svg>
      <div
        className="mt-6 text-center italic"
        style={{
          fontFamily: '"Instrument Serif", serif',
          color: CREAM,
          fontSize: 24,
        }}
      >
        Gati! Mirë se vjen në Rroba 🎉
      </div>
      <style>{`
        @keyframes rroba-circle { to { stroke-dashoffset: 0; } }
        @keyframes rroba-check { to { stroke-dashoffset: 0; } }
      `}</style>
    </div>
  );
}

/* ---------- Container ---------- */
function OnboardingFlow() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [authName, setAuthName] = useState("");
  const [ready, setReady] = useState(false);

  // Steps: 0 splash, 1 city, 2 profile, 3 style, 4 how, 5 notify, 6 done
  const [step, setStep] = useState(0);
  const [cityId, setCityId] = useState<string | null>(null);
  const [cityName, setCityName] = useState<string>("");
  const cityFromDb = useCityById(cityId);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [height, setHeight] = useState("");
  const [genders, setGenders] = useState<string[]>([]);
  const [cats, setCats] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) {
        navigate({ to: "/auth" });
        return;
      }
      setUserId(user.id);
      const nm =
        (user.user_metadata?.full_name as string) ||
        (user.user_metadata?.name as string) ||
        (user.email ? user.email.split("@")[0] : "");
      setAuthName(nm);

      // If already completed, skip out
      const { data: prof } = await supabase
        .from("profiles")
        .select("onboarding_completed, name, city, city_id")
        .eq("id", user.id)
        .maybeSingle();
      if (prof?.onboarding_completed) {
        navigate({ to: "/", replace: true });
        return;
      }
      if (prof?.name && !displayName) setDisplayName(prof.name);
      const p = prof as { city?: string | null; city_id?: string | null } | null;
      if (p?.city_id && !cityId) setCityId(p.city_id);
      if (p?.city && !cityName) setCityName(p.city);
      setReady(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleFrom = useCallback(
    (arr: string[], setArr: (v: string[]) => void, v: string) => {
      setArr(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
    },
    [],
  );

  const finish = async () => {
    if (!userId) return;
    const preferences = {
      genders,
      categories: cats,
      sizes,
    };
    const heightNum = height ? parseInt(height, 10) : null;
    const uname = username.replace(/^@/, "").trim().toLowerCase();
    const updatePayload: Record<string, unknown> = {
      city: (cityName || cityFromDb?.name) ?? undefined,
      city_id: cityId ?? undefined,
      name: displayName.trim(),
      display_name: displayName.trim(),
      username: uname || null,
      avatar_url: avatarPath ?? undefined,
      bio: bio.trim() || null,
      height_cm: heightNum,
      preferences,
      onboarding_completed: true,
    };
    const { error } = await supabase
      .from("profiles")
      // Types not yet regenerated for the new columns; safe cast.
      .update(updatePayload as never)
      .eq("id", userId);
    if (error) {
      toast.error(error.message);
      return;
    }
    setStep(6);
  };

  const content = useMemo(() => {
    if (!ready && step !== 0) {
      return (
        <div
          className="flex h-full w-full items-center justify-center"
          style={{ background: CREAM }}
        >
          <span
            className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-t-transparent"
            style={{ borderColor: MUTED, borderTopColor: "transparent" }}
          />
        </div>
      );
    }
    switch (step) {
      case 0:
        return <StepSplash onDone={() => setStep(1)} />;
      case 1:
        return (
          <StepCity
            value={cityId}
            onChange={(id, name) => {
              setCityId(id);
              setCityName(name);
            }}
            onNext={() => setStep(2)}
          />
        );
      case 2:
        return (
          <StepProfile
            userId={userId!}
            authName={authName}
            displayName={displayName}
            setDisplayName={setDisplayName}
            username={username}
            setUsername={setUsername}
            avatarUrl={avatarPath}
            setAvatarUrl={setAvatarPath}
            bio={bio}
            setBio={setBio}
            height={height}
            setHeight={setHeight}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        );
      case 3:
        return (
          <StepStyle
            genders={genders}
            toggleGender={(v) => toggleFrom(genders, setGenders, v)}
            cats={cats}
            toggleCat={(v) => toggleFrom(cats, setCats, v)}
            sizes={sizes}
            toggleSize={(v) => toggleFrom(sizes, setSizes, v)}
            onBack={() => setStep(2)}
            onSkip={() => setStep(4)}
            onNext={() => setStep(4)}
          />
        );
      case 4:
        return (
          <StepHow
            onBack={() => setStep(3)}
            onSkip={() => setStep(5)}
            onNext={() => setStep(5)}
          />
        );
      case 5:
        return (
          <StepNotify
            onBack={() => setStep(4)}
            onSkip={finish}
            onEnable={finish}
          />
        );
      case 6:
      default:
        return <StepDone onDone={() => navigate({ to: "/", replace: true })} />;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    ready,
    step,
    cityId,
    cityName,
    cityFromDb,
    userId,
    authName,
    displayName,
    username,
    avatarPath,
    bio,
    height,
    genders,
    cats,
    sizes,
  ]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: step === 0 || step === 6 ? DARK : CREAM }}
    >
      <div
        className="relative mx-auto flex h-[100dvh] w-full max-w-[480px] flex-col"
        style={{ background: step === 0 || step === 6 ? DARK : CREAM }}
      >
        {content}
      </div>
    </div>
  );
}
