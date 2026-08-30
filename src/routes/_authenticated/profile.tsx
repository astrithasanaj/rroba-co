import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDownUp,
  ArrowLeft,
  Bell,
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  Gem,
  Grid2x2,
  Heart,
  HelpCircle,
  ImageOff,
  Loader2,
  LogOut,
  MessageSquare,
  Minus,
  Plus,
  Ruler,
  Settings as SettingsIcon,
  Shirt,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Trash2,
  User as UserIcon,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { MobileShell } from "@/components/marketplace/MobileShell";
import { StarRow } from "@/components/marketplace/RatingsDialog";
import { ReviewsSheet } from "@/components/marketplace/ReviewsSheet";

import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser } from "@/hooks/useCurrentUser";
import {
  getCachedCurrentProfile,
  setCurrentProfileCache,
  updateCurrentProfileCache,
  useCurrentProfile,
} from "@/hooks/useCurrentProfile";

import { compressImage, AVATAR_OPTIONS } from "@/utils/compressImage";
import { hydrateListings, type ListingRow, type ListingView } from "@/lib/listings";
import { getMembershipPlan } from "@/lib/membership-plans";
import { useTranslation, type Language } from "@/i18n";
import { CityPicker } from "@/components/marketplace/CityPicker";
import { useUserCollections } from "@/lib/user-collections";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { IosShareIcon } from "@/components/marketplace/IosShareIcon";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getProfileStats, setProfileStats } from "@/lib/profile-stats-cache";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

type Tab = "mine" | "liked" | "saved" | "wardrobe";
type SortMode = "new" | "low" | "high";

type Profile = {
  id: string;
  name: string;
  avatar_url: string | null;
  city: string;
  city_id: string | null;
  bio: string;
  rating_avg: number;
  rating_count: number;
  height_cm: number | null;
  created_at?: string;
};

type OfferRow = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  status: string;
  created_at: string;
};

const CREAM = "var(--brand-surface)";
const CARD = "var(--brand-surface)";
const INK = "var(--brand-ink)";
const MUTED = "var(--brand-ink-secondary)";
const DIVIDER = "var(--brand-border)";
const SOLD = "var(--brand-rose)";
const BORDER_STRONG = "var(--brand-border-strong)";
const FOCUS_CLASS = "focus:outline-none focus-visible:shadow-[0_0_0_3px_rgba(198,90,122,0.35)]";
// Lokale semantiske farge-konstanter (kun brukt i profil).
const OVERLAY_GLYPH = "#ffffff";
const GLASS_BG = "rgba(255,255,255,0.7)";
const GLASS_BORDER = "rgba(226,226,222,0.8)";
const DARK_GLASS_BG = "rgba(255,255,255,0.12)";
const DARK_GLASS_INK_SOFT = "rgba(255,255,255,0.65)";
const OFFER_ACCEPTED_BG = "#d1f4e0";
const OFFER_DECLINED_BG = "#f4d1d1";

// ---- Fetchers (module-scope so they don't re-alloc per render) ---------

async function fetchProfileRow(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  const row = data as Profile | null;
  return row && row.id === userId ? row : null;
}

async function fetchProfileStats(
  userId: string,
): Promise<{ followers: number; following: number; articles: number }> {
  const [fRes, gRes, aRes] = await Promise.all([
    supabase.from("followers").select("*", { count: "exact", head: true }).eq("following_id", userId),
    supabase.from("followers").select("*", { count: "exact", head: true }).eq("follower_id", userId),
    supabase
      .from("listings")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "active"),
  ]);
  return {
    followers: fRes.count ?? 0,
    following: gRes.count ?? 0,
    articles: aRes.count ?? 0,
  };
}

async function fetchMyListings(userId: string): Promise<ListingView[]> {
  const { data } = await supabase
    .from("listings")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["active", "sold"])
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as ListingRow[];
  const hydrated = await hydrateListings(rows, { thumbnail: true, mode: "cover" });
  // Aktive først, deretter solgte — samme sortering som før.
  return [
    ...hydrated.filter((p) => p.status === "active"),
    ...hydrated.filter((p) => p.status === "sold"),
  ];
}

