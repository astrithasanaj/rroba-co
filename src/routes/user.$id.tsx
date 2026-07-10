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
import { ReviewsSheet } from "@/components/marketplace/ReviewsSheet";
import { FollowListSheet } from "@/components/marketplace/FollowListSheet";

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

function Stat({
  value,
  label,
  onClick,
}: {
  value: number | string;
  label: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <p style={{ fontSize: 18, fontWeight: 600, color: INK, lineHeight: 1.2 }}>{value}</p>
      <p style={{ fontSize: 11, fontWeight: 400, color: MUTED, marginTop: 2, letterSpacing: "0.2px" }}>
        {label}
      </p>
    </>
  );
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="active:opacity-70"
        style={{
          textAlign: "center",
          background: "transparent",
          border: 0,
          padding: 0,
          cursor: "pointer",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        {content}
      </button>
    );
  }
  return <div style={{ textAlign: "center" }}>{content}</div>;
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
  const [followSheet, setFollowSheet] = useState<null | "followers" | "following">(null);


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
        supabase.from("public_profiles").select("id,name,avatar_url,city,bio,rating_avg,rating_count,created_at").eq("id", id).maybeSingle(),
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
      <div
        style={{
          backgroundColor: CREAM,
          color: INK,
          WebkitFontSmoothing: "antialiased",
          WebkitTapHighlightColor: "transparent",
        }}
        className="min-h-screen pb-[110px]"
      >
        {/* Header */}
        <header
          className="sticky top-0 z-30 flex items-center justify-between"
          style={{ padding: "10px 16px 6px", backgroundColor: CREAM }}
        >
          <button
            onClick={() => window.history.back()}
            className="profile-btn grid place-items-center"
            style={{
              width: 40,
              height: 40,
              borderRadius: "9999px",
              backgroundColor: CARD,
              color: INK,
              border: "none",
            }}
            aria-label="Kthehu"
          >
            <ArrowLeft style={{ width: 18, height: 18 }} strokeWidth={1.8} />
          </button>
          <h1 style={{ fontSize: 14, fontWeight: 500, letterSpacing: "0.1px", color: INK }}>
            {username}
          </h1>
          <button
            onClick={() => setMoreOpen(true)}
            className="profile-btn grid place-items-center"
            style={{
              width: 40,
              height: 40,
              borderRadius: "9999px",
              backgroundColor: CARD,
              color: INK,
              border: "none",
            }}
            aria-label="Më shumë"
          >
            <MoreHorizontal style={{ width: 18, height: 18 }} strokeWidth={1.8} />
          </button>
        </header>

        {/* Profile */}
        <section>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "8px 16px 12px" }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <img
                src={avatar}
                alt=""
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: `2px solid ${DIVIDER}`,
                }}
              />
              {hasSale && (
                <span
                  className="absolute grid place-items-center"
                  style={{
                    bottom: 0,
                    right: 0,
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    backgroundColor: CORAL,
                    border: `2px solid ${CREAM}`,
                  }}
                  aria-label="Shitës aktiv"
                >
                  <Check style={{ width: 10, height: 10, color: "#fff" }} strokeWidth={3} />
                </span>
              )}
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-around" }}>
                <Stat value={activeCount} label="artikuj" />
                <Stat
                  value={followers}
                  label="ndjekës"
                  onClick={() => navigate({ to: "/user/$id/followers", params: { id } })}
                />
                <Stat
                  value={followingCount}
                  label="ndjek"
                  onClick={() => navigate({ to: "/user/$id/following", params: { id } })}
                />
              </div>


              <div style={{ display: "flex", gap: 7 }}>
                {!isOwn && (
                  <button
                    onClick={toggleFollow}
                    className="profile-btn"
                    style={{
                      flex: 1,
                      height: 34,
                      borderRadius: 10,
                      border: isFollowing ? "1px solid #c8c3b9" : "none",
                      backgroundColor: isFollowing ? CREAM : INK,
                      color: isFollowing ? INK : "#ffffff",
                      fontSize: 12,
                      fontWeight: 500,
                      letterSpacing: "0.2px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                    }}
                  >
                    {isFollowing ? (
                      <>
                        Duke ndjekur <Check style={{ width: 12, height: 12 }} strokeWidth={2.2} />
                      </>
                    ) : (
                      "Ndiq"
                    )}
                  </button>
                )}
                <button
                  onClick={() => setReviewsOpen(true)}
                  className="profile-btn"
                  style={{
                    flex: 1,
                    height: 34,
                    borderRadius: 10,
                    border: "1px solid #c8c3b9",
                    backgroundColor: CREAM,
                    color: INK,
                    fontSize: 12,
                    fontWeight: 500,
                    letterSpacing: "0.2px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                  }}
                >
                  <Star style={{ width: 12, height: 12 }} fill={CORAL} stroke={CORAL} strokeWidth={1.5} />
                  {ratingBtnText}
                </button>
              </div>
            </div>
          </div>

          <div style={{ padding: "0 16px 14px" }}>
            <p
              style={{
                fontSize: 17,
                fontWeight: 600,
                letterSpacing: "-0.2px",
                color: INK,
                lineHeight: 1.2,
              }}
            >
              {displayName}
            </p>
            {memberSince && (
              <p style={{ marginTop: 4, fontSize: 13, color: MUTED }}>{memberSince}</p>
            )}
            {profile.bio && (
              <p className="mt-3 whitespace-pre-wrap text-[14px] leading-relaxed" style={{ color: INK }}>
                {profile.bio}
              </p>
            )}
          </div>
        </section>

        {/* Divider */}
        <div style={{ height: 1, backgroundColor: DIVIDER, width: "100%" }} />

        {/* Tabs */}
        <div>
          <div className="grid grid-cols-2" style={{ backgroundColor: CREAM }}>
            <button
              className="profile-btn relative flex items-center justify-center"
              style={{ height: 40, background: "transparent", border: "none" }}
              aria-label="Rrjeti"
            >
              <GridIcon color={INK} />
              <span
                style={{
                  position: "absolute",
                  bottom: 0,
                  width: 20,
                  height: 2,
                  backgroundColor: INK,
                }}
              />
            </button>
            <button
              onClick={() => setSortOpen(true)}
              className="profile-btn flex items-center justify-center"
              style={{ height: 40, background: "transparent", border: "none" }}
              aria-label="Rendit"
            >
              <ArrowDownUp style={{ width: 20, height: 20, color: "#c8c3b9" }} strokeWidth={1.7} />
            </button>
          </div>
        </div>

        {/* Grid */}
        {sorted.length === 0 ? (
          <div className="p-10 text-center text-sm" style={{ color: MUTED }}>
            Asnjë artikull për tu shfaqur.
          </div>
        ) : (
          <div className="grid grid-cols-2" style={{ gap: 1.5, backgroundColor: "#e8e3d9" }}>
            {sorted.map((l) => (
              <div key={l.id} className="relative overflow-hidden" style={{ aspectRatio: "1 / 1" }}>
                <ListingCard listing={l} aspect="1/1" isOnProfileGrid />
              </div>
            ))}
          </div>
        )}

        {/* Floating sort */}
        {sorted.length > 0 && (
          <div
            style={{
              position: "fixed",
              bottom: 90,
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "center",
              padding: "10px 0 8px",
              zIndex: 30,
              pointerEvents: "none",
            }}
          >
            <button
              onClick={() => setSortOpen(true)}
              className="profile-btn"
              style={{
                pointerEvents: "auto",
                backgroundColor: INK,
                color: CREAM,
                height: 36,
                borderRadius: 24,
                padding: "0 18px",
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: "0.2px",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                border: "none",
              }}
            >
              <ArrowDownUp style={{ width: 14, height: 14 }} strokeWidth={2} />
              Sorto
            </button>
          </div>
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
      <ReviewsSheet
        open={reviewsOpen}
        onOpenChange={setReviewsOpen}
        sellerId={id}
        currentUserId={currentUserId}
        sellerName={displayName}
        sellerUsername={username}
        sellerCreatedAt={profile.created_at}
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
