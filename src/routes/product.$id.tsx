import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, MessageCircle, Loader2, Star, BadgeCheck, MoreHorizontal, Heart, Bookmark } from "lucide-react";
import { toast } from "sonner";
import { MobileShell } from "@/components/marketplace/MobileShell";
import { ImageGallery } from "@/components/marketplace/ImageGallery";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { MakeOfferDialog } from "@/components/marketplace/MakeOfferDialog";
import { MoreSheet } from "@/components/marketplace/MoreSheet";
import { useUserCollections } from "@/lib/user-collections";
import { supabase } from "@/integrations/supabase/client";
import { hydrateListings, type ListingRow, type ListingView } from "@/lib/listings";

export const Route = createFileRoute("/product/$id")({
  component: ProductDetail,
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
  const [listing, setListing] = useState<ListingView | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [similar, setSimilar] = useState<ListingView[]>([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<string | null>(null);
  const [offerOpen, setOfferOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const { likes, saves, toggleLike, toggleSave } = useUserCollections();
  

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMe(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      const { data: row } = await supabase.from("listings").select("*").eq("id", id).maybeSingle();
      if (!row) {
        setLoading(false);
        return;
      }
      const [hydrated] = await hydrateListings([row as ListingRow]);
      const { data: prof } = await supabase
        .from("profiles")
        .select("id,name,avatar_url,rating_avg,rating_count")
        .eq("id", row.user_id)
        .maybeSingle();
      const { data: sim } = await supabase
        .from("listings")
        .select("*")
        .eq("category", row.category)
        .neq("id", row.id)
        .eq("sold", false)
        .limit(6);
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

  if (loading) {
    return (
      <MobileShell hideNav>
        <div className="grid h-screen place-items-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </MobileShell>
    );
  }

  if (!listing) {
    return (
      <MobileShell>
        <div className="p-10 text-center">
          <p>Artikulli nuk u gjet.</p>
          <Link to="/" className="text-accent underline">Kthehu në kreu</Link>
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

  return (
    <MobileShell hideNav>
      <div className="relative">
        <ImageGallery images={images} alt={listing.title} />
        <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between p-4 pt-6">
          <button
            onClick={() => navigate({ to: "/" })}
            className="grid h-10 w-10 place-items-center rounded-full bg-background/90 backdrop-blur"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setMoreOpen(true)}
            aria-label="Më shumë"
            className="grid h-10 w-10 place-items-center rounded-full bg-background/90 backdrop-blur"
          >
            <MoreHorizontal size={20} color="#1a1a1a" strokeWidth={1.6} />
          </button>
        </div>
      </div>

      {listing.sold && (
        <div
          className="w-full px-5 py-3 text-center text-sm font-bold text-white"
          style={{ backgroundColor: "#e8826a" }}
        >
          Ky artikull është shitur
        </div>
      )}
        <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between p-4 pt-6">
          <button
            onClick={() => navigate({ to: "/" })}
            className="grid h-10 w-10 place-items-center rounded-full bg-background/90 backdrop-blur"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setMoreOpen(true)}
            aria-label="Më shumë"
            className="grid h-10 w-10 place-items-center rounded-full bg-background/90 backdrop-blur"
          >
            <MoreHorizontal size={20} color="#1a1a1a" strokeWidth={1.6} />
          </button>
        </div>
      </div>


      <div className="px-5 pt-5">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {listing.brand || "—"}
        </p>
        <div className="mt-1 flex items-start justify-between gap-3">
          <h1 className="font-display text-3xl leading-tight">{listing.title}</h1>
          <p className="shrink-0 font-display text-3xl">€{listing.price}</p>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-y-3 rounded-2xl bg-secondary/60 p-4 text-sm">
          {meta.map(([k, v]) => (
            <div key={k}>
              <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{k}</dt>
              <dd className="mt-0.5">{v}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-5 whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
          {listing.description}
        </p>

        {seller && (
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
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

        {similar.length > 0 && (
          <section className="mt-8">
            <h3 className="mb-3 font-display text-2xl">Artikuj të ngjashëm</h3>
            <div className="grid grid-cols-2 gap-3">
              {similar.map((p) => (
                <ListingCard key={p.id} listing={p} />
              ))}
            </div>
          </section>
        )}

        <div className="h-32" />
      </div>

      <div
        className="fixed bottom-0 left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 border-t px-5 py-3"
        style={{ backgroundColor: "#f6f1e7", borderColor: "#ddd8ce" }}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <button
              onClick={() => {
                if (!me) return navigate({ to: "/auth" });
                toggleLike(listing.id);
              }}
              aria-label="Pëlqe"
              className="p-1"
            >
              <Heart
                size={22}
                strokeWidth={1.5}
                color={likes.has(listing.id) ? "#e8826a" : "#1a1a1a"}
                fill={likes.has(listing.id) ? "#e8826a" : "none"}
              />
            </button>
            <button
              onClick={() => {
                if (!me) return navigate({ to: "/auth" });
                toggleSave(listing.id);
              }}
              aria-label="Ruaj"
              className="p-1"
            >
              <Bookmark
                size={22}
                strokeWidth={1.5}
                color="#1a1a1a"
                fill={saves.has(listing.id) ? "#1a1a1a" : "none"}
              />
            </button>
            <button
              onClick={sendMessage}
              disabled={me === listing.user_id}
              aria-label="Mesazh"
              className="p-1 disabled:opacity-40"
            >
              <MessageCircle size={22} strokeWidth={1.5} color="#1a1a1a" />
            </button>
          </div>
          <button
            onClick={() => setOfferOpen(true)}
            disabled={listing.sold || me === listing.user_id}
            className="rounded-full px-7 py-3 text-sm font-semibold disabled:opacity-50"
            style={{ backgroundColor: "#e8826a", color: "#fff" }}
          >
            {listing.sold ? "Shitur" : "Blej"}
          </button>
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>

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
        productUrl={typeof window !== "undefined" ? `${window.location.origin}/product/${listing.id}` : ""}
        productTitle={listing.title}
        reporterId={me}
      />
    </MobileShell>
  );
}