async function fetchOffers(userId: string): Promise<{
  received: OfferRow[];
  sent: OfferRow[];
  titles: Record<string, string>;
}> {
  const [rec, sent] = await Promise.all([
    supabase
      .from("offers")
      .select("*")
      .eq("seller_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("offers")
      .select("*")
      .eq("buyer_id", userId)
      .order("created_at", { ascending: false }),
  ]);
  const received = (rec.data ?? []) as OfferRow[];
  const sentRows = (sent.data ?? []) as OfferRow[];
  const ids = Array.from(new Set([...received, ...sentRows].map((o) => o.listing_id)));
  let titles: Record<string, string> = {};
  if (ids.length) {
    const { data: t } = await supabase.from("listings").select("id,title").in("id", ids);
    for (const row of t ?? []) titles[row.id] = row.title;
  }
  return { received, sent: sentRows, titles };
}

async function fetchListingsByIds(ids: string[]): Promise<ListingView[]> {
  if (ids.length === 0) return [];
  const { data } = await supabase
    .from("listings")
    .select("*")
    .in("id", ids)
    .eq("status", "active")
    .eq("sold", false);
  return hydrateListings((data ?? []) as ListingRow[], { thumbnail: true, mode: "cover" });
}

function ProfilePage() {
  const { t } = useTranslation();
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { likes, saves, loaded: collectionsLoaded } = useUserCollections();
  const hasUnreadNotifications = useUnreadNotifications();
  const [tab, setTab] = useState<Tab>("mine");
  const [sort, setSort] = useState<SortMode>("new");
  const [ratingsOpen, setRatingsOpen] = useState(false);
  const [benefitsOpen, setBenefitsOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [offersOpen, setOffersOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [heightOpen, setHeightOpen] = useState(false);
  const [offerSub, setOfferSub] = useState<"received" | "sent">("received");

  // Profile row — synchronous cache seed for name/avatar/bio/city.
  const cachedProfile = getCachedCurrentProfile(user.id) as Profile | null | undefined;
  const [profile, setProfile] = useState<Profile | null>(cachedProfile ?? null);
  const liveCachedProfile = useCurrentProfile(user.id) as Profile | null;
  useEffect(() => {
    if (liveCachedProfile && liveCachedProfile.id === user.id) {
      setProfile(liveCachedProfile);
    }
  }, [liveCachedProfile, user.id]);

  // ---- Queries ---------------------------------------------------------

  const statsQuery = useQuery({
    queryKey: ["profile-stats", user.id] as const,
    queryFn: () => fetchProfileStats(user.id),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
    initialData: () => {
      const s = getProfileStats(user.id);
      if (s && s.followers != null && s.following != null && s.articles != null) {
        return {
          followers: s.followers,
          following: s.following,
          articles: s.articles,
        };
      }
      return undefined;
    },
  });

  useEffect(() => {
    if (statsQuery.data) {
      setProfileStats(user.id, statsQuery.data);
    }
  }, [statsQuery.data, user.id]);

  const listingsQuery = useQuery({
    queryKey: ["profile-listings", user.id] as const,
    queryFn: () => fetchMyListings(user.id),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
  const myListings: ListingView[] = listingsQuery.data ?? [];

  const offersQuery = useQuery({
    queryKey: ["profile-offers", user.id] as const,
    queryFn: () => fetchOffers(user.id),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
  const offersReceived = offersQuery.data?.received ?? [];
  const offersSent = offersQuery.data?.sent ?? [];
  const listingTitles = offersQuery.data?.titles ?? {};

  // Liked/saved — keyed on sorted ids so cache-per-selection works,
  // placeholderData keeps last render while switching.
  const likesKey = useMemo(() => Array.from(likes).sort().join(","), [likes]);
  const savesKey = useMemo(() => Array.from(saves).sort().join(","), [saves]);

  const likedQuery = useQuery({
    queryKey: ["profile-liked-listings", user.id, likesKey] as const,
    queryFn: () => fetchListingsByIds(Array.from(likes)),
    enabled: collectionsLoaded,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
  const savedQuery = useQuery({
    queryKey: ["profile-saved-listings", user.id, savesKey] as const,
    queryFn: () => fetchListingsByIds(Array.from(saves)),
    enabled: collectionsLoaded,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
  const likedListings = likedQuery.data ?? [];
  const savedListings = savedQuery.data ?? [];

  // Fetch profile row separately (fills the shared profile cache), but do
  // not gate anything on it — the cache-seeded profile above is used for
  // the visible header.
  useEffect(() => {
    let cancelled = false;
    fetchProfileRow(user.id).then((row) => {
      if (cancelled) return;
      setProfile(row);
      setCurrentProfileCache(user.id, row);
    });
    return () => {
      cancelled = true;
    };
  }, [user.id]);

  // Invalidation helper — used by SettingsSheet / HeightSheet.
  const loadAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["profile-stats", user.id] });
    queryClient.invalidateQueries({ queryKey: ["profile-listings", user.id] });
    queryClient.invalidateQueries({ queryKey: ["profile-offers", user.id] });
    fetchProfileRow(user.id).then((row) => {
      setProfile(row);
      setCurrentProfileCache(user.id, row);
    });
  }, [queryClient, user.id]);

  // Realtime: debounced invalidations, never blank current state.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const invalidateListings = () => {
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        queryClient.invalidateQueries({ queryKey: ["profile-listings", user.id] });
        queryClient.invalidateQueries({ queryKey: ["profile-stats", user.id] });
      }, 300);
    };
    const invalidateOffers = () => {
      queryClient.invalidateQueries({ queryKey: ["profile-offers", user.id] });
    };
    const ch = supabase
      .channel(`profile-live:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "listings", filter: `user_id=eq.${user.id}` },
        invalidateListings,
      )
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "listings" }, invalidateListings)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "offers", filter: `seller_id=eq.${user.id}` },
        invalidateOffers,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "offers", filter: `buyer_id=eq.${user.id}` },
        invalidateOffers,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ratings", filter: `seller_id=eq.${user.id}` },
        () => {
          fetchProfileRow(user.id).then((row) => {
            setProfile(row);
            setCurrentProfileCache(user.id, row);
          });
        },
      )
      .subscribe();
    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(ch);
    };
  }, [user.id, queryClient]);

  // ---- Derived values --------------------------------------------------

  // Authoritative source: head-count from stats query.
  const articleCount: number | null = statsQuery.data?.articles ?? null;
  const followers: number | null = statsQuery.data?.followers ?? null;
  const following: number | null = statsQuery.data?.following ?? null;


  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };
  const respondOffer = async (o: OfferRow, status: "accepted" | "declined") => {
    const { error } = await supabase.from("offers").update({ status }).eq("id", o.id);
    if (error) toast.error(error.message);
    else toast.success(status === "accepted" ? t("profile.offer_accepted") : t("profile.offer_declined"));
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/user/${user.id}`;
    const shareData = { url, title: displayName, text: t("profile.share_text") };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(url);
        toast.success(t("profile.link_copied"));
      }
    } catch {
      // Bruker avbrøt native share-dialog – ignorer.
    }
  };

  // Ikke vis noe brukernavn eller avatar før profilen (matchende user.id) er lastet.
  // Tidligere fallback brukte user.email-prefix, som lekket rå e-post (f.eks. private-relay-id)
  // som brukernavn i et lite øyeblikk før den ekte profilen kom fram.
  const profileReady = profile !== null && profile.id === user.id;
  const displayName = profileReady ? profile.name : "";
  const avatar = profileReady && profile.avatar_url ? profile.avatar_url : null;
  const username = profileReady
    ? `@${(profile.name || "").toLowerCase().replace(/\s+/g, "")}`
    : "";


  const sortFn = (a: ListingView, b: ListingView) => {
    if (sort === "low") return a.price - b.price;
    if (sort === "high") return b.price - a.price;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  };

  const mineListings = useMemo(() => {
    const active = myListings.filter((l) => l.status === "active").sort(sortFn);
    const sold = myListings.filter((l) => l.status === "sold").sort(sortFn);
    return [...active, ...sold];
  }, [myListings, sort]);
  const wardrobeListings = useMemo(
    () => myListings.filter((l) => l.status === "sold").sort(sortFn),
    [myListings, sort],
  );
  const sortedLiked = useMemo(() => [...likedListings].sort(sortFn), [likedListings, sort]);
  const sortedSaved = useMemo(() => [...savedListings].sort(sortFn), [savedListings, sort]);

  const salesCount = useMemo(
    () => myListings.filter((l) => l.status === "sold").length,
    [myListings],
  );
  const tier = salesCount >= 20 ? "top" : salesCount >= 5 ? "trusted" : "starter";

  const tabs: { id: Tab; icon: typeof Grid2x2 }[] = [
    { id: "mine", icon: Grid2x2 },
    { id: "liked", icon: Heart },
    { id: "saved", icon: Bookmark },
    { id: "wardrobe", icon: Shirt },
  ];

  const currentGrid =
    tab === "mine"
      ? mineListings
      : tab === "liked"
        ? sortedLiked
        : tab === "saved"
          ? sortedSaved
          : wardrobeListings;

  return (
    <MobileShell>
      <div
        style={{
          backgroundColor: CREAM,
          color: INK,
          WebkitFontSmoothing: "antialiased",
          WebkitTapHighlightColor: "transparent",
        }}
        className="min-h-screen pb-[90px]"
      >
        {/* Header */}
        <header
          className="flex items-center justify-between"
          style={{ padding: "10px 16px 6px", backgroundColor: CREAM }}
        >
          <div
            className="flex items-center"
            style={{ backgroundColor: CARD, borderRadius: 24, padding: "6px 10px", gap: 4 }}
          >
            <button
              onClick={() => navigate({ to: "/notifications" })}
              className="profile-btn relative grid place-items-center"
              style={{ color: INK, background: "transparent", border: "none", padding: 0, width: 40, height: 40, borderRadius: 20 }}
              aria-label={t("home.notifications_aria")}
            >
              <Bell style={{ width: 20, height: 20 }} strokeWidth={1.8} />
              {hasUnreadNotifications && (
                <span
                  aria-hidden="true"
                  className="absolute rounded-full"
                  style={{ top: 6, right: 6, width: 10, height: 10, backgroundColor: "var(--brand-rose)" }}
                />
              )}
            </button>
            <button
              onClick={() => setSortOpen(true)}
              className="profile-btn grid place-items-center"
              style={{ color: INK, background: "transparent", border: "none", padding: 0, width: 40, height: 40, borderRadius: 20 }}
              aria-label={t("common.filter")}
            >
              <SlidersHorizontal style={{ width: 20, height: 20 }} strokeWidth={1.8} />
            </button>
          </div>
          <h1
            style={{
              fontSize: 14,
              fontWeight: 500,
              letterSpacing: "0.1px",
              color: INK,
            }}
          >
            {username}
          </h1>
          <div
            className="flex items-center"
            style={{ backgroundColor: CARD, borderRadius: 24, padding: "6px 10px", gap: 4 }}
          >
            <button
              onClick={handleShare}
              className="profile-btn grid place-items-center"
              style={{ color: INK, background: "transparent", border: "none", padding: 0, width: 40, height: 40, borderRadius: 20 }}
              aria-label={t("common.share")}
            >
              <IosShareIcon size={20} color={INK} strokeWidth={1.6} />
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              className="profile-btn grid place-items-center"
              style={{ color: INK, background: "transparent", border: "none", padding: 0, width: 40, height: 40, borderRadius: 20 }}
              aria-label={t("common.settings")}
            >
              <SettingsIcon style={{ width: 20, height: 20 }} strokeWidth={1.8} />
            </button>
          </div>
        </header>

        {/* Profile section */}
        <section>
          <div
            style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "8px 16px 12px" }}
          >
            {avatar ? (
              <img
                src={avatar}
                alt=""
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: `2px solid ${DIVIDER}`,
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                aria-hidden="true"
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  backgroundColor: DIVIDER,
                  border: `2px solid ${DIVIDER}`,
                  flexShrink: 0,
                }}
              />
            )}

            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-around" }}>
                <Stat
                  value={articleCount}
                  label={t("profile.stat_articles")}
                />
                <Stat
                  value={followers}
                  label={t("profile.stat_followers")}
                  onClick={() => navigate({ to: "/user/$id/followers", params: { id: user.id } })}
                />
                <Stat
                  value={following}
                  label={t("profile.stat_following")}
                  onClick={() => navigate({ to: "/user/$id/following", params: { id: user.id } })}
                />
              </div>
              <div style={{ display: "flex", gap: 7 }}>
                <button
                  onClick={() => setBenefitsOpen(true)}
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
                  <Gem style={{ width: 12, height: 12 }} strokeWidth={1.8} />
                  {t("profile.benefits")}
                </button>
                <button
                  onClick={() => setRatingsOpen(true)}
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
                  {(profile?.rating_count ?? 0) > 0 ? (
                    <>
                      <Star style={{ width: 12, height: 12 }} fill="currentColor" strokeWidth={0} />
                      {(profile?.rating_avg ?? 0).toFixed(1)}
                    </>
                  ) : (
                    t("profile.no_rating")
                  )}
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
            <div
              style={{
                marginTop: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 400, color: MUTED }}>
                {profile?.city || ""}
              </span>
              <button
                onClick={() => setHeightOpen(true)}
                className="profile-btn"
                style={{
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  fontSize: 12,
                  color: MUTED,
                  fontStyle: profile?.height_cm ? "normal" : "italic",
                }}
              >
                {profile?.height_cm ? (
                  <>
                    <Ruler style={{ width: 13, height: 13 }} strokeWidth={1.8} />
                    {profile.height_cm} cm
                  </>
                ) : (
                  t("profile.add_height")
                )}
              </button>
            </div>
            {profile?.bio && (
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
          <div
            role="tablist"
            aria-label={t("profile.sections_aria")}
            className="grid grid-cols-4"
            style={{ backgroundColor: CREAM }}
          >
            {tabs.map((tabItem) => {
              const Icon = tabItem.icon;
              const active = tab === tabItem.id;
              const tabLabels: Record<Tab, string> = {
                mine: t("profile.tab_mine"),
                liked: t("profile.tab_liked"),
                saved: t("profile.tab_saved"),
                wardrobe: t("profile.tab_wardrobe"),
              };
              return (
                <button
                  key={tabItem.id}
                  id={`profile-tab-${tabItem.id}`}
                  role="tab"
                  aria-selected={active}
                  aria-controls={`profile-panel-${tabItem.id}`}
                  tabIndex={active ? 0 : -1}
                  aria-label={tabLabels[tabItem.id]}
                  onClick={() => setTab(tabItem.id)}
                  className={`profile-btn relative flex items-center justify-center ${FOCUS_CLASS}`}
                  style={{ height: 52, background: "transparent", border: "none" }}
                >
                  <Icon
                    aria-hidden="true"
                    style={{
                      width: 26,
                      height: 26,
                      color: active ? INK : "var(--brand-border-strong)",
                    }}
                    strokeWidth={active ? 2 : 1.7}
                  />
                  {active && (
                    <span
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        bottom: 0,
                        width: 26,
                        height: 2,
                        backgroundColor: INK,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid */}
        <ProfileTabGrid
          tab={tab}
          listings={currentGrid}
          isMineLoading={listingsQuery.isPending && !listingsQuery.data}
          isLikedLoading={
            !collectionsLoaded || (likedQuery.isPending && !likedQuery.data)
          }
          isSavedLoading={
            !collectionsLoaded || (savedQuery.isPending && !savedQuery.data)
          }
        />


      </div>

      {/* Sort sheet */}
      <Sheet open={sortOpen} onOpenChange={setSortOpen}>
        <SheetContent
          side="bottom"
          hideClose
          className="border-0 p-0"
          style={{ backgroundColor: CARD }}
        >
          <div className="flex items-center gap-3 px-5 pt-4 pb-2">
            <button
              type="button"
              onClick={() => setSortOpen(false)}
              aria-label={t("common.back")}
              className="grid place-items-center rounded-full transition-transform duration-150 active:scale-[0.97]"
              style={{
                width: 44,
                height: 44,
                backgroundColor: GLASS_BG,
                border: `1px solid ${GLASS_BORDER}`,
                backdropFilter: "blur(8px)",
              }}
            >
              <ChevronLeft size={22} color="var(--brand-ink)" strokeWidth={2} />
            </button>
            <h2 className="text-[17px] font-bold" style={{ color: INK }}>
              {t("profile.sort_by")}
            </h2>
          </div>
          <div className="px-5 pb-8 pt-2">
            {(
              [
                { id: "new", label: t("profile.sort_newest") },
                { id: "low", label: t("profile.sort_low_high") },
                { id: "high", label: t("profile.sort_high_low") },
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

      {/* Benefits sheet — full-page slide-in from right */}
      <Sheet open={benefitsOpen} onOpenChange={setBenefitsOpen}>
        <SheetContent
          side="right"
          hideClose
          className="h-[100dvh] w-full !max-w-none p-0 border-0"
          style={{
            backgroundColor: CREAM,
            WebkitFontSmoothing: "antialiased",
            overscrollBehavior: "contain",
          }}
        >
          {/* Header — matches Vlerësimet */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px 12px",
              borderBottom: `1px solid ${DIVIDER}`,
              backgroundColor: CREAM,
            }}
          >
            <div
              style={{
                width: 72,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
              }}
            >
              <button
                type="button"
                onClick={() => setBenefitsOpen(false)}
                aria-label="Kthehu"
                className="grid place-items-center rounded-full transition-transform duration-150 active:scale-[0.97]"
                style={{
                  width: 44,
                  height: 44,
                  backgroundColor: GLASS_BG,
                  border: `1px solid ${GLASS_BORDER}`,
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                }}
              >
                <ChevronLeft size={22} color="var(--brand-ink)" strokeWidth={2} />
              </button>
            </div>
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: INK }}>{t("profile.benefits")}</div>
              <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{t("profile.benefits_subtitle")}</div>
            </div>
            <div style={{ width: 72 }} />
          </div>

          <div style={{ overflowY: "auto", height: "calc(100dvh - 60px)", paddingBottom: 40 }}>
            <p
              style={{
                fontSize: 13,
                color: MUTED,
                textAlign: "center",
                padding: "16px 24px 20px",
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              {t("profile.benefits_body")}
            </p>
            <TierCard
              emoji="🥉"
              title={t("profile.tier_starter")}
              range={t("profile.tier_starter_range")}
              body={t("profile.tier_starter_body")}
              active={tier === "starter"}
            />
            <TierCard
              emoji="🥈"
              title={t("profile.tier_trusted")}
              range={t("profile.tier_trusted_range")}
              body={t("profile.tier_trusted_body")}
              active={tier === "trusted"}
            />
            <TierCard
              emoji="🥇"
              title={t("profile.tier_top")}
              range={t("profile.tier_top_range")}
              body={t("profile.tier_top_body")}
              active={tier === "top"}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Reviews dialog */}
      <ReviewsSheet
        open={ratingsOpen}
        onOpenChange={setRatingsOpen}
        sellerId={user.id}
        currentUserId={user.id}
        sellerName={displayName}
        sellerUsername={username}
        sellerCreatedAt={profile?.created_at}
      />

      {/* Offers sheet */}
      <Sheet open={offersOpen} onOpenChange={setOffersOpen}>
        <SheetContent
          side="bottom"
          className="h-[85vh] overflow-y-auto"
          style={{ backgroundColor: CREAM }}
        >
          <SheetHeader>
            <SheetTitle>{t("profile.offers_title")}</SheetTitle>
          </SheetHeader>
          <div className="mt-4 flex gap-2">
            {(["received", "sent"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setOfferSub(s)}
                className="rounded-full px-3 py-1.5 text-xs"
                style={{
                  backgroundColor: offerSub === s ? INK : CARD,
                  color: offerSub === s ? "white" : INK,
                }}
              >
                {s === "received" ? t("profile.offers_received") : t("profile.offers_sent")}
              </button>
            ))}
          </div>
          <div className="mt-4">
            <OffersList
              offers={offerSub === "received" ? offersReceived : offersSent}
              titles={listingTitles}
              canRespond={offerSub === "received"}
              onRespond={respondOffer}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Settings sheet */}
      <SettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        profile={profile}
        email={user.email ?? ""}
        onSaved={loadAll}
        onSignOut={handleSignOut}
      />

      {/* Height picker sheet */}
      <HeightSheet
        open={heightOpen}
        onOpenChange={setHeightOpen}
        userId={user.id}
        current={profile?.height_cm ?? null}
        onSaved={loadAll}
      />
    </MobileShell>
  );
}

function HeightSheet({
  open,
  onOpenChange,
  userId,
  current,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userId: string;
  current: number | null;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const [value, setValue] = useState<number>(current ?? 175);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setValue(current ?? 175);
  }, [open, current]);

  const options = useMemo(() => Array.from({ length: 220 - 140 + 1 }, (_, i) => 140 + i), []);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ height_cm: value }).eq("id", userId);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    onOpenChange(false);
    onSaved();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl border-0 p-0"
        style={{ backgroundColor: CREAM }}
      >
        <SheetHeader className="px-5 pt-5">
          <SheetTitle style={{ color: INK }}>{t("profile.height_title")}</SheetTitle>
        </SheetHeader>
        <div
          className="mx-5 mt-4 overflow-y-auto rounded-2xl"
          style={{ height: 220, border: `1px solid ${DIVIDER}`, scrollSnapType: "y mandatory" }}
        >
          {options.map((h) => {
            const selected = h === value;
            return (
              <button
                key={h}
                onClick={() => setValue(h)}
                className="flex w-full items-center justify-center py-2 text-[17px]"
                style={{
                  color: selected ? INK : MUTED,
                  fontWeight: selected ? 700 : 400,
                  backgroundColor: selected ? CARD : "transparent",
                  scrollSnapAlign: "center",
                }}
              >
                {h} cm
              </button>
            );
          })}
        </div>
        <div className="px-5 pb-6 pt-4">
          <button
            onClick={save}
            disabled={saving}
            className="h-12 w-full rounded-full text-[15px] font-bold text-white disabled:opacity-60"
            style={{ backgroundColor: INK }}
          >
            {saving ? t("common.saving") : t("common.save")}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Stat({
  value,
  label,
  onClick,
}: {
  value: number | null;
  label: string;
  onClick?: () => void;
}) {
  const inner = (
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
        onClick={onClick}
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
        {inner}
      </button>
    );
  }
  return <div style={{ textAlign: "center", minWidth: "5ch" }}>{inner}</div>;
}

/**
 * Renders the listings grid for the active profile tab.
 * - Same geometry as the real grid (2 cols, gap:1.5, aspect-square).
 * - First-visit shows an aspect-matched skeleton grid from the first frame.
 * - Empty state is only shown once the tab's query has finished with no data.
 */
function ProfileTabGrid({
  tab,
  listings,
  isMineLoading,
  isLikedLoading,
  isSavedLoading,
}: {
  tab: Tab;
  listings: ListingView[];
  isMineLoading: boolean;
  isLikedLoading: boolean;
  isSavedLoading: boolean;
}) {
  const loading =
    tab === "mine"
      ? isMineLoading
      : tab === "liked"
        ? isLikedLoading
        : tab === "saved"
          ? isSavedLoading
          : isMineLoading; // wardrobe derives from mine listings
  return (
    <section
      id={`profile-panel-${tab}`}
      role="tabpanel"
      aria-labelledby={`profile-tab-${tab}`}
      aria-busy={loading}
      className="pt-0"
    >
      {loading && listings.length === 0 ? (
        <ProfileGridSkeleton />
      ) : listings.length === 0 ? (
        <TabEmptyState tab={tab} />
      ) : (
        <ListingsGrid listings={listings} manage={tab === "mine"} />
      )}
    </section>
  );
}

function ProfileGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2"
      style={{ gap: 1.5, backgroundColor: "#ffffff" }}
      role="status"
      aria-live="polite"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="aspect-square animate-pulse"
          style={{ backgroundColor: "var(--brand-cream, #f3ede4)" }}
        />
      ))}
      <span className="sr-only">Duke ngarkuar…</span>
    </div>
  );
}


