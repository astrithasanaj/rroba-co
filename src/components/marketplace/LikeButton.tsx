import { Heart } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useUserCollections } from "@/lib/user-collections";

export function LikeButton({
  listingId,
  className = "",
  size = 16,
}: {
  listingId: string;
  className?: string;
  size?: number;
}) {
  const { userId, likes, toggleLike } = useUserCollections();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const liked = likes.has(listingId);
  return (
    <button
      type="button"
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!userId) {
          navigate({ to: "/auth" });
          return;
        }
        if (busy) return;
        setBusy(true);
        try {
          await toggleLike(listingId);
        } finally {
          setBusy(false);
        }
      }}
      aria-label={liked ? "Hiq nga të preferuarat" : "Ruaj në të preferuarat"}
      aria-pressed={liked}
      aria-busy={busy}
      disabled={busy}
      className={`grid min-h-11 min-w-11 place-items-center rounded-full backdrop-blur transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-100 ${className}`}
      style={{
        backgroundColor: "color-mix(in srgb, var(--brand-surface) 85%, transparent)",
      }}
    >
      <Heart
        aria-hidden="true"
        style={{
          width: size,
          height: size,
          color: liked ? "var(--brand-rose)" : "var(--brand-ink)",
        }}
        strokeWidth={1.8}
        fill={liked ? "currentColor" : "none"}
      />
    </button>
  );
}

export function SaveButton({
  listingId,
  className = "",
  size = 16,
  withLabel = false,
}: {
  listingId: string;
  className?: string;
  size?: number;
  withLabel?: boolean;
}) {
  const { userId, saves, toggleSave } = useUserCollections();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const saved = saves.has(listingId);
  return (
    <button
      type="button"
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!userId) {
          navigate({ to: "/auth" });
          return;
        }
        if (busy) return;
        setBusy(true);
        try {
          await toggleSave(listingId);
        } finally {
          setBusy(false);
        }
      }}
      aria-label={saved ? "Hiq nga të ruajturat" : "Ruaj për më vonë"}
      aria-pressed={saved}
      aria-busy={busy}
      disabled={busy}
      className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full backdrop-blur transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-100 ${className}`}
      style={{
        backgroundColor: "color-mix(in srgb, var(--brand-surface) 85%, transparent)",
        color: "var(--brand-ink)",
      }}
    >
      <svg
        aria-hidden="true"
        style={{ width: size, height: size }}
        viewBox="0 0 24 24"
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
      {withLabel && <span className="text-xs font-medium">{saved ? "Ruajtur" : "Ruaj"}</span>}
    </button>
  );
}
