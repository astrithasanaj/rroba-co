import { createFileRoute, useNavigate, useParams, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Info, MapPin, Handshake, Home, ChevronRight, X } from "lucide-react";
import { toast } from "sonner";
import { MobileShell } from "@/components/marketplace/MobileShell";
import { supabase } from "@/integrations/supabase/client";
import { hydrateListings, type ListingRow, type ListingView } from "@/lib/listings";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export const Route = createFileRoute("/_authenticated/buy/$id")({
  component: BuyPage,
});

type Seller = { id: string; name: string; avatar_url: string | null };

const CREAM = "#f6f1e7";
const CARD = "#ede8de";
const TEXT = "#1a1a1a";
const MUTED = "#a89f94";
const DIVIDER = "#ddd8ce";
const CORAL = "#e8826a";

function roundHalf(n: number) {
  return Math.round(n * 2) / 2;
}

function BuyPage() {
  const { id } = useParams({ from: "/_authenticated/buy/$id" });
  const navigate = useNavigate();
  const [listing, setListing] = useState<ListingView | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [me, setMe] = useState<string | null>(null);
  const [delivery, setDelivery] = useState<"meet" | "home" | null>(null);
  const [location, setLocation] = useState("");
  const [address, setAddress] = useState("");
  const [offerOpen, setOfferOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [protectionInfoOpen, setProtectionInfoOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMe(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: row } = await supabase.from("listings").select("*").eq("id", id).maybeSingle();
      if (!row) return;
      const [h] = await hydrateListings([row as ListingRow]);
      const { data: prof } = await supabase
        .from("public_profiles" as any)
        .select("id,name,avatar_url")
        .eq("id", row.user_id)
        .maybeSingle();
      if (!active) return;
      setListing(h);
      setSeller(prof as Seller | null);
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const price = listing?.price ?? 0;
  const fee = useMemo(() => roundHalf(price * 0.05), [price]);
  const total = price + fee;

  const deliveryOptions = listing?.delivery ?? [];
  const hasMeet =
    deliveryOptions.length === 0 ||
    deliveryOptions.some((d) => /takim|meet|person/i.test(d));
  const hasHome =
    deliveryOptions.length === 0 ||
    deliveryOptions.some((d) => /dorëzim|dorezim|home|shtëpi|shtepi/i.test(d));

  useEffect(() => {
    if (!listing) return;
    if (hasMeet && !hasHome) setDelivery("meet");
    else if (hasHome && !hasMeet) setDelivery("home");
  }, [listing, hasMeet, hasHome]);

  const canConfirm =
    delivery !== null &&
    (delivery === "meet" ? location.trim().length > 0 : address.trim().length > 0);

  const sendOffer = async () => {
    if (!listing || !me) return;
    const n = Number(offerAmount.replace(",", "."));
    if (!Number.isFinite(n) || n <= 0) {
      toast.error("Shkruaj një çmim të vlefshëm");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("offers").insert({
      listing_id: listing.id,
      buyer_id: me,
      seller_id: listing.user_id,
      amount: n,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Propozimi u dërgua!");
    setOfferAmount("");
    setOfferOpen(false);
  };

  const confirmBuy = async () => {
    if (!listing || !me) return;
    setSubmitting(true);
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("listing_id", listing.id)
      .eq("buyer_id", me)
      .maybeSingle();
    let convId = existing?.id;
    if (!convId) {
      const { data: created, error } = await supabase
        .from("conversations")
        .insert({ listing_id: listing.id, buyer_id: me, seller_id: listing.user_id })
        .select("id")
        .single();
      if (error) {
        setSubmitting(false);
        return toast.error(error.message);
      }
      convId = created.id;
    }
    const deliveryText =
      delivery === "meet"
        ? `Takim personal në: ${location}`
        : `Dorëzim në shtëpi. Adresa: ${address}`;
    const content = `Dua të blej ${listing.title} për €${listing.price}. ${deliveryText}`;
    await supabase.from("messages").insert({
      conversation_id: convId,
      sender_id: me,
      content,
    });
    setSubmitting(false);
    setConfirmOpen(false);
    toast.success("Kërkesa u dërgua te shitësi");
    navigate({ to: "/messages", search: { thread: convId } });
  };

  if (!listing) {
    return (
      <MobileShell hideNav>
        <div className="p-10 text-center text-sm" style={{ color: MUTED }}>
          Duke ngarkuar...
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell hideNav>
      <div style={{ backgroundColor: CREAM, minHeight: "100vh", color: TEXT }}>
        {/* Header */}
        <div
          className="sticky top-0 z-20 flex items-center justify-between px-4"
          style={{ backgroundColor: CREAM, height: 56, borderBottom: `1px solid ${DIVIDER}` }}
        >
          <button
            onClick={() => window.history.back()}
            className="grid h-9 w-9 place-items-center rounded-full"
            aria-label="Kthehu"
          >
            <ArrowLeft size={22} strokeWidth={1.6} color={TEXT} />
          </button>
          <h1 className="text-base font-bold" style={{ color: TEXT }}>Bli</h1>
          {seller ? (
            <Link
              to="/user/$id"
              params={{ id: seller.id }}
              className="block h-9 w-9 overflow-hidden rounded-full"
            >
              <img
                src={
                  seller.avatar_url ||
                  `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seller.name || "U")}`
                }
                alt={seller.name}
                className="h-full w-full object-cover"
              />
            </Link>
          ) : (
            <div className="h-9 w-9" />
          )}
        </div>

        <div className="px-4 pt-4 pb-40 space-y-5">
          {/* Product summary */}
          <div className="rounded-2xl p-3.5 flex gap-3 items-center" style={{ backgroundColor: CARD }}>
            {listing.coverUrl && (
              <img
                src={listing.coverUrl}
                alt={listing.title}
                className="h-[60px] w-[60px] rounded-xl object-cover shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold" style={{ color: TEXT }}>
                {listing.title}
              </p>
              <p className="text-xs" style={{ color: MUTED }}>
                {listing.brand || listing.category} · {listing.size}
              </p>
            </div>
            <p className="text-sm font-bold" style={{ color: TEXT }}>€{listing.price}</p>
          </div>

          {/* Price breakdown */}
          <div>
            <div className="flex items-center justify-between text-sm py-1">
              <span style={{ color: MUTED }}>Çmimi i artikullit</span>
              <span style={{ color: TEXT }} className="font-semibold">€{price}</span>
            </div>
            <div className="flex items-center justify-between text-sm py-1">
              <button
                type="button"
                onClick={() => setProtectionInfoOpen(true)}
                className="inline-flex items-center gap-1.5"
                style={{ color: MUTED }}
              >
                Mbrojtja e blerësit
                <Info size={14} strokeWidth={1.6} />
              </button>
              <span style={{ color: TEXT }} className="font-semibold">€{fee.toFixed(2)}</span>
            </div>
            <div style={{ borderTop: `1px dashed ${DIVIDER}`, marginTop: 6, marginBottom: 6 }} />
            <div className="flex items-center justify-between text-sm py-1">
              <span style={{ color: TEXT }} className="font-bold">Nëntotali</span>
              <span style={{ color: TEXT }} className="font-bold">€{total.toFixed(2)}</span>
            </div>
          </div>

          {/* Offer / add more section */}
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: CARD }}>
            <div className="flex items-center justify-between p-4 gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold" style={{ color: TEXT }}>Dëshiron çmim tjetër?</p>
                <p className="text-xs mt-0.5" style={{ color: MUTED }}>Propozoi një çmim shitësit</p>
              </div>
              <button
                onClick={() => setOfferOpen(true)}
                className="shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold"
                style={{ backgroundColor: CREAM, color: TEXT, border: `1px solid ${TEXT}` }}
              >
                Propozim
              </button>
            </div>
            <div style={{ borderTop: `1px solid ${DIVIDER}` }} />
            <div className="flex items-center justify-between p-4 gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold" style={{ color: TEXT }}>Shto më shumë nga ky shitës</p>
                <p className="text-xs mt-0.5" style={{ color: MUTED }}>Merri gjithçka në një paketë!</p>
              </div>
              {seller && (
                <Link
                  to="/user/$id"
                  params={{ id: seller.id }}
                  className="shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold"
                  style={{ backgroundColor: CREAM, color: TEXT, border: `1px solid ${TEXT}` }}
                >
                  Shiko
                </Link>
              )}
            </div>
          </div>

          {/* Delivery */}
          <div>
            <h2 className="text-lg font-bold mb-3" style={{ color: TEXT }}>Dorëzimi</h2>
            <div className={hasMeet && hasHome ? "grid grid-cols-2 gap-3" : ""}>
              {hasMeet && (
                <button
                  onClick={() => setDelivery("meet")}
                  className="rounded-2xl p-4 text-left"
                  style={{
                    backgroundColor: delivery === "meet" ? TEXT : CARD,
                    color: delivery === "meet" ? "#fff" : TEXT,
                  }}
                >
                  <Handshake size={22} strokeWidth={1.6} />
                  <p className="mt-2 text-sm font-semibold">Takim personal</p>
                </button>
              )}
              {hasHome && (
                <button
                  onClick={() => setDelivery("home")}
                  className="rounded-2xl p-4 text-left"
                  style={{
                    backgroundColor: delivery === "home" ? TEXT : CARD,
                    color: delivery === "home" ? "#fff" : TEXT,
                  }}
                >
                  <Home size={22} strokeWidth={1.6} />
                  <p className="mt-2 text-sm font-semibold">Dorëzim në shtëpi</p>
                </button>
              )}
            </div>

            {delivery === "meet" && (
              <div className="mt-4">
                <label className="text-xs font-semibold" style={{ color: TEXT }}>
                  Ku dëshiron të takohesh?
                </label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Shkruaj vendndodhjen..."
                  className="mt-2 w-full rounded-xl px-4 py-3 text-sm outline-none"
                  style={{ backgroundColor: CARD, color: TEXT }}
                />
              </div>
            )}
            {delivery === "home" && (
              <div className="mt-4">
                <label className="text-xs font-semibold inline-flex items-center gap-1.5" style={{ color: TEXT }}>
                  <MapPin size={14} strokeWidth={1.6} color={MUTED} />
                  Adresa e dorëzimit
                </label>
                <div className="mt-2 flex items-center rounded-xl px-4 py-3" style={{ backgroundColor: CARD }}>
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Shkruaj adresën tënde..."
                    className="flex-1 bg-transparent text-sm outline-none"
                    style={{ color: TEXT }}
                  />
                  <ChevronRight size={18} color={MUTED} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sticky confirm */}
        <div
          className="fixed bottom-0 left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 px-4 pt-3"
          style={{ backgroundColor: CREAM, borderTop: `1px solid ${DIVIDER}` }}
        >
          <button
            onClick={() => canConfirm && setConfirmOpen(true)}
            disabled={!canConfirm}
            className="w-full font-bold text-white transition active:scale-[0.98]"
            style={{
              backgroundColor: canConfirm ? CORAL : DIVIDER,
              height: 56,
              borderRadius: 14,
              fontSize: 16,
            }}
          >
            Konfirmo blerjen
          </button>
          <div style={{ height: "env(safe-area-inset-bottom)" }} />
          <div className="h-3" />
        </div>
      </div>

      {/* Offer sheet */}
      <Sheet open={offerOpen} onOpenChange={setOfferOpen}>
        <SheetContent side="bottom" style={{ backgroundColor: CREAM, borderColor: DIVIDER }} className="rounded-t-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14" />
            <h3 className="text-base font-bold" style={{ color: TEXT }}>Propozim çmimi</h3>
            <button onClick={() => setOfferOpen(false)} className="text-sm" style={{ color: MUTED }}>Anulo</button>
          </div>
          <p className="text-sm mb-3" style={{ color: MUTED }}>Çmimi aktual: €{price}</p>
          <div className="flex items-center rounded-xl px-4 py-3 mb-2" style={{ backgroundColor: CARD }}>
            <span className="text-lg font-bold mr-2" style={{ color: TEXT }}>€</span>
            <input
              type="number"
              inputMode="decimal"
              value={offerAmount}
              onChange={(e) => setOfferAmount(e.target.value)}
              className="flex-1 bg-transparent text-lg font-bold outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              style={{ color: TEXT }}
              placeholder="0"
            />
          </div>
          <p className="text-xs mb-4" style={{ color: MUTED }}>
            Shitësi do të njoftohet për propozimin tënd
          </p>
          <button
            onClick={sendOffer}
            disabled={submitting}
            className="w-full font-bold text-white rounded-2xl h-12 mb-6 disabled:opacity-50"
            style={{ backgroundColor: TEXT }}
          >
            Dërgo propozimin
          </button>
        </SheetContent>
      </Sheet>

      {/* Protection info sheet */}
      <Sheet open={protectionInfoOpen} onOpenChange={setProtectionInfoOpen}>
        <SheetContent side="bottom" style={{ backgroundColor: CREAM, borderColor: DIVIDER }} className="rounded-t-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold" style={{ color: TEXT }}>Mbrojtja e blerësit</h3>
            <button onClick={() => setProtectionInfoOpen(false)}>
              <X size={20} color={TEXT} />
            </button>
          </div>
          <p className="text-sm mb-6" style={{ color: TEXT }}>
            Mbrojtja e blerësit siguron që të marrësh artikullin siç përshkruhet.
          </p>
        </SheetContent>
      </Sheet>

      {/* Confirm buy sheet */}
      <Sheet open={confirmOpen} onOpenChange={setConfirmOpen}>
        <SheetContent side="bottom" style={{ backgroundColor: CREAM, borderColor: DIVIDER }} className="rounded-t-2xl">
          <h3 className="text-base font-bold mb-4 text-center" style={{ color: TEXT }}>Konfirmo blerjen</h3>
          <div className="rounded-2xl p-4 mb-4 space-y-2" style={{ backgroundColor: CARD }}>
            <div className="flex justify-between text-sm"><span style={{ color: MUTED }}>Artikulli</span><span style={{ color: TEXT }} className="font-semibold">{listing.title}</span></div>
            <div className="flex justify-between text-sm"><span style={{ color: MUTED }}>Çmimi</span><span style={{ color: TEXT }} className="font-semibold">€{price}</span></div>
            <div className="flex justify-between text-sm"><span style={{ color: MUTED }}>Dorëzimi</span><span style={{ color: TEXT }} className="font-semibold">{delivery === "meet" ? "Takim personal" : "Dorëzim në shtëpi"}</span></div>
          </div>
          <button
            onClick={confirmBuy}
            disabled={submitting}
            className="w-full font-bold text-white rounded-2xl h-12 mb-6 disabled:opacity-50"
            style={{ backgroundColor: CORAL }}
          >
            Konfirmo
          </button>
        </SheetContent>
      </Sheet>
    </MobileShell>
  );
}