function TierCard({
  emoji,
  title,
  range,
  body,
  active,
}: {
  emoji: string;
  title: string;
  range: string;
  body: string;
  active: boolean;
}) {
  return (
    <div
      style={{
        background: active ? INK : CARD,
        borderRadius: 16,
        padding: 18,
        margin: "0 16px 10px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 700, color: active ? CREAM : INK }}>
          {emoji} {title}
        </span>
        <span
          style={{
            fontSize: 12,
            color: active ? CREAM : MUTED,
            background: active ? DARK_GLASS_BG : CREAM,
            padding: "4px 10px",
            borderRadius: 10,
          }}
        >
          {range}
        </span>
      </div>
      <p
        style={{
          fontSize: 13,
          color: active ? DARK_GLASS_INK_SOFT : MUTED,
          lineHeight: 1.5,
          margin: 0,
        }}
      >
        {body}
      </p>
    </div>
  );
}

function ListingsGrid({ listings, manage }: { listings: ListingView[]; manage?: boolean }) {
  return (
    <div className="grid grid-cols-2" style={{ gap: 1.5, backgroundColor: "#ffffff" }}>
      {listings.map((l, i) => (
        <ListingGridTile key={l.id} listing={l} manage={manage} eager={i < 4} />
      ))}
    </div>
  );
}

function ListingGridTile({
  listing: l,
  manage,
  eager = false,
}: {
  listing: ListingView;
  manage?: boolean;
  eager?: boolean;
}) {
  const [broken, setBroken] = useState(false);
  const hasCover = !!l.coverUrl && !broken;
  const linkProps = manage
    ? ({ to: "/listing/$id/manage", params: { id: l.id } } as const)
    : ({ to: "/product/$id", params: { id: l.id } } as const);
  const isSold = l.status === "sold" || l.sold;
  return (
    <Link
      {...linkProps}
      className="relative block aspect-square overflow-hidden"
      style={{ backgroundColor: "var(--brand-cream, #f3ede4)", borderRadius: 0 }}
    >
      {hasCover ? (
        <img
          src={l.coverUrl}
          alt={l.title}
          className="h-full w-full"
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : "auto"}
          decoding="async"
          onError={() => setBroken(true)}
          style={{
            objectFit: "cover",
            objectPosition: "center top",
            ...(isSold ? { filter: "brightness(0.80) saturate(0.60)" } : {}),
          }}
        />
      ) : (
        <div
          role="img"
          aria-label={l.title}
          className="flex h-full w-full items-center justify-center"
          style={{ color: "var(--brand-ink-muted, #a89f94)" }}
        >
          <ImageOff aria-hidden="true" className="h-8 w-8" strokeWidth={1.4} />
        </div>
      )}
      <span
        className="pointer-events-none absolute italic"
        style={{
          top: 0,
          left: 0,
          padding: "6px 7px",
          fontFamily: "var(--font-voice), Georgia, serif",
          fontSize: 9,
          color: OVERLAY_GLYPH,
          opacity: 0.75,
          textShadow: "0 1px 2px rgba(0,0,0,0.35)",
        }}
      >
        Rroba
      </span>
      {isSold && <SoldRibbon />}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0"
        style={{
          padding: "10px 8px 8px",
          backgroundImage: "linear-gradient(to bottom, transparent 45%, rgba(0,0,0,0.58) 100%)",
        }}
      >
        <p
          className="truncate"
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: OVERLAY_GLYPH,
            letterSpacing: "0.1px",
            opacity: isSold ? 0.85 : 1,
          }}
        >
          {l.title}
        </p>
        <p
          className="truncate"
          style={{
            fontSize: 10,
            color: "rgba(255,255,255,0.82)",
            marginTop: 2,
          }}
        >
          {[l.brand, l.size, `€${l.price}`].filter(Boolean).join(" · ")}
        </p>
      </div>
    </Link>
  );
}

