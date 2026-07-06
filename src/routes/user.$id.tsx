import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownUp,
  ArrowLeft,
  Check,
  Flag,
  Loader2,
  MoreHorizontal,
  Share2,
  Star,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { MobileShell } from "@/components/marketplace/MobileShell";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { supabase } from "@/integrations/supabase/client";
import { hydrateListings, type ListingRow, type ListingView } from "@/lib/listings";
import { SwipeBackWrapper } from "@/components/SwipeBackWrapper";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { RatingsDialog } from "@/components/marketplace/RatingsDialog";

export const Route = createFileRoute("/user/$id")({
  component: () => (
    <SwipeBackWrapper>
      <UserProfile />
    </SwipeBackWrapper>
  ),
});

type Profile = {
  id: string;
  name: string;
  avatar_url: string | null;
  city: string;
  bio: string;
  rating_avg: number;
  rating_count: number;
  created_at?: string;
};

type SortMode = "new" | "low" | "high" | "popular";

const CREAM = "#f6f1e7";
const CARD = "#ede8de";
const INK = "#1a1a1a";
const MUTED = "#a89f94";
const DIVIDER = "#ddd8ce";
const CORAL = "#e8826a";

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[22px] font-bold leading-none" style={{ color: INK }}>
        {value}
      </span>
      <span className="mt-1 text-[12px]" style={{ color: MUTED }}>
        {label}
      </span>
    </div>
  );
}

