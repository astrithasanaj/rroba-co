import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Bell, Loader2, Shirt, Mountain, Archive, Baby, Frame, Speaker, Scissors } from "lucide-react";
import { MobileShell } from "@/components/marketplace/MobileShell";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { LikeButton } from "@/components/marketplace/LikeButton";
import { supabase } from "@/integrations/supabase/client";
import { hydrateListings, type ListingRow, type ListingView } from "@/lib/listings";

export const Route = createFileRoute("/")({
  component: HomePage,
});

const PAGE_BG = "#f6f1e7";
const CARD_BG = "#ede8de";
const INK = "#1a1a1a";
const MUTED = "#a89f94";

const CATEGORIES = [
  { key: "mode", label: "Modë & aksesorë", Icon: Shirt },
  { key: "outdoor", label: "Outdoor & sport", Icon: Mountain },
  { key: "interior", label: "Interiør & mobilje", Icon: Archive },
  { key: "femije", label: "Fëmijë & bebe", Icon: Baby },
  { key: "art", label: "Art & dizajn", Icon: Frame },
  { key: "elektronik", label: "Elektronikë & zë", Icon: Speaker },
  { key: "hobi", label: "Hobi", Icon: Scissors },
] as const;

function HomePage() {
  const [listings, setListings] = useState<ListingView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("listings")
        .select("*")
        .eq("sold", false)
        .order("created_at", { ascending: false })
        .limit(60);
      const hydrated = await hydrateListings((data ?? []) as ListingRow[]);
      if (active) {
        setListings(hydrated);
        setLoading(false);
      }
    };
    load();
    const ch = supabase
      .channel("home-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "listings" }, () => load())
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(ch);
    };
  }, []);

  const trending = useMemo(() => listings.slice(0, 5), [listings]);
  const newThisWeek = useMemo(() => listings.slice(0, 10), [listings]);
  const featured = trending[0];
  const trendingRest = trending.slice(1, 5);

  return (
    <MobileShell>
      <div style={{ backgroundColor: PAGE_BG, minHeight: "100%" }}>
        <header
          className="sticky top-0 z-30 flex items-center justify-between px-[18px] py-4 backdrop-blur"
          style={{ backgroundColor: `${PAGE_BG}f2` }}
        >
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
          <Link
            to="/notifications"
            className="grid h-10 w-10 place-items-center rounded-full"
            aria-label="Njoftime"
          >
            <Bell className="h-5 w-5" strokeWidth={1.7} style={{ color: INK }} />
          </Link>
        </header>

        {/* Categories */}
        <section className="mt-2">
          <h2 className="px-[18px] text-[16px] font-bold" style={{ color: INK }}>
            Kategoritë
          </h2>
          <div className="category-scroll mt-3 pb-1">
            {CATEGORIES.map(({ key, label, Icon }) => {
              const hasGender = key === "mode" || key === "femije";
              const linkProps = hasGender
                ? ({ to: "/category/$slug/gender", params: { slug: key } } as const)
                : ({ to: "/category/$slug/$gender", params: { slug: key, gender: "all" } } as const);
              return (
                <Link
                  key={key}
                  {...linkProps}
                  className="flex flex-col items-center"
                  style={{ flex: "0 0 84px", scrollSnapAlign: "start" }}
                >
                  <div
                    className="grid place-items-center"
                    style={{
                      width: 84,
                      height: 84,
                      borderRadius: 14,
                      backgroundColor: CARD_BG,
                    }}
                  >
                    <Icon size={26} strokeWidth={1.6} style={{ color: INK }} />
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
          <div className="grid place-items-center py-16" style={{ color: MUTED }}>
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : listings.length === 0 ? (
          <div
            className="mx-5 mt-8 rounded-2xl border border-dashed p-8 text-center text-sm"
            style={{ borderColor: "#ddd8ce", color: MUTED }}
          >
            Ende nuk ka artikuj. Bëhu i pari që publikon!
          </div>
        ) : (
          <>
            {/* Trending masonry */}
            <section className="mt-7 px-5">
              <SectionHeader title="Trending tani" />
              {featured && (
                <div className="mt-3 grid grid-cols-2 gap-2.5" style={{ gridAutoRows: "minmax(0,1fr)" }}>
                  <Link
                    to="/product/$id"
                    params={{ id: featured.id }}
                    className="relative col-span-1 row-span-2 overflow-hidden"
                    style={{ borderRadius: 14, aspectRatio: "1 / 2.06" }}
                  >
                    {featured.coverUrl && (
                      <img
                        src={featured.coverUrl}
                        alt={featured.title}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    )}
                    <div
                      className="absolute inset-x-0 bottom-0 p-3"
                      style={{
                        background:
                          "linear-gradient(to top, rgba(0,0,0,0.6), rgba(0,0,0,0))",
                      }}
                    >
                      <p className="line-clamp-1 text-sm font-semibold text-white">
                        {featured.title}
                      </p>
                      <p className="text-sm font-bold text-white">€{featured.price}</p>
                    </div>
                    <LikeButton listingId={featured.id} className="absolute right-2 top-2 h-8 w-8 shadow-sm" />
                  </Link>
                  <div className="flex flex-col gap-2.5">
                    {trendingRest.slice(0, 2).map((l) => (
                      <SmallTile key={l.id} listing={l} />
                    ))}
                  </div>
                  {trendingRest.slice(2, 4).map((l) => (
                    <SmallTile key={l.id} listing={l} />
                  ))}
                </div>
              )}
            </section>

            {/* New this week — horizontal scroll */}
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
      </div>
    </MobileShell>
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

function SmallTile({ listing }: { listing: ListingView }) {
  return (
    <Link
      to="/product/$id"
      params={{ id: listing.id }}
      className="relative block overflow-hidden"
      style={{ borderRadius: 14, aspectRatio: "1 / 1", backgroundColor: CARD_BG }}
    >
      {listing.coverUrl && (
        <img
          src={listing.coverUrl}
          alt={listing.title}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <LikeButton listingId={listing.id} className="absolute right-2 top-2 h-7 w-7 shadow-sm" />
    </Link>
  );
}
