import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { Bell, UserPlus, Shirt } from "lucide-react";
import { MobileShell } from "@/components/marketplace/MobileShell";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { ListingCardSkeleton, ProductGridSkeleton } from "@/components/marketplace/Skeletons";

import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser } from "@/hooks/useCurrentUser";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { HOME_CATEGORIES } from "@/lib/categories";
import { hydrateListings, type ListingRow, type ListingView } from "@/lib/listings";
import { isGenderSpecificCategory, GENDER_SPECIFIC_CATEGORIES } from "@/lib/category-taxonomy";
import { useTranslation } from "@/i18n";

export const Route = createFileRoute("/")({
  component: HomePage,
});

const PAGE_BG = "#ffffff";
const INK = "#2d1521";
const MUTED = "#a89f94";

type Tab = "for-you" | "following";

// ---------- Data helpers (pure fetchers, reused by useQuery) ----------

type Prefs = {
  uid: string | null;
  allowedGenders: string[];
  genderFilter: string;
};

function passesPersonalization(
  r: Pick<ListingRow, "category" | "gender">,
  allowedGenders: string[],
) {
  if (r.gender == null) return true;
  if (!isGenderSpecificCategory(r.category)) return true;
  return allowedGenders.includes(r.gender);
}

async function fetchPrefs(uid: string | null): Promise<Prefs> {
  let myGenders: string[] = [];
  if (uid) {
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("preferences")
      .eq("id", uid)
      .maybeSingle();
    const prefs = profileRow?.preferences as { genders?: string[] } | null;
    myGenders = prefs?.genders ?? [];
  }
  const wantsWomen =
    myGenders.includes("women") || myGenders.includes("both") || myGenders.length === 0;
  const wantsMen =
    myGenders.includes("men") || myGenders.includes("both") || myGenders.length === 0;

  const allowedGenders: string[] = [];
  if (wantsWomen) allowedGenders.push("Femra");
  if (wantsMen) allowedGenders.push("Meshkuj");

  const neutralCategoriesList = `"${[
    "Interier & mobilie",
    "Outdoor & sport",
    "Art & dizajn",
    "Elektronikë & zë",
    "Hobi",
  ].join('","')}"`;
  const genderSpecificList = `"${GENDER_SPECIFIC_CATEGORIES.join('","')}"`;
  const allowedGendersList = allowedGenders.map((g) => `"${g}"`).join(",");
  const genderFilter = [
    "gender.is.null",
    `category.not.in.(${genderSpecificList})`,
    `category.in.(${neutralCategoriesList})`,
    allowedGenders.length > 0 ? `gender.in.(${allowedGendersList})` : null,
  ]
    .filter(Boolean)
    .join(",");

  return { uid, allowedGenders, genderFilter };
}

async function fetchNewThisWeek(genderFilter: string): Promise<ListingView[]> {
  const weekAgoIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: rows } = await supabase
    .from("listings")
    .select("*")
    .eq("status", "active")
    .neq("category", "Fëmijë & bebe")
    .or(genderFilter)
    .gte("created_at", weekAgoIso)
    .order("created_at", { ascending: false })
    .limit(10);
  const list = (rows ?? []) as ListingRow[];
  if (list.length === 0) return [];
  return hydrateListings(list, { thumbnail: true, mode: "cover" });
}

type PromotedRegular = {
  promoted: ListingView[];
  regular: ListingView[];
  regularRows: ListingRow[];
};

