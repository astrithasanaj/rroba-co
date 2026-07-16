import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Bell, UserPlus, Shirt } from "lucide-react";
import { MobileShell } from "@/components/marketplace/MobileShell";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { ProductGridSkeleton } from "@/components/marketplace/Skeletons";

import { supabase } from "@/integrations/supabase/client";
import { HOME_CATEGORIES } from "@/lib/categories";
import { hydrateListings, type ListingRow, type ListingView } from "@/lib/listings";

export const Route = createFileRoute("/")({
  component: HomePage,
});

const PAGE_BG = "#ffffff";
const INK = "#1a1a1a";
const MUTED = "#a89f94";

type Tab = "for-you" | "following";

function HomePage() {
  const [tab, setTab] = useState<Tab>("for-you");

  const handleTabChange = (next: Tab) => {
    if (next === tab) return;
    setTab(next);
    const scroller = typeof document !== "undefined" ? document.querySelector<HTMLElement>(".page-wrapper") : null;
    if (scroller && scroller.scrollTop > 0) {
      scroller.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  const [listings, setListings] = useState<ListingView[]>([]);
  const [promoted, setPromoted] = useState<ListingView[]>([]);
  const [followingListings, setFollowingListings] = useState<ListingView[]>([]);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingLoading, setFollowingLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);

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

      const hydratedPromoted = await hydrateListings(promotedRows);
      const hydratedRegular = await hydrateListings((regular ?? []) as ListingRow[]);
      const promotedWithFlag = hydratedPromoted.map((l) => ({ ...l, is_promoted: true }));

      if (active) {
        setPromoted(promotedWithFlag.slice(0, 10));
        setListings(hydratedRegular);
        setLoading(false);
      }
    };
    load();
    const ch = supabase
      .channel("home-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "listings" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "promotions" }, () => load())
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(ch);
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadFollowing = async () => {
      setFollowingLoading(true);
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData.user?.id;
      if (!uid) {
        if (active) {
          setFollowingIds([]);
          setFollowingListings([]);
          setFollowingLoading(false);
        }
        return;
      }
      const { data: follows } = await supabase
        .from("followers")
        .select("following_id")
        .eq("follower_id", uid);
      const ids = (follows ?? []).map((f) => f.following_id);
      if (ids.length === 0) {
        if (active) {
          setFollowingIds([]);
          setFollowingListings([]);
          setFollowingLoading(false);
        }
        return;
      }
      const { data: rows } = await supabase
        .from("listings")
        .select("*")
        .eq("status", "active")
        .in("user_id", ids)
        .order("created_at", { ascending: false })
        .limit(60);
      const hydrated = await hydrateListings((rows ?? []) as ListingRow[]);
      if (active) {
        setFollowingIds(ids);
        setFollowingListings(hydrated);
        setFollowingLoading(false);
      }
    };
    loadFollowing();
    const ch = supabase
      .channel("home-following")
      .on("postgres_changes", { event: "*", schema: "public", table: "followers" }, () => loadFollowing())
      .on("postgres_changes", { event: "*", schema: "public", table: "listings" }, () => loadFollowing())
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(ch);
    };
  }, []);

  const trending = useMemo(() => listings.slice(0, 5), [listings]);
  const newThisWeek = useMemo(() => listings.slice(0, 10), [listings]);
  const followingPreview = useMemo(() => followingListings.slice(0, 5), [followingListings]);

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
              className="grid h-10 w-10 place-items-center rounded-full"
              aria-label="Njoftime"
            >
              <Bell className="h-5 w-5" strokeWidth={1.7} style={{ color: INK }} />
            </Link>
          </div>
          <div className="px-[18px] pb-3">
            <div
              className="flex p-1 rounded-full"
              style={{ backgroundColor: "#ffffff" }}
              role="tablist"
            >
              <TabButton active={tab === "for-you"} onClick={() => handleTabChange("for-you")}>
                Për ty
              </TabButton>
              <TabButton active={tab === "following"} onClick={() => handleTabChange("following")}>
                Duke ndjekur
              </TabButton>
            </div>
          </div>
        </header>

        <div key={tab} className="animate-fade-in" style={{ animationDuration: "150ms" }}>
          {tab === "for-you" ? (
            <ForYou
              loading={loading}
              listings={listings}
              promoted={promoted}
              trending={trending}
              newThisWeek={newThisWeek}
              followingPreview={followingPreview}
            />
          ) : (
            <FollowingFeed
              loading={followingLoading}
              hasFollowing={followingIds.length > 0}
              listings={followingListings}
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
        backgroundColor: active ? INK : "transparent",
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
  loading,
  listings,
  promoted,
  trending,
  newThisWeek,
  followingPreview,
}: {
  loading: boolean;
  listings: ListingView[];
  promoted: ListingView[];
  trending: ListingView[];
  newThisWeek: ListingView[];
  followingPreview: ListingView[];
}) {
  return (
    <>
      {/* Categories */}
      <section className="mt-2">
        <h2 className="px-[18px] text-[16px] font-bold" style={{ color: INK }}>
          Kategoritë
        </h2>
        <div className="category-scroll mt-3 pb-1">
          {HOME_CATEGORIES.map(({ key, label, Icon, boxColor, iconColor }) => {
            const hasGender = key === "mode" || key === "femije";
            const hasSubcategory = key === "outdoor" || key === "interior" || key === "art";
            const linkProps = hasGender
              ? ({ to: "/category/$slug/choose-gender", params: { slug: key } } as const)
              : hasSubcategory
              ? ({ to: "/category/$slug/subcategory", params: { slug: key } } as const)
              : ({ to: "/category/$slug/$gender", params: { slug: key, gender: "all" } } as const);
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
                    background: "rgba(10,9,7,0.94)",
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                    border: "0.5px solid rgba(255,255,255,0.09)",
                  }}
                >
                  <Icon size={24} strokeWidth={1.5} style={{ color: "#f2ede3" }} />
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

      {loading ? (
        <section className="mt-7 px-[18px]">
          <ProductGridSkeleton count={6} />
        </section>
      ) : listings.length === 0 ? (
        <div
          className="mx-5 mt-8 rounded-2xl border border-dashed p-8 text-center text-sm"
          style={{ borderColor: "#ddd8ce", color: MUTED }}
        >
          Ende nuk ka artikuj. Bëhu i pari që publikon!
        </div>
      ) : (
        <>
          {followingPreview.length > 0 && (
            <section className="mt-7">
              <div className="px-5">
                <SectionHeader title="Nga profilet që ndjek" />
              </div>
              <div
                className="mt-3 flex gap-3 overflow-x-auto px-5 pb-2 [&::-webkit-scrollbar]:hidden"
                style={{ scrollbarWidth: "none" }}
              >
                {followingPreview.map((l) => (
                  <div key={l.id} style={{ width: 168, flexShrink: 0 }}>
                    <ListingCard listing={l} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {promoted.length > 0 && (
            <section className="mt-7">
              <div className="px-5">
                <SectionHeader title="Të zgjedhura" />
              </div>
              <div
                className="mt-3 flex gap-3 overflow-x-auto px-5 pb-2 [&::-webkit-scrollbar]:hidden"
                style={{ scrollbarWidth: "none" }}
              >
                {promoted.map((l) => (
                  <div key={l.id} style={{ width: 168, flexShrink: 0 }}>
                    <ListingCard listing={l} />
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="mt-7 px-[18px]">
            <SectionHeader title="Trending tani" />
            <div className="mt-3 grid grid-cols-2 gap-2">
              {trending.map((l, i) => (
                <ListingCard key={l.id} listing={l} eager={i < 4} />
              ))}
            </div>
          </section>

          <section className="mt-8">
            <div className="px-5">
              <SectionHeader title="E re këtë javë" />
            </div>
            <div
              className="mt-3 flex gap-3 overflow-x-auto px-5 pb-2 [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: "none" }}
            >
              {newThisWeek.map((l) => (
                <div key={l.id} style={{ width: 168, flexShrink: 0 }}>
                  <ListingCard listing={l} />
                </div>
              ))}
            </div>
          </section>

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
          Nuk ndjek ende askënd
        </h3>
        <p className="mt-2 max-w-xs text-sm" style={{ color: MUTED }}>
          Eksploro dhe fillo të ndjekësh shitës që të pëlqejnë.
        </p>
        <Link
          to="/search"
          className="mt-6 rounded-full px-6 py-3 text-sm font-semibold"
          style={{ backgroundColor: INK, color: "#ffffff" }}
        >
          Eksploro
        </Link>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div
        className="mx-5 mt-8 rounded-2xl border border-dashed p-8 text-center text-sm"
        style={{ borderColor: "#ddd8ce", color: MUTED }}
      >
        Ende asnjë artikull nga profilet që ndjek.
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

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-[16px] font-bold" style={{ color: INK }}>
        {title}
      </h3>
      <Link to="/search" className="text-xs font-medium" style={{ color: MUTED }}>
        Shiko të gjitha
      </Link>
    </div>
  );
}
