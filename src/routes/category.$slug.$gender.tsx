import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, Loader2, SlidersHorizontal, PackageSearch } from "lucide-react";
import { MobileShell } from "@/components/marketplace/MobileShell";
import { LikeButton } from "@/components/marketplace/LikeButton";
import { supabase } from "@/integrations/supabase/client";
import { getCategory } from "@/lib/categories";
import { hydrateListings, type ListingRow, type ListingView, CITIES, CONDITIONS } from "@/lib/listings";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const BG = "#f6f1e7";
const CARD = "#ede8de";
const INK = "#1a1a1a";
const MUTED = "#a89f94";

type SearchParams = { subcategories?: string };

export const Route = createFileRoute("/category/$slug/$gender")({
  component: CategoryResultsPage,
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    subcategories: typeof search.subcategories === "string" ? search.subcategories : undefined,
  }),
});

type Filters = {
  size?: string;
  condition?: string;
  city?: string;
  brand?: string;
  priceMin?: string;
  priceMax?: string;
};

function CategoryResultsPage() {
  const { slug, gender } = useParams({ from: "/category/$slug/$gender" });
  const search = Route.useSearch();
  const subcategoryList = useMemo(
    () => (search.subcategories ? search.subcategories.split(",").filter(Boolean) : []),
    [search.subcategories],
  );
  const navigate = useNavigate();
  const def = getCategory(slug);
  const [results, setResults] = useState<ListingView[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({});

  const genderOption = useMemo(
    () => def?.genderOptions?.find((g) => g.slug === gender),
    [def, gender],
  );

  const title = useMemo(() => {
    if (!def) return "";
    return genderOption ? `${def.label} · ${genderOption.label}` : def.label;
  }, [def, genderOption]);

  useEffect(() => {
    if (!def) return;
    let active = true;
    const run = async () => {
      setLoading(true);
      let query = supabase.from("listings").select("*").eq("sold", false);
      if (def.categories.length === 1) {
        query = query.eq("category", def.categories[0]);
      } else {
        query = query.in("category", def.categories);
      }
      if (genderOption) {
        query = query.eq("gender", genderOption.dbValue);
      }
      if (filters.size) query = query.ilike("size", filters.size);
      if (filters.condition) query = query.eq("condition", filters.condition);
      if (filters.city) query = query.eq("city", filters.city);
      if (filters.brand) query = query.ilike("brand", `%${filters.brand}%`);
      if (filters.priceMin) query = query.gte("price", Number(filters.priceMin));
      if (filters.priceMax) query = query.lte("price", Number(filters.priceMax));
      if (subcategoryList.length > 0) {
        const orExpr = subcategoryList
          .map((s: string) => `title.ilike.%${s.replace(/[,()]/g, "")}%`)
          .join(",");
        query = query.or(orExpr);
      }
      query = query.order("created_at", { ascending: false });
      const { data } = await query.limit(120);
      const hydrated = await hydrateListings((data ?? []) as ListingRow[]);
      if (active) {
        setResults(hydrated);
        setLoading(false);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [def, genderOption, filters]);

  if (!def) {
    return (
      <MobileShell>
        <div style={{ backgroundColor: BG, minHeight: "100vh", color: INK }} className="p-10 text-center">
          Kategoria nuk u gjet
        </div>
      </MobileShell>
    );
  }

  const backTo = def.hasGender
    ? () => navigate({ to: "/category/$slug/choose-gender", params: { slug } })
    : () => navigate({ to: "/" });

  const activeCount = Object.values(filters).filter((v) => v && v.length > 0).length;

  return (
    <MobileShell>
      <div style={{ backgroundColor: BG, minHeight: "100vh" }} className="pb-32">
        <header className="relative flex items-center justify-center px-5 pt-6 pb-3">
          <button
            type="button"
            onClick={backTo}
            className="absolute left-5 top-6 grid h-10 w-10 place-items-center rounded-full"
            style={{ backgroundColor: CARD }}
            aria-label="Kthehu"
          >
            <ChevronLeft className="h-5 w-5" style={{ color: INK }} />
          </button>
          <h1 className="px-12 text-center text-[15px] font-bold leading-tight" style={{ color: INK }}>
            {title}
          </h1>
        </header>

        <div className="px-5">
          <p className="text-xs" style={{ color: MUTED }}>
            {loading ? "Po ngarkohet..." : `${results.length} artikuj`}
          </p>
        </div>

        <section className="mt-4 px-5">
          {loading ? (
            <div className="grid place-items-center py-16">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: MUTED }} />
            </div>
          ) : results.length === 0 ? (
            <div
              className="flex flex-col items-center gap-3 rounded-2xl p-10 text-center text-sm"
              style={{ backgroundColor: CARD, color: MUTED }}
            >
              <PackageSearch className="h-10 w-10" strokeWidth={1.4} />
              Asnjë artikull u gjet për këtë kategori
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {results.map((r) => (
                <ResultCard key={r.id} listing={r} />
              ))}
            </div>
          )}
        </section>

        <button
          type="button"
          onClick={() => setShowFilters(true)}
          className="fixed bottom-28 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full px-5 py-3 shadow-lg"
          style={{ backgroundColor: INK, color: "#fff" }}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="text-sm font-semibold">Filtro</span>
          {activeCount > 0 && (
            <span
              className="ml-1 grid h-5 w-5 place-items-center rounded-full bg-white text-[10px] font-bold"
              style={{ color: INK }}
            >
              {activeCount}
            </span>
          )}
        </button>
      </div>

      <FiltersSheet open={showFilters} onOpenChange={setShowFilters} filters={filters} setFilters={setFilters} />
    </MobileShell>
  );
}

function ResultCard({ listing }: { listing: ListingView }) {
  const isNew = useMemo(() => {
    const created = new Date(listing.created_at).getTime();
    return Date.now() - created < 7 * 24 * 60 * 60 * 1000;
  }, [listing.created_at]);

  return (
    <Link to="/product/$id" params={{ id: listing.id }} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl" style={{ backgroundColor: CARD }}>
        {listing.coverUrl && (
          <img
            src={listing.coverUrl}
            alt={listing.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        {isNew && (
          <span
            className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold"
            style={{ backgroundColor: INK, color: "#fff" }}
          >
            E re
          </span>
        )}
        <LikeButton listingId={listing.id} className="absolute right-2 top-2 h-8 w-8 shadow-sm" />
      </div>
      <div className="mt-2 px-0.5">
        <div className="flex items-start justify-between gap-2">
          <p className="line-clamp-1 text-sm font-medium" style={{ color: INK }}>
            {listing.title}
          </p>
          <p className="shrink-0 text-sm font-semibold" style={{ color: INK }}>
            €{listing.price}
          </p>
        </div>
        <p className="mt-0.5 text-xs" style={{ color: MUTED }}>
          {(listing.brand || "—") + " · " + (listing.size || "—")}
        </p>
        {listing.city && (
          <p className="text-xs" style={{ color: MUTED }}>
            {listing.city}
          </p>
        )}
      </div>
    </Link>
  );
}

function FiltersSheet({
  open,
  onOpenChange,
  filters,
  setFilters,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  filters: Filters;
  setFilters: (f: Filters | ((p: Filters) => Filters)) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[85vh] overflow-y-auto border-0"
        style={{ backgroundColor: BG }}
      >
        <SheetHeader>
          <SheetTitle style={{ color: INK }}>Filtra</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-5">
          <Chips
            label="Gjendja"
            value={filters.condition}
            onChange={(v) => setFilters((p) => ({ ...p, condition: v }))}
            options={[...CONDITIONS]}
          />
          <Chips
            label="Qyteti"
            value={filters.city}
            onChange={(v) => setFilters((p) => ({ ...p, city: v }))}
            options={[...CITIES]}
          />
          <div>
            <Label style={{ color: INK }}>Madhësia</Label>
            <Input
              value={filters.size ?? ""}
              onChange={(e) => setFilters((p) => ({ ...p, size: e.target.value }))}
              placeholder="P.sh. M"
              className="mt-1 border-0"
              style={{ backgroundColor: CARD, color: INK }}
            />
          </div>
          <div>
            <Label style={{ color: INK }}>Brendi</Label>
            <Input
              value={filters.brand ?? ""}
              onChange={(e) => setFilters((p) => ({ ...p, brand: e.target.value }))}
              placeholder="P.sh. Nike"
              className="mt-1 border-0"
              style={{ backgroundColor: CARD, color: INK }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label style={{ color: INK }}>Çmimi min (€)</Label>
              <Input
                type="number"
                value={filters.priceMin ?? ""}
                onChange={(e) => setFilters((p) => ({ ...p, priceMin: e.target.value }))}
                className="mt-1 border-0"
                style={{ backgroundColor: CARD, color: INK }}
              />
            </div>
            <div>
              <Label style={{ color: INK }}>Çmimi maks (€)</Label>
              <Input
                type="number"
                value={filters.priceMax ?? ""}
                onChange={(e) => setFilters((p) => ({ ...p, priceMax: e.target.value }))}
                className="mt-1 border-0"
                style={{ backgroundColor: CARD, color: INK }}
              />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setFilters({})}
              className="flex-1 rounded-full py-3 text-sm font-medium"
              style={{ backgroundColor: CARD, color: INK }}
            >
              Pastro
            </button>
            <button
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-full py-3 text-sm font-semibold"
              style={{ backgroundColor: INK, color: "#fff" }}
            >
              Apliko
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Chips({
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
      <Label style={{ color: INK }}>{label}</Label>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => {
          const active = value === o;
          return (
            <button
              key={o}
              type="button"
              onClick={() => onChange(active ? "" : o)}
              className="rounded-full px-3 py-1.5 text-xs font-medium"
              style={{ backgroundColor: active ? INK : CARD, color: active ? "#fff" : INK }}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}
