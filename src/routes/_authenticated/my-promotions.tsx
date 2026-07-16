import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronLeft, Loader2, Sparkles, Zap, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { MobileShell } from "@/components/marketplace/MobileShell";
import { SwipeBackWrapper } from "@/components/SwipeBackWrapper";
import { supabase } from "@/integrations/supabase/client";
import { hydrateListings, type ListingRow, type ListingView } from "@/lib/listings";

export const Route = createFileRoute("/_authenticated/my-promotions")({
  component: () => (
    <SwipeBackWrapper>
      <MyPromotionsPage />
    </SwipeBackWrapper>
  ),
});

const CREAM = "#ffffff";
const CARD = "#ffffff";
const INK = "#2d1521";
const MUTED = "#a89f94";
const CORAL = "#c65a7a";
const DIVIDER = "#e2e2de";

type Kind = "feed_top" | "category_top" | "search_top";

function MyPromotionsPage() {
  const [loading, setLoading] = useState(true);
  const [topCredits, setTopCredits] = useState(0);
  const [ppDays, setPpDays] = useState(0);
  const [tier, setTier] = useState<string | null>(null);
  const [listings, setListings] = useState<ListingView[]>([]);
  const [picker, setPicker] = useState<{ listing: ListingView } | null>(null);
  const [daysSheet, setDaysSheet] = useState<{
    listing: ListingView;
    kind: "feed_top" | "category_top";
  } | null>(null);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [{ data: prof }, { data: rows }] = await Promise.all([
      supabase
        .from("profiles")
        .select("membership_tier, top_of_list_credits, paid_placement_days")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("listings")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false }),
    ]);
    const p = (prof ?? {}) as { membership_tier?: string | null; top_of_list_credits?: number; paid_placement_days?: number };
    setTier(p.membership_tier ?? null);
    setTopCredits(p.top_of_list_credits ?? 0);
    setPpDays(p.paid_placement_days ?? 0);
    setListings(await hydrateListings((rows ?? []) as ListingRow[]));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const consume = async (listingId: string, kind: Kind, days?: number) => {
    if (kind === "search_top" && topCredits <= 0) {
      toast.error("Nuk keni më kredite 'Krye të listës' këtë muaj");
      return;
    }
    if ((kind === "feed_top" || kind === "category_top") && (days ?? 0) > ppDays) {
      toast.error("Nuk keni më ditë 'Plasim i paguar' këtë muaj");
      return;
    }
    const { error } = await (supabase as unknown as {
      rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
    }).rpc("consume_promotion_credit", {
      _listing_id: listingId,
      _kind: kind,
      _days: kind === "search_top" ? null : days,
    });
    if (error) {
      if (error.message.includes("no_top_of_list_credits")) {
        toast.error("Nuk keni më kredite 'Krye të listës' këtë muaj");
      } else if (error.message.includes("no_paid_placement_days")) {
        toast.error("Nuk keni më ditë 'Plasim i paguar' këtë muaj");
      } else {
        toast.error(error.message);
      }
      return;
    }
    toast.success("Promovimi u aktivizua!");
    setPicker(null);
    setDaysSheet(null);
    load();
  };

  return (
    <MobileShell hideNav>
      <div className="min-h-screen" style={{ backgroundColor: CREAM }}>
        <header
          className="sticky top-0 z-30 flex items-center px-4 pt-4 pb-3"
          style={{ backgroundColor: CREAM }}
        >
          <button
            onClick={() => window.history.back()}
            className="grid h-10 w-10 place-items-center rounded-full"
            style={{ backgroundColor: CARD }}
            aria-label="Kthehu"
          >
            <ArrowLeft className="h-5 w-5" style={{ color: INK }} />
          </button>
          <h1
            className="flex-1 px-3 text-center font-display text-[22px] italic"
            style={{ color: INK }}
          >
            Promovimet e mia
          </h1>
          <div className="h-10 w-10" />
        </header>

        {loading ? (
          <div className="grid place-items-center py-20">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: MUTED }} />
          </div>
        ) : (
          <>
            <section className="px-4 pt-2">
              <div
                style={{
                  backgroundColor: INK,
                  borderRadius: 16,
                  padding: 20,
                  color: "#ffffff",
                }}
              >
                <p className="text-[12px]" style={{ color: "#e5e0d5", letterSpacing: 1, fontWeight: 700 }}>
                  {tier ? tier.toUpperCase() : "PA MEDLEMSKAP"}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <BalanceTile
                    icon={<Zap className="h-4 w-4" />}
                    label="Krye e kërkimit"
                    value={String(topCredits)}
                    suffix="kredite"
                  />
                  <BalanceTile
                    icon={<Sparkles className="h-4 w-4" />}
                    label="Plasim i paguar"
                    value={String(ppDays)}
                    suffix="ditë"
                  />
                </div>
                {!tier && (
                  <p className="mt-3 text-[12px]" style={{ color: "#e5e0d5" }}>
                    Bli një medlemskap ose kredite për të filluar promovimet.
                  </p>
                )}
              </div>
            </section>

            <section className="mt-6 px-4 pb-32">
              <h2 className="text-[16px] font-bold" style={{ color: INK }}>
                Artikujt e mi
              </h2>
              {listings.length === 0 ? (
                <p className="mt-3 text-[13px]" style={{ color: MUTED }}>
                  Nuk keni artikuj aktivë.
                </p>
              ) : (
                <div className="mt-3 space-y-2">
                  {listings.map((l) => (
                    <div
                      key={l.id}
                      className="flex items-center gap-3"
                      style={{ backgroundColor: CARD, borderRadius: 14, padding: 10 }}
                    >
                      <div
                        className="overflow-hidden"
                        style={{ width: 56, height: 56, borderRadius: 10, backgroundColor: DIVIDER, flexShrink: 0 }}
                      >
                        {l.coverUrl && (
                          <img src={l.coverUrl} alt="" className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-bold" style={{ color: INK }}>
                          {l.title}
                        </p>
                        <p className="text-[12px]" style={{ color: MUTED }}>
                          €{Number(l.price).toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={() => setPicker({ listing: l })}
                        style={{
                          backgroundColor: INK,
                          color: "#ffffff",
                          borderRadius: 10,
                          padding: "8px 14px",
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        Përdor
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {picker && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            onClick={() => setPicker(null)}
          >
            <div
              className="w-full max-w-[440px]"
              style={{ backgroundColor: CREAM, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: "16px 20px 28px" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto h-1 w-10 rounded-full" style={{ backgroundColor: DIVIDER }} />
              <p className="mt-4 text-[18px] font-bold" style={{ color: INK }}>
                Zgjedh promovimin
              </p>
              <p className="mt-1 text-[13px]" style={{ color: MUTED }}>
                {picker.listing.title}
              </p>

              <button
                onClick={() => {
                  if (ppDays <= 0) {
                    toast.error("Nuk keni më ditë 'Plasim i paguar' këtë muaj");
                    return;
                  }
                  setDaysSheet({ listing: picker.listing, kind: "feed_top" });
                  setPicker(null);
                }}
                disabled={ppDays <= 0}
                className="mt-4 flex w-full items-center justify-between px-4 py-3 text-left disabled:opacity-50"
                style={{ backgroundColor: CARD, borderRadius: 12 }}
              >
                <div>
                  <p className="text-[14px] font-bold" style={{ color: INK }}>
                    Krye i feed-it
                  </p>
                  <p className="text-[12px]" style={{ color: MUTED }}>
                    Zgjedh 1–{ppDays} ditë • {ppDays} ditë të mbetura
                  </p>
                </div>
                <Sparkles className="h-5 w-5" style={{ color: CORAL }} />
              </button>

              <button
                onClick={() => {
                  if (ppDays <= 0) {
                    toast.error("Nuk keni më ditë 'Plasim i paguar' këtë muaj");
                    return;
                  }
                  setDaysSheet({ listing: picker.listing, kind: "category_top" });
                  setPicker(null);
                }}
                disabled={ppDays <= 0}
                className="mt-2 flex w-full items-center justify-between px-4 py-3 text-left disabled:opacity-50"
                style={{ backgroundColor: CARD, borderRadius: 12 }}
              >
                <div>
                  <p className="text-[14px] font-bold" style={{ color: INK }}>
                    Krye i kategorisë
                  </p>
                  <p className="text-[12px]" style={{ color: MUTED }}>
                    Zgjedh 1–{ppDays} ditë • {ppDays} ditë të mbetura
                  </p>
                </div>
                <Sparkles className="h-5 w-5" style={{ color: CORAL }} />
              </button>

              <button
                onClick={() =>
                  topCredits > 0
                    ? consume(picker.listing.id, "search_top")
                    : toast.error("Nuk keni më kredite 'Krye të listës' këtë muaj")
                }
                disabled={topCredits <= 0}
                className="mt-2 flex w-full items-center justify-between px-4 py-3 text-left disabled:opacity-50"
                style={{ backgroundColor: CARD, borderRadius: 12 }}
              >
                <div>
                  <p className="text-[14px] font-bold" style={{ color: INK }}>
                    Krye i kërkimit
                  </p>
                  <p className="text-[12px]" style={{ color: MUTED }}>
                    Përdor 1 kredit • {topCredits} të mbetura
                  </p>
                </div>
                <Zap className="h-5 w-5" style={{ color: CORAL }} />
              </button>
            </div>
          </div>
        )}

        {daysSheet && (
          <DaysSheet
            max={ppDays}
            listing={daysSheet.listing}
            onClose={() => setDaysSheet(null)}
            onConfirm={(d) => consume(daysSheet.listing.id, daysSheet.kind, d)}
          />
        )}
      </div>
    </MobileShell>
  );
}

function BalanceTile({
  icon,
  label,
  value,
  suffix,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  suffix: string;
}) {
  return (
    <div style={{ backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 12, padding: 12 }}>
      <div className="flex items-center gap-1.5" style={{ color: "#e5e0d5" }}>
        {icon}
        <span className="text-[11px]" style={{ letterSpacing: 0.3 }}>{label}</span>
      </div>
      <p className="mt-1 font-bold" style={{ color: "#fff", fontSize: 24 }}>
        {value} <span className="text-[12px] font-normal" style={{ color: "#e5e0d5" }}>{suffix}</span>
      </p>
    </div>
  );
}

function DaysSheet({
  max,
  listing,
  onClose,
  onConfirm,
}: {
  max: number;
  listing: ListingView;
  onClose: () => void;
  onConfirm: (days: number) => void;
}) {
  const [days, setDays] = useState(1);
  const clamped = useMemo(() => Math.max(1, Math.min(days, max)), [days, max]);
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[440px]"
        style={{ backgroundColor: CREAM, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: "16px 20px 28px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto h-1 w-10 rounded-full" style={{ backgroundColor: DIVIDER }} />
        <p className="mt-4 text-[18px] font-bold" style={{ color: INK }}>
          Sa ditë?
        </p>
        <p className="mt-1 text-[13px]" style={{ color: MUTED }}>
          {listing.title} • {max} ditë të mbetura
        </p>

        <div
          className="mt-5 flex items-center justify-between"
          style={{ backgroundColor: CARD, borderRadius: 14, padding: "10px 14px" }}
        >
          <button
            onClick={() => setDays((d) => Math.max(1, d - 1))}
            className="grid h-10 w-10 place-items-center"
            style={{ backgroundColor: CREAM, borderRadius: 10 }}
          >
            <Minus className="h-4 w-4" style={{ color: INK }} />
          </button>
          <div className="text-center">
            <p className="text-[32px] font-bold" style={{ color: INK, lineHeight: 1 }}>{clamped}</p>
            <p className="text-[11px]" style={{ color: MUTED }}>ditë</p>
          </div>
          <button
            onClick={() => setDays((d) => Math.min(max, d + 1))}
            className="grid h-10 w-10 place-items-center"
            style={{ backgroundColor: CREAM, borderRadius: 10 }}
          >
            <Plus className="h-4 w-4" style={{ color: INK }} />
          </button>
        </div>

        <button
          onClick={() => onConfirm(clamped)}
          className="mt-5 grid w-full place-items-center"
          style={{
            backgroundColor: INK,
            color: "#ffffff",
            height: 52,
            borderRadius: 14,
            fontWeight: 700,
            fontSize: 15,
          }}
        >
          Aktivizo për {clamped} ditë
        </button>
        <button
          onClick={onClose}
          className="mt-2 grid w-full place-items-center"
          style={{ color: MUTED, height: 44, fontWeight: 600, fontSize: 14 }}
        >
          Anulo
        </button>
      </div>
    </div>
  );
}
