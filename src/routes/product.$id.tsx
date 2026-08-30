import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
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

import { MoreSheet } from "@/components/marketplace/MoreSheet";
import { ProductPageSkeleton } from "@/components/marketplace/Skeletons";
import { useUserCollections } from "@/lib/user-collections";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserId } from "@/hooks/useCurrentUser";
import { hydrateListings, type ListingRow, type ListingView } from "@/lib/listings";
import { SwipeBackWrapper } from "@/components/SwipeBackWrapper";
import { getListingLikeInfo } from "@/lib/likes.functions";
import {
  fetchPublicProfile,
  prefetchPublicProfile,
  publicProfileKey,
} from "@/lib/profile-queries";
import {
  fetchProductListing,
  PRODUCT_LISTING_STALE_MS,
  productListingKey,
} from "@/lib/product-queries";
import { useTranslation } from "@/i18n";
import { tCategory } from "@/i18n/tCategory";

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

// Delte klasse-strenger for konsekvent stil
const ICON_BTN =
  "grid h-12 w-12 place-items-center rounded-full transition-transform duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-rose)] focus-visible:ring-offset-2";
const META_TEXT_INK = { color: "var(--brand-ink)" } as const;
const META_TEXT_MUTED = { color: "var(--brand-ink-muted)" } as const;

async function fetchProductListing(id: string): Promise<ListingView | "unavailable" | null> {
  const { data: row } = await supabase.from("listings").select("*").eq("id", id).maybeSingle();
  if (!row) return null;
  if (["expired", "removed", "flagged"].includes((row as ListingRow).status)) return "unavailable";
  const [hydrated] = await hydrateListings([row as ListingRow]);
  return hydrated;
}

async function fetchProductSeller(userId: string): Promise<Seller | null> {
  const { data } = await supabase
    .from("public_profiles")
    .select("id,name,avatar_url,rating_avg,rating_count")
    .eq("id", userId)
    .maybeSingle();
  return (data as Seller | null) ?? null;
}

async function fetchSimilarListings(category: string, excludeId: string): Promise<ListingView[]> {
  const { data: sim } = await supabase
    .from("listings")
    .select("*")
    .eq("category", category)
    .neq("id", excludeId)
    .eq("status", "active")
    .eq("sold", false)
    .limit(8);
  return hydrateListings((sim ?? []) as ListingRow[], { thumbnail: true, mode: "cover" });
}

const EMPTY_LIKE_INFO = { count: 0, recentLiker: null as string | null, recentLikerId: null as string | null };

