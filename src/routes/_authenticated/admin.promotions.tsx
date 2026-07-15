import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { MobileShell } from "@/components/marketplace/MobileShell";
import { SwipeBackWrapper } from "@/components/SwipeBackWrapper";
import { supabase } from "@/integrations/supabase/client";
import { signPaths } from "@/lib/listings";

export const Route = createFileRoute("/_authenticated/admin/promotions")({
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw redirect({ to: "/auth" });
    const { data: isAdmin } = await supabase.rpc("is_admin", { _uid: user.id });
    if (!isAdmin) throw redirect({ to: "/" });
  },
  component: () => (
    <SwipeBackWrapper>
      <AdminPromotions />
    </SwipeBackWrapper>
  ),
});

const CREAM = "#ffffff";
const CARD = "#ffffff";
const INK = "#1a1a1a";
const MUTED = "#a89f94";
const CORAL = "#e8826a";
const OK = "#2e7d32";
const ERR = "#e53935";
const DIVIDER = "#ddd8ce";

type Row = {
  id: string;
  listing_id: string;
  seller_id: string;
  type: string;
  duration_days: number;
  price_eur: number;
  status: string;
  payment_method: string | null;
  payment_reference: string | null;
  created_at: string;
  ends_at: string;
  listing_title: string;
  listing_cover: string;
  seller_name: string;
  seller_email: string;
};

const TYPE_LABEL: Record<string, string> = {
  feed_top: "Krye i feed-it",
  category_top: "Krye i kategorisë",
  search_top: "Krye i kërkimit",
};

type CreditRow = {
  id: string;
  user_id: string;
  kind: string;
  amount: number;
  price_eur: number;
  status: string;
  payment_method: string | null;
  payment_reference: string | null;
  created_at: string;
  buyer_name: string;
};

const CREDIT_LABEL: Record<string, string> = {
  paid_placement_days: "Ditë plasimi",
  top_of_list_credits: "Kredite kërkimi",
};

