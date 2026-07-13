import { createFileRoute, useNavigate, useParams, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, Check, ChevronRight, Copy, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import { MobileShell } from "@/components/marketplace/MobileShell";
import { SwipeBackWrapper } from "@/components/SwipeBackWrapper";
import { supabase } from "@/integrations/supabase/client";

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
type CreditKind = "paid_placement_days" | "top_of_list_credits";

type Purchase = { amount: number; original: number; price: number; label: string };

type Option = {
  key: PromoType;
  title: string;
  description: string;
  creditKind: CreditKind;
  creditUnit: "day" | "use";
  membershipLabel: string;
  purchases: Purchase[];
  defaultIndex: number;
};

const OPTIONS: Option[] = [
  {
    key: "feed_top",
    title: "Krye i feed-it",
    description:
      "Shfaq artikullin tënd te 'E re këtë javë' dhe 'Për ty'. Rrit ndjeshëm shanset për shitje të shpejtë.",
    creditKind: "paid_placement_days",
    creditUnit: "day",
    membershipLabel: "1 ditë nga plasimi i paguar",
    purchases: [
      { amount: 3, original: 1.86, price: 1.40, label: "3 ditë" },
      { amount: 5, original: 2.49, price: 1.87, label: "5 ditë" },
      { amount: 7, original: 3.11, price: 2.33, label: "7 ditë" },
    ],
    defaultIndex: 1,
  },
  {
    key: "category_top",
    title: "Krye i kategorisë",
    description:
      "Artikulli yt shfaqet i pari në kategorinë e zgjedhur. Kap vëmendjen e blerësve që shfletojnë kategori specifike.",
    creditKind: "paid_placement_days",
    creditUnit: "day",
    membershipLabel: "1 ditë nga plasimi i paguar",
    purchases: [
      { amount: 3, original: 1.86, price: 1.40, label: "3 ditë" },
      { amount: 5, original: 2.49, price: 1.87, label: "5 ditë" },
      { amount: 7, original: 3.11, price: 2.33, label: "7 ditë" },
    ],
    defaultIndex: 1,
  },
  {
    key: "search_top",
    title: "Krye i kërkimit",
    description:
      "Kur dikush kërkon diçka të ngjashme, artikulli yt shfaqet i pari. Kreditë ruhen dhe përdoren kur të duash.",
    creditKind: "top_of_list_credits",
    creditUnit: "use",
    membershipLabel: "1 kredit 'Krye e listës'",
    purchases: [
      { amount: 3, original: 1.86, price: 1.40, label: "3 kredite" },
      { amount: 5, original: 2.86, price: 2.15, label: "5 kredite" },
      { amount: 10, original: 4.99, price: 3.74, label: "10 kredite" },
    ],
    defaultIndex: 0,
  },
];

type Balances = {
  tier: string | null;
  paid_placement_days: number;
  top_of_list_credits: number;
};

function PromotePage() {
  const { id } = useParams({ from: "/_authenticated/listing/$id/promote" });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [balances, setBalances] = useState<Balances>({
    tier: null,
    paid_placement_days: 0,
    top_of_list_credits: 0,
  });
  const [selected, setSelected] = useState<Record<PromoType, number>>({
    feed_top: 1,
    category_top: 1,
    search_top: 0,
  });
  const [paySheet, setPaySheet] = useState<{ option: Option; index: number } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    const { data: prof } = await supabase
      .from("profiles")
      .select("membership_tier, top_of_list_credits, paid_placement_days")
      .eq("id", user.id)
      .maybeSingle();
    const p = (prof ?? {}) as {
      membership_tier?: string | null;
      top_of_list_credits?: number;
      paid_placement_days?: number;
    };
    setBalances({
      tier: p.membership_tier ?? null,
      paid_placement_days: p.paid_placement_days ?? 0,
      top_of_list_credits: p.top_of_list_credits ?? 0,
    });
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const useMembershipCredit = async (opt: Option) => {
    if (busy) return;
    setBusy(true);
    const args: Record<string, unknown> = {
      _listing_id: id,
      _kind: opt.key,
      _days: opt.creditUnit === "day" ? 1 : null,
    };
    const { error } = await (supabase as unknown as {
      rpc: (fn: string, a: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
    }).rpc("consume_promotion_credit", args);
    setBusy(false);
    if (error) {
      if (error.message.includes("no_paid_placement_days")) {
        toast.error("Nuk keni më ditë 'Plasim i paguar' këtë muaj");
      } else if (error.message.includes("no_top_of_list_credits")) {
        toast.error("Nuk keni më kredite 'Krye të listës' këtë muaj");
      } else {
        toast.error(error.message);
      }
      return;
    }
    toast.success("Promovimi u aktivizua!");
    navigate({ to: "/listing/$id/manage", params: { id } });
  };

  if (loading) {
    return (
      <MobileShell hideNav>
        <div className="grid h-screen place-items-center" style={{ backgroundColor: CREAM }}>
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: MUTED }} />
        </div>
      </MobileShell>
    );
  }

  const isMember = !!balances.tier;

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

        {/* Non-member savings banner */}
        {!isMember && (
          <section className="px-4 pt-1">
            <Link
              to="/listing/$id/premium"
              params={{ id }}
              className="block"
              style={{
                backgroundColor: CARD,
                borderRadius: 12,
                padding: "12px 14px",
                border: `1px solid ${DIVIDER}`,
              }}
            >
              <p className="text-[13px]" style={{ color: INK, lineHeight: 1.4 }}>
                Shitësit që promovojnë shpesh <strong>kursejnë deri në 52%</strong> me Rroba Premium →
              </p>
            </Link>
          </section>
        )}

        <section className="mt-4 space-y-3 px-4 pb-32">
          {OPTIONS.map((opt) => {
            const remaining =
              opt.creditKind === "paid_placement_days"
                ? balances.paid_placement_days
                : balances.top_of_list_credits;
            return (
              <PromoCard
                key={opt.key}
                option={opt}
                remaining={remaining}
                canUseMembership={remaining > 0}
                onUseMembership={() => useMembershipCredit(opt)}
                selectedIndex={selected[opt.key]}
                onSelect={(i) => setSelected((s) => ({ ...s, [opt.key]: i }))}
                onBuy={() => setPaySheet({ option: opt, index: selected[opt.key] })}
              />
            );
          })}
        </section>

        {paySheet && (
          <PaySheet
            option={paySheet.option}
            index={paySheet.index}
            onClose={() => setPaySheet(null)}
            onDone={() => {
              setPaySheet(null);
              navigate({ to: "/my-promotions" });
            }}
          />
        )}
      </div>
    </MobileShell>
  );
}