function ProductDetail() {
  const { id } = useParams({ from: "/product/$id" });
  const navigate = useNavigate({ from: "/messages" });
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const cached = getCachedListing(id);
  const [me, setMe] = useState<string | null>(null);

  const [moreOpen, setMoreOpen] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const { likes, saves, toggleLike, toggleSave } = useUserCollections();

  useEffect(() => {
    getCurrentUserId().then((id) => setMe(id));
  }, []);

  const listingQuery = useQuery({
    queryKey: ["product-listing", id] as const,
    queryFn: () => fetchProductListing(id),
    staleTime: 30_000,
    placeholderData: (prev) => prev ?? (cached ? cached : undefined),
  });

  const listingData = listingQuery.data;
  const listing = listingData && listingData !== "unavailable" ? listingData : null;

  // Selger og "lignende" hentes parallelt så snart listing-raden finnes.
  const sellerQuery = useQuery({
    queryKey: ["product-seller", listing?.user_id ?? null] as const,
    queryFn: () => fetchProductSeller(listing!.user_id),
    enabled: !!listing?.user_id,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
  const seller = sellerQuery.data ?? null;

  const similarQuery = useQuery({
    queryKey: ["product-similar", listing?.category ?? null, id] as const,
    queryFn: () => fetchSimilarListings(listing!.category, id),
    enabled: !!listing?.category,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
  const similar = similarQuery.data ?? [];

  const likeInfoQuery = useQuery({
    queryKey: ["product-like-info", id] as const,
    queryFn: () => getListingLikeInfo({ data: { listingId: id } }),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
  const likeInfo = likeInfoQuery.data ?? EMPTY_LIKE_INFO;

  const loading = listingQuery.isPending;

  useEffect(() => {
    if (listingData === "unavailable") {
      toast.info(t("product.unavailable"));
      navigate({ to: "/" });
    }
  }, [listingData]);

  const sendMessage = async () => {
    if (!me) {
      navigate({ to: "/auth" });
      return;
    }
    if (!listing) return;
    if (me === listing.user_id) {
      toast.error(t("product.cannot_message_self"));
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
    navigate({
      to: "/messages",
      search: (prev: {
        thread: string | undefined;
        view: "list" | "archive" | "new";
        tab: "all" | "buy" | "sell";
      }) => ({ ...prev, thread: convId }),
    });
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
        <div className="p-10 text-center" style={META_TEXT_INK}>
          <p>{t("product.not_found")}</p>
          <Link
            to="/"
            className="underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-rose)] focus-visible:ring-offset-2 rounded"
            style={{ color: "var(--brand-rose)" }}
          >
            {t("product.back_to_home")}
          </Link>
        </div>
      </MobileShell>
    );
  }

  const meta: [string, string][] = [
    [t("product.meta_category"), tCategory(listing.category, t)],
    [t("product.meta_type"), listing.subcategory ? tCategory(listing.subcategory, t) : t("product.dash")],
    [t("product.meta_brand"), listing.brand || t("product.dash")],
    [t("product.meta_condition"), tCategory(listing.condition, t)],
    [t("product.meta_size"), listing.size],
    [t("product.meta_color"), listing.color ? tCategory(listing.color, t) : t("product.dash")],
    [t("product.meta_gender"), tCategory(listing.gender, t)],
    [t("product.meta_city"), listing.city || t("product.dash")],
  ];

  const images = listing.imageUrls.length ? listing.imageUrls : [listing.coverUrl];
  const isSold = listing.sold || listing.status === "sold";
  const isOwn = me === listing.user_id;
  const firstLine = listing.description.split("\n")[0].slice(0, 100);

  const isDescriptionTruncated = firstLine.length < listing.description.length;

  const descriptionPreview = isDescriptionTruncated ? `${firstLine}…` : firstLine;

  return (
    <MobileShell>
      {/* Fixed header */}
      <div
        className="fixed top-0 left-1/2 z-50 flex w-full max-w-[480px] -translate-x-1/2 items-center justify-between border-b px-4 py-3"
        style={{ backgroundColor: "var(--brand-surface)", borderColor: "var(--brand-border)" }}
      >
        <button
          type="button"
          onClick={() => window.history.back()}
          aria-label={t("common.back")}
          className={ICON_BTN}
          style={{
            backgroundColor: "rgba(255,255,255,0.7)",
            border: "1px solid rgba(226,226,222,0.8)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          <ChevronLeft size={22} color="var(--brand-ink)" strokeWidth={2} aria-hidden="true" />
        </button>
        <div className="min-w-0 flex-1 px-2 text-center">
          <h1 className="truncate font-display text-base font-semibold" style={META_TEXT_INK}>
            {listing.title}
          </h1>
          <p className="text-sm font-semibold" style={{ color: "var(--brand-rose)" }}>
            €{listing.price}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          aria-label={t("product.more")}
          className={`${ICON_BTN} border`}
          style={{ borderColor: "var(--brand-border)", backgroundColor: "var(--brand-surface)" }}
        >
          <MoreHorizontal size={22} color="var(--brand-ink)" strokeWidth={1.6} aria-hidden="true" />
        </button>
      </div>

      {/* Spacer for fixed header */}
      <div className="h-16" />

      {/* Seller info row */}
      <div
        className="flex items-center gap-3 border-b px-[18px] py-3"
        style={{ borderColor: "var(--brand-border)" }}
        aria-hidden={seller ? undefined : "true"}
      >
        {seller ? (
          <>
            <img
              src={
                seller.avatar_url ||
                `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seller.name || "U")}`
              }
              alt=""
              aria-hidden="true"
              className="h-9 w-9 shrink-0 rounded-full object-cover"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold" style={META_TEXT_INK}>
                {seller.name || t("product.user_fallback")}
              </p>
              <p className="text-xs" style={META_TEXT_MUTED}>
                {listing.city || "—"}
              </p>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3" aria-hidden="true">
            <div className="h-9 w-9 shrink-0 rounded-full bg-[var(--brand-border)]" />
            <div className="min-w-0">
              <div className="h-5 w-24 rounded bg-[var(--brand-border)]" />
              <div className="mt-1 h-4 w-16 rounded bg-[var(--brand-border)]" />
            </div>
          </div>
        )}
      </div>

      {/* Image gallery */}
      <ImageGallery images={images} alt={listing.title} />

      {/* Sold banner */}
      {isSold && (
        <div
          className="w-full px-5 py-3 text-center text-sm font-bold"
          style={{ backgroundColor: "var(--brand-rose)", color: "#ffffff" }}
        >
          {t("product.is_sold_banner")}
        </div>
      )}

      {/* Inline action bar */}
      <div
        className="flex items-center justify-between border-b px-[18px] py-3"
        style={{ backgroundColor: "var(--brand-surface)", borderColor: "var(--brand-border)" }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (!me) return navigate({ to: "/auth" });
              toggleLike(listing.id);
            }}
            aria-label={likes.has(listing.id) ? t("product.unlike") : t("product.like")}
            aria-pressed={likes.has(listing.id)}
            className={`${ICON_BTN} border`}
            style={{ borderColor: "var(--brand-border)" }}
          >
            <Heart
              size={22}
              strokeWidth={1.5}
              color="var(--brand-rose)"
              fill={likes.has(listing.id) ? "var(--brand-rose)" : "none"}
              aria-hidden="true"
            />
          </button>
          <button
            type="button"
            onClick={() => {
              if (!me) return navigate({ to: "/auth" });
              toggleSave(listing.id);
            }}
            aria-label={saves.has(listing.id) ? t("product.unsave") : t("product.save")}
            aria-pressed={saves.has(listing.id)}
            className={ICON_BTN}
          >
            <Bookmark
              size={22}
              strokeWidth={1.5}
              color="var(--brand-ink)"
              fill={saves.has(listing.id) ? "var(--brand-ink)" : "none"}
              aria-hidden="true"
            />
          </button>
          <button
            type="button"
            onClick={sendMessage}
            disabled={isOwn}
            aria-label={t("product.send_message_aria")}
            className={`${ICON_BTN} disabled:opacity-40 disabled:active:scale-100`}
          >
            <MessageCircle
              size={22}
              strokeWidth={1.5}
              color="var(--brand-ink)"
              aria-hidden="true"
            />
          </button>
        </div>
        <button
          type="button"
          onClick={sendMessage}
          disabled={isSold || isOwn}
          className="px-5 text-base font-bold transition-transform duration-150 active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-rose)] focus-visible:ring-offset-2"
          style={{
            background: "linear-gradient(120deg, var(--brand-coral), var(--brand-rose))",
            color: "#ffffff",
            minWidth: 96,
            height: 44,
            borderRadius: 14,
            boxShadow: "0 2px 8px color-mix(in oklab, var(--brand-rose) 35%, transparent)",
          }}
        >
          {isSold ? t("product.sold") : t("product.message_seller")}
        </button>
      </div>


      {/* Social proof line */}
      {likeInfo.count > 0 && (
        <p
          className="px-[18px] py-1 text-[13px]"
          style={META_TEXT_INK}
          aria-label={
            likeInfo.count === 1 ? t("product.liked_by_1") : t("product.liked_by_n").replace("{n}", String(likeInfo.count))
          }
        >
          <span className="font-semibold">{t("product.liked_by_label")}</span>{" "}
          {likeInfo.count === 1 ? t("product.person_1") : t("product.persons_n").replace("{n}", String(likeInfo.count))}
        </p>
      )}

      {/* Seller description preview */}
      {listing.description && (
        <>
          {isDescriptionTruncated ? (
            <button
              type="button"
              onClick={() => setDescExpanded((v) => !v)}
              className="w-full px-[18px] pb-3 pt-1 text-left text-[13px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-rose)] focus-visible:ring-offset-2 rounded"
              style={META_TEXT_INK}
              aria-expanded={descExpanded}
            >
              <span className="font-semibold">{seller?.name || t("product.user_fallback")}</span>{" "}
              {descriptionPreview}
            </button>
          ) : (
            <p className="px-[18px] pb-3 pt-1 text-left text-[13px]" style={META_TEXT_INK}>
              <span className="font-semibold">{seller?.name || t("product.user_fallback")}</span>{" "}
              {listing.description}
            </p>
          )}
          {descExpanded && (
            <p className="px-[18px] py-3 text-[13px]" style={META_TEXT_INK}>
              {listing.description}
            </p>
          )}
        </>
      )}

      {/* Product details card */}
      <dl
        className="mx-[18px] my-3 grid grid-cols-2 gap-y-3 rounded-2xl border p-4 text-sm"
        style={{ borderColor: "var(--brand-border)", backgroundColor: "var(--brand-surface)" }}
      >
        {meta.map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="text-[11px] uppercase tracking-wide" style={META_TEXT_MUTED}>
              {k}
            </dt>
            <dd className="mt-0.5 line-clamp-2 break-words" style={META_TEXT_INK}>
              {v}
            </dd>
          </div>
        ))}
      </dl>

      {/* Seller profile card */}
      {seller && (
        <div
          className="mx-[18px] my-3 flex items-center gap-3 rounded-2xl border p-3"
          style={{ borderColor: "var(--brand-border)", backgroundColor: "var(--brand-surface)" }}
        >
          <img
            src={
              seller.avatar_url ||
              `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seller.name || "U")}`
            }
            alt=""
            aria-hidden="true"
            className="h-12 w-12 shrink-0 rounded-full object-cover"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <p className="truncate text-sm font-semibold" style={META_TEXT_INK}>
                {seller.name || t("product.user_fallback")}
              </p>
              <BadgeCheck
                className="h-4 w-4 shrink-0"
                style={{ color: "var(--brand-rose)" }}
                fill="currentColor"
                aria-hidden="true"
              />
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-xs" style={META_TEXT_MUTED}>
              <span className="inline-flex items-center gap-0.5">
                <Star className="h-3 w-3" fill="currentColor" aria-hidden="true" />{" "}
                {seller.rating_avg.toFixed(1)}
              </span>
              <span>· {t("product.ratings_count").replace("{n}", String(seller.rating_count))}</span>
            </div>
          </div>
          <Link
            to="/user/$id"
            params={{ id: seller.id }}
            onMouseEnter={() => prefetchPublicProfile(queryClient, seller.id)}
            onTouchStart={() => prefetchPublicProfile(queryClient, seller.id)}
            onFocus={() => prefetchPublicProfile(queryClient, seller.id)}
            className="shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-transform duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-rose)] focus-visible:ring-offset-2"
            style={{
              borderColor: "var(--brand-border)",
              color: "var(--brand-ink)",
              backgroundColor: "var(--brand-surface)",
            }}
          >
            {t("product.view_profile")}
          </Link>
        </div>
      )}

      {/* Similar items horizontal scroll */}
      {similar.length > 0 && (
        <section id="similar-section" className="mt-8">
          <h3 className="mb-3 px-[18px] font-display text-2xl" style={META_TEXT_INK}>
            {t("product.similar_items")}
          </h3>
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