function SoldRibbon() {
  const { t } = useTranslation();
  return (
    <div
      className="pointer-events-none absolute"
      style={{
        top: 13,
        right: -23,
        width: 82,
        background: SOLD,
        color: OVERLAY_GLYPH,
        fontSize: 9,
        fontWeight: 700,
        textAlign: "center",
        padding: "4px 0",
        transform: "rotate(45deg)",
        zIndex: 3,
        letterSpacing: "0.8px",
        textTransform: "uppercase",
      }}
    >
      {t("profile.sold_ribbon")}
    </div>
  );
}

function TabEmptyState({ tab }: { tab: Tab }) {
  const { t } = useTranslation();
  const Icon =
    tab === "mine" ? Grid2x2 : tab === "liked" ? Heart : tab === "saved" ? Bookmark : Shirt;
  const subtitle =
    tab === "mine"
      ? t("profile.empty_mine")
      : tab === "liked"
        ? t("profile.empty_liked")
        : tab === "saved"
          ? t("profile.empty_saved")
          : t("profile.empty_wardrobe");
  return (
    <div className="flex flex-col items-center justify-center px-8 py-20 text-center">
      <Icon size={32} strokeWidth={1.5} style={{ color: MUTED }} />
      <p className="mt-4 text-[15px] font-bold" style={{ color: INK }}>
        {t("profile.no_items_yet")}
      </p>
      <p className="mt-1 text-[13px]" style={{ color: MUTED }}>
        {subtitle}
      </p>
    </div>
  );
}

