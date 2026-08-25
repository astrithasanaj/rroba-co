import { createFileRoute, useNavigate, useParams, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Eye,
  Heart,
  Loader2,
  Megaphone,
  Pencil,
  Send,
  CheckCircle2,
  Trash2,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { MobileShell } from "@/components/marketplace/MobileShell";
import { supabase } from "@/integrations/supabase/client";
import { hydrateListings, type ListingRow, type ListingView } from "@/lib/listings";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { SwipeBackWrapper } from "@/components/SwipeBackWrapper";
import { ReviewsSheet } from "@/components/marketplace/ReviewsSheet";

export const Route = createFileRoute("/_authenticated/listing/$id/manage")({
  component: () => (<SwipeBackWrapper><ManageListingPage /></SwipeBackWrapper>),
});

const CREAM = "#ffffff";
const CARD = "#ffffff";
const INK = "#2d1521";
const MUTED = "#a89f94";
const DIVIDER = "#e2e2de";
const DANGER = "#e53935";

function ManageListingPage() {
  const { id } = useParams({ from: "/_authenticated/listing/$id/manage" });
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const [listing, setListing] = useState<ListingView | null>(null);
  const [loading, setLoading] = useState(true);
  const [likeCount, setLikeCount] = useState(0);
  const [priceOpen, setPriceOpen] = useState(false);
  const [newPrice, setNewPrice] = useState("");
  const [savingPrice, setSavingPrice] = useState(false);
  const [confirmSold, setConfirmSold] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [working, setWorking] = useState(false);
  const [buyerPickerOpen, setBuyerPickerOpen] = useState(false);
  const [buyerCandidates, setBuyerCandidates] = useState<
    Array<{ id: string; name: string | null; avatar_url: string | null }>
  >([]);
  const [rateBuyer, setRateBuyer] = useState<{
    id: string;
    name: string | null;
    avatar_url: string | null;
  } | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data: row } = await supabase.from("listings").select("*").eq("id", id).maybeSingle();
    if (!row) {
      setLoading(false);
      return;
    }
    if (row.user_id !== user.id) {
      navigate({ to: "/product/$id", params: { id } });
      return;
    }
    const [hydrated] = await hydrateListings([row as ListingRow]);
    const { count } = await supabase
      .from("listing_likes")
      .select("*", { count: "exact", head: true })
      .eq("listing_id", id);
    setListing(hydrated);
    setLikeCount(count ?? 0);
    setNewPrice(String(hydrated.price));
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const savePrice = async () => {
    const v = parseFloat(newPrice);
    if (!Number.isFinite(v) || v < 0) {
      toast.error("Çmim i pavlefshëm");
      return;
    }
    setSavingPrice(true);
    const { error } = await supabase
      .from("listings")
      .update({ price: v, updated_at: new Date().toISOString() })
      .eq("id", id);
    setSavingPrice(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Çmimi u përditësua");
    setPriceOpen(false);
    load();
  };

  const toggleSold = async () => {
    if (!listing) return;
    const next = !listing.sold;

    // Reactivation: keep existing behavior
    if (!next) {
      setWorking(true);
      const { error } = await supabase
        .from("listings")
        .update({
          sold: false,
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      setWorking(false);
      setConfirmSold(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Artikulli u rikthye si aktiv");
      load();
      return;
    }

    // Marking sold: look up buyer candidates first
    setWorking(true);
    const { data: convos } = await supabase
      .from("conversations")
      .select("buyer_id")
      .eq("listing_id", id);
    const buyerIds = Array.from(new Set((convos ?? []).map((c) => c.buyer_id)));

    if (buyerIds.length === 0) {
      const { error } = await supabase
        .from("listings")
        .update({
          sold: true,
          status: "sold",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      setWorking(false);
      setConfirmSold(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Artikulli u shënua si i shitur");
      load();
      return;
    }

    const { data: profs } = await supabase
      .from("public_profiles")
      .select("id,name,avatar_url")
      .in("id", buyerIds);
    const byId = new Map((profs ?? []).map((p: any) => [p.id, p]));
    setBuyerCandidates(
      buyerIds.map((bid) => byId.get(bid) ?? { id: bid, name: null, avatar_url: null }),
    );
    setWorking(false);
    setConfirmSold(false);
    setBuyerPickerOpen(true);
  };

  const confirmBuyerAndSold = async (buyer: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  }) => {
    setWorking(true);
    const { error } = await supabase
      .from("listings")
      .update({
        sold: true,
        status: "sold",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (!error) {
      await supabase.from("listing_sales").upsert(
        { listing_id: id, seller_id: listing?.user_id ?? "", buyer_id: buyer.id },
        { onConflict: "listing_id" },
      );
    }
    setWorking(false);
    if (error) {
      toast.error(error.message);
      return;
    }

    setBuyerPickerOpen(false);
    toast.success("Artikulli u shënua si i shitur");
    setRateBuyer(buyer);
    setReviewOpen(true);
    load();
  };

  const deleteListing = async () => {
    setWorking(true);
    try {
      const paths = (listing?.image_paths ?? []) as string[];
      if (paths.length) {
        await supabase.storage.from("photos").remove(paths);
      }
      const { error } = await supabase.from("listings").delete().eq("id", id);
      if (error) throw error;
      toast.success("Artikulli u fshi.");
      setConfirmDelete(false);
      navigate({ to: "/profile" });
    } catch (e) {
      toast.error("Diçka shkoi keq. Provo sërish.");
    } finally {
      setWorking(false);
    }
  };

  const share = async () => {
    if (!listing) return;
    const url = `${window.location.origin}/product/${listing.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ url, title: listing.title, text: "Shiko këtë artikull në Rroba" });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Lidhja u kopjua!");
      }
    } catch {
      /* user cancelled */
    }
  };

  if (loading || !listing) {
    return (
      <MobileShell hideNav>
        <div className="grid h-screen place-items-center" style={{ backgroundColor: CREAM }}>
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: MUTED }} />
        </div>
      </MobileShell>
    );
  }

  const breadcrumb = [listing.category, listing.gender].filter(Boolean).join(" / ");
  const lastEdited = new Date(listing.created_at).toLocaleDateString("sq-AL", {
    day: "numeric",
    month: "long",
  });

  return (
    <MobileShell>
      <div className="min-h-screen" style={{ backgroundColor: CREAM }}>
        {/* Header */}
        <header className="sticky top-0 z-30 flex items-center px-4 pt-4 pb-3" style={{ backgroundColor: CREAM }}>
          <button
            type="button"
            onClick={() => window.history.back()}
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
          <h1
            className="flex-1 truncate px-3 text-center text-base font-bold"
            style={{ color: INK }}
          >
            {listing.title}
          </h1>
          <div className="h-10 w-10" />
        </header>

        {/* Top section */}
        <section className="px-4 pt-2">
          <div className="flex gap-4">
            <div
              className="overflow-hidden rounded-2xl"
              style={{ width: "45%", aspectRatio: "1 / 1", backgroundColor: CARD }}
            >
              {listing.coverUrl && (
                <img src={listing.coverUrl} alt={listing.title} className="h-full w-full object-cover" />
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <p className="line-clamp-2 text-xl font-bold leading-tight" style={{ color: INK }}>
                {listing.title}
              </p>
              {breadcrumb && (
                <p className="mt-1 truncate text-xs" style={{ color: MUTED }}>
                  {breadcrumb}
                </p>
              )}
              <p className="mt-4 text-2xl font-bold" style={{ color: INK }}>
                {listing.price} €
              </p>
              <button
                onClick={() => setPriceOpen(true)}
                className="mt-0.5 self-start text-sm font-medium underline underline-offset-2"
                style={{ color: INK }}
              >
                Ndrysho çmimin
              </button>
              <div className="mt-4 flex items-center gap-4 text-xs" style={{ color: MUTED }}>
                <span className="inline-flex items-center gap-1">
                  <Heart className="h-3.5 w-3.5" /> {likeCount}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" /> —
                </span>
              </div>
              <Link
                to="/product/$id"
                params={{ id: listing.id }}
                className="mt-3 grid place-items-center rounded-full border py-2.5 text-sm font-semibold"
                style={{ borderColor: INK, color: INK, backgroundColor: CREAM }}
              >
                Shiko artikullin
              </Link>
            </div>
          </div>
        </section>

        {/* Action list */}
        <section className="mt-8 px-4">
          <ActionRow
            icon={<Pencil className="h-5 w-5" style={{ color: INK }} />}
            title="Ndrysho"
            subtitle={`Ndryshuar për herë të fundit më ${lastEdited}`}
            chevron
            onClick={() => navigate({ to: "/listing/$id/edit", params: { id } })}
          />
          <Divider />
          <ActionRow
            icon={<Megaphone className="h-5 w-5" style={{ color: INK }} />}
            title="Promovo"
            subtitle="Rrit shanset për të shitur duke promovuar artikullin tënd!"
            chevron
            onClick={() => navigate({ to: "/listing/$id/promote", params: { id } })}
          />
          <Divider />
          <ActionRow
            icon={<Send className="h-5 w-5" style={{ color: INK }} />}
            title="Ndaj"
            onClick={share}
          />
          <Divider />
          {listing.sold ? (
            <ActionRow
              icon={<RotateCcw className="h-5 w-5" style={{ color: INK }} />}
              title="Shëno si aktiv"
              onClick={() => setConfirmSold(true)}
            />
          ) : (
            <ActionRow
              icon={<CheckCircle2 className="h-5 w-5" style={{ color: INK }} />}
              title="Shëno si shitur"
              onClick={() => setConfirmSold(true)}
            />
          )}
          <Divider />
          <ActionRow
            icon={<Trash2 className="h-5 w-5" style={{ color: DANGER }} />}
            title="Fshij këtë artikull"
            titleColor={DANGER}
            onClick={() => setConfirmDelete(true)}
          />
        </section>

        <div className="h-32" />
      </div>

      {/* Price sheet */}
      <Sheet open={priceOpen} onOpenChange={setPriceOpen}>
        <SheetContent
          side="bottom"
          hideClose
          className="border-0 p-0"
          style={{ backgroundColor: CREAM }}
        >
          <div className="flex items-center gap-3 px-6 pt-4 pb-2">
            <button
              type="button"
              onClick={() => setPriceOpen(false)}
              aria-label="Kthehu"
              className="grid place-items-center rounded-full transition-transform duration-150 active:scale-90"
              style={{ width: 36, height: 36, backgroundColor: "rgba(255,255,255,0.7)", border: "1px solid rgba(226,226,222,0.8)", backdropFilter: "blur(8px)" }}
            >
              <ChevronLeft size={22} color="#2d1521" strokeWidth={2} />
            </button>
            <SheetTitle style={{ color: INK }}>Ndrysho çmimin</SheetTitle>
          </div>
          <div className="px-6 pb-6 pt-4">
            <div
              className="flex items-center rounded-2xl px-4 py-3"
              style={{ backgroundColor: CARD }}
            >
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="no-spinner border-0 bg-transparent p-0 text-lg font-bold shadow-none focus-visible:ring-0"
                style={{ color: INK }}
              />
              <span className="ml-2 text-lg font-bold" style={{ color: INK }}>
                €
              </span>
            </div>
            <button
              onClick={savePrice}
              disabled={savingPrice}
              className="mt-4 w-full rounded-full py-3 text-sm font-semibold disabled:opacity-60"
              style={{ backgroundColor: INK, color: CREAM }}
            >
              {savingPrice ? "Duke ruajtur…" : "Ruaj"}
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Mark sold / active */}
      <ConfirmSheet
        open={confirmSold}
        onClose={() => (working ? null : setConfirmSold(false))}
        title={listing.sold ? "Ktheje si aktiv" : "Shëno si të shitur"}
        body={
          listing.sold
            ? "A dëshiron ta rikthesh këtë artikull si aktiv? Do të rishfaqet në feed dhe në profilin tënd."
            : "A e ke shitur këtë artikull? Ai do të shënohet si i shitur në profilin tënd dhe nuk do të jetë më i dukshëm për blerësit."
        }
        primaryLabel={listing.sold ? "Po, aktivizoje" : "Po, e shita"}
        primaryColor={INK}
        onPrimary={toggleSold}
        working={working}
      />

      {/* Delete */}
      <ConfirmSheet
        open={confirmDelete}
        onClose={() => (working ? null : setConfirmDelete(false))}
        title="Fshij artikullin"
        body="A jeni i sigurt që dëshironi të fshini këtë artikull? Do të humbisni të gjitha ofertat dhe bisedat e lidhura me të. Shënojeni si të shitur për të shmangur këtë."
        primaryLabel="Po, fshij artikullin tim"
        primaryColor={DANGER}
        onPrimary={deleteListing}
        working={working}
      />

      {/* Buyer picker */}
      {buyerPickerOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: CREAM,
            zIndex: 60,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 16px 12px",
              background: "#2d1521",
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={() => (working ? null : setBuyerPickerOpen(false))}
              disabled={working}
              aria-label="Kthehu"
              className="transition-transform duration-150 active:scale-90"
              style={{
                width: 36,
                height: 36,
                background: "rgba(255,255,255,0.12)",
                border: "none",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <ChevronLeft size={22} color="#ffffff" strokeWidth={2} />
            </button>
            <span style={{ fontSize: 16, fontWeight: 600, color: "#ffffff" }}>
              Kush e bleu?
            </span>
          </div>
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
              padding: "20px 16px 40px",
            }}
          >
            <p style={{ color: MUTED, fontSize: 13, marginBottom: 16 }}>
              Zgjidh personin që e bleu këtë artikull. Do të mund ta vlerësosh më pas.
            </p>
            {buyerCandidates.map((b) => (
              <button
                key={b.id}
                type="button"
                disabled={working}
                onClick={() => confirmBuyerAndSold(b)}
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-transform duration-150 active:scale-[0.99] disabled:opacity-60"
                style={{
                  backgroundColor: CARD,
                  border: `1px solid ${DIVIDER}`,
                  marginBottom: 8,
                }}
              >
                {b.avatar_url ? (
                  <img
                    src={b.avatar_url}
                    alt=""
                    style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover" }}
                  />
                ) : (
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      background: DIVIDER,
                      display: "grid",
                      placeItems: "center",
                      fontSize: 14,
                      fontWeight: 600,
                      color: INK,
                    }}
                  >
                    {(b.name ?? "?").slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: INK,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {b.name || "Përdorues"}
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0" style={{ color: MUTED }} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Rate buyer sheet */}
      {rateBuyer && (
        <ReviewsSheet
          open={reviewOpen}
          onOpenChange={(v) => {
            setReviewOpen(v);
            if (!v) setRateBuyer(null);
          }}
          sellerId={rateBuyer.id}
          currentUserId={user.id}
          sellerName={rateBuyer.name ?? "Përdorues"}
          initialRateOpen
          listingId={id}
        />
      )}
    </MobileShell>
  );
}

function ConfirmSheet({
  open,
  onClose,
  title,
  body,
  primaryLabel,
  primaryColor,
  onPrimary,
  working,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  body: string;
  primaryLabel: string;
  primaryColor: string;
  onPrimary: () => void | Promise<void>;
  working: boolean;
}) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: CREAM,
        zIndex: 60,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 16px 12px",
          background: "#2d1521",
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={working}
          aria-label="Kthehu"
          className="transition-transform duration-150 active:scale-90"
          style={{
            width: 36,
            height: 36,
            background: "rgba(255,255,255,0.12)",
            border: "none",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <ChevronLeft size={22} color="#ffffff" strokeWidth={2} />
        </button>
        <span style={{ fontSize: 16, fontWeight: 600, color: "#ffffff" }}>
          {title}
        </span>
      </div>
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          padding: "24px 20px",
        }}
      >
        <p
          style={{
            color: INK,
            fontSize: 14,
            lineHeight: 1.5,
            marginBottom: 20,
          }}
        >
          {body}
        </p>
        <button
          onClick={onPrimary}
          disabled={working}
          className="grid w-full place-items-center disabled:opacity-70"
          style={{
            backgroundColor: CREAM,
            border: `1px solid ${DIVIDER}`,
            borderRadius: 999,
            height: 48,
            color: primaryColor,
            fontWeight: 700,
            fontSize: 15,
          }}
        >
          {working ? <Loader2 className="h-5 w-5 animate-spin" /> : primaryLabel}
        </button>
        <button
          onClick={onClose}
          disabled={working}
          className="mt-[10px] grid w-full place-items-center disabled:opacity-60"
          style={{
            backgroundColor: CARD,
            border: "none",
            borderRadius: 999,
            height: 48,
            color: INK,
            fontWeight: 700,
            fontSize: 15,
          }}
        >
          Jo, anulo
        </button>
      </div>
    </div>
  );
}

function Divider() {
  return <div className="h-px" style={{ backgroundColor: DIVIDER }} />;
}

function ActionRow({
  icon,
  title,
  subtitle,
  chevron,
  titleColor = INK,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  chevron?: boolean;
  titleColor?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-4 py-4 text-left"
    >
      <div className="grid h-10 w-10 shrink-0 place-items-center">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-bold" style={{ color: titleColor }}>
          {title}
        </p>
        {subtitle && (
          <p className="mt-0.5 text-xs leading-snug" style={{ color: MUTED }}>
            {subtitle}
          </p>
        )}
      </div>
      {chevron && <ChevronRight className="h-5 w-5 shrink-0" style={{ color: MUTED }} />}
    </button>
  );
}