async function fetchPromotedRegular(): Promise<PromotedRegular> {
  const nowIso = new Date().toISOString();
  const { data: promos } = await supabase
    .from("promotions")
    .select("listing_id, listings(*)")
    .eq("type", "feed_top")
    .eq("status", "active")
    .eq("payment_confirmed", true)
    .gt("ends_at", nowIso);

  const promotedRows = ((promos ?? []) as Array<{ listings: ListingRow | null }>)
    .map((p) => p.listings)
    .filter((r): r is ListingRow => !!r && r.status === "active");
  const promotedIds = promotedRows.map((r) => r.id);

  let query = supabase
    .from("listings")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(60);
  if (promotedIds.length > 0) {
    query = query.not("id", "in", `(${promotedIds.join(",")})`);
  }
  const { data: regular } = await query;
  const regularRows = (regular ?? []) as ListingRow[];

  const [hydratedPromoted, hydratedRegular] = await Promise.all([
    hydrateListings(promotedRows, { thumbnail: true, mode: "cover" }),
    hydrateListings(regularRows, { thumbnail: true, mode: "cover" }),
  ]);
  const promotedWithFlag = hydratedPromoted.map((l) => ({ ...l, is_promoted: true }));
  return {
    promoted: promotedWithFlag.slice(0, 10),
    regular: hydratedRegular,
    regularRows,
  };
}

async function fetchTrending(
  prefs: Prefs,
  regularRows: ListingRow[],
): Promise<ListingView[]> {
  const weekAgoIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: likeRows } = await supabase
    .from("listing_likes")
    .select("listing_id")
    .gte("created_at", weekAgoIso);

  const likeCounts = new Map<string, number>();
  for (const r of (likeRows ?? []) as Array<{ listing_id: string }>) {
    likeCounts.set(r.listing_id, (likeCounts.get(r.listing_id) ?? 0) + 1);
  }
  const rankedIds = Array.from(likeCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id);

  let trendingRows: ListingRow[] = [];
  if (rankedIds.length > 0) {
    const { data: trendingActive } = await supabase
      .from("listings")
      .select("*")
      .eq("status", "active")
      .neq("category", "Fëmijë & bebe")
      .or(prefs.genderFilter)
      .in("id", rankedIds);
    const byId = new Map<string, ListingRow>();
    for (const row of (trendingActive ?? []) as ListingRow[]) byId.set(row.id, row);
    trendingRows = rankedIds
      .map((id) => byId.get(id))
      .filter((r): r is ListingRow => !!r)
      .slice(0, 5);
  }

  if (trendingRows.length < 5) {
    const have = new Set(trendingRows.map((r) => r.id));
    const fillers = regularRows.filter(
      (r) =>
        !have.has(r.id) &&
        r.category !== "Fëmijë & bebe" &&
        passesPersonalization(r, prefs.allowedGenders),
    );
    trendingRows = [...trendingRows, ...fillers].slice(0, 5);
  }

  if (trendingRows.length === 0) return [];
  return hydrateListings(trendingRows, { thumbnail: true, mode: "cover" });
}

type FollowingData = { ids: string[]; listings: ListingView[] };

async function fetchFollowing(uid: string | null): Promise<FollowingData> {
  if (!uid) return { ids: [], listings: [] };
  const { data: follows } = await supabase
    .from("followers")
    .select("following_id")
    .eq("follower_id", uid);
  const ids = (follows ?? []).map((f) => f.following_id);
  if (ids.length === 0) return { ids: [], listings: [] };
  const { data: rows } = await supabase
    .from("listings")
    .select("*")
    .eq("status", "active")
    .in("user_id", ids)
    .order("created_at", { ascending: false })
    .limit(60);
  const listings = await hydrateListings((rows ?? []) as ListingRow[], {
    thumbnail: true,
    mode: "cover",
  });
  return { ids, listings };
}

// ---------- Component ----------

