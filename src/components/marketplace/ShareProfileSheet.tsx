import { useCallback, useEffect, useRef, useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ChevronLeft, Download, Link2, Share2, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Variant = {
  key: string;
  bg: string;
  ink: string;
  accent: string;
  accentInk: string;
};

const VARIANTS: Variant[] = [
  { key: "cream", bg: "#faf3ee", ink: "#2d1521", accent: "#c65a7a", accentInk: "#ffffff" },
  { key: "ink", bg: "#2d1521", ink: "#faf3ee", accent: "#f08a72", accentInk: "#2d1521" },
  { key: "rose", bg: "#c65a7a", ink: "#ffffff", accent: "#ffffff", accentInk: "#c65a7a" },
  { key: "coral", bg: "#f08a72", ink: "#2d1521", accent: "#2d1521", accentInk: "#ffffff" },
];

const W = 1080;
const H = 1920;

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function ShareProfileSheet({
  open,
  onOpenChange,
  profileUrl,
  displayName,
  username,
  avatarUrl,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  profileUrl: string;
  displayName: string;
  username: string;
  avatarUrl: string;
}) {
  const [variant, setVariant] = useState(0);
  const [busy, setBusy] = useState<null | "share" | "save">(null);
  const avatarRef = useRef<HTMLImageElement | null>(null);
  const v = VARIANTS[variant]!;

  useEffect(() => {
    if (!open) return;
    let alive = true;
    void loadImage(avatarUrl).then((img) => {
      if (alive) avatarRef.current = img;
    });
    return () => {
      alive = false;
    };
  }, [open, avatarUrl]);

  const renderCard = useCallback(async (): Promise<Blob | null> => {
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.fillStyle = v.bg;
    ctx.fillRect(0, 0, W, H);

    // Soft radial glow for depth
    const glow = ctx.createRadialGradient(W / 2, H * 0.4, 60, W / 2, H * 0.4, W * 0.8);
    glow.addColorStop(0, "rgba(255,255,255,0.16)");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // Avatar
    const cx = W / 2;
    const cy = H * 0.38;
    const r = 210;
    const img = avatarRef.current ?? (await loadImage(avatarUrl));
    avatarRef.current = img;

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    if (img) {
      const ratio = Math.max((r * 2) / img.width, (r * 2) / img.height);
      const dw = img.width * ratio;
      const dh = img.height * ratio;
      ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
    } else {
      ctx.fillStyle = v.accent;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      ctx.fillStyle = v.accentInk;
      ctx.font = "700 170px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(displayName.slice(0, 1).toUpperCase(), cx, cy + 8);
    }
    ctx.restore();

    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 3, 0, Math.PI * 2);
    ctx.stroke();

    // Username pill
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "600 52px system-ui, sans-serif";
    const label = username || displayName;
    const pw = ctx.measureText(label).width + 90;
    const py = cy + r + 130;
    ctx.fillStyle = v.accent;
    roundRect(ctx, cx - pw / 2, py - 46, pw, 92, 46);
    ctx.fill();
    ctx.fillStyle = v.accentInk;
    ctx.fillText(label, cx, py + 3);

    // Display name
    ctx.fillStyle = v.ink;
    ctx.font = "700 74px system-ui, sans-serif";
    ctx.fillText(displayName, cx, py + 160);

    // Branding
    ctx.font = "700 68px system-ui, sans-serif";
    ctx.globalAlpha = 0.9;
    ctx.fillText("rroba", cx, H * 0.78);
    ctx.globalAlpha = 1;

    // Link CTA
    ctx.font = "500 42px system-ui, sans-serif";
    ctx.globalAlpha = 0.7;
    const link = profileUrl.replace(/^https?:\/\//, "");
    ctx.fillText(link, cx, H - 190);
    ctx.globalAlpha = 1;

    return await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/png", 0.95),
    );
  }, [v, avatarUrl, displayName, username, profileUrl]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      toast.success("Lidhja u kopjua");
    } catch {
      toast.error("Nuk mund të kopjohej lidhja");
    }
  };

  const shareSystem = async () => {
    setBusy("share");
    try {
      const blob = await renderCard();
      const file = blob ? new File([blob], "rroba-profile.png", { type: "image/png" }) : null;
      const nav = navigator as Navigator & {
        canShare?: (d: ShareData) => boolean;
      };
      if (file && nav.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: profileUrl, title: displayName });
      } else if (navigator.share) {
        await navigator.share({ url: profileUrl, title: displayName });
      } else {
        await copyLink();
      }
    } catch {
      /* cancelled */
    } finally {
      setBusy(null);
    }
  };

  const saveImage = async () => {
    setBusy("save");
    try {
      const blob = await renderCard();
      if (!blob) {
        toast.error("Nuk mund të krijohej imazhi");
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "rroba-profile.png";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      toast.success("Imazhi u ruajt");
    } catch {
      toast.error("Nuk mund të krijohej imazhi");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        hideClose
        className="flex flex-col border-0 p-0"
        style={{ backgroundColor: "var(--brand-surface)" }}
      >
        <div className="flex items-center gap-3 px-4 pt-5 pb-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Kthehu"
            className="grid place-items-center rounded-full transition-transform duration-150 active:scale-[0.97]"
            style={{
              width: 44,
              height: 44,
              backgroundColor: "rgba(255,255,255,0.7)",
              border: "1px solid rgba(226,226,222,0.8)",
              backdropFilter: "blur(8px)",
            }}
          >
            <ChevronLeft size={22} color="var(--brand-ink)" strokeWidth={2} />
          </button>
          <h2 className="text-[17px] font-bold" style={{ color: "var(--brand-ink)" }}>
            Ndaj profilin
          </h2>
        </div>

        {/* Story-format preview */}
        <div className="flex flex-1 items-center justify-center overflow-hidden px-6 py-3">
          <div
            className="flex w-full max-w-[240px] flex-col items-center justify-center rounded-[26px] px-6 py-8"
            style={{ backgroundColor: v.bg, aspectRatio: "9 / 16" }}
          >
            <img
              src={avatarUrl}
              alt=""
              className="h-24 w-24 rounded-full object-cover"
              style={{ border: "3px solid rgba(255,255,255,0.6)" }}
            />
            <span
              className="mt-5 rounded-full px-4 py-1.5 text-[13px] font-semibold"
              style={{ backgroundColor: v.accent, color: v.accentInk }}
            >
              {username || displayName}
            </span>
            <span className="mt-3 text-[15px] font-bold" style={{ color: v.ink }}>
              {displayName}
            </span>
            <span
              className="mt-auto text-[16px] font-bold tracking-tight"
              style={{ color: v.ink, opacity: 0.9 }}
            >
              rroba
            </span>
            <span className="mt-2 text-[10px]" style={{ color: v.ink, opacity: 0.65 }}>
              {profileUrl.replace(/^https?:\/\//, "")}
            </span>
          </div>
        </div>

        {/* Background variants */}
        <div className="flex items-center justify-center gap-3 pb-3">
          {VARIANTS.map((opt, i) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setVariant(i)}
              aria-label={`Sfond ${i + 1}`}
              className="grid place-items-center rounded-full transition-transform active:scale-90"
              style={{
                width: 34,
                height: 34,
                backgroundColor: opt.bg,
                border:
                  i === variant
                    ? "2px solid var(--brand-ink)"
                    : "1px solid var(--brand-border)",
              }}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-start justify-center gap-6 px-5 pb-7">
          <Action
            icon={busy === "save" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
            label="Ruaj"
            onClick={saveImage}
          />
          <Action
            icon={busy === "share" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Share2 className="h-5 w-5" />}
            label="Ndaj me..."
            onClick={shareSystem}
          />
          <Action icon={<Link2 className="h-5 w-5" />} label="Kopjo lidhjen" onClick={copyLink} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Action({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-[76px] flex-col items-center gap-2 active:opacity-70"
    >
      <span
        className="grid h-14 w-14 place-items-center rounded-2xl"
        style={{
          backgroundColor: "rgba(45,21,33,0.06)",
          border: "1px solid var(--brand-border)",
          color: "var(--brand-ink)",
        }}
      >
        {icon}
      </span>
      <span
        className="text-center text-[11px] font-medium leading-tight"
        style={{ color: "var(--brand-ink-secondary)" }}
      >
        {label}
      </span>
    </button>
  );
}
