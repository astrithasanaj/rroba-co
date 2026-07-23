import { useEffect, useMemo, useState } from "react";
import { Loader2, Star, BadgeCheck, User as UserIcon, ArrowLeft, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useTranslation } from "@/i18n";

const CREAM = "#ffffff";
const CARD = "#ffffff";
const INK = "#2d1521";
const MUTED = "#a89f94";
const DIVIDER = "#e2e2de";
const CORAL = "#c65a7a";

type Row = {
  id: string;
  rater_id: string;
  seller_id: string;
  stars: number;
  comment: string;
  created_at: string;
};

type RaterProfile = { id: string; name: string | null; avatar_url: string | null };

function useFormatReviewDate() {
  const { t } = useTranslation();
  return (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays <= 0) return t("reviews.time_today");
    if (diffDays === 1) return t("reviews.time_yesterday");
    if (diffDays < 7) return t("reviews.time_days", { n: diffDays });
    if (diffDays < 30) return t("reviews.time_weeks", { n: Math.floor(diffDays / 7) });
    if (diffDays < 365) return t("reviews.time_months", { n: Math.floor(diffDays / 30) });
    return t("reviews.time_years", { n: Math.floor(diffDays / 365) });
  };
}

function formatMemberSince(iso: string | null | undefined, locale: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(locale, { month: "long", year: "numeric" });
}

function StarBar({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 2 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          style={{ width: size, height: size }}
          strokeWidth={0}
          fill={i < value ? CORAL : DIVIDER}
        />
      ))}
    </span>
  );
}

function Initials({ name }: { name: string }) {
  const letters = (name || "?")
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: "50%",
        background: "#e2e2de",
        color: INK,
        display: "grid",
        placeItems: "center",
        fontSize: 14,
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      {letters}
    </div>
  );
}

