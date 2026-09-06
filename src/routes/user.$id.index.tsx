import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  ArrowDownUp,
  ArrowLeft,
  Check,
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
import { getCurrentUser } from "@/hooks/useCurrentUser";
import { type ListingView } from "@/lib/listings";
import { SwipeBackWrapper } from "@/components/SwipeBackWrapper";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ReviewsSheet } from "@/components/marketplace/ReviewsSheet";
import { getProfileStats, setProfileStats } from "@/lib/profile-stats-cache";
import {
  fetchPublicProfile,
  fetchUserPublicListings,
  fetchUserStats,
  publicProfileKey,
  publicProfileListingsKey,
  publicProfileStatsKey,
} from "@/lib/profile-queries";

export const Route = createFileRoute("/user/$id/")({
  component: () => (
    <SwipeBackWrapper>
      <UserProfile />
    </SwipeBackWrapper>
  ),
});


type SortMode = "new" | "low" | "high" | "popular";
type ListingWithLikes = ListingView & { _likes: number };

const CREAM = "var(--brand-surface)";
const CARD = "var(--brand-surface)";
const INK = "var(--brand-ink)";
const MUTED = "var(--brand-ink-secondary)";
const DIVIDER = "var(--brand-border)";
const CORAL = "var(--brand-rose)";
const BORDER_STRONG = "var(--brand-border-strong)";
const FOCUS_CLASS = "focus:outline-none focus-visible:shadow-[0_0_0_3px_rgba(198,90,122,0.35)]";

function Stat({
  value,
  label,
  onClick,
}: {
  value: number | string | null;
  label: string;
  onClick?: (e: React.MouseEvent) => void;
}) {
  const content = (
    <>
      <p
        style={{
          fontSize: 18,
          fontWeight: 600,
          color: INK,
          lineHeight: 1.2,
          minHeight: "1.2em",
          minWidth: "2.5ch",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value === null ? (
          <span
            aria-hidden="true"
            className="inline-block rounded bg-muted animate-pulse align-middle"
            style={{ width: "2ch", height: "0.85em" }}
          />
        ) : (
          value
        )}
      </p>
      <p
        style={{
          fontSize: 11,
          fontWeight: 400,
          color: MUTED,
          marginTop: 2,
          letterSpacing: "0.2px",
        }}
      >
        {label}
      </p>
    </>
  );
  if (onClick) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick(e);
        }}
        className="active:opacity-70"
        style={{
          textAlign: "center",
          background: "transparent",
          border: 0,
          padding: 0,
          cursor: "pointer",
          WebkitTapHighlightColor: "transparent",
          minWidth: "5ch",
        }}
      >
        {content}
      </button>
    );
  }
  return <div style={{ textAlign: "center", minWidth: "5ch" }}>{content}</div>;
}

// ---- Fetchers live in @/lib/profile-queries (shared with intent prefetch) ---