function EmptyMsg({ text, actionLabel, to }: { text: string; actionLabel?: string; to?: string }) {
  return (
    <div className="mx-5 mt-8 rounded-2xl p-8 text-center" style={{ backgroundColor: CARD }}>
      <p className="text-sm" style={{ color: MUTED }}>
        {text}
      </p>
      {actionLabel && to && (
        <Link
          to={to}
          className="mt-4 inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold text-white"
          style={{ backgroundColor: INK }}
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

function OffersList({
  offers,
  titles,
  canRespond,
  onRespond,
}: {
  offers: OfferRow[];
  titles: Record<string, string>;
  canRespond: boolean;
  onRespond: (o: OfferRow, status: "accepted" | "declined") => void;
}) {
  const { t } = useTranslation();
  if (offers.length === 0)
    return (
      <p className="py-6 text-center text-sm" style={{ color: MUTED }}>
        {t("profile.no_offers")}
      </p>
    );
  return (
    <ul className="space-y-2">
      {offers.map((o) => (
        <li key={o.id} className="rounded-2xl p-3" style={{ backgroundColor: CARD }}>
          <div className="flex items-center justify-between">
            <Link to="/product/$id" params={{ id: o.listing_id }} className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold" style={{ color: INK }}>
                {titles[o.listing_id] ?? t("profile.offer_item_fallback")}
              </p>
              <p className="text-xs" style={{ color: MUTED }}>
                {new Date(o.created_at).toLocaleString()}
              </p>
            </Link>
            <p className="shrink-0 text-xl font-bold" style={{ color: INK }}>
              €{o.amount}
            </p>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{
                backgroundColor:
                  o.status === "accepted"
                    ? OFFER_ACCEPTED_BG
                    : o.status === "declined"
                      ? OFFER_DECLINED_BG
                      : DIVIDER,
                color: INK,
              }}
            >
              {o.status === "pending"
                ? t("profile.offer_pending")
                : o.status === "accepted"
                  ? t("profile.offer_accepted_status")
                  : t("profile.offer_declined_status")}
            </span>
            {canRespond && o.status === "pending" && (
              <div className="flex gap-2">
                <button
                  onClick={() => onRespond(o, "declined")}
                  className="grid h-11 w-11 place-items-center rounded-full"
                  style={{ backgroundColor: DIVIDER }}
                  aria-label={t("profile.offer_reject_aria")}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onRespond(o, "accepted")}
                  className="grid h-11 w-11 place-items-center rounded-full text-white"
                  style={{ backgroundColor: INK }}
                  aria-label={t("profile.offer_accept_aria")}
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

type SettingsView =
  | "main"
  | "profile"
  | "notifications"
  | "language"
  | "faq"
  | "support"
  | "privacy"
  | "terms";

function SettingsSheet({
  open,
  onOpenChange,
  profile,
  email,
  onSaved,
  onSignOut,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  profile: Profile | null;
  email: string;
  onSaved: () => void;
  onSignOut: () => void;
}) {
  const navigate = useNavigate();
  const [view, setView] = useState<SettingsView>("main");
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [profileDirty, setProfileDirty] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  useEffect(() => {
    if (open) {
      setView("main");
      setProfileDirty(false);
    }
  }, [open]);
  useEffect(() => {
    if (view !== "profile") setProfileDirty(false);
  }, [view]);

  const handleBack = () => {
    if (view === "profile" && profileDirty) {
      setConfirmDiscard(true);
      return;
    }
    if (view !== "main") setView("main");
    else onOpenChange(false);
  };

  const { t } = useTranslation();
  const titles: Record<SettingsView, string> = {
    main: t("settings.title"),
    profile: t("settings.edit_profile"),
    notifications: t("settings.notifications"),
    language: t("settings.language"),
    faq: t("settings.faq"),
    support: t("settings.contact_support"),
    privacy: t("settings.privacy"),
    terms: t("settings.terms"),
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        hideClose
        className="w-full !max-w-full h-full overflow-y-auto border-0 p-0 sm:!max-w-full"
        style={{ backgroundColor: CREAM, color: INK }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px 12px",
            backgroundColor: CREAM,
          }}
        >
          <button
            type="button"
            onClick={handleBack}
            aria-label={t("common.back")}
            className="grid place-items-center rounded-full transition-transform duration-150 active:scale-[0.97] focus:outline-none focus-visible:shadow-[0_0_0_3px_rgba(198,90,122,0.35)]"
            style={{
              width: 44,
              height: 44,
              backgroundColor: GLASS_BG,
              border: `1px solid ${GLASS_BORDER}`,
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              WebkitTapHighlightColor: "transparent",
              flexShrink: 0,
            }}
          >
            <ChevronLeft aria-hidden="true" size={22} color="var(--brand-ink)" strokeWidth={2} />
          </button>
          <SheetTitle
            className="italic"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 17,
              fontWeight: 500,
              color: INK,
              letterSpacing: "0.1px",
            }}
          >
            {titles[view]}
          </SheetTitle>
          <div style={{ width: 44 }} />
        </div>

        <div className="px-0 pb-6">
          {view === "main" && (
            <SettingsMain
              onNavigate={setView}
              onLogout={() => setConfirmLogout(true)}
              onDeleteAccount={() => navigate({ to: "/profile/delete-account" })}
              onOpenMembership={() => navigate({ to: "/membership" })}
            />
          )}
          {view === "profile" && (
            <div className="px-5 pt-2">
              <ProfileForm
                profile={profile}
                email={email}
                onSaved={onSaved}
                onDirtyChange={setProfileDirty}
                onCloseSettings={() => onOpenChange(false)}
              />

            </div>
          )}
          {view === "notifications" && <NotificationsView />}
          {view === "language" && <LanguageView />}
          {view === "faq" && <FaqView />}
          {view === "support" && <SupportView />}
          {view === "privacy" && <PrivacyView />}
          {view === "terms" && <TermsView />}
        </div>

        <LogoutConfirm
          open={confirmLogout}
          onOpenChange={setConfirmLogout}
          onConfirm={() => {
            setConfirmLogout(false);
            onSignOut();
          }}
        />

        <UnsavedChangesDialog
          open={confirmDiscard}
          onOpenChange={setConfirmDiscard}
          onDiscard={() => {
            setConfirmDiscard(false);
            setProfileDirty(false);
            setView("main");
          }}
        />
      </SheetContent>
    </Sheet>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="uppercase"
      style={{
        color: MUTED,
        backgroundColor: CREAM,
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: "0.8px",
        padding: "20px 20px 8px",
      }}
    >
      {children}
    </div>
  );
}

function Row({
  icon,
  title,
  subtitle,
  onClick,
  isLast,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  onClick?: () => void;
  isLast?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="settings-row"
      style={{ borderBottom: isLast ? "none" : `1px solid ${DIVIDER}` }}
    >
      <i className={`ti ${icon} settings-icon`} aria-hidden="true" />
      <div className="settings-text">
        <div className="settings-title">{title}</div>
        {subtitle && <div className="settings-subtitle">{subtitle}</div>}
      </div>
      <i className="ti ti-chevron-right settings-chevron" aria-hidden="true" />
    </button>
  );
}

function RowDivider() {
  return <div style={{ height: 1, backgroundColor: DIVIDER, marginLeft: 20, marginRight: 20 }} />;
}
function SectionDivider() {
  return <div style={{ height: 1, backgroundColor: DIVIDER }} />;
}

function SettingsMain({
  onNavigate,
  onLogout,
  onDeleteAccount,
  onOpenMembership,
}: {
  onNavigate: (v: SettingsView) => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
  onOpenMembership: () => void;
}) {
  const { t, language } = useTranslation();
  const [membershipTier, setMembershipTier] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      const user = await getCurrentUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("membership_tier")
        .eq("id", user.id)
        .maybeSingle();
      setMembershipTier((data as { membership_tier?: string | null } | null)?.membership_tier ?? null);
    })();
  }, []);
  const activePlan = getMembershipPlan(membershipTier);
  const membershipSubtitle = activePlan
    ? `${t(activePlan.labelKey)} · ${t("settings.membership_active_suffix")}`
    : t("settings.membership_view_plans");
  const languageSubtitle =
    language === "en" ? t("settings.language_en") : t("settings.language_sq");
  return (
    <div>
      <SectionHeader>{t("settings.section_account")}</SectionHeader>
      <div>
        <Row
          icon="ti-user"
          title={t("settings.edit_profile")}
          subtitle={t("settings.edit_profile_subtitle")}
          onClick={() => onNavigate("profile")}
        />
        <Row
          icon="ti-bell"
          title={t("settings.notifications")}
          subtitle={t("settings.notifications_subtitle")}
          onClick={() => onNavigate("notifications")}
        />
        <Row
          icon="ti-crown"
          title={t("settings.membership")}
          subtitle={membershipSubtitle}
          onClick={onOpenMembership}
          isLast
        />
      </div>

      <SectionHeader>{t("settings.section_preferences")}</SectionHeader>
      <div>
        <Row
          icon="ti-language"
          title={t("settings.language")}
          subtitle={languageSubtitle}
          onClick={() => onNavigate("language")}
          isLast
        />
      </div>

      <SectionHeader>{t("settings.section_help")}</SectionHeader>
      <div>
        <Row icon="ti-help-circle" title={t("settings.faq")} onClick={() => onNavigate("faq")} />
        <Row
          icon="ti-message"
          title={t("settings.contact_support")}
          onClick={() => onNavigate("support")}
          isLast
        />
      </div>

      <SectionHeader>{t("settings.section_other")}</SectionHeader>
      <div>
        <Row
          icon="ti-shield"
          title={t("settings.privacy")}
          subtitle={t("settings.privacy_subtitle")}
          onClick={() => onNavigate("privacy")}
        />
        <Row
          icon="ti-file-text"
          title={t("settings.terms")}
          onClick={() => onNavigate("terms")}
          isLast
        />
      </div>

      {/* Logout */}
      <button
        type="button"
        onClick={onLogout}
        className="settings-row"
        style={{
          borderTop: `1px solid ${DIVIDER}`,
          borderBottom: "none",
          justifyContent: "center",
          marginTop: 32,
          padding: "18px 20px",
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 500, color: SOLD }}>{t("settings.sign_out")}</span>
      </button>

      {/* Delete account */}
      <div style={{ height: 1, backgroundColor: DIVIDER, margin: "24px 20px 0" }} />
      <button
        type="button"
        onClick={onDeleteAccount}
        aria-label={t("settings.delete_account")}
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "16px 20px",
          minHeight: 44,
          width: "100%",
          background: "transparent",
          border: "none",
          textAlign: "left",
          cursor: "pointer",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <i
          className="ti ti-trash"
          aria-hidden="true"
          style={{ fontSize: 20, color: "var(--brand-danger)", width: 22 }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{ fontSize: 14, fontWeight: 600, color: "var(--brand-danger)", lineHeight: 1.3 }}
          >
            {t("settings.delete_account")}
          </div>
          <div style={{ fontSize: 12, color: MUTED, marginTop: 2, lineHeight: 1.3 }}>
            {t("settings.delete_account_subtitle")}
          </div>
        </div>
      </button>

      {/* Version */}
      <div
        style={{
          textAlign: "center",
          padding: "16px 0 24px",
          fontSize: 11,
          color: BORDER_STRONG,
          letterSpacing: "0.3px",
        }}
      >
        Rroba v1.0.0
      </div>
    </div>
  );
}

function LegalPage({ title, paragraphs }: { title: string; paragraphs: string[] }) {
  return (
    <div className="px-5 pt-2 pb-6">
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontStyle: "italic",
          fontSize: 22,
          color: INK,
          marginBottom: 12,
        }}
      >
        {title}
      </h2>
      <div className="space-y-3">
        {paragraphs.map((p, i) => (
          <p key={i} style={{ fontSize: 14, lineHeight: 1.55, color: INK }}>
            {p}
          </p>
        ))}
      </div>
    </div>
  );
}