export function ReviewsSheet({
  open,
  onOpenChange,
  sellerId,
  currentUserId,
  sellerName,
  sellerUsername,
  sellerCreatedAt,
  initialRateOpen,
  listingId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sellerId: string;
  currentUserId: string | null;
  sellerName: string;
  sellerUsername?: string;
  sellerCreatedAt?: string | null;
  initialRateOpen?: boolean;
  listingId?: string;
}) {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [raters, setRaters] = useState<Record<string, RaterProfile>>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "sold" | "bought">("all");

  // Rate flow
  const [rateOpen, setRateOpen] = useState(!!initialRateOpen);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [canRate, setCanRate] = useState(false);

  useEffect(() => {
    if (open && initialRateOpen) setRateOpen(true);
  }, [open, initialRateOpen]);

  const isOwn = currentUserId === sellerId;

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
      const list = (data ?? []) as Row[];
      setRows(list);
      const ids = Array.from(new Set(list.map((r) => r.rater_id)));
      if (ids.length) {
        const { data: profs } = await supabase
          .from("public_profiles")
          .select("id,name,avatar_url")
          .in("id", ids);
        const map: Record<string, RaterProfile> = {};
        (profs ?? []).forEach((p: any) => (map[p.id] = p));
        if (active) setRaters(map);
      }

      // Existing review by current user
      if (currentUserId && !isOwn) {
        const mine = list.find((r) => r.rater_id === currentUserId);
        if (mine) {
          setStars(mine.stars);
          setComment(mine.comment ?? "");
        } else {
          setStars(0);
          setComment("");
        }
        // Eligibility: any conversation between the two users (either direction)
        const { data: convo } = await supabase
          .from("conversations")
          .select("id")
          .or(
            `and(seller_id.eq.${sellerId},buyer_id.eq.${currentUserId}),and(buyer_id.eq.${sellerId},seller_id.eq.${currentUserId})`,
          )
          .limit(1);
        if (active) setCanRate(!!(convo && convo.length > 0));
      }
      if (active) setLoading(false);
    })();
  }, [open, sellerId, currentUserId, isOwn]);

  const avg = rows.length ? rows.reduce((s, r) => s + r.stars, 0) / rows.length : 0;
  const filtered = useMemo(() => {
    // We don't store sold/bought distinction — show all for both filter tabs
    if (tab === "all") return rows;
    return rows; // fallback: same list
  }, [rows, tab]);

  const submitReview = async () => {
    if (!currentUserId || stars < 1 || submitting) return;
    setSubmitting(true);
    const payload = {
      rater_id: currentUserId,
      seller_id: sellerId,
      stars,
      comment: comment.trim(),
      ...(listingId ? { listing_id: listingId } : {}),
    };
    const { error } = await supabase
      .from("ratings")
      .upsert(payload, { onConflict: "rater_id,seller_id" });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Vlerësimi u dërgua!");
    setRateOpen(false);
    // refresh
    const { data } = await supabase
      .from("ratings")
      .select("*")
      .eq("seller_id", sellerId)
      .order("created_at", { ascending: false });
    setRows((data ?? []) as Row[]);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          hideClose
          className="h-[100dvh] w-full !max-w-none p-0 border-0"
          style={{
            backgroundColor: CREAM,
            WebkitFontSmoothing: "antialiased",
            overscrollBehavior: "contain",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px 12px",
              borderBottom: `1px solid ${DIVIDER}`,
              backgroundColor: CREAM,
            }}
          >
            <div style={{ width: 72, display: "flex", alignItems: "center", justifyContent: "flex-start" }}>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
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
                <ChevronLeft size={22} color="#2d1521" strokeWidth={2} />
              </button>
            </div>
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: INK }}>Vlerësimet</div>
              {sellerUsername && (
                <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>
                  për {sellerUsername}
                </div>
              )}
            </div>
            <div style={{ width: 72 }} />
          </div>

          {/* Body */}
          <div
            style={{
              overflowY: "auto",
              height: "calc(100dvh - 60px)",
              padding: "14px 16px 40px",
            }}
          >
            {/* Summary */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 8 }}>
              <div style={{ background: CARD, borderRadius: 14, padding: 16, textAlign: "center" }}>
                <div
                  style={{
                    fontSize: 10,
                    color: MUTED,
                    letterSpacing: "0.8px",
                    fontWeight: 600,
                  }}
                >
                  VLERËSIM
                </div>
                <div style={{ fontSize: 42, fontWeight: 700, color: INK, lineHeight: 1.1, marginTop: 4 }}>
                  {avg.toFixed(1)}
                </div>
                <div style={{ fontSize: 12, color: MUTED }}>nga 5.0</div>
              </div>
              <div
                style={{
                  background: CARD,
                  borderRadius: 14,
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  justifyContent: "center",
                }}
              >
                <Info
                  icon={<BadgeCheck size={16} color={CORAL} strokeWidth={2.2} />}
                  text={<b style={{ fontWeight: 700 }}>Shitës i besuar</b>}
                />
                <Info
                  icon={<Star size={16} color={INK} strokeWidth={2} />}
                  text={<>{rows.length} vlerësime</>}
                />
                <Info
                  icon={<UserIcon size={16} color={INK} strokeWidth={2} />}
                  text={<>U bë anëtar në {formatMemberSince(sellerCreatedAt)}</>}
                />
              </div>
            </div>

            {/* Tabs */}
            <div
              style={{
                marginTop: 14,
                background: CARD,
                borderRadius: 24,
                padding: 3,
                display: "flex",
                height: 36,
              }}
            >
              {(
                [
                  { id: "all", label: "Të gjitha" },
                  { id: "sold", label: "Shitur" },
                  { id: "bought", label: "Blerë" },
                ] as const
              ).map((t) => {
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    style={{
                      flex: 1,
                      border: 0,
                      borderRadius: 20,
                      background: active ? INK : "transparent",
                      color: active ? CREAM : MUTED,
                      fontSize: 13,
                      fontWeight: 500,
                      WebkitTapHighlightColor: "transparent",
                      cursor: "pointer",
                    }}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Rate button */}
            {!isOwn && currentUserId && canRate && (
              <button
                onClick={() => setRateOpen(true)}
                style={{
                  marginTop: 14,
                  width: "100%",
                  height: 48,
                  borderRadius: 12,
                  background: INK,
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 600,
                  border: 0,
                  WebkitTapHighlightColor: "transparent",
                  cursor: "pointer",
                }}
              >
                Lër një vlerësim
              </button>
            )}

            {/* List */}
            <div style={{ marginTop: 14 }}>
              {loading ? (
                <div style={{ display: "grid", placeItems: "center", padding: 40 }}>
                  <Loader2 className="animate-spin" size={20} color={MUTED} />
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px" }}>
                  <Star size={48} color={DIVIDER} strokeWidth={1.5} style={{ margin: "0 auto" }} />
                  <div style={{ fontSize: 16, fontWeight: 700, color: INK, marginTop: 12 }}>
                    Ende asnjë vlerësim
                  </div>
                  <div style={{ fontSize: 13, color: MUTED, marginTop: 6 }}>
                    Vlerësimet shfaqen pasi të kryhet një shitje
                  </div>
                </div>
              ) : (
                filtered.map((r) => {
                  const rp = raters[r.rater_id];
                  const name = rp?.name || "Përdorues";
                  const goToProfile = (e: React.MouseEvent) => {
                    e.stopPropagation();
                    onOpenChange(false);
                    navigate({ to: "/user/$id", params: { id: r.rater_id } });
                  };
                  return (
                    <div
                      key={r.id}
                      style={{
                        background: CARD,
                        borderRadius: 14,
                        padding: 14,
                        marginBottom: 8,
                        display: "flex",
                        gap: 12,
                        transition: "transform 80ms ease",
                        WebkitTapHighlightColor: "transparent",
                      }}
                      onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.99)")}
                      onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                      onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    >
                      <button
                        type="button"
                        onClick={goToProfile}
                        style={{
                          background: "transparent",
                          border: 0,
                          padding: 0,
                          cursor: "pointer",
                          flexShrink: 0,
                          WebkitTapHighlightColor: "transparent",
                        }}
                        aria-label={name}
                      >
                        {rp?.avatar_url ? (
                          <img
                            src={rp.avatar_url}
                            alt=""
                            style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", display: "block" }}
                          />
                        ) : (
                          <Initials name={name} />
                        )}
                      </button>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                          <button
                            type="button"
                            onClick={goToProfile}
                            className="active:opacity-70 hover:underline"
                            style={{
                              background: "transparent",
                              border: 0,
                              padding: 0,
                              cursor: "pointer",
                              fontSize: 14,
                              fontWeight: 600,
                              color: INK,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              textAlign: "left",
                              WebkitTapHighlightColor: "transparent",
                            }}
                          >
                            {name}
                          </button>
                          <StarBar value={r.stars} />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
                          <div style={{ fontSize: 12, color: MUTED }}>Blerës · Takim personal</div>
                          <div style={{ fontSize: 12, color: MUTED }}>{formatReviewDate(r.created_at)}</div>
                        </div>
                        {r.comment && (
                          <div style={{ fontSize: 13, color: INK, marginTop: 6, lineHeight: 1.5 }}>
                            {r.comment}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Rate sheet */}
      <Sheet open={rateOpen} onOpenChange={setRateOpen}>
        <SheetContent side="bottom" hideClose className="p-0 border-0" style={{ backgroundColor: CREAM }}>
          <div style={{ padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                type="button"
                onClick={() => setRateOpen(false)}
                aria-label="Kthehu"
                className="grid place-items-center rounded-full transition-transform duration-150 active:scale-90"
                style={{
                  width: 36,
                  height: 36,
                  backgroundColor: "rgba(255,255,255,0.7)",
                  border: "1px solid rgba(226,226,222,0.8)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <ChevronLeft size={22} color="#2d1521" strokeWidth={2} />
              </button>
              <div style={{ fontSize: 16, fontWeight: 700, color: INK }}>Vlerëso shitësin</div>
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setStars(n)}
                  style={{
                    background: "transparent",
                    border: 0,
                    cursor: "pointer",
                    padding: 4,
                    WebkitTapHighlightColor: "transparent",
                    transform: stars === n ? "scale(1.15)" : "scale(1)",
                    transition: "transform 150ms cubic-bezier(0.5, 1.5, 0.5, 1)",
                  }}
                >
                  <Star
                    size={32}
                    strokeWidth={0}
                    fill={n <= stars ? CORAL : DIVIDER}
                  />
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Shkruaj një koment (opsionale)..."
              rows={4}
              style={{
                width: "100%",
                marginTop: 16,
                background: CARD,
                border: 0,
                borderRadius: 12,
                padding: 12,
                fontSize: 13,
                color: INK,
                resize: "none",
                outline: "none",
              }}
            />
            <button
              onClick={submitReview}
              disabled={stars < 1 || submitting}
              style={{
                marginTop: 16,
                width: "100%",
                height: 48,
                borderRadius: 12,
                background: CORAL,
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                border: 0,
                cursor: "pointer",
                opacity: stars < 1 || submitting ? 0.5 : 1,
                display: "inline-flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 8,
              }}
            >
              {submitting && <Loader2 className="animate-spin" size={16} />}
              Dërgo vlerësimin
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function Info({ icon, text }: { icon: React.ReactNode; text: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: INK }}>
      {icon}
      <span>{text}</span>
    </div>
  );
}