function HomePage() {
  const queryClient = useQueryClient();
  const hasUnreadNotifications = useUnreadNotifications();
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>("for-you");

  const handleTabChange = (next: Tab) => {
    if (next === tab) return;
    setTab(next);
    const scroller =
      typeof document !== "undefined" ? document.querySelector<HTMLElement>(".page-wrapper") : null;
    if (scroller && scroller.scrollTop > 0) {
      scroller.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Auth — cached so remount doesn't refetch on every navigation.
  const authQuery = useQuery({
    queryKey: ["home-auth"] as const,
    queryFn: async () => (await getCurrentUser())?.id ?? null,
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });
  const uid = authQuery.data ?? null;
  const uidKey = uid ?? "anonymous";

  // Preferences — keyed per user so cross-user contamination is impossible.
  const prefsQuery = useQuery({
    queryKey: ["home-prefs", uidKey] as const,
    queryFn: () => fetchPrefs(uid),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
    enabled: authQuery.isSuccess,
  });
  const prefs = prefsQuery.data;

  // Promoted + regular grid.
  const promotedRegularQuery = useQuery({
    queryKey: ["home-promoted-regular", uidKey] as const,
    queryFn: fetchPromotedRegular,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

  // New this week — depends on prefs.
  const newWeekQuery = useQuery({
    queryKey: ["home-new-week", uidKey] as const,
    queryFn: () => fetchNewThisWeek(prefs!.genderFilter),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
    enabled: !!prefs,
  });

  // Trending — depends on prefs and needs regularRows as filler.
  // Uses ensureQueryData so a refetch waits for a fresh promoted/regular pull.
  const trendingQuery = useQuery({
    queryKey: ["home-trending", uidKey] as const,
    queryFn: async () => {
      const pr = await queryClient.ensureQueryData({
        queryKey: ["home-promoted-regular", uidKey] as const,
        queryFn: fetchPromotedRegular,
        staleTime: 30_000,
      });
      return fetchTrending(prefs!, pr.regularRows);
    },
    staleTime: 30_000,
    placeholderData: (prev) => prev,
    enabled: !!prefs,
  });

  // Following feed.
  const followingQuery = useQuery({
    queryKey: ["home-following", uidKey] as const,
    queryFn: () => fetchFollowing(uid),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
    enabled: authQuery.isSuccess,
  });

  // Realtime — invalidate keys instead of resetting state so cached data stays
  // rendered while the background refetch runs.
  useEffect(() => {
    const invalidateFeed = () => {
      queryClient.invalidateQueries({ queryKey: ["home-promoted-regular", uidKey] });
      queryClient.invalidateQueries({ queryKey: ["home-new-week", uidKey] });
      queryClient.invalidateQueries({ queryKey: ["home-trending", uidKey] });
    };
    const ch = supabase
      .channel("home-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "listings" },
        invalidateFeed,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "promotions" },
        invalidateFeed,
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [queryClient, uidKey]);

  useEffect(() => {
    const invalidateFollowing = () => {
      queryClient.invalidateQueries({ queryKey: ["home-following", uidKey] });
    };
    const ch = supabase
      .channel("home-following")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "followers" },
        invalidateFollowing,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "listings" },
        invalidateFollowing,
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [queryClient, uidKey]);

  // Skeletons appear only when a query has never had data.
  const regularData = promotedRegularQuery.data;
  const newWeekData = newWeekQuery.data;
  const trendingData = trendingQuery.data;
  const followingData = followingQuery.data;

  return (
    <MobileShell>
      <div style={{ backgroundColor: PAGE_BG, minHeight: "100%" }}>
        <header
          className="sticky top-0 z-30 backdrop-blur"
          style={{ backgroundColor: `${PAGE_BG}f2` }}
        >
          <div className="flex items-center justify-between px-[18px] py-4">
            <div className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="grid place-items-center"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "#2d1521",
                }}
              >
                <Shirt size={18} strokeWidth={1.8} style={{ color: "#e8836a" }} />
              </span>
              <h1
                className="text-3xl italic"
                style={{
                  color: INK,
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                }}
              >
                Rroba
              </h1>
            </div>
            <Link
              to="/notifications"
              className="relative grid h-12 w-12 place-items-center rounded-full"
              aria-label={t("home.notifications_aria")}
            >
              <Bell className="h-6 w-6" strokeWidth={1.7} style={{ color: INK }} />
              {hasUnreadNotifications && (
                <span
                  aria-hidden="true"
                  className="absolute h-2.5 w-2.5 rounded-full"
                  style={{ top: 10, right: 10, backgroundColor: "var(--brand-rose)" }}
                />
              )}
            </Link>
          </div>
          <div className="px-[18px] pb-3">
            <div
              className="flex p-1 rounded-full"
              style={{ backgroundColor: "#ffffff" }}
              role="tablist"
            >
              <TabButton active={tab === "for-you"} onClick={() => handleTabChange("for-you")}>
                {t("home.tab_for_you")}
              </TabButton>
              <TabButton active={tab === "following"} onClick={() => handleTabChange("following")}>
                {t("home.tab_following")}
              </TabButton>
            </div>
          </div>
        </header>

        <div key={tab} className="animate-fade-in" style={{ animationDuration: "150ms" }}>
          {tab === "for-you" ? (
            <ForYou
              regularLoading={regularData === undefined}
              trendingLoading={trendingData === undefined}
              newWeekLoading={newWeekData === undefined}
              listings={regularData?.regular ?? []}
              promoted={regularData?.promoted ?? []}
              trending={trendingData ?? []}
              newThisWeek={newWeekData ?? []}
            />
          ) : (
            <FollowingFeed
              loading={followingData === undefined}
              hasFollowing={(followingData?.ids.length ?? 0) > 0}
              listings={followingData?.listings ?? []}
            />
          )}
        </div>

      </div>
    </MobileShell>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className="flex-1 py-2 text-sm font-semibold rounded-full transition-colors"
      style={{
        background: active ? "linear-gradient(120deg, #e8836a, #c65a7a)" : "transparent",
        color: active ? "#ffffff" : MUTED,
        flexBasis: 0,
        minWidth: 0,
      }}
    >
      {children}
    </button>
  );
}

function ForYou({
  regularLoading,
  trendingLoading,
  newWeekLoading,
  listings,
  promoted,
  trending,
  newThisWeek,
}: {
  regularLoading: boolean;
  trendingLoading: boolean;
  newWeekLoading: boolean;
  listings: ListingView[];
  promoted: ListingView[];
  trending: ListingView[];
  newThisWeek: ListingView[];
}) {
  const { t } = useTranslation();
  const noContentAtAll =
    !regularLoading &&
    !trendingLoading &&
    !newWeekLoading &&
    listings.length === 0 &&
    promoted.length === 0 &&
    trending.length === 0 &&
    newThisWeek.length === 0;

  return (
    <>
      {/* Categories */}
      <section className="mt-2">
        <h2 className="px-[18px] text-[16px] font-bold" style={{ color: INK }}>
          {t("home.categories")}
        </h2>
        <div className="category-scroll mt-3 pb-1">
          {HOME_CATEGORIES.map(({ key, label, Icon, boxColor, iconColor }) => {
            const k: string = key;
            const hasGender = k === "mode" || k === "femije";
            const hasSubcategory =
              k === "outdoor" ||
              k === "interior" ||
              k === "art" ||
              k === "elektronik" ||
              k === "hobi";
            const linkProps = hasGender
              ? ({ to: "/category/$slug/choose-gender", params: { slug: key } } as const)
              : hasSubcategory
                ? ({ to: "/category/$slug/subcategory", params: { slug: key } } as const)
                : ({
                    to: "/category/$slug/$gender",
                    params: { slug: key, gender: "all" },
                  } as const);
            return (
              <Link
                key={key}
                {...linkProps}
                className="flex flex-col items-center"
                style={{ flex: "0 0 84px", scrollSnapAlign: "start" }}
              >
                <div
                  className="tap-icon grid place-items-center"
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: "#2d1521",
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                    border: "0.5px solid rgba(255,255,255,0.09)",
                  }}
                >
                  <Icon size={24} strokeWidth={1.5} style={{ color: "#e8836a" }} />
                </div>
                <span
                  className="mt-1.5 text-center font-bold leading-tight line-clamp-2"
                  style={{ color: INK, fontSize: 11, width: 84 }}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {noContentAtAll ? (
        <div
          className="mx-5 mt-8 rounded-2xl border border-dashed p-8 text-center text-sm"
          style={{ borderColor: "#e2e2de", color: MUTED }}
        >
          {t("home.empty_no_items")}
        </div>
      ) : (
        <>
          {promoted.length > 0 && (
            <section className="mt-7">
              <div className="px-5">
                <SectionHeader title={t("home.section_featured")} />
              </div>
              <div
                className="mt-3 flex gap-3 overflow-x-auto px-5 pb-2 [&::-webkit-scrollbar]:hidden"
                style={{ scrollbarWidth: "none" }}
              >
                {promoted.map((l, i) => (
                  <div key={l.id} style={{ width: 168, flexShrink: 0 }}>
                    <ListingCard listing={l} eager={i < 2} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {(trendingLoading || trending.length > 0) && (
            <section className="mt-8 px-5">
              <SectionHeader title={t("home.section_trending")} seeAllSearch={{ section: "trending" }} />
              <div className="mt-3 grid grid-cols-2 gap-2">
                {trendingLoading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <ListingCardSkeleton key={i} aspect="3/4" />
                    ))
                  : trending.map((l, i) => (
                      <ListingCard key={l.id} listing={l} eager={i < 4} />
                    ))}
              </div>
            </section>
          )}

          {(newWeekLoading || newThisWeek.length > 0) && (
            <section className="mt-8 px-5">
              <SectionHeader title={t("home.section_new_week")} seeAllSearch={{ section: "new" }} />
              <div
                className="mt-3 flex gap-3 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden"
                style={{ scrollbarWidth: "none" }}
              >
                {newWeekLoading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} style={{ width: 168, flexShrink: 0 }}>
                        <ListingCardSkeleton aspect="3/4" />
                      </div>
                    ))
                  : newThisWeek.map((l, i) => (
                      <div key={l.id} style={{ width: 168, flexShrink: 0 }}>
                        <ListingCard listing={l} eager={i < 2} />
                      </div>
                    ))}
              </div>
            </section>
          )}

          {regularLoading && listings.length === 0 && (
            <section className="mt-7 px-[18px]">
              <ProductGridSkeleton count={6} />
            </section>
          )}

          <div className="h-24" />
        </>
      )}
    </>
  );
}


function FollowingFeed({
  loading,
  hasFollowing,
  listings,
}: {
  loading: boolean;
  hasFollowing: boolean;
  listings: ListingView[];
}) {
  const { t } = useTranslation();
  if (loading) {
    return (
      <section className="mt-6 px-[18px]">
        <ProductGridSkeleton count={6} />
      </section>
    );
  }

  if (!hasFollowing) {
    return (
      <div className="mt-10 flex flex-col items-center px-8 text-center">
        <div
          className="mb-4 grid h-16 w-16 place-items-center rounded-full"
          style={{ backgroundColor: "#ffffff" }}
        >
          <UserPlus className="h-7 w-7" strokeWidth={1.6} style={{ color: INK }} />
        </div>
        <h3 className="text-lg font-bold" style={{ color: INK }}>
          {t("home.following_empty_title")}
        </h3>
        <p className="mt-2 max-w-xs text-sm" style={{ color: MUTED }}>
          {t("home.following_empty_body")}
        </p>
        <Link
          to="/search"
          className="mt-6 rounded-full px-6 py-3 text-sm font-semibold"
          style={{ backgroundColor: INK, color: "#ffffff" }}
        >
          {t("home.following_empty_cta")}
        </Link>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div
        className="mx-5 mt-8 rounded-2xl border border-dashed p-8 text-center text-sm"
        style={{ borderColor: "#e2e2de", color: MUTED }}
      >
        {t("home.following_no_listings")}
      </div>
    );
  }

  return (
    <section className="mt-4 px-[18px]">
      <div className="grid grid-cols-2 gap-2">
        {listings.map((l, i) => (
          <ListingCard key={l.id} listing={l} eager={i < 4} />
        ))}
      </div>
      <div className="h-24" />
    </section>
  );
}



function SectionHeader({
  title,
  seeAllSearch,
}: {
  title: string;
  seeAllSearch?: { section?: "new" | "trending" };
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-[16px] font-bold" style={{ color: INK }}>
        {title}
      </h3>
      <Link
        to="/search"
        search={seeAllSearch ?? {}}
        className="text-xs font-medium"
        style={{ color: MUTED }}
      >
        {t("common.seeAll")}
      </Link>
    </div>
  );
}
