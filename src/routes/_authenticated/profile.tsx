import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Camera,
  Heart,
  Loader2,
  LogOut,
  MapPin,
  MoreVertical,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { MobileShell } from "@/components/marketplace/MobileShell";
import { NewListingDialog } from "@/components/marketplace/NewListingDialog";
import { RatingsDialog, StarRow } from "@/components/marketplace/RatingsDialog";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

type ListingRow = {
  id: string;
  user_id: string;
  title: string;
  brand: string;
  category: string;
  size: string;
  price: number;
  description: string;
  image_paths: string[];
  sold: boolean;
  created_at: string;
};

type ListingView = ListingRow & { coverUrl: string };

const SIGN_TTL = 60 * 60;

async function signPaths(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const { data } = await supabase.storage.from("photos").createSignedUrls(paths, SIGN_TTL);
  const map: Record<string, string> = {};
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) map[item.path] = item.signedUrl;
  }
  return map;
}

type Tab = "all" | "liked" | "saved";

function ProfilePage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [ratingsOpen, setRatingsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [myListings, setMyListings] = useState<ListingView[]>([]);
  const [likedListings, setLikedListings] = useState<ListingView[]>([]);
  const [savedListings, setSavedListings] = useState<ListingView[]>([]);

  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const [followers] = useState(0);
  const [following] = useState(0);
  const [streak] = useState(0);

  const [ratingStats, setRatingStats] = useState({ avg: 0, count: 0 });

  const hydrate = useCallback(async (rows: ListingRow[]): Promise<ListingView[]> => {
    const covers = rows.map((r) => r.image_paths?.[0]).filter(Boolean) as string[];
    const urls = await signPaths(covers);
    return rows.map((r) => ({ ...r, coverUrl: urls[r.image_paths?.[0] ?? ""] ?? "" }));
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [mine, likes, saves, ratings] = await Promise.all([
      supabase
        .from("listings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase.from("listing_likes").select("listing_id").eq("user_id", user.id),
      supabase.from("listing_saves").select("listing_id").eq("user_id", user.id),
      supabase.from("ratings").select("stars").eq("seller_id", user.id),
    ]);

    setMyListings(await hydrate((mine.data ?? []) as ListingRow[]));

    const likeIds = (likes.data ?? []).map((l) => l.listing_id);
    const saveIds = (saves.data ?? []).map((l) => l.listing_id);
    setLikedIds(new Set(likeIds));
    setSavedIds(new Set(saveIds));

    if (likeIds.length > 0) {
      const { data } = await supabase
        .from("listings")
        .select("*")
        .in("id", likeIds)
        .order("created_at", { ascending: false });
      setLikedListings(await hydrate((data ?? []) as ListingRow[]));
    } else setLikedListings([]);

    if (saveIds.length > 0) {
      const { data } = await supabase
        .from("listings")
        .select("*")
        .in("id", saveIds)
        .order("created_at", { ascending: false });
      setSavedListings(await hydrate((data ?? []) as ListingRow[]));
    } else setSavedListings([]);

    const stars = (ratings.data ?? []).map((r) => r.stars);
    setRatingStats({
      count: stars.length,
      avg: stars.length ? stars.reduce((a, b) => a + b, 0) / stars.length : 0,
    });

    setLoading(false);
  }, [user.id, hydrate]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Realtime: listings, likes, saves, ratings
  useEffect(() => {
    const channel = supabase
      .channel("profile-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "listings" },
        () => loadAll(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "listing_likes", filter: `user_id=eq.${user.id}` },
        () => loadAll(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "listing_saves", filter: `user_id=eq.${user.id}` },
        () => loadAll(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ratings", filter: `seller_id=eq.${user.id}` },
        () => loadAll(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id, loadAll]);

  const toggleLike = async (listingId: string) => {
    if (likedIds.has(listingId)) {
      await supabase
        .from("listing_likes")
        .delete()
        .eq("user_id", user.id)
        .eq("listing_id", listingId);
    } else {
      await supabase.from("listing_likes").insert({ user_id: user.id, listing_id: listingId });
    }
  };

  const toggleSave = async (listingId: string) => {
    if (savedIds.has(listingId)) {
      await supabase
        .from("listing_saves")
        .delete()
        .eq("user_id", user.id)
        .eq("listing_id", listingId);
    } else {
      await supabase.from("listing_saves").insert({ user_id: user.id, listing_id: listingId });
    }
  };

  const markSold = async (listing: ListingView) => {
    const { error } = await supabase
      .from("listings")
      .update({ sold: !listing.sold })
      .eq("id", listing.id);
    if (error) toast.error(error.message);
  };

  const deleteListing = async (listing: ListingView) => {
    const { error } = await supabase.from("listings").delete().eq("id", listing.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (listing.image_paths?.length) {
      await supabase.storage.from("photos").remove(listing.image_paths);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  const displayName =
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    user.email?.split("@")[0] ||
    "Bruker";

  const username = `@${(user.email?.split("@")[0] ?? "bruker").toLowerCase()}`;
  const city = (user.user_metadata?.city as string | undefined) ?? "Oslo, Norge";

  const avatar =
    (user.user_metadata?.avatar_url as string | undefined) ||
    `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(displayName)}`;

  const activeList = useMemo<ListingView[]>(() => {
    if (tab === "all") return myListings;
    if (tab === "liked") return likedListings;
    return savedListings;
  }, [tab, myListings, likedListings, savedListings]);

  return (
    <MobileShell>
      <header className="flex items-center justify-between px-5 py-4">
        <h1 className="font-display text-xl">{username}</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDialogOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-full hover:bg-secondary"
            aria-label="Last opp foto"
          >
            <Camera className="h-5 w-5" strokeWidth={1.7} />
          </button>
          <button
            onClick={handleSignOut}
            className="grid h-10 w-10 place-items-center rounded-full hover:bg-secondary"
            aria-label="Logg ut"
          >
            <LogOut className="h-5 w-5" strokeWidth={1.7} />
          </button>
        </div>
      </header>

      {/* Tise-style profile head */}
      <section className="px-5">
        <div className="flex items-start gap-4">
          <img
            src={avatar}
            alt=""
            className="h-20 w-20 shrink-0 rounded-full object-cover ring-2 ring-border"
          />
          <div className="grid flex-1 grid-cols-3 gap-1 pt-2 text-center">
            <Stat label="Streak" value={streak} />
            <Stat label="Følgere" value={followers} />
            <Stat label="Følger" value={following} />
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-center gap-1">
            <p className="font-display text-lg">{displayName}</p>
            <BadgeCheck className="h-4 w-4 text-accent" fill="currentColor" />
          </div>
          <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" /> {city}
          </p>
          <div className="mt-1 flex items-center gap-1 text-xs">
            <StarRow value={ratingStats.avg} size={12} />
            <span className="ml-1 font-semibold">{ratingStats.avg.toFixed(1)}</span>
            <span className="text-muted-foreground">· {ratingStats.count} vurderinger</span>
          </div>
        </div>

        <button
          onClick={() => setRatingsOpen(true)}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-semibold hover:bg-secondary"
        >
          <Star className="h-4 w-4" /> Vurderinger
        </button>
      </section>

      {/* Tabs */}
      <div className="mt-6 border-b border-border px-5">
        <div className="flex gap-6">
          {[
            { id: "all" as const, label: "Alle produkter" },
            { id: "liked" as const, label: "Likede" },
            { id: "saved" as const, label: "Lagrede" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative pb-3 text-sm font-medium transition ${
                tab === t.id ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {t.label}
              {tab === t.id && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-foreground" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <section className="px-5 pt-4">
        {loading ? (
          <div className="grid place-items-center py-10 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : activeList.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            {tab === "all" && "Du har ingen produkter ennå."}
            {tab === "liked" && "Ingen likte produkter."}
            {tab === "saved" && "Ingen lagrede produkter."}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {activeList.map((l) => (
              <ProductCard
                key={l.id}
                listing={l}
                isOwner={l.user_id === user.id}
                liked={likedIds.has(l.id)}
                saved={savedIds.has(l.id)}
                onToggleLike={() => toggleLike(l.id)}
                onToggleSave={() => toggleSave(l.id)}
                onMarkSold={() => markSold(l)}
                onDelete={() => deleteListing(l)}
              />
            ))}
          </div>
        )}
      </section>

      <NewListingDialog open={dialogOpen} onOpenChange={setDialogOpen} userId={user.id} />
      <RatingsDialog
        open={ratingsOpen}
        onOpenChange={setRatingsOpen}
        sellerId={user.id}
        currentUserId={user.id}
        sellerName={displayName}
      />
    </MobileShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="font-display text-lg leading-tight">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

function ProductCard({
  listing,
  isOwner,
  liked,
  saved,
  onToggleLike,
  onToggleSave,
  onMarkSold,
  onDelete,
}: {
  listing: ListingView;
  isOwner: boolean;
  liked: boolean;
  saved: boolean;
  onToggleLike: () => void;
  onToggleSave: () => void;
  onMarkSold: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card">
      <div className="relative aspect-square overflow-hidden bg-secondary">
        {listing.coverUrl && (
          <img
            src={listing.coverUrl}
            alt={listing.title}
            loading="lazy"
            className={`h-full w-full object-cover transition ${
              listing.sold ? "opacity-70 grayscale" : ""
            }`}
          />
        )}
        {listing.sold && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <span className="rotate-[-18deg] rounded-md bg-destructive px-6 py-1.5 text-sm font-black tracking-widest text-destructive-foreground shadow-lg">
              SOLGT
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleLike();
          }}
          className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-background/90 backdrop-blur"
          aria-label="Lik"
        >
          <Heart
            className={`h-3.5 w-3.5 ${liked ? "text-destructive" : ""}`}
            fill={liked ? "currentColor" : "none"}
            strokeWidth={1.8}
          />
        </button>
        {isOwner && (
          <div className="absolute left-1.5 top-1.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="grid h-7 w-7 place-items-center rounded-full bg-background/90 backdrop-blur"
                  aria-label="Mer"
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={onMarkSold}>
                  {listing.sold ? "Marker som tilgjengelig" : "Marker som solgt"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onToggleSave}>
                  {saved ? "Fjern fra lagrede" : "Lagre"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive focus:text-destructive"
                >
                  Slett
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        {!isOwner && (
          <button
            type="button"
            onClick={onToggleSave}
            className="absolute left-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-background/90 backdrop-blur text-[10px] font-bold"
            aria-label="Lagre"
          >
            {saved ? "★" : "☆"}
          </button>
        )}
      </div>
      <div className="p-2.5">
        <p className="truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {listing.brand || listing.category}
        </p>
        <p className="truncate text-sm">{listing.title}</p>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">str. {listing.size}</span>
          <span className="text-sm font-bold">{listing.price} kr</span>
        </div>
      </div>
    </div>
  );
}
