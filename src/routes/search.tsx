import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search as SearchIcon, X, ArrowLeft, SlidersHorizontal, Loader2 } from "lucide-react";
import { MobileShell } from "@/components/marketplace/MobileShell";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, CITIES, CONDITIONS, GENDERS, hydrateListings, type ListingRow, type ListingView } from "@/lib/listings";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Search = {
  q?: string;
  section?: "new" | "trending";
};

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: typeof s.q === "string" ? s.q : undefined,
    section: s.section === "new" || s.section === "trending" ? s.section : undefined,
  }),
  component: SearchPage,
});

type Filters = {
  category?: string;
  size?: string;
  condition?: string;
  city?: string;
  gender?: string;
  priceMin?: string;
  priceMax?: string;
};

function SearchPage() {
  const navigate = useNavigate();
  const { q: initialQ, section } = Route.useSearch();
  const [q, setQ] = useState(initialQ ?? "");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({});
  const [results, setResults] = useState<ListingView[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setQ(initialQ ?? "");
  }, [initialQ]);

  const activeCount = useMemo(
    () => Object.values(filters).filter((v) => v && v.length > 0).length,
    [filters],
  );

  useEffect(() => {
    let active = true;
    const search = async () => {
      setLoading(true);
      let query = supabase.from("listings").select("*").eq("sold", false);
      if (q.trim()) {
        const term = `%${q.trim()}%`;
        query = query.or(`title.ilike.${term},description.ilike.${term},brand.ilike.${term}`);
      }
      if (filters.category) query = query.eq("category", filters.category);
      if (filters.size) query = query.ilike("size", filters.size);
      if (filters.condition) query = query.eq("condition", filters.condition);
      if (filters.city) query = query.eq("city", filters.city);
      if (filters.gender) query = query.eq("gender", filters.gender);
      if (filters.priceMin) query = query.gte("price", Number(filters.priceMin));
      if (filters.priceMax) query = query.lte("price", Number(filters.priceMax));
      query = query.order("created_at", { ascending: section !== "trending" });
      const { data } = await query.limit(60);
      const hydrated = await hydrateListings((data ?? []) as ListingRow[]);
      if (active) {
        setResults(hydrated);
        setLoading(false);
      }
    };
    const t = setTimeout(search, 250);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [q, filters, section]);

  return (
    <MobileShell>
      <header className="sticky top-0 z-30 bg-background/95 px-5 pb-3 pt-4 backdrop-blur">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate({ to: "/" })}
            className="grid h-10 w-10 place-items-center rounded-full hover:bg-secondary"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex flex-1 items-center gap-2 rounded-full bg-secondary px-4 py-2.5">
            <SearchIcon className="h-4 w-4 text-muted-foreground" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Kërko për artikuj, marka..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {q && (
              <button onClick={() => setQ("")} aria-label="Pastro">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(true)}
            className="relative grid h-10 w-10 place-items-center rounded-full bg-secondary"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {activeCount > 0 && (
              <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-foreground text-[9px] font-bold text-background">
                {activeCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <div className="px-5 py-3">
        <p className="mb-3 text-xs text-muted-foreground">
          {loading ? "Po kërkon..." : `${results.length} rezultate`}
        </p>
        {loading ? (
          <div className="grid place-items-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : results.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Asgjë nuk u gjet. Provo me fjalë tjera ose hiq disa filtra.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {results.map((r) => (
              <ListingCard key={r.id} listing={r} />
            ))}
          </div>
        )}
      </div>

      <Sheet open={showFilters} onOpenChange={setShowFilters}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Filtra</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <FilterSelect label="Kategoria" value={filters.category} onChange={(v) => setFilters((p) => ({ ...p, category: v }))} options={CATEGORIES.map((c) => c.value)} />
            <FilterSelect label="Gjendja" value={filters.condition} onChange={(v) => setFilters((p) => ({ ...p, condition: v }))} options={[...CONDITIONS]} />
            <FilterSelect label="Qyteti" value={filters.city} onChange={(v) => setFilters((p) => ({ ...p, city: v }))} options={[...CITIES]} />
            <FilterSelect label="Gjinia" value={filters.gender} onChange={(v) => setFilters((p) => ({ ...p, gender: v }))} options={[...GENDERS]} />
            <div>
              <Label>Madhësia</Label>
              <Input
                value={filters.size ?? ""}
                onChange={(e) => setFilters((p) => ({ ...p, size: e.target.value }))}
                placeholder="P.sh. M"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Çmimi min (€)</Label>
                <Input
                  type="number"
                  value={filters.priceMin ?? ""}
                  onChange={(e) => setFilters((p) => ({ ...p, priceMin: e.target.value }))}
                />
              </div>
              <div>
                <Label>Çmimi maks (€)</Label>
                <Input
                  type="number"
                  value={filters.priceMax ?? ""}
                  onChange={(e) => setFilters((p) => ({ ...p, priceMax: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setFilters({})}
                className="flex-1 rounded-full border border-border py-3 text-sm font-medium"
              >
                Pastro
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="flex-1 rounded-full bg-foreground py-3 text-sm font-semibold text-background"
              >
                Apliko
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </MobileShell>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1 flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(value === o ? "" : o)}
            className={`rounded-full px-3 py-1.5 text-xs ${
              value === o ? "bg-foreground text-background" : "bg-secondary text-foreground/80"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