function UserProfile() {
  const { id } = useParams({ from: "/user/$id/" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);

  const [moreOpen, setMoreOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [sort, setSort] = useState<SortMode>("new");

  // ---- Queries ------------------------------------------------------------

  const profileQuery = useQuery({
    queryKey: publicProfileKey(id),
    queryFn: () => fetchPublicProfile(id),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });
  const profile = profileQuery.data ?? null;

  const listingsQuery = useQuery({
    queryKey: publicProfileListingsKey(id),
    queryFn: () => fetchUserPublicListings(id),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
  const listings: ListingWithLikes[] = listingsQuery.data?.listings ?? [];
  const hasSale = listingsQuery.data?.hasSale ?? false;
  const likesTotal = listingsQuery.data?.totalLikes ?? 0;

  const statsQuery = useQuery({
    queryKey: publicProfileStatsKey(id),
    queryFn: () => fetchUserStats(id),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
    initialData: () => {
      const s = getProfileStats(id);
      if (s && s.followers != null && s.following != null && s.articles != null) {
        return { followers: s.followers, following: s.following, articles: s.articles };
      }
      return undefined;
    },
  });

  useEffect(() => {
    if (statsQuery.data) setProfileStats(id, statsQuery.data);
  }, [statsQuery.data, id]);

  // Authoritative: head-count from stats query.
  const followers: number | null = statsQuery.data?.followers ?? null;
  const followingCount: number | null = statsQuery.data?.following ?? null;
  const articleCount: number | null = statsQuery.data?.articles ?? null;

  // Load current user + follow-state once auth is known.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const u = await getCurrentUser();
      if (cancelled) return;
      const uid = u?.id ?? null;
      setCurrentUserId(uid);
      if (!uid) {
        setIsFollowing(false);
        return;
      }
      const { data: follow } = await supabase
        .from("followers")
        .select("id")
        .eq("follower_id", uid)
        .eq("following_id", id)
        .maybeSingle();
      if (!cancelled) setIsFollowing(!!follow);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Optimistic follow state updates use setFollowers via query cache patch.
  const setFollowers = useCallback(
    (mut: (n: number) => number) => {
      queryClient.setQueryData<{ followers: number; following: number; articles: number }>(
        publicProfileStatsKey(id),
        (prev) => (prev ? { ...prev, followers: mut(prev.followers) } : prev),
      );
    },
    [queryClient, id],
  );


  const displayName = profile?.name || "Përdorues";
  const username = profile?.username
    ? `@${profile.username}`
    : `@user_${(profile?.id || id || "").slice(0, 8)}`;

  const avatar =
    profile?.avatar_url ||
    `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(displayName)}`;


  const memberSince = useMemo(() => {
    if (!profile?.created_at) return null;
    const d = new Date(profile.created_at);
    const month = d.toLocaleDateString("sq-AL", { month: "long" });
    return `U bë anëtar në ${month} ${d.getFullYear()}`;
  }, [profile?.created_at]);

  const sorted = useMemo(() => {
    const active = listings.filter((l) => l.status === "active");
    const sold = listings.filter((l) => l.status === "sold");
    const cmp = (a: ListingWithLikes, b: ListingWithLikes) => {
      if (sort === "low") return a.price - b.price;
      if (sort === "high") return b.price - a.price;
      if (sort === "popular") return (b._likes ?? 0) - (a._likes ?? 0);
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
    if (followBusy) return;
    const prev = isFollowing;
    setFollowBusy(true);
    // optimistic
    setIsFollowing(!prev);
    setFollowers((n) => (n ?? 0) + (prev ? -1 : 1));
    try {
      if (prev) {
        const { error } = await supabase
          .from("followers")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("following_id", id);
        if (error) {
          setIsFollowing(true);
          setFollowers((n) => (n ?? 0) + 1);
          toast.error(error.message);
        }
      } else {
        const { error } = await supabase
          .from("followers")
          .insert({ follower_id: currentUserId, following_id: id });
        if (error) {
          setIsFollowing(false);
          setFollowers((n) => (n ?? 1) - 1);
          toast.error(error.message);
        }
      }
    } finally {
      setFollowBusy(false);
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

  const loading = profileQuery.isPending && !profileQuery.data;
  const listingsLoading = listingsQuery.isPending && !listingsQuery.data;

  if (loading) {
    return (
      <MobileShell>
        <div
          role="status"
          aria-live="polite"
          aria-busy="true"
          className="min-h-screen pb-[110px]"
          style={{ backgroundColor: CREAM }}
        >
          {/* Header placeholder — matches real header geometry */}
          <header
            className="sticky top-0 z-30 flex items-center justify-between"
            style={{ padding: "10px 16px 6px", backgroundColor: CREAM }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "9999px",
                backgroundColor: "rgba(255,255,255,0.7)",
                border: "1px solid rgba(226,226,222,0.8)",
              }}
              aria-hidden="true"
            />
            <div
              style={{
                width: 96,
                height: 14,
                borderRadius: 4,
                backgroundColor: DIVIDER,
              }}
              aria-hidden="true"
            />
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "9999px",
                backgroundColor: CARD,
              }}
              aria-hidden="true"
            />
          </header>

          {/* Profile row placeholder */}
          <section>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 14,
                padding: "8px 16px 12px",
              }}
            >
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  backgroundColor: DIVIDER,
                  flexShrink: 0,
                }}
                aria-hidden="true"
              />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-around" }}>
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}
                    >
                      <div style={{ width: 24, height: 18, borderRadius: 4, backgroundColor: DIVIDER }} />
                      <div style={{ width: 48, height: 11, borderRadius: 4, backgroundColor: DIVIDER }} />
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 7 }}>
                  <div style={{ flex: 1, height: 34, borderRadius: 10, backgroundColor: DIVIDER }} />
                  <div style={{ flex: 1, height: 34, borderRadius: 10, backgroundColor: DIVIDER }} />
                </div>
              </div>
            </div>
          </section>

          <span className="sr-only">Duke ngarkuar profilin…</span>
        </div>
      </MobileShell>
    );
  }


  if (profileQuery.isFetched && !profile) {
    return (
      <MobileShell>
        <div role="alert" className="p-10 text-center text-sm" style={{ color: MUTED }}>
          Përdoruesi nuk u gjet.
        </div>
      </MobileShell>
    );
  }

  if (!profile) {
    // Placeholder — should never render because `loading` short-circuits.
    return null;
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
            type="button"
            onClick={() => window.history.back()}
            aria-label="Kthehu"
            className={`grid place-items-center rounded-full transition-transform duration-150 active:scale-[0.97] ${FOCUS_CLASS}`}
            style={{
              width: 44,
              height: 44,
              backgroundColor: "rgba(255,255,255,0.7)",
              border: "1px solid rgba(226,226,222,0.8)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          >
            <ChevronLeft size={22} color="var(--brand-ink)" strokeWidth={2} aria-hidden="true" />
          </button>
          <h1 style={{ fontSize: 14, fontWeight: 500, letterSpacing: "0.1px", color: INK }}>
            {username}
          </h1>
          <button
            onClick={() => setMoreOpen(true)}
            className="profile-btn grid place-items-center"
            style={{
              width: 44,
              height: 44,
              borderRadius: "9999px",
              backgroundColor: CARD,
              color: INK,
              border: "none",
            }}
            aria-label="Më shumë"
          >
            <MoreHorizontal style={{ width: 22, height: 22 }} strokeWidth={1.8} />
          </button>
        </header>

        {/* Profile */}
        <section>
          <div
            style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "8px 16px 12px" }}
          >
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
                <Stat value={articleCount} label="artikuj" />
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
                    disabled={followBusy}
                    aria-pressed={isFollowing}
                    aria-busy={followBusy}
                    aria-label={isFollowing ? "Ndalo së ndjekuri" : "Ndiq"}
                    className={`profile-btn ${FOCUS_CLASS}`}
                    style={{
                      flex: 1,
                      height: 34,
                      minWidth: 0,
                      borderRadius: 10,
                      border: "none",
                      background: isFollowing
                        ? "var(--brand-rose-soft)"
                        : "linear-gradient(120deg, var(--brand-coral), var(--brand-rose))",
                      color: isFollowing ? "var(--brand-rose-ink)" : "#ffffff",
                      fontSize: 12,
                      fontWeight: 600,
                      letterSpacing: "0.2px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                      opacity: followBusy ? 0.7 : 1,
                      cursor: followBusy ? "progress" : "pointer",
                    }}
                  >
                    {isFollowing ? (
                      <>
                        Duke ndjekur{" "}
                        <Check
                          style={{ width: 12, height: 12 }}
                          strokeWidth={2.2}
                          aria-hidden="true"
                        />
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
                    border: "1px solid var(--brand-border-strong)",
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
                  <Star
                    style={{ width: 12, height: 12 }}
                    fill={CORAL}
                    stroke={CORAL}
                    strokeWidth={1.5}
                  />
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
              <p
                className="mt-3 whitespace-pre-wrap text-[14px] leading-relaxed"
                style={{ color: INK }}
              >
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
              <ArrowDownUp
                style={{ width: 20, height: 20, color: "var(--brand-border-strong)" }}
                strokeWidth={1.7}
              />
            </button>
          </div>
        </div>

        {/* Grid */}
        {listingsLoading && sorted.length === 0 ? (
          <div
            className="grid grid-cols-2"
            style={{ gap: 1.5, backgroundColor: "#ffffff" }}
            role="status"
            aria-live="polite"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square animate-pulse"
                style={{ backgroundColor: "var(--brand-cream, #f3ede4)" }}
              />
            ))}
            <span className="sr-only">Duke ngarkuar…</span>
          </div>
        ) : sorted.length === 0 ? (
          <div className="p-10 text-center text-sm" style={{ color: MUTED }}>
            Asnjë artikull për tu shfaqur.
          </div>
        ) : (
          <div className="grid grid-cols-2" style={{ gap: 1.5, backgroundColor: "#ffffff" }}>
            {sorted.map((l, i) => (
              <div key={l.id} className="relative overflow-hidden" style={{ aspectRatio: "1 / 1" }}>
                <ListingCard listing={l} aspect="1/1" isOnProfileGrid eager={i < 4} />
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
        <SheetContent
          side="bottom"
          hideClose
          className="border-0 p-0"
          style={{ backgroundColor: CARD }}
        >
          <div className="flex items-center gap-3 px-4 pt-5 pb-3">
            <button
              type="button"
              onClick={() => setMoreOpen(false)}
              aria-label="Kthehu"
              className="grid place-items-center rounded-full transition-transform duration-150 active:scale-[0.97]"
              style={{
                width: 44,
                height: 44,
                backgroundColor: "rgba(255,255,255,0.7)",
                border: "1px solid rgba(226,226,222,0.8)",
                backdropFilter: "blur(8px)",
              }}
            >
              <ChevronLeft size={22} color="var(--brand-ink)" strokeWidth={2} />
            </button>
          </div>
          <div className="px-2 pb-6 pt-1">
            <button
              onClick={handleShare}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-4 text-left text-[15px] font-medium"
              style={{ color: INK }}
            >
              <Share2 className="h-5 w-5" strokeWidth={1.8} /> Ndaj profilin
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Sort sheet */}
      <Sheet open={sortOpen} onOpenChange={setSortOpen}>
        <SheetContent
          side="bottom"
          hideClose
          className="border-0 p-0"
          style={{ backgroundColor: CARD }}
        >
          <div className="flex items-center gap-3 px-4 pt-5 pb-2">
            <button
              type="button"
              onClick={() => setSortOpen(false)}
              aria-label="Kthehu"
              className="grid place-items-center rounded-full transition-transform duration-150 active:scale-[0.97]"
              style={{
                width: 44,
                height: 44,
                backgroundColor: "rgba(255,255,255,0.7)",
                border: "1px solid rgba(226,226,222,0.8)",
                backdropFilter: "blur(8px)",
              }}
            >
              <ChevronLeft size={22} color="var(--brand-ink)" strokeWidth={2} />
            </button>
          </div>
          <div className="px-5 pb-8 pt-4">
            <h2 className="mb-3 text-[17px] font-bold" style={{ color: INK }}>
              Rendit sipas
            </h2>
            {(
              [
                { id: "new", label: "Më të rejat" },
                { id: "low", label: "Çmimi: ulët-lartë" },
                { id: "high", label: "Çmimi: lartë-ulët" },
                { id: "popular", label: "Më të popullarizuarat" },
              ] as const
            ).map((o) => (
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
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