function PromoCard({
  option,
  remaining,
  canUseMembership,
  onUseMembership,
  selectedIndex,
  onSelect,
  onBuy,
}: {
  option: Option;
  remaining: number;
  canUseMembership: boolean;
  onUseMembership: () => void;
  selectedIndex: number;
  onSelect: (i: number) => void;
  onBuy: () => void;
}) {
  const purchase = option.purchases[selectedIndex];
  const suffix = option.creditUnit === "day" ? "ditë" : "kredite";

  return (
    <div style={{ backgroundColor: CARD, borderRadius: 16, padding: 16 }}>
      <div className="flex items-start gap-3">
        <div
          className="grid place-items-center"
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: CREAM,
            flexShrink: 0,
          }}
        >
          {option.creditKind === "paid_placement_days" ? (
            <Sparkles className="h-5 w-5" style={{ color: CORAL }} />
          ) : (
            <Zap className="h-5 w-5" style={{ color: CORAL }} />
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

      {/* Membership-credit primary CTA */}
      {canUseMembership && (
        <button
          onClick={onUseMembership}
          className="mt-4 flex w-full items-center justify-between px-4 py-3 text-left"
          style={{
            backgroundColor: INK,
            color: "#ffffff",
            borderRadius: 12,
            border: `2px solid ${CORAL}`,
          }}
        >
          <div>
            <p className="text-[14px] font-bold">Përdor {option.membershipLabel} — FALAS</p>
            <p className="text-[12px]" style={{ opacity: 0.85 }}>
              Të mbeten {remaining} {suffix} nga medlemskapi
            </p>
          </div>
          <Check className="h-5 w-5" />
        </button>
      )}

      <p
        className="mt-4 text-[11px]"
        style={{ color: MUTED, letterSpacing: 0.6, fontWeight: 700 }}
      >
        {canUseMembership ? "OSE BLI MË SHUMË" : "BLI KREDITE"}
      </p>

      <div className="mt-2 flex gap-2 overflow-x-auto no-scrollbar">
        {option.purchases.map((p, i) => {
          const active = i === selectedIndex;
          return (
            <button
              key={p.amount}
              onClick={() => onSelect(i)}
              className="relative flex flex-col items-center px-3 py-2"
              style={{
                backgroundColor: active ? INK : CREAM,
                color: active ? "#ffffff" : INK,
                borderRadius: 12,
                minWidth: 104,
                border: `1px solid ${active ? INK : DIVIDER}`,
              }}
            >
              <span
                className="absolute"
                style={{
                  top: -8,
                  right: -6,
                  backgroundColor: CORAL,
                  color: "#ffffff",
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "2px 6px",
                  borderRadius: 999,
                  letterSpacing: 0.3,
                }}
              >
                −25%
              </span>
              <span className="text-[13px] font-semibold">{p.label}</span>
              <span
                className="text-[11px] line-through"
                style={{ opacity: active ? 0.6 : 0.5 }}
              >
                €{p.original.toFixed(2)}
              </span>
              <span className="text-[13px] font-bold" style={{ color: active ? "#ffffff" : CORAL }}>
                €{p.price.toFixed(2)}
              </span>
            </button>
          );
        })}
      </div>

      <button
        onClick={onBuy}
        className="mt-4 w-full flex items-center justify-center gap-2"
        style={{
          backgroundColor: canUseMembership ? CARD : CORAL,
          color: canUseMembership ? INK : "#ffffff",
          border: canUseMembership ? `1px solid ${DIVIDER}` : "none",
          height: 48,
          borderRadius: 14,
          fontWeight: 700,
          fontSize: 14,
        }}
      >
        <span>Bli {purchase.label} për</span>
        <span className="line-through" style={{ opacity: 0.55, fontWeight: 500 }}>
          €{purchase.original.toFixed(2)}
        </span>
        <span>€{purchase.price.toFixed(2)}</span>
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
  onClose,
  onDone,
}: {
  option: Option;
  index: number;
  onClose: () => void;
  onDone: () => void;
}) {
  const p = option.purchases[index];
  const [method, setMethod] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const reference = useMemo(
    () => `CRED-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
    [],
  );

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
    const { error } = await (supabase as unknown as {
      from: (t: string) => {
        insert: (row: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
      };
    })
      .from("credit_purchases")
      .insert({
        user_id: user.id,
        kind: option.creditKind,
        amount: p.amount,
        price_eur: p.price,
        payment_method: method,
        payment_reference: reference,
        status: "pending_payment",
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
          Bli {p.label}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-[14px] line-through" style={{ color: MUTED }}>
            €{p.original.toFixed(2)}
          </span>
          <span
            style={{
              backgroundColor: CORAL,
              color: "#ffffff",
              fontSize: 10,
              fontWeight: 700,
              padding: "2px 6px",
              borderRadius: 999,
            }}
          >
            −25%
          </span>
          <span className="text-[16px] font-bold" style={{ color: INK }}>
            €{p.price.toFixed(2)}
          </span>
        </div>
        <p className="mt-2 text-[13px]" style={{ color: MUTED }}>
          Kreditet do të shtohen në saldon tënde pas verifikimit.
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
          <div className="mt-4" style={{ backgroundColor: CARD, borderRadius: 12, padding: 14 }}>
            <p className="text-[13px]" style={{ color: INK, lineHeight: 1.5 }}>
              Dërgo <strong>€{p.price.toFixed(2)}</strong> me referencën:
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
              Kreditet aktivizohen brenda 2 orëve.
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