function PrivacyView() {
  const { t } = useTranslation();
  return (
    <LegalPage
      title={t("profile.privacy_title")}
      paragraphs={[
        t("profile.privacy_p1"),
        t("profile.privacy_p2"),
        t("profile.privacy_p3"),
      ]}
    />
  );
}

function TermsView() {
  const { t } = useTranslation();
  return (
    <LegalPage
      title={t("profile.terms_title")}
      paragraphs={[
        t("profile.terms_p1"),
        t("profile.terms_p2"),
        t("profile.terms_p3"),
      ]}
    />
  );
}

function ProfileForm({
  profile,
  email,
  onSaved,
  onDirtyChange,
  onCloseSettings,
}: {
  profile: Profile | null;
  email: string;
  onSaved: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  onCloseSettings?: () => void;
}) {

  const { t } = useTranslation();
  const navigate = useNavigate();
  const [name, setName] = useState(profile?.name ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [city, setCity] = useState(profile?.city ?? "");
  const [cityId, setCityId] = useState<string | null>(profile?.city_id ?? null);
  const [height, setHeight] = useState<string>(profile?.height_cm?.toString() ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removePhotoOpen, setRemovePhotoOpen] = useState(false);
  const [removingPhoto, setRemovingPhoto] = useState(false);

  useEffect(() => {
    setName(profile?.name ?? "");
    setBio(profile?.bio ?? "");
    setCity(profile?.city ?? "");
    setCityId(profile?.city_id ?? null);
    setHeight(profile?.height_cm?.toString() ?? "");
    setAvatarUrl(profile?.avatar_url ?? "");
  }, [profile]);

  useEffect(() => {
    if (!onDirtyChange) return;
    const h = height.trim() === "" ? null : Math.max(0, Math.min(260, parseInt(height, 10) || 0));
    const dirty =
      (name ?? "") !== (profile?.name ?? "") ||
      (bio ?? "") !== (profile?.bio ?? "") ||
      (city ?? "") !== (profile?.city ?? "") ||
      (cityId ?? null) !== (profile?.city_id ?? null) ||
      h !== (profile?.height_cm ?? null) ||
      (avatarUrl || null) !== (profile?.avatar_url ?? null);
    onDirtyChange(dirty);
  }, [name, bio, city, cityId, height, avatarUrl, profile, onDirtyChange]);

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setUploading(true);
    try {
      const compressed = await compressImage(file, AVATAR_OPTIONS);
      const ext = compressed.type === "image/webp" ? "webp" : "jpg";
      const path = `${profile.id}/avatars/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("photos")
        .upload(path, compressed, { contentType: compressed.type, upsert: false });
      if (error) {
        toast.error(error.message);
        return;
      }
      const { data: signed } = await supabase.storage
        .from("photos")
        .createSignedUrl(path, 60 * 60 * 24 * 365);
      if (signed?.signedUrl) setAvatarUrl(signed.signedUrl);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("profile.upload_failed"));
    } finally {
      setUploading(false);
    }
  };

  const extractStoragePath = (url: string): string | null => {
    try {
      const u = new URL(url);
      const m = u.pathname.match(/\/storage\/v1\/object\/(?:sign|public)\/photos\/(.+)$/);
      return m ? decodeURIComponent(m[1]) : null;
    } catch {
      return null;
    }
  };

  const handleRemovePhoto = async () => {
    if (!profile) return;
    setRemovingPhoto(true);
    try {
      const path = extractStoragePath(avatarUrl);
      if (path) {
        const { error: removeError } = await supabase.storage.from("photos").remove([path]);
        if (removeError) console.error(t("profile.storage_delete_error"), removeError.message);
      }
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", profile.id);
      if (error) throw error;
      updateCurrentProfileCache(profile.id, { avatar_url: null });
      setAvatarUrl("");
      toast.success(t("profile.photo_removed"));
      onSaved();

    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.something_went_wrong"));
    } finally {
      setRemovingPhoto(false);
      setRemovePhotoOpen(false);
    }
  };

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    const h = height.trim() === "" ? null : Math.max(0, Math.min(260, parseInt(height, 10) || 0));
    const { error } = await supabase
      .from("profiles")
      .update({ name, bio, city, city_id: cityId, avatar_url: avatarUrl || null, height_cm: h })
      .eq("id", profile.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      updateCurrentProfileCache(profile.id, {
        name,
        bio,
        city,
        city_id: cityId,
        avatar_url: avatarUrl || null,
        height_cm: h,
      });
      toast.success(t("profile.profile_saved"));
      onSaved();
    }
  };


  const inputStyle = { backgroundColor: CARD, color: INK, borderColor: DIVIDER } as const;

  return (
    <div className="space-y-4 pb-6">
      <div className="flex flex-col items-center gap-3">
        <img
          src={
            avatarUrl ||
            `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name || "U")}`
          }
          alt=""
          className="h-16 w-16 rounded-full object-cover"
          style={{ boxShadow: `0 0 0 2px ${DIVIDER}` }}
        />
        <div className="flex items-center gap-2" style={{ width: 280 }}>
          <label
            className="cursor-pointer inline-flex flex-1 items-center justify-center px-4 py-2 text-xs font-medium"
            style={{
              backgroundColor: "#f4f4f2",
              color: "#1c1a16",
              border: "1px solid #e2e2de",
              borderRadius: 9999,
            }}
          >
            {uploading ? t("profile.uploading") : t("profile.change_photo")}
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
          </label>
          {avatarUrl && !avatarUrl.includes("dicebear.com") && (
            <button
              type="button"
              onClick={() => setRemovePhotoOpen(true)}
              className="inline-flex flex-1 items-center justify-center px-4 py-2 text-xs font-medium"
              style={{
                backgroundColor: "#fbeceb",
                color: "#b3392f",
                border: "1px solid #f3d4d1",
                borderRadius: 9999,
                cursor: "pointer",
              }}
            >
              {t("profile.remove_photo")}
            </button>
          )}
        </div>
      </div>
      <RemovePhotoDialog
        open={removePhotoOpen}
        onOpenChange={setRemovePhotoOpen}
        onConfirm={handleRemovePhoto}
        loading={removingPhoto}
      />
      <div>
        <div className="flex items-center justify-between">
          <Label style={{ color: INK }}>{t("profile.email_label")}</Label>
          <button
            type="button"
            onClick={() => {
              onCloseSettings?.();
              navigate({ to: "/profile/change-email" });
            }}
            className="text-xs font-semibold"
            style={{
              color: "#ffffff",
              background: "linear-gradient(120deg, #e8836a, #c65a7a)",
              border: "none",
              borderRadius: 9999,
              padding: "5px 12px",
              cursor: "pointer",
            }}
          >
            {t("profile.change_email")}
          </button>
        </div>
        <Input value={email} disabled style={inputStyle} />
      </div>
      <div>
        <Label style={{ color: INK }}>{t("profile.name_label")}</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          style={inputStyle}
        />
      </div>
      <div>
        <Label style={{ color: INK }}>{t("profile.bio_label")}</Label>
        <Textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={300}
          rows={3}
          style={inputStyle}
        />
      </div>
      <div>
        <Label style={{ color: INK }}>{t("profile.height_label")}</Label>
        <Input
          type="number"
          inputMode="numeric"
          min={0}
          max={260}
          value={height}
          onChange={(e) => setHeight(e.target.value)}
          placeholder={t("profile.height_placeholder")}
          style={inputStyle}
        />
      </div>
      <div>
        <Label style={{ color: INK }}>{t("profile.city_label")}</Label>
        <div
          className="mt-1 flex h-[52px] w-full items-center rounded-2xl px-4"
          style={{ background: CARD, border: `1px solid ${DIVIDER}` }}
        >
          <CityPicker
            value={cityId}
            onChange={(id, c) => {
              setCityId(id);
              setCity(c.name);
            }}
            className="!h-full w-full !bg-transparent px-0 border-0"
          />
        </div>
      </div>
      <button
        onClick={save}
        disabled={saving}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm disabled:opacity-50"
        style={{
          background: "linear-gradient(120deg, #e8836a, #c65a7a)",
          color: "#ffffff",
          fontWeight: 600,
          border: "none",
        }}
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        {t("common.save")}
      </button>
    </div>
  );
}

function ToggleRow({
  title,
  subtitle,
  value,
  onChange,
}: {
  title: string;
  subtitle?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      className="flex cursor-pointer items-center gap-3 px-5 py-4"
      style={{ backgroundColor: CREAM, minHeight: 44 }}
    >
      <div className="flex-1">
        <div className="text-[15px] font-semibold" style={{ color: INK }}>
          {title}
        </div>
        {subtitle && (
          <div className="mt-0.5 text-[13px]" style={{ color: MUTED }}>
            {subtitle}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        role="switch"
        aria-checked={value}
        aria-label={title}
        className="relative grid shrink-0 place-items-center bg-transparent p-0 focus-visible:outline-none"
        style={{ height: 44, width: 46 }}
      >
        <span
          aria-hidden="true"
          className="relative block rounded-full transition-colors duration-200 ease-out"
          style={{
            height: 26,
            width: 46,
            backgroundColor: value ? INK : DIVIDER,
          }}
        >
          <span
            aria-hidden="true"
            className="absolute left-0 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full transition-transform duration-200 ease-out"
            style={{
              transform: `translateX(${value ? 24 : 2}px)`,
              backgroundColor: CREAM,
              boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
            }}
          />
        </span>
      </button>

    </label>
  );
}

function NotificationsView() {
  const { t } = useTranslation();
  const [offers, setOffers] = useState(true);
  const [messages, setMessages] = useState(true);
  return (
    <div>
      <SectionHeader>{t("profile.notif_types")}</SectionHeader>
      <ToggleRow title={t("profile.notif_new_offers")} value={offers} onChange={setOffers} />
      <RowDivider />
      <ToggleRow title={t("profile.notif_messages_title")} value={messages} onChange={setMessages} />
    </div>
  );
}



function useFaqs() {
  const { t } = useTranslation();
  return [
    { q: t("profile.faq_q1"), a: t("profile.faq_a1") },
    { q: t("profile.faq_q2"), a: t("profile.faq_a2") },
    { q: t("profile.faq_q3"), a: t("profile.faq_a3") },
    { q: t("profile.faq_q4"), a: t("profile.faq_a4") },
    { q: t("profile.faq_q5"), a: t("profile.faq_a5") },
    { q: t("profile.faq_q6"), a: t("profile.faq_a6") },
    { q: t("profile.faq_q7"), a: t("profile.faq_a7") },
    { q: t("profile.faq_q8"), a: t("profile.faq_a8") },
    { q: t("profile.faq_q9"), a: t("profile.faq_a9") },
    { q: t("profile.faq_q10"), a: t("profile.faq_a10") },
  ];
}

function FaqItem({
  q,
  a,
  open,
  onToggle,
}: {
  q: string;
  a: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      style={{
        backgroundColor: open ? "var(--brand-surface)" : CREAM,
        borderRadius: open ? "0 0 10px 10px" : 0,
        transition: "background-color 160ms ease",
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ padding: "16px 20px", minHeight: 44, WebkitTapHighlightColor: "transparent" }}
      >
        <div className="flex-1 text-[14px] font-bold" style={{ color: INK }}>
          {q}
        </div>
        <ChevronRight
          aria-hidden="true"
          className="h-4 w-4 shrink-0"
          strokeWidth={2}
          style={{
            color: BORDER_STRONG,
            transform: open ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 200ms ease",
          }}
        />
      </button>
      <div
        style={{
          maxHeight: open ? 400 : 0,
          overflow: "hidden",
          transition: "max-height 200ms ease",
        }}
      >
        <div style={{ padding: "0 20px 16px", fontSize: 13, color: MUTED, lineHeight: 1.6 }}>
          {a}
        </div>
      </div>
    </div>
  );
}

function LanguageView() {
  const { t, language, setLanguage } = useTranslation();
  const options: Array<{ key: Language; label: string; hint: string }> = [
    { key: "sq", label: t("settings.language_sq"), hint: "Shqip" },
    { key: "en", label: t("settings.language_en"), hint: "English" },
  ];
  return (
    <div className="pt-2">
      {options.map((opt, i) => {
        const active = language === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => setLanguage(opt.key)}
            className="settings-row"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              padding: "16px 20px",
              background: "transparent",
              border: "none",
              borderTop: i === 0 ? `1px solid ${DIVIDER}` : "none",
              borderBottom: `1px solid ${DIVIDER}`,
              textAlign: "left",
              cursor: "pointer",
              WebkitTapHighlightColor: "transparent",
              minHeight: 56,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 15, fontWeight: 500, color: INK, lineHeight: 1.3 }}>
                {opt.label}
              </span>
              <span style={{ fontSize: 12, color: MUTED, lineHeight: 1.3 }}>{opt.hint}</span>
            </div>
            {active && <Check size={20} color={INK} strokeWidth={2.25} />}
          </button>
        );
      })}
    </div>
  );
}

function FaqView() {
  const FAQS = useFaqs();
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  return (
    <div className="pt-2">
      {FAQS.map((f, i) => (
        <div key={f.q}>
          <FaqItem
            q={f.q}
            a={f.a}
            open={openIdx === i}
            onToggle={() => setOpenIdx((cur) => (cur === i ? null : i))}
          />
          {i < FAQS.length - 1 && <div style={{ height: 1, backgroundColor: DIVIDER }} />}
        </div>
      ))}
    </div>
  );
}

function SupportView() {
  const { t } = useTranslation();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const inputBase = "w-full rounded-xl px-4 py-3 text-[15px] outline-none placeholder:font-normal";
  const inputStyle = { backgroundColor: CARD, color: INK } as const;
  const placeholderStyle = { ["--tw-placeholder-color" as never]: MUTED };

  const send = async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error(t("profile.support_fill_all"));
      return;
    }
    setSending(true);
    await new Promise((r) => setTimeout(r, 600));
    setSending(false);
    setSubject("");
    setBody("");
    toast.success(t("profile.support_sent"));
  };

  return (
    <div className="space-y-3 px-5 pt-4">
      <input
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder={t("profile.support_subject")}
        className={inputBase}
        style={{ ...inputStyle, ...placeholderStyle }}
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={t("profile.support_body_ph")}
        rows={6}
        className={inputBase + " resize-none"}
        style={{ ...inputStyle, ...placeholderStyle }}
      />
      <style>{`textarea::placeholder, input::placeholder { color: ${MUTED}; }`}</style>
      <button
        onClick={send}
        disabled={sending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full py-3 text-[15px] font-semibold disabled:opacity-50"
        style={{ backgroundColor: INK, color: "#ffffff" }}
      >
        {sending && <Loader2 className="h-4 w-4 animate-spin" />}
        {t("common.send")}
      </button>
    </div>
  );
}

function LogoutConfirm({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!open) setBusy(false);
  }, [open]);
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-title"
      aria-describedby="logout-desc"
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
          background: INK,
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          disabled={busy}
          aria-label="Kthehu"
          className="transition-transform duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            width: 44,
            height: 44,
            background: DARK_GLASS_BG,
            border: "none",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: busy ? "default" : "pointer",
            flexShrink: 0,
          }}
        >
          <ChevronLeft aria-hidden="true" size={22} color="#ffffff" strokeWidth={2} />
        </button>
        <span
          id="logout-title"
          style={{ fontSize: 16, fontWeight: 600, color: "#ffffff" }}
        >
          {t("profile.logout_confirm_title")}
        </span>
      </div>
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          padding: "24px 20px",
          color: INK,
        }}
      >
        <div id="logout-desc" style={{ fontSize: 13, color: MUTED, marginBottom: 20 }}>
          {t("profile.logout_confirm_body")}
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              if (busy) return;
              setBusy(true);
              onConfirm();
            }}
            disabled={busy}
            aria-busy={busy}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              backgroundColor: INK,
              color: "#ffffff",
              height: 50,
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              width: "100%",
              opacity: busy ? 0.7 : 1,
              cursor: busy ? "default" : "pointer",
              border: "none",
            }}
          >
            {busy ? t("profile.logging_out") : t("common.yes_sure")}
          </button>
          <button
            type="button"
            autoFocus
            onClick={() => onOpenChange(false)}
            disabled={busy}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              backgroundColor: CARD,
              color: INK,
              border: `1px solid ${DIVIDER}`,
              height: 50,
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              width: "100%",
              cursor: busy ? "default" : "pointer",
            }}
          >
            {t("common.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}

function RemovePhotoDialog({
  open,
  onOpenChange,
  onConfirm,
  loading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  const { t } = useTranslation();
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="remove-photo-title"
      aria-describedby="remove-photo-desc"
      className="fixed inset-0 z-[100] flex items-center justify-center px-6"
      style={{
        backgroundColor: "rgba(20,18,15,0.55)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
      onClick={() => {
        if (!loading) onOpenChange(false);
      }}
    >
      <div
        className="w-full"
        style={{
          maxWidth: 280,
          backgroundColor: CARD,
          borderRadius: 22,
          boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
          padding: "24px 20px 20px",
          textAlign: "center",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="mx-auto grid h-[52px] w-[52px] place-items-center rounded-full"
          style={{ backgroundColor: "var(--brand-danger-soft)" }}
        >
          <Trash2
            aria-hidden="true"
            style={{ width: 22, height: 22, color: "var(--brand-danger)" }}
            strokeWidth={2}
          />
        </div>
        <div
          id="remove-photo-title"
          style={{ fontSize: 16, fontWeight: 600, color: INK, marginTop: 16 }}
        >
          {t("profile.remove_photo_title")}
        </div>
        <div
          id="remove-photo-desc"
          style={{ fontSize: 13, color: MUTED, lineHeight: 1.5, marginTop: 6 }}
        >
          {t("profile.remove_photo_body")}
        </div>
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            aria-busy={loading}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              backgroundColor: "var(--brand-danger)",
              color: "#ffffff",
              height: 48,
              borderRadius: 999,
              fontSize: 14,
              fontWeight: 600,
              width: "100%",
              border: "none",
              cursor: loading ? "default" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? t("profile.removing") : t("profile.remove_photo")}
          </button>
          <button
            type="button"
            autoFocus
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              backgroundColor: CREAM,
              color: INK,
              height: 48,
              borderRadius: 999,
              fontSize: 14,
              fontWeight: 600,
              width: "100%",
              border: "none",
              cursor: loading ? "default" : "pointer",
            }}
          >
            Anulo
          </button>
        </div>
      </div>
    </div>
  );
}

function UnsavedChangesDialog({
  open,
  onOpenChange,
  onDiscard,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDiscard: () => void;
}) {
  const { t } = useTranslation();
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="unsaved-title"
      aria-describedby="unsaved-desc"
      className="fixed inset-0 z-[100] flex items-center justify-center px-6"
      style={{
        backgroundColor: "rgba(20,18,15,0.55)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-full"
        style={{
          maxWidth: 280,
          backgroundColor: CARD,
          borderRadius: 22,
          boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
          padding: "24px 20px 20px",
          textAlign: "center",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div id="unsaved-title" style={{ fontSize: 16, fontWeight: 600, color: INK }}>
          {t("profile.unsaved_title")}
        </div>
        <div
          id="unsaved-desc"
          style={{ fontSize: 13, color: MUTED, lineHeight: 1.5, marginTop: 8 }}
        >
          {t("profile.unsaved_body")}
        </div>
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={onDiscard}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              backgroundColor: "var(--brand-danger-soft)",
              color: "var(--brand-danger)",
              height: 48,
              borderRadius: 999,
              fontSize: 14,
              fontWeight: 600,
              width: "100%",
              border: `1px solid ${DIVIDER}`,
              cursor: "pointer",
            }}
          >
            {t("profile.leave_without_saving")}
          </button>
          <button
            type="button"
            autoFocus
            onClick={() => onOpenChange(false)}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              backgroundColor: CREAM,
              color: INK,
              height: 48,
              borderRadius: 999,
              fontSize: 14,
              fontWeight: 600,
              width: "100%",
              border: "none",
              cursor: "pointer",
            }}
          >
            {t("profile.continue_editing")}
          </button>
        </div>
      </div>
    </div>
  );
}
