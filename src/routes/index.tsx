import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Bell, ArrowRight, Loader2 } from "lucide-react";
import { MobileShell } from "@/components/marketplace/MobileShell";
import { GenderToggle } from "@/components/marketplace/GenderToggle";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { supabase } from "@/integrations/supabase/client";
import { hydrateListings, type ListingRow, type ListingView } from "@/lib/listings";

export const Route = createFileRoute("/")({
  component: HomePage,
});

type Gender = "Të gjitha" | "Femra" | "Meshkuj" | "Fëmijë";

function HomePage() {
  const [gender, setGender] = useState<Gender>("Të gjitha");
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

  const filtered = useMemo(() => {
    if (gender === "Të gjitha") return listings;
    return listings.filter((l) => l.gender === gender);
  }, [listings, gender]);

  const newThisWeek = useMemo(() => filtered.slice(0, 6), [filtered]);
  const trending = useMemo(() => filtered.slice(0, 6).reverse(), [filtered]);

  return (
    <MobileShell>
      <header className="sticky top-0 z-30 flex items-center justify-between bg-background/95 px-5 py-4 backdrop-blur">
        <h1 className="font-display text-3xl tracking-tight">Rroba</h1>
        <Link
          to="/notifications"
          className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-secondary"
        >
          <Bell className="h-5 w-5" strokeWidth={1.7} />
        </Link>
      </header>

      <div className="px-5">
        <GenderToggle value={gender} onChange={setGender} />
      </div>

      <section className="mx-5 mt-5 overflow-hidden rounded-3xl bg-accent/40">
        <div className="grid grid-cols-[1.1fr_1fr] items-stretch">
          <div className="flex flex-col justify-between p-5">
            <span className="w-fit rounded-full bg-background/70 px-2.5 py-1 text-[10px] font-medium tracking-wide">
              Edicioni i javës
            </span>
            <div>
              <h2 className="font-display text-3xl leading-[1.05]">
                Gjej stilin tënd për më pak.
              </h2>
              <Link
                to="/search"
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-foreground px-3.5 py-2 text-xs font-semibold text-background"
              >
                Shfleto <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
          <img
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80"
            alt="Modë"
            className="h-full w-full object-cover"
          />
        </div>
      </section>

      {loading ? (
        <div className="grid place-items-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mx-5 mt-8 rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Ende nuk ka artikuj. Bëhu i pari që publikon!
        </div>
      ) : (
        <>
          <Section title="E re këtë javë" subtitle="Sapo të publikuar" sectionKey="new">
            <Grid listings={newThisWeek} />
          </Section>
          <Section title="Trending tani" subtitle="Çfarë po duan të gjithë" sectionKey="trending">
            <Grid listings={trending} />
          </Section>
          <Section title={gender === "Të gjitha" ? "Të gjitha" : gender}>
            <Grid listings={filtered} />
          </Section>
        </>
      )}
    </MobileShell>
  );
}

function Section({
  title,
  subtitle,
  sectionKey,
  children,
}: {
  title: string;
  subtitle?: string;
  sectionKey?: "new" | "trending";
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8 px-5">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h3 className="font-display text-2xl">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <Link
          to="/search"
          search={sectionKey ? { section: sectionKey } : undefined}
          className="text-xs font-medium text-muted-foreground"
        >
          Shiko të gjitha
        </Link>
      </div>
      {children}
    </section>
  );
}

function Grid({ listings }: { listings: ListingView[] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {listings.map((l) => (
        <ListingCard key={l.id} listing={l} />
      ))}
    </div>
  );
}
