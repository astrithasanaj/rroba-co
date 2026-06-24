import { Heart } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
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
  const liked = likes.has(listingId);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!userId) {
          navigate({ to: "/auth" });
          return;
        }
        toggleLike(listingId);
      }}
      aria-label={liked ? "Hiq nga të preferuarat" : "Ruaj në të preferuarat"}
      aria-pressed={liked}
      className={`grid place-items-center rounded-full bg-background/85 backdrop-blur transition active:scale-95 ${className}`}
    >
      <Heart
        style={{ width: size, height: size }}
        strokeWidth={1.8}
        fill={liked ? "currentColor" : "none"}
        className={liked ? "text-rose-500" : "text-foreground"}
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
  const saved = saves.has(listingId);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!userId) {
          navigate({ to: "/auth" });
          return;
        }
        toggleSave(listingId);
      }}
      aria-label={saved ? "Hiq nga të ruajturat" : "Ruaj për më vonë"}
      aria-pressed={saved}
      className={`inline-flex items-center justify-center gap-1.5 rounded-full bg-background/85 backdrop-blur transition active:scale-95 ${className}`}
    >
      <svg
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
