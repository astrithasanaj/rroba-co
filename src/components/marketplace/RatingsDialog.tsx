import { useEffect, useState } from "react";
import { Loader2, Star, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export type RatingRow = {
  id: string;
  rater_id: string;
  seller_id: string;
  stars: number;
  comment: string;
  created_at: string;
};

export function StarRow({
  value,
  size = 14,
  className = "",
}: {
  value: number;
  size?: number;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          style={{ width: size, height: size }}
          className={n <= Math.round(value) ? "text-amber-500" : "text-muted-foreground/30"}
          fill={n <= Math.round(value) ? "currentColor" : "none"}
          strokeWidth={1.6}
        />
      ))}
    </span>
  );
}

export function RatingsDialog({
  open,
  onOpenChange,
  sellerId,
  currentUserId,
  sellerName,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sellerId: string;
  currentUserId: string | null;
  sellerName: string;
}) {
  const [ratings, setRatings] = useState<RatingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isOwn = currentUserId === sellerId;
  const existing = currentUserId
    ? ratings.find((r) => r.rater_id === currentUserId)
    : undefined;

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("ratings")
        .select("*")
        .eq("seller_id", sellerId)
        .order("created_at", { ascending: false });
      if (!active) return;
      const rows = (data ?? []) as RatingRow[];
      setRatings(rows);
      const mine = currentUserId ? rows.find((r) => r.rater_id === currentUserId) : undefined;
      if (mine) {
        setStars(mine.stars);
        setComment(mine.comment);
      } else {
        setStars(0);
        setComment("");
      }
      setLoading(false);
    })();
    const channel = supabase
      .channel(`ratings-${sellerId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ratings", filter: `seller_id=eq.${sellerId}` },
        async () => {
          const { data } = await supabase
            .from("ratings")
            .select("*")
            .eq("seller_id", sellerId)
            .order("created_at", { ascending: false });
          setRatings((data ?? []) as RatingRow[]);
        },
      )
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [open, sellerId, currentUserId]);

  const handleSubmit = async () => {
    if (!currentUserId || stars < 1 || stars > 5 || submitting) return;
    setSubmitting(true);
    const { error } = await supabase.from("ratings").upsert(
      {
        rater_id: currentUserId,
        seller_id: sellerId,
        stars,
        comment: comment.trim(),
      },
      { onConflict: "rater_id,seller_id" },
    );
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(existing ? "Vlerësimi u përditësua" : "Faleminderit për vlerësimin");
  };

  const avg =
    ratings.length === 0
      ? 0
      : ratings.reduce((s, r) => s + r.stars, 0) / ratings.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Vlerësimet</DialogTitle>
          <DialogDescription>
            {sellerName} ka {ratings.length} vlerësime
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3 rounded-2xl bg-secondary p-4">
          <div className="text-3xl font-display">{avg.toFixed(1)}</div>
          <div>
            <StarRow value={avg} size={16} />
            <p className="text-xs text-muted-foreground">bazuar në {ratings.length} vlerësime</p>
          </div>
        </div>

        {!isOwn && currentUserId && (
          <div className="space-y-2 border-t border-border pt-4">
            <p className="text-sm font-semibold">
              {existing ? "Përditëso vlerësimin tënd" : "Jep një vlerësim"}
            </p>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setStars(n)}
                  className="p-1"
                  aria-label={`${n} yje`}
                >
                  <Star
                    className={
                      n <= (hover || stars) ? "text-amber-500" : "text-muted-foreground/40"
                    }
                    fill={n <= (hover || stars) ? "currentColor" : "none"}
                    strokeWidth={1.6}
                  />
                </button>
              ))}
            </div>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Skriv en kommentar (valgfritt)"
            />
            <button
              type="button"
              onClick={handleSubmit}
              disabled={stars < 1 || submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-sm font-semibold text-background disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {existing ? "Oppdater" : "Send vurdering"}
            </button>
          </div>
        )}

        {!currentUserId && (
          <p className="text-center text-xs text-muted-foreground">Logg inn for å vurdere.</p>
        )}

        <div className="space-y-3 border-t border-border pt-4">
          <p className="text-sm font-semibold">Alle vurderinger</p>
          {loading ? (
            <div className="grid place-items-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : ratings.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground">Ingen vurderinger ennå.</p>
          ) : (
            ratings.map((r) => (
              <div key={r.id} className="rounded-xl border border-border p-3">
                <div className="flex items-center justify-between">
                  <StarRow value={r.stars} />
                  <span className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString("nb-NO")}
                  </span>
                </div>
                {r.comment && <p className="mt-1.5 text-sm">{r.comment}</p>}
              </div>
            ))
          )}
        </div>

        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full hover:bg-secondary"
          aria-label="Lukk"
        >
          <X className="h-4 w-4" />
        </button>
      </DialogContent>
    </Dialog>
  );
}
