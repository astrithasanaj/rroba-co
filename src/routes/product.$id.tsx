import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  MessageCircle,
  Star,
  BadgeCheck,
  MoreHorizontal,
  Heart,
  Bookmark,
} from "lucide-react";
import { toast } from "sonner";
import { MobileShell } from "@/components/marketplace/MobileShell";
import { ImageGallery } from "@/components/marketplace/ImageGallery";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { MakeOfferDialog } from "@/components/marketplace/MakeOfferDialog";
import { MoreSheet } from "@/components/marketplace/MoreSheet";
import { ProductPageSkeleton } from "@/components/marketplace/Skeletons";
import { useUserCollections } from "@/lib/user-collections";
import { supabase } from "@/integrations/supabase/client";
import { hydrateListings, type ListingRow, type ListingView } from "@/lib/listings";
import { getCachedListing } from "@/lib/prefetch";
import { SwipeBackWrapper } from "@/components/SwipeBackWrapper";
import { getListingLikeInfo } from "@/lib/likes.functions";

export const Route = createFileRoute("/product/$id")({
  component: () => (
    <SwipeBackWrapper>
      <ProductDetail />
    </SwipeBackWrapper>
  ),
});

type Seller = {
  id: string;
  name: string;
  avatar_url: string | null;
  rating_avg: number;
  rating_count: number;
};

