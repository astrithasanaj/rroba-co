import { createFileRoute, useNavigate, useParams, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, Check, ChevronRight, Copy } from "lucide-react";
import { toast } from "sonner";
import { MobileShell } from "@/components/marketplace/MobileShell";
import { SwipeBackWrapper } from "@/components/SwipeBackWrapper";
import { supabase } from "@/integrations/supabase/client";
import { hydrateListings, type ListingRow, type ListingView } from "@/lib/listings";

export const Route = createFileRoute("/_authenticated/listing/$id/promote")({
  component: () => (
    <SwipeBackWrapper>
      <PromotePage />
    </SwipeBackWrapper>
  ),
});

const CREAM = "#f6f1e7";
const CARD = "#ede8de";
const INK = "#1a1a1a";
const MUTED = "#a89f94";
const CORAL = "#e8826a";
const DIVIDER = "#ddd8ce";

type PromoType = "feed_top" | "category_top" | "search_top";

type Option = {
  key: PromoType;
  title: string;
  description: string;
  durations: { days: number; price: number }[];
  defaultIndex: number;
  bundle?: { count: number; price: number; days: number };
};

const OPTIONS: Option[] = [
  {
    key: "feed_top",
    title: "Krye i feed-it",
    description:
      "Shfaq artikullin tënd te 'E re këtë javë' dhe 'Për ty' te blerësit që kanë treguar interes për artikuj të ngjashëm. Rrit ndjeshëm shanset për shitje të shpejtë.",
    durations: [
      { days: 3, price: 0.99 },
      { days: 5, price: 1.49 },
      { days: 7, price: 1.99 },
    ],
    defaultIndex: 1,
  },
  {
    key: "category_top",
    title: "Krye i kategorisë",
    description:
      "Artikulli yt do të shfaqet i pari në rezultatet e kërkimit brenda kategorisë së zgjedhur. Kap vëmendjen e blerësve që shfletojnë kategori specifike.",
    durations: [
      { days: 3, price: 1.49 },
      { days: 5, price: 1.99 },
      { days: 7, price: 2.49 },
    ],
    defaultIndex: 1,
  },
  {
    key: "search_top",
    title: "Krye i kërkimit",
    description:
      "Kur dikush kërkon diçka të ngjashme me artikullin tënd, ai shfaqet i pari. Merr 3 promovime të paketëzuara — i pari aktivizohet menjëherë, dy të tjerat kur të dëshirosh.",
    durations: [{ days: 30, price: 0.99 }],
    defaultIndex: 0,
    bundle: { count: 3, price: 0.99, days: 30 },
  },
];