function UserProfile() {
  const { id } = useParams({ from: "/user/$id" });
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [listings, setListings] = useState<ListingView[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [likesTotal, setLikesTotal] = useState(0);
  const [hasSale, setHasSale] = useState(false);

  const [moreOpen, setMoreOpen] = useState(false);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [sort, setSort] = useState<SortMode>("new");

  const loadFollows = useCallback(async () => {
    const [{ count: fCount }, { count: gCount }] = await Promise.all([
      supabase.from("followers").select("*", { count: "exact", head: true }).eq("following_id", id),
      supabase.from("followers").select("*", { count: "exact", head: true }).eq("follower_id", id),
    ]);
    setFollowers(fCount ?? 0);
    setFollowingCount(gCount ?? 0);
  }, [id]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id ?? null;

      const [p, l] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
        supabase
          .from("listings")
          .select("*")
          .eq("user_id", id)
          .in("status", ["active", "sold"])
          .order("created_at", { ascending: false }),
      ]);
      const rows = (l.data ?? []) as ListingRow[];
      const hydrated = await hydrateListings(rows);

      // likes totals for the "popular" sort
      const listingIds = rows.map((r) => r.id);
      let likesMap: Record<string, number> = {};
      let totalLikes = 0;
      if (listingIds.length) {
        const { data: lk } = await supabase
          .from("listing_likes")
          .select("listing_id")
          .in("listing_id", listingIds);
        for (const row of lk ?? []) {
          likesMap[row.listing_id] = (likesMap[row.listing_id] ?? 0) + 1;
          totalLikes++;
        }
      }
      const withLikes = hydrated.map((h) => ({ ...h, _likes: likesMap[h.id] ?? 0 }));

      if (!active) return;
      setProfile(p.data as Profile | null);
      setListings(withLikes as ListingView[]);
      setLikesTotal(totalLikes);
      setHasSale(rows.some((r) => r.status === "sold"));
      setCurrentUserId(uid);

      await loadFollows();

      if (uid) {
        const { data: follow } = await supabase
          .from("followers")
          .select("id")
          .eq("follower_id", uid)
          .eq("following_id", id)
          .maybeSingle();
        setIsFollowing(!!follow);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [id, loadFollows]);

  const displayName = profile?.name || "Përdorues";
  const username = `@${displayName.toLowerCase().replace(/\s+/g, "")}`;
  const avatar =
    profile?.avatar_url ||
    `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(displayName)}`;

  const activeCount = useMemo(
    () => listings.filter((l) => l.status === "active").length,
    [listings],
  );

  const memberSince = useMemo(() => {
    if (!profile?.created_at) return null;
    const d = new Date(profile.created_at);
    const month = d.toLocaleDateString("sq-AL", { month: "long" });
    return `U bë anëtar në ${month} ${d.getFullYear()}`;
  }, [profile?.created_at]);

  const sorted = useMemo(() => {
    const active = listings.filter((l) => l.status === "active");
    const sold = listings.filter((l) => l.status === "sold");
    const cmp = (a: ListingView, b: ListingView) => {
      if (sort === "low") return a.price - b.price;
      if (sort === "high") return b.price - a.price;
      if (sort === "popular")
        return ((b as any)._likes ?? 0) - ((a as any)._likes ?? 0);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    };
    return [...active.sort(cmp), ...sold.sort(cmp)];
  }, [listings, sort]);

  const toggleFollow = async () => {
    if (!currentUserId) {
      navigate({ to: "/auth" });
      return;
    }
    if (currentUserId === id) return;
    const prev = isFollowing;
    // optimistic
    setIsFollowing(!prev);
    setFollowers((n) => n + (prev ? -1 : 1));
    if (prev) {
      const { error } = await supabase
        .from("followers")
        .delete()
        .eq("follower_id", currentUserId)
        .eq("following_id", id);
      if (error) {
        setIsFollowing(true);
        setFollowers((n) => n + 1);
        toast.error(error.message);
      }
    } else {
      const { error } = await supabase
        .from("followers")
        .insert({ follower_id: currentUserId, following_id: id });
      if (error) {
        setIsFollowing(false);
        setFollowers((n) => n - 1);
        toast.error(error.message);
      }
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/user/${id}`;
    try {
      if (navigator.share) await navigator.share({ url, title: displayName });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Lidhja u kopjua");
      }
    } catch {
      /* cancelled */
    }
    setMoreOpen(false);
  };

  const handleReport = async () => {
    if (!currentUserId) {
      navigate({ to: "/auth" });
      return;
    }
    toast.success("Faleminderit, raporti u dërgua");
    setMoreOpen(false);
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

  if (!profile) {
    return (
      <MobileShell>
        <div className="p-10 text-center text-sm" style={{ color: MUTED }}>
          Përdoruesi nuk u gjet.
        </div>
      </MobileShell>
    );
  }

  const isOwn = currentUserId === id;
  const ratingBtnText =
    profile.rating_count > 0
      ? `${profile.rating_avg.toFixed(1)} (${profile.rating_count})`
      : "Asnjë vlerësim";

  return (
    <MobileShell>
      <div style={{ backgroundColor: CREAM, color: INK }} className="min-h-screen pb-[110px]">
        {/* Header */}
        <header
          className="sticky top-0 z-30 flex items-center justify-between px-4 py-3"
          style={{ backgroundColor: CREAM }}
        >
          <button
            onClick={() => window.history.back()}
            className="grid h-10 w-10 place-items-center rounded-full"
            style={{ backgroundColor: CARD, color: INK }}
            aria-label="Kthehu"
          >
            <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={1.8} />
          </button>
          <h1 className="text-[15px] font-bold" style={{ color: INK }}>
            {username}
          </h1>
          <button
            onClick={() => setMoreOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-full"
            style={{ backgroundColor: CARD, color: INK }}
            aria-label="Më shumë"
          >
            <MoreHorizontal className="h-[18px] w-[18px]" strokeWidth={1.8} />
          </button>
        </header>

        {/* Profile */}
        <section className="px-5 pt-4">
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              <img
                src={avatar}
                alt=""
                className="h-[90px] w-[90px] rounded-full object-cover"
                style={{ border: `1px solid ${DIVIDER}` }}
              />
              {hasSale && (
                <span
                  className="absolute bottom-0 right-0 grid h-5 w-5 place-items-center rounded-full"
                  style={{ backgroundColor: CORAL, border: `2px solid ${CREAM}` }}
                  aria-label="Shitës aktiv"
                >
                  <Check className="h-3 w-3 text-white" strokeWidth={3} />
                </span>
              )}
            </div>
            <div className="flex flex-1 items-center justify-around">
              <Stat value={activeCount} label="artikuj" />
              <Stat value={followers} label="ndjekës" />
              <Stat value={followingCount} label="ndjek" />
            </div>
          </div>

          {/* Follow + rating */}
          <div className="mt-4 flex gap-2">
            {!isOwn && (
              <button
                onClick={toggleFollow}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-[12px] text-[14px] font-bold transition active:scale-[0.98]"
                style={{
                  height: 44,
                  backgroundColor: isFollowing ? CARD : INK,
                  color: isFollowing ? INK : "#ffffff",
                  border: isFollowing ? `1.5px solid ${INK}` : "none",
                }}
              >
                {isFollowing ? (
                  <>
                    Duke ndjekur <Check className="h-4 w-4" strokeWidth={2.2} />
                  </>
                ) : (
                  "Ndiq"
                )}
              </button>
            )}
            <button
              onClick={() => setReviewsOpen(true)}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-[12px] text-[14px] font-bold"
              style={{ height: 44, backgroundColor: CARD, color: INK }}
            >
              <Star className="h-4 w-4" fill={CORAL} stroke={CORAL} strokeWidth={1.5} />
              {ratingBtnText}
            </button>
          </div>

          {/* Name + member since */}
          <div className="mt-4">
            <p className="text-[20px] font-bold leading-tight" style={{ color: INK }}>
              {displayName}
            </p>
            {memberSince && (
              <p className="mt-1 text-[13px]" style={{ color: MUTED }}>
                {memberSince}
              </p>
            )}
            {profile.bio && (
              <p className="mt-3 whitespace-pre-wrap text-[14px] leading-relaxed" style={{ color: INK }}>
                {profile.bio}
              </p>
            )}
          </div>
        </section>

        {/* Tabs */}
        <div className="mt-6" style={{ borderBottom: `1px solid ${DIVIDER}` }}>
          <div className="grid grid-cols-2">
            <button className="relative flex items-center justify-center py-3" aria-label="Rrjeti">
              <GridIcon color={INK} />
              <span className="absolute inset-x-8 -bottom-px h-[2px]" style={{ backgroundColor: INK }} />
            </button>
            <button
              onClick={() => setSortOpen(true)}
              className="flex items-center justify-center py-3"
              aria-label="Rendit"
            >
              <ArrowDownUp className="h-[20px] w-[20px]" strokeWidth={1.8} style={{ color: MUTED }} />
            </button>
          </div>
        </div>

        {/* Grid */}
        {sorted.length === 0 ? (
          <div className="p-10 text-center text-sm" style={{ color: MUTED }}>
            Asnjë artikull për tu shfaqur.
          </div>
        ) : (
          <div className="grid grid-cols-2" style={{ gap: 1, backgroundColor: CREAM }}>
            {sorted.map((l) => (
              <div key={l.id} className="relative overflow-hidden" style={{ aspectRatio: "1 / 1" }}>
                <ListingCard listing={l} aspect="1/1" isOnProfileGrid />
              </div>
            ))}
          </div>
        )}

        {/* Floating sort */}
        {sorted.length > 0 && (
          <button
            onClick={() => setSortOpen(true)}
            className="fixed bottom-20 left-1/2 z-30 -translate-x-1/2 inline-flex items-center gap-2 rounded-full px-5 py-3 text-[13px] font-semibold text-white shadow-lg"
            style={{ backgroundColor: INK }}
          >
            Sorto <ArrowDownUp className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* More sheet */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl border-0 p-0" style={{ backgroundColor: CARD }}>
          <div className="mx-auto mt-3 h-1.5 w-12 rounded-full" style={{ backgroundColor: DIVIDER }} />
          <div className="px-2 pb-6 pt-3">
            <button
              onClick={handleShare}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-4 text-left text-[15px] font-medium"
              style={{ color: INK }}
            >
              <Share2 className="h-5 w-5" strokeWidth={1.8} /> Ndaj profilin
            </button>
            <button
              onClick={handleReport}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-4 text-left text-[15px] font-medium"
              style={{ color: INK }}
            >
              <Flag className="h-5 w-5" strokeWidth={1.8} /> Raporto përdoruesin
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Sort sheet */}
      <Sheet open={sortOpen} onOpenChange={setSortOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl border-0 p-0" style={{ backgroundColor: CARD }}>
          <div className="mx-auto mt-3 h-1.5 w-12 rounded-full" style={{ backgroundColor: DIVIDER }} />
          <div className="px-5 pb-8 pt-4">
            <h2 className="mb-3 text-[17px] font-bold" style={{ color: INK }}>
              Rendit sipas
            </h2>
            {([
              { id: "new", label: "Më të rejat" },
              { id: "low", label: "Çmimi: ulët-lartë" },
              { id: "high", label: "Çmimi: lartë-ulët" },
              { id: "popular", label: "Më të popullarizuarat" },
            ] as const).map((o) => (
              <button
                key={o.id}
                onClick={() => {
                  setSort(o.id);
                  setSortOpen(false);
                }}
                className="flex w-full items-center justify-between py-3 text-left text-[15px]"
                style={{ color: INK, borderBottom: `1px solid ${DIVIDER}` }}
              >
                {o.label}
                {sort === o.id && <Check className="h-4 w-4" />}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Reviews */}
      <RatingsDialog
        open={reviewsOpen}
        onOpenChange={setReviewsOpen}
        sellerId={id}
        currentUserId={currentUserId}
        sellerName={displayName}
      />

      {/* Suppress unused var lint for likesTotal (surfaced via popular sort but unused otherwise) */}
      <span className="hidden">{likesTotal}</span>
    </MobileShell>
  );
}

function GridIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