function ProductDetail() {
  const { id } = useParams({ from: "/product/$id" });
  const navigate = useNavigate();
  const cached = getCachedListing(id);
  const [listing, setListing] = useState<ListingView | null>(cached);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [similar, setSimilar] = useState<ListingView[]>([]);
  const [loading, setLoading] = useState(!cached);
  const [me, setMe] = useState<string | null>(null);
  const [offerOpen, setOfferOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [likeInfo, setLikeInfo] = useState<{
    count: number;
    recentLiker: string | null;
    recentLikerId: string | null;
  }>({ count: 0, recentLiker: null, recentLikerId: null });
  const { likes, saves, toggleLike, toggleSave } = useUserCollections();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMe(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!cached) setLoading(true);
      const { data: row } = await supabase.from("listings").select("*").eq("id", id).maybeSingle();
      if (!row) {
        setLoading(false);
        return;
      }
      if (["expired", "removed", "flagged"].includes((row as ListingRow).status)) {
        toast.info("Ky artikull nuk është më i disponueshëm.");
        navigate({ to: "/" });
        return;
      }
      const [hydrated] = await hydrateListings([row as ListingRow]);
      const { data: prof } = await supabase
        .from("public_profiles")
        .select("id,name,avatar_url,rating_avg,rating_count")
        .eq("id", row.user_id)
        .maybeSingle();
      const { data: sim } = await supabase
        .from("listings")
        .select("*")
        .eq("category", row.category)
        .neq("id", row.id)
        .eq("status", "active")
        .eq("sold", false)
        .limit(8);
      const simHydrated = await hydrateListings((sim ?? []) as ListingRow[]);
      if (!active) return;
      setListing(hydrated);
      setSeller(prof as Seller | null);
      setSimilar(simHydrated);
      setLoading(false);
    };
    load();
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    getListingLikeInfo({ data: { listingId: id } })
      .then((info) => setLikeInfo(info))
      .catch(() => {});
  }, [id]);

  const sendMessage = async () => {
    if (!me) {
      navigate({ to: "/auth" });
      return;
    }
    if (!listing) return;
    if (me === listing.user_id) {
      toast.error("Nuk mund të dërgosh mesazh vetes");
      return;
    }
    // Find or create conversation
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
        toast.error(error.message);
        return;
      }
      convId = created.id;
    }
    navigate({ to: "/messages", search: { thread: convId } });
  };

  if (loading && !listing) {
    return (
      <MobileShell>
        <ProductPageSkeleton />
      </MobileShell>
    );
  }

  if (!listing) {
    return (
      <MobileShell>
        <div className="p-10 text-center">
          <p>Artikulli nuk u gjet.</p>
          <Link to="/" className="text-accent underline">
            Kthehu në kreu
          </Link>
        </div>
      </MobileShell>
    );
  }

  const meta: [string, string][] = [
    ["Marka", listing.brand || "—"],
    ["Kategoria", listing.category],
    ["Madhësia", listing.size],
    ["Gjendja", listing.condition],
    ["Ngjyra", listing.color || "—"],
    ["Qyteti", listing.city || "—"],
    ["Gjinia", listing.gender],
  ];

  const images = listing.imageUrls.length ? listing.imageUrls : [listing.coverUrl];
  const isSold = listing.sold || listing.status === "sold";
  const isOwn = me === listing.user_id;
  const firstLine = listing.description.split("\n")[0].slice(0, 100);
  const descriptionPreview =
    firstLine.length < listing.description.length ? `${firstLine}…` : firstLine;

  return (
    <MobileShell>
      {/* Fixed header */}
      <div
        className="fixed top-0 left-1/2 z-50 flex w-full max-w-[480px] -translate-x-1/2 items-center justify-between border-b px-4 py-3"
        style={{ backgroundColor: "#ffffff", borderColor: "#ddd8ce" }}
      >
        <button
          onClick={() => window.history.back()}
          className="grid h-10 w-10 place-items-center rounded-full border backdrop-blur"
          style={{ borderColor: "#e2e2de", backgroundColor: "#ffffff" }}
        >
          <ArrowLeft className="h-4 w-4" color="#1a1a1a" />
        </button>
        <div className="min-w-0 flex-1 px-2 text-center">
          <h1
            className="truncate font-display text-base font-semibold"
            style={{ color: "#1a1a1a" }}
          >
            {listing.title}
          </h1>
          <p className="text-sm font-semibold" style={{ color: "#2c3548" }}>
            €{listing.price}
          </p>
        </div>
        <button
          onClick={() => setMoreOpen(true)}
          aria-label="Më shumë"
          className="grid h-10 w-10 place-items-center rounded-full border backdrop-blur"
          style={{ borderColor: "#e2e2de", backgroundColor: "#ffffff" }}
        >
          <MoreHorizontal size={20} color="#1a1a1a" strokeWidth={1.6} />
        </button>
      </div>

      {/* Spacer for fixed header */}
      <div className="h-16" />

      {/* Seller info row */}
      {seller && (
        <div
          className="flex items-center gap-3 border-b px-[18px] py-3"
          style={{ borderColor: "#ddd8ce" }}
        >
          <img
            src={
              seller.avatar_url ||
              `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seller.name || "U")}`
            }
            alt={seller.name}
            className="h-9 w-9 shrink-0 rounded-full object-cover"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold" style={{ color: "#1a1a1a" }}>
              {seller.name || "Përdorues"}
            </p>
            <p className="text-xs" style={{ color: "#a89f94" }}>
              {listing.city || "—"}
            </p>
          </div>
        </div>
      )}

      {/* Image gallery */}
      <ImageGallery images={images} alt={listing.title} />

      {/* Sold banner */}
      {isSold && (
        <div
          className="w-full px-5 py-3 text-center text-sm font-bold text-white"
          style={{ backgroundColor: "#e8826a" }}
        >
          Ky artikull është shitur
        </div>
      )}

      {/* Inline action bar */}
      <div
        className="flex items-center justify-between border-b px-[18px] py-3"
        style={{ backgroundColor: "#ffffff", borderColor: "#ddd8ce" }}
      >
        <div className="flex items-center gap-5">
          <button
            onClick={() => {
              if (!me) return navigate({ to: "/auth" });
              toggleLike(listing.id);
            }}
            aria-label="Pëlqe"
            className="grid h-11 w-11 place-items-center rounded-full border border-[#d6dae6] transition active:scale-95"
          >
            <Heart
              size={24}
              strokeWidth={1.5}
              color="#2c3548"
              fill={likes.has(listing.id) ? "#2c3548" : "none"}
            />
          </button>
          <button
            onClick={() => {
              if (!me) return navigate({ to: "/auth" });
              toggleSave(listing.id);
            }}
            aria-label="Ruaj"
            className="grid h-11 w-11 place-items-center"
          >
            <Bookmark
              size={24}
              strokeWidth={1.5}
              color="#1a1a1a"
              fill={saves.has(listing.id) ? "#1a1a1a" : "none"}
            />
          </button>
          <button
            onClick={sendMessage}
            disabled={isOwn}
            aria-label="Mesazh"
            className="grid h-11 w-11 place-items-center disabled:opacity-40"
          >
            <MessageCircle size={24} strokeWidth={1.5} color="#1a1a1a" />
          </button>
        </div>
        <button
          onClick={() => {
            if (!me) return navigate({ to: "/auth" });
            if (isOwn) return;
            navigate({ to: "/buy/$id", params: { id: listing.id } });
          }}
          disabled={isSold || isOwn}
          className="px-4 text-base font-bold transition active:scale-95 disabled:opacity-50"
          style={{
            backgroundColor: "#1c1a16",
            color: "#fff",
            minWidth: 90,
            height: 44,
            borderRadius: 14,
            boxShadow: "0 2px 8px rgba(232,130,106,0.35)",
          }}
        >
          {isSold ? "Shitur" : "Bli"}
        </button>
      </div>

      {/* Social proof line */}
      {likeInfo.count > 0 && likeInfo.recentLiker && (
        <p className="px-[18px] py-1 text-[13px]" style={{ color: "#1a1a1a" }}>
          Likt nga{" "}
          {likeInfo.recentLikerId ? (
            <Link
              to="/user/$id"
              params={{ id: likeInfo.recentLikerId }}
              onClick={(e) => e.stopPropagation()}
              className="font-semibold hover:underline active:opacity-70"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              {likeInfo.recentLiker}
            </Link>
          ) : (
            <span className="font-semibold">{likeInfo.recentLiker}</span>
          )}
          {likeInfo.count > 1 ? ` dhe ${likeInfo.count - 1} të tjerë` : ""}
        </p>
      )}

      {/* Seller description preview */}
      {listing.description && (
        <>
          <button
            onClick={() => setDescExpanded((v) => !v)}
            className="w-full px-[18px] pb-3 pt-1 text-left text-[13px]"
            style={{ color: "#1a1a1a" }}
          >
            <span className="font-semibold">{seller?.name || "Përdorues"}</span>{" "}
            {descriptionPreview}
          </button>
          {descExpanded && (
            <p className="px-[18px] py-3 text-[13px]" style={{ color: "#1a1a1a" }}>
              {listing.description}
            </p>
          )}
        </>
      )}

      {/* Product details card */}
      <dl className="mx-[18px] my-3 grid grid-cols-2 gap-y-3 rounded-2xl border border-[#e2e2de] bg-white p-4 text-sm">
        {meta.map(([k, v]) => (
          <div key={k}>
            <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{k}</dt>
            <dd className="mt-0.5">{v}</dd>
          </div>
        ))}
      </dl>

      {/* Seller profile card */}
      {seller && (
        <div className="mx-[18px] my-3 flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
          <img
            src={
              seller.avatar_url ||
              `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seller.name || "U")}`
            }
            alt={seller.name}
            className="h-12 w-12 shrink-0 rounded-full object-cover"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <p className="truncate text-sm font-semibold">{seller.name || "Përdorues"}</p>
              <BadgeCheck className="h-4 w-4 text-accent" fill="currentColor" />
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-0.5">
                <Star className="h-3 w-3" fill="currentColor" /> {seller.rating_avg.toFixed(1)}
              </span>
              <span>· {seller.rating_count} vlerësime</span>
            </div>
          </div>
          <Link
            to="/user/$id"
            params={{ id: seller.id }}
            className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-secondary"
          >
            Shiko profilin
          </Link>
        </div>
      )}

      {/* Similar items horizontal scroll */}
      {similar.length > 0 && (
        <section id="similar-section" className="mt-8">
          <h3 className="mb-3 px-[18px] font-display text-2xl">Artikuj të ngjashëm</h3>
          <div className="flex gap-3 overflow-x-auto px-[18px] pb-4 no-scrollbar snap-x snap-mandatory">
            {similar.map((p) => (
              <div key={p.id} className="w-[160px] min-w-[160px] snap-start">
                <ListingCard listing={p} />
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="h-8" />

      <MakeOfferDialog
        open={offerOpen}
        onOpenChange={setOfferOpen}
        listingId={listing.id}
        sellerId={listing.user_id}
        buyerId={me}
        listingPrice={listing.price}
      />

      <MoreSheet
        open={moreOpen}
        onOpenChange={setMoreOpen}
        productId={listing.id}
        productUrl={
          typeof window !== "undefined" ? `${window.location.origin}/product/${listing.id}` : ""
        }
        productTitle={listing.title}
        reporterId={me}
      />
    </MobileShell>
  );
}