function PromotePage() {
  const { id } = useParams({ from: "/_authenticated/listing/$id/promote" });
  const navigate = useNavigate();
  const [listing, setListing] = useState<ListingView | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Record<PromoType, number>>({
    feed_top: 1,
    category_top: 1,
    search_top: 0,
  });
  const [paySheet, setPaySheet] = useState<{ option: Option; index: number } | null>(null);

  useEffect(() => {
    (async () => {
      const { data: row } = await supabase.from("listings").select("*").eq("id", id).maybeSingle();
      if (row) {
        const [h] = await hydrateListings([row as ListingRow]);
        setListing(h);
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading || !listing) {
    return (
      <MobileShell hideNav>
        <div className="grid h-screen place-items-center" style={{ backgroundColor: CREAM }}>
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: MUTED }} />
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell hideNav>
      <div className="min-h-screen" style={{ backgroundColor: CREAM }}>
        {/* Header */}
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
            Promovo
          </h1>
          <Link
            to="/my-promotions"
            className="grid h-10 place-items-center px-3 rounded-full text-[12px] font-bold"
            style={{ backgroundColor: CARD, color: INK }}
          >
            Kreditet
          </Link>
        </header>

        {/* placeholder replaced */}
        <div style={{ display: "none" }} />
        {/* keep spacing */}
        <div style={{ display: "none" }}>

        {/* Hero banner */}
        <section className="px-4 pt-2">
          <div
            className="w-full"
            style={{
              backgroundColor: INK,
              borderRadius: 16,
              padding: "24px 20px",
              color: "#ffffff",
            }}
          >
            <p className="font-display italic" style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.1 }}>
              Bli Rroba Premium
            </p>
            <p className="mt-2 text-[14px]" style={{ color: "#e5e0d5" }}>
              Për €2.99/muaj merr:
            </p>
            <ul className="mt-3 space-y-2">
              {[
                "5 promovime falas në krye të listës",
                "5 ditë plassim i sponsorizuar",
                "Përfitime ekskluzive anëtare",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2 text-[14px] font-bold" style={{ color: "#ffffff" }}>
                  <Check className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <Link
              to="/listing/$id/premium"
              params={{ id }}
              className="mt-4 grid w-full place-items-center"
              style={{
                backgroundColor: CORAL,
                color: "#ffffff",
                height: 46,
                borderRadius: 12,
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              Shiko të gjitha përfitimet →
            </Link>
          </div>
        </section>

        {/* Options */}
        <section className="mt-6 space-y-3 px-4 pb-32">
          {OPTIONS.map((opt) => (
            <PromoCard
              key={opt.key}
              option={opt}
              listing={listing}
              selectedIndex={selected[opt.key]}
              onSelect={(i) => setSelected((s) => ({ ...s, [opt.key]: i }))}
              onBuy={() => setPaySheet({ option: opt, index: selected[opt.key] })}
            />
          ))}
        </section>

        {paySheet && (
          <PaySheet
            option={paySheet.option}
            index={paySheet.index}
            listing={listing}
            onClose={() => setPaySheet(null)}
            onDone={() => {
              setPaySheet(null);
              navigate({ to: "/listing/$id/manage", params: { id } });
            }}
          />
        )}
      </div>
    </MobileShell>
  );
}

function PromoCard({
  option,
  listing,
  selectedIndex,
  onSelect,
  onBuy,
}: {
  option: Option;
  listing: ListingView;
  selectedIndex: number;
  onSelect: (i: number) => void;
  onBuy: () => void;
}) {
  const sel = option.durations[selectedIndex];
  const buyLabel = option.bundle
    ? `Bli ${option.bundle.count} për €${option.bundle.price.toFixed(2)}`
    : `€${sel.price.toFixed(2)}`;

  return (
    <div
      style={{
        backgroundColor: CARD,
        borderRadius: 16,
        padding: 16,
      }}
    >
      <div className="flex gap-3">
        <div
          className="overflow-hidden"
          style={{ width: 80, height: 80, borderRadius: 12, backgroundColor: DIVIDER, flexShrink: 0 }}
        >
          {listing.coverUrl && (
            <img src={listing.coverUrl} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[16px] font-bold" style={{ color: INK }}>
            {option.title}
          </p>
          <p className="mt-1 text-[13px]" style={{ color: MUTED, lineHeight: 1.5 }}>
            {option.description}
          </p>
        </div>
      </div>

      {!option.bundle && (
        <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar">
          {option.durations.map((d, i) => {
            const active = i === selectedIndex;
            return (
              <button
                key={d.days}
                onClick={() => onSelect(i)}
                className="grid place-items-center px-4 py-2"
                style={{
                  backgroundColor: active ? INK : CREAM,
                  color: active ? "#ffffff" : INK,
                  borderRadius: 12,
                  minWidth: 92,
                  border: `1px solid ${active ? INK : DIVIDER}`,
                }}
              >
                <span className="text-[13px] font-semibold">{d.days} ditë</span>
                <span className="text-[12px]" style={{ opacity: 0.85 }}>
                  €{d.price.toFixed(2)}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <button
        onClick={onBuy}
        className="mt-4 w-full"
        style={{
          backgroundColor: CORAL,
          color: "#ffffff",
          height: 50,
          borderRadius: 14,
          fontWeight: 700,
          fontSize: 15,
        }}
      >
        {buyLabel}
      </button>
    </div>
  );
}

const PAY_METHODS = [
  { key: "revolut", label: "Revolut", detail: "@rroba  •  +383 44 000 000" },
  { key: "paypal", label: "PayPal", detail: "payments@rroba.app" },
  { key: "bank", label: "Transfer bankar", detail: "XK05 1212 0000 0000 0000" },
] as const;

function PaySheet({
  option,
  index,
  listing,
  onClose,
  onDone,
}: {
  option: Option;
  index: number;
  listing: ListingView;
  onClose: () => void;
  onDone: () => void;
}) {
  const d = option.durations[index];
  const price = option.bundle ? option.bundle.price : d.price;
  const days = option.bundle ? option.bundle.days : d.days;
  const [method, setMethod] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const reference = useMemo(() => `PROMO-${listing.id.slice(0, 8).toUpperCase()}`, [listing.id]);

  const submit = async () => {
    if (!method) return;
    setSubmitting(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Duhet të kyçesh");
      setSubmitting(false);
      return;
    }
    const ends = new Date();
    ends.setDate(ends.getDate() + days);
    const { error } = await supabase.from("promotions").insert({
      listing_id: listing.id,
      seller_id: user.id,
      type: option.key,
      duration_days: days,
      price_eur: price,
      ends_at: ends.toISOString(),
      status: "pending_payment",
      payment_method: method,
      payment_reference: reference,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Faleminderit! Po e verifikojmë pagesën.");
    onDone();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[440px]"
        style={{
          backgroundColor: CREAM,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          padding: "16px 20px 28px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto h-1 w-10 rounded-full" style={{ backgroundColor: DIVIDER }} />
        <p className="mt-4 text-[18px] font-bold" style={{ color: INK }}>
          Si të paguash
        </p>
        <p className="mt-1 text-[13px]" style={{ color: MUTED }}>
          Zgjedh metodën e pagesës për €{price.toFixed(2)}
        </p>

        <div className="mt-4 space-y-2">
          {PAY_METHODS.map((m) => {
            const active = method === m.key;
            return (
              <button
                key={m.key}
                onClick={() => setMethod(m.key)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
                style={{
                  backgroundColor: active ? INK : CARD,
                  color: active ? "#ffffff" : INK,
                  borderRadius: 12,
                }}
              >
                <div>
                  <p className="text-[14px] font-bold">{m.label}</p>
                  <p className="text-[12px]" style={{ opacity: 0.75 }}>
                    {m.detail}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4" />
              </button>
            );
          })}
        </div>

        {method && (
          <div
            className="mt-4"
            style={{ backgroundColor: CARD, borderRadius: 12, padding: 14 }}
          >
            <p className="text-[13px]" style={{ color: INK, lineHeight: 1.5 }}>
              Dërgo <strong>€{price.toFixed(2)}</strong> dhe na shkruaj në mesazhe me referencën:
            </p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(reference);
                toast.success("Referenca u kopjua");
              }}
              className="mt-2 flex items-center gap-2"
              style={{
                backgroundColor: CREAM,
                borderRadius: 8,
                padding: "8px 12px",
                border: `1px solid ${DIVIDER}`,
              }}
            >
              <span className="text-[13px] font-bold" style={{ color: INK }}>
                {reference}
              </span>
              <Copy className="h-3.5 w-3.5" style={{ color: MUTED }} />
            </button>
            <p className="mt-3 text-[12px]" style={{ color: MUTED }}>
              Do të aktivizojmë promovimin tuaj brenda 2 orëve.
            </p>
          </div>
        )}

        <button
          onClick={submit}
          disabled={!method || submitting}
          className="mt-5 grid w-full place-items-center disabled:opacity-50"
          style={{
            backgroundColor: INK,
            color: "#ffffff",
            height: 52,
            borderRadius: 14,
            fontWeight: 700,
            fontSize: 15,
          }}
        >
          {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "E kam dërguar pagesën"}
        </button>
        <button
          onClick={onClose}
          disabled={submitting}
          className="mt-2 grid w-full place-items-center"
          style={{ color: MUTED, height: 44, fontWeight: 600, fontSize: 14 }}
        >
          Anulo
        </button>
      </div>
    </div>
  );
}