function AdminPromotions() {
  const [rows, setRows] = useState<Row[]>([]);
  const [credits, setCredits] = useState<CreditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pending" | "active" | "all">("pending");

  const load = async () => {
    setLoading(true);
    const [{ data: promos }, { data: cRows }] = await Promise.all([
      supabase.from("promotions").select("*").order("created_at", { ascending: false }).limit(200),
      supabase
        .from("credit_purchases")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200),
    ]);
    const safePromos = promos ?? [];
    const safeCredits = (cRows ?? []) as unknown as CreditRow[];
    const listingIds = [...new Set(safePromos.map((p) => p.listing_id))];
    const sellerIds = [
      ...new Set([
        ...safePromos.map((p) => p.seller_id),
        ...safeCredits.map((c) => c.user_id),
      ]),
    ];
    const [{ data: listings }, { data: profiles }] = await Promise.all([
      listingIds.length
        ? supabase.from("listings").select("id,title,image_paths").in("id", listingIds)
        : Promise.resolve({ data: [] as { id: string; title: string; image_paths: string[] }[] }),
      sellerIds.length
        ? supabase.from("profiles").select("id,name,display_name,username").in("id", sellerIds)
        : Promise.resolve({ data: [] as { id: string; name: string; display_name: string; username: string }[] }),
    ]);
    const coverPaths = (listings ?? [])
      .map((l) => (l.image_paths as string[])?.[0])
      .filter(Boolean) as string[];
    const signed = await signPaths(coverPaths);
    const listingMap = new Map(
      (listings ?? []).map((l) => {
        const p = (l.image_paths as string[])?.[0];
        return [l.id, { title: l.title, cover: p ? signed[p] ?? "" : "" }];
      }),
    );
    const profileMap = new Map(
      (profiles ?? []).map((p) => [
        p.id,
        p.display_name || p.name || p.username || "—",
      ]),
    );
    setRows(
      safePromos.map((p) => ({
        id: p.id,
        listing_id: p.listing_id,
        seller_id: p.seller_id,
        type: p.type,
        duration_days: p.duration_days,
        price_eur: Number(p.price_eur),
        status: p.status,
        payment_method: p.payment_method,
        payment_reference: p.payment_reference,
        created_at: p.created_at,
        ends_at: p.ends_at,
        listing_title: listingMap.get(p.listing_id)?.title ?? "—",
        listing_cover: listingMap.get(p.listing_id)?.cover ?? "",
        seller_name: profileMap.get(p.seller_id) ?? "—",
        seller_email: "",
      })),
    );
    setCredits(
      safeCredits.map((c) => ({
        ...c,
        buyer_name: profileMap.get(c.user_id) ?? "—",
      })),
    );
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const confirm = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("promotions")
      .update({
        status: "active",
        payment_confirmed: true,
        payment_confirmed_at: new Date().toISOString(),
        confirmed_by: user?.id ?? null,
      })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Promovimi u aktivizua");
    const row = rows.find((r) => r.id === id);
    if (row) {
      const { error: notifError } = await supabase.from("notifications").insert({
        user_id: row.seller_id,
        type: "promotion_active",
        data: { promotion_id: id, listing_id: row.listing_id, title: row.listing_title },
      });
      if (notifError) toast.error(`Njoftimi dështoi: ${notifError.message}`);
    }
    load();
  };

  const refuse = async (id: string) => {
    const row = rows.find((r) => r.id === id);
    const { error } = await supabase.from("promotions").update({ status: "refused" }).eq("id", id);
    if (error) return toast.error(error.message);
    if (row) {
      const { error: notifError } = await supabase.from("notifications").insert({
        user_id: row.seller_id,
        type: "promotion_refused",
        data: { promotion_id: id, listing_id: row.listing_id, title: row.listing_title },
      });
      if (notifError) toast.error(`Njoftimi dështoi: ${notifError.message}`);
    }
    toast.success("Promovimi u refuzua");
    load();
  };

  const confirmCredit = async (id: string) => {
    const row = credits.find((c) => c.id === id);
    const { error } = await supabase
      .from("credit_purchases")
      .update({ status: "confirmed" })
      .eq("id", id);
    if (error) return toast.error(error.message);
    if (row) {
      await supabase.from("notifications").insert({
        user_id: row.user_id,
        type: "credits_added",
        data: { kind: row.kind, amount: row.amount },
      });
    }
    toast.success("Kreditet u shtuan");
    load();
  };

  const refuseCredit = async (id: string) => {
    const { error } = await supabase
      .from("credit_purchases")
      .update({ status: "refused" })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Blerja u refuzua");
    load();
  };

  const filtered = rows.filter((r) => {
    if (tab === "pending") return r.status === "pending_payment";
    if (tab === "active") return r.status === "active";
    return true;
  });
  const pendingCredits = credits.filter((c) => c.status === "pending_payment");

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
          <h1 className="flex-1 px-3 text-center font-display text-[22px] italic" style={{ color: INK }}>
            Promovime
          </h1>
          <div className="h-10 w-10" />
        </header>

        <div className="flex gap-2 px-4 pb-3">
          {(["pending", "active", "all"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-2 text-[13px] font-semibold"
              style={{
                backgroundColor: tab === t ? INK : CARD,
                color: tab === t ? "#fff" : INK,
                borderRadius: 999,
              }}
            >
              {t === "pending" ? "Në pritje" : t === "active" ? "Aktive" : "Të gjitha"}
            </button>
          ))}
        </div>

        {tab === "pending" && pendingCredits.length > 0 && (
          <div className="space-y-2 px-4 pb-4">
            <p className="text-[11px] font-bold" style={{ color: MUTED, letterSpacing: 0.8 }}>
              BLERJE KREDITESH NË PRITJE
            </p>
            {pendingCredits.map((c) => (
              <div key={c.id} style={{ backgroundColor: CARD, borderRadius: 14, padding: 14 }}>
                <p className="text-[13px] font-bold" style={{ color: INK }}>
                  {c.buyer_name}
                </p>
                <p className="mt-1 text-[13px]" style={{ color: INK }}>
                  {c.amount} × {CREDIT_LABEL[c.kind] ?? c.kind} · €{Number(c.price_eur).toFixed(2)}
                </p>
                <p className="mt-0.5 text-[11px]" style={{ color: MUTED }}>
                  {c.payment_method ?? "—"} · ref {c.payment_reference ?? "—"}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => confirmCredit(c.id)}
                    className="flex-1 py-2 text-[13px] font-bold"
                    style={{ backgroundColor: OK, color: "#fff", borderRadius: 10 }}
                  >
                    <Check className="mx-auto h-4 w-4" />
                  </button>
                  <button
                    onClick={() => refuseCredit(c.id)}
                    className="flex-1 py-2 text-[13px] font-bold"
                    style={{ backgroundColor: CREAM, color: ERR, borderRadius: 10, border: `1px solid ${DIVIDER}` }}
                  >
                    <X className="mx-auto h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}


        {loading ? (
          <div className="grid h-64 place-items-center">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: MUTED }} />
          </div>
        ) : filtered.length === 0 ? (
          <p className="px-4 py-12 text-center text-[14px]" style={{ color: MUTED }}>
            Asnjë promovim.
          </p>
        ) : (
          <div className="space-y-3 px-4 pb-24">
            {filtered.map((r) => (
              <div
                key={r.id}
                style={{ backgroundColor: CARD, borderRadius: 14, padding: 14 }}
              >
                <div className="flex gap-3">
                  <div
                    className="overflow-hidden"
                    style={{ width: 64, height: 64, borderRadius: 10, backgroundColor: DIVIDER, flexShrink: 0 }}
                  >
                    {r.listing_cover && (
                      <img src={r.listing_cover} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-bold" style={{ color: INK }}>
                      {r.listing_title}
                    </p>
                    <p className="mt-0.5 truncate text-[12px]" style={{ color: MUTED }}>
                      {r.seller_name}
                    </p>
                    <p className="mt-1 text-[12px]" style={{ color: INK }}>
                      {TYPE_LABEL[r.type] ?? r.type} · {r.duration_days} ditë · €{r.price_eur.toFixed(2)}
                    </p>
                    <p className="mt-0.5 text-[11px]" style={{ color: MUTED }}>
                      {r.payment_method ?? "—"} · ref {r.payment_reference ?? "—"}
                    </p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
                {r.status === "pending_payment" && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => confirm(r.id)}
                      className="flex-1 py-2 text-[13px] font-bold"
                      style={{ backgroundColor: OK, color: "#fff", borderRadius: 10 }}
                    >
                      <Check className="mx-auto h-4 w-4" />
                    </button>
                    <button
                      onClick={() => refuse(r.id)}
                      className="flex-1 py-2 text-[13px] font-bold"
                      style={{ backgroundColor: CREAM, color: ERR, borderRadius: 10, border: `1px solid ${DIVIDER}` }}
                    >
                      <X className="mx-auto h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </MobileShell>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; fg: string; label: string }> = {
    pending_payment: { bg: "#fff3cd", fg: "#7a5a00", label: "Në pritje" },
    active: { bg: "#d4f0d4", fg: OK, label: "Aktive" },
    expired: { bg: DIVIDER, fg: MUTED, label: "Skaduar" },
    refused: { bg: "#fde2e0", fg: ERR, label: "Refuzuar" },
  };
  const s = map[status] ?? { bg: DIVIDER, fg: MUTED, label: status };
  return (
    <span
      className="h-fit shrink-0 px-2 py-1 text-[10px] font-bold"
      style={{ backgroundColor: s.bg, color: s.fg, borderRadius: 6 }}
    >
      {s.label}
    </span>
  );
}
