import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search as SearchIcon,
  X,
  SlidersHorizontal,
  Loader2,
  Clock,
  Shirt,
  Mountain,
  Archive,
  Baby,
  Frame,
  Speaker,
  
} from "lucide-react";
import { MobileShell } from "@/components/marketplace/MobileShell";
import { supabase } from "@/integrations/supabase/client";
import {
  CATEGORIES,
  CITIES,
  CONDITIONS,
  GENDERS,
  hydrateListings,
  type ListingRow,
  type ListingView,
} from "@/lib/listings";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LikeButton } from "@/components/marketplace/LikeButton";

const BG = "#f6f1e7";
const CARD = "#ede8de";
const INK = "#1a1a1a";
const MUTED = "#a89f94";
const DIVIDER = "#ddd8ce";

type Search = {
  q?: string;
  category?: string;
  section?: "new" | "trending";
};

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: typeof s.q === "string" ? s.q : undefined,
    category: typeof s.category === "string" ? s.category : undefined,
    section:
      s.section === "new" || s.section === "trending" ? s.section : undefined,
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

type CategoryCard = {
  label: string;
  value: string;
  Icon: typeof Shirt;
};

const CATEGORY_CARDS: CategoryCard[] = [
  { label: "Modë & aksesorë", value: "Veshje", Icon: Shirt },
  { label: "Outdoor & sport", value: "Outdoor", Icon: Mountain },
  { label: "Interiør & mobilje", value: "Interier", Icon: Archive },
  { label: "Fëmijë & bebe", value: "Fëmijë", Icon: Baby },
  { label: "Art & dizajn", value: "Art", Icon: Frame },
  { label: "Elektronikë & zë", value: "Elektronikë", Icon: Speaker },
  
];

const RECENT_KEY = "rroba-recent-searches";

function loadRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as string[]).slice(0, 5) : [];
  } catch {
    return [];
  }
}

function saveRecent(list: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 5)));
  } catch {
    /* ignore */
  }
}

function SearchPage() {
  const navigate = useNavigate();
  const { q: initialQ, category: initialCategory, section } = Route.useSearch();
  const [q, setQ] = useState(initialQ ?? "");
  const [focused, setFocused] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    category: initialCategory,
  });
  const [results, setResults] = useState<ListingView[]>([]);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>(() => loadRecent());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setQ(initialQ ?? "");
  }, [initialQ]);

  useEffect(() => {
    if (initialCategory) {
      setFilters((p) => ({ ...p, category: initialCategory }));
    }
  }, [initialCategory]);

  const activeCount = useMemo(
    () => Object.values(filters).filter((v) => v && v.length > 0).length,
    [filters],
  );

  const hasQuery = q.trim().length > 0;
  const hasCategory = !!filters.category;
  const showResults = hasQuery || hasCategory;

  useEffect(() => {
    if (!showResults) {
      setResults([]);
      return;
    }
    let active = true;
    const run = async () => {
      setLoading(true);
      let query = supabase.from("listings").select("*").eq("sold", false);
      if (q.trim()) {
        const term = `%${q.trim()}%`;
        query = query.or(
          `title.ilike.${term},description.ilike.${term},brand.ilike.${term}`,
        );
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
    const t = setTimeout(run, 250);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [q, filters, section, showResults]);

  const commitRecent = (term: string) => {
    const t = term.trim();
    if (!t) return;
    setRecent((prev) => {
      const next = [t, ...prev.filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, 5);
      saveRecent(next);
      return next;
    });
  };

  const removeRecent = (term: string) => {
    setRecent((prev) => {
      const next = prev.filter((x) => x !== term);
      saveRecent(next);
      return next;
    });
  };

  const clearRecent = () => {
    setRecent([]);
    saveRecent([]);
  };

  const pickCategory = (value: string) => {
    setFilters((p) => ({ ...p, category: value }));
    navigate({ to: "/search", search: { category: value } });
  };

  return (
    <MobileShell>
      <div style={{ backgroundColor: BG, minHeight: "100vh" }} className="pb-32">
        <header className="px-5 pt-10">
          <h1
            className="text-[32px] font-bold leading-none tracking-tight"
            style={{ color: INK }}
          >
            Eksploro
          </h1>

          <div
            className="mt-5 flex h-[52px] items-center gap-3 rounded-full px-5"
            style={{ backgroundColor: CARD }}
            onClick={() => inputRef.current?.focus()}
          >
            <SearchIcon className="h-5 w-5 shrink-0" style={{ color: MUTED }} />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 150)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  commitRecent(q);
                  inputRef.current?.blur();
                }
              }}
              placeholder="Kërko"
              className="flex-1 bg-transparent text-[16px] outline-none placeholder:font-normal"
              style={{ color: INK }}
            />
            {q && (
              <button
                type="button"
                onClick={() => {
                  setQ("");
                  inputRef.current?.focus();
                }}
                aria-label="Pastro"
              >
                <X className="h-5 w-5" style={{ color: MUTED }} />
              </button>
            )}
          </div>
        </header>

        {focused && !hasQuery ? (
          <RecentSearches
            items={recent}
            onPick={(t) => {
              setQ(t);
              commitRecent(t);
            }}
            onRemove={removeRecent}
            onClear={clearRecent}
          />
        ) : showResults ? (
          <ResultsSection
            loading={loading}
            results={results}
            categoryLabel={
              filters.category
                ? CATEGORY_CARDS.find((c) => c.value === filters.category)?.label ??
                  filters.category
                : undefined
            }
            onClearCategory={() => {
              setFilters((p) => ({ ...p, category: undefined }));
              navigate({ to: "/search", search: {} });
            }}
          />
        ) : (
          <CategoriesSection onPick={pickCategory} />
        )}

        {showResults && (
          <button
            type="button"
            onClick={() => setShowFilters(true)}
            className="fixed bottom-28 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full px-5 py-3 shadow-lg"
            style={{ backgroundColor: INK, color: "#ffffff" }}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="text-sm font-semibold">Filtro</span>
            {activeCount > 0 && (
              <span className="ml-1 grid h-5 w-5 place-items-center rounded-full bg-white text-[10px] font-bold" style={{ color: INK }}>
                {activeCount}
              </span>
            )}
          </button>
        )}
      </div>

      <FiltersSheet
        open={showFilters}
        onOpenChange={setShowFilters}
        filters={filters}
        setFilters={setFilters}
      />
    </MobileShell>
  );
}

function CategoriesSection({ onPick }: { onPick: (v: string) => void }) {
  return (
    <section className="mt-8 px-5">
      <h2 className="mb-4 text-[20px] font-bold" style={{ color: INK }}>
        Kategoritë
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {CATEGORY_CARDS.map(({ label, value, Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => onPick(value)}
            className="flex h-[140px] flex-col items-start justify-between rounded-2xl p-4 text-left"
            style={{ backgroundColor: CARD }}
          >
            <Icon className="h-8 w-8" strokeWidth={1.5} style={{ color: INK }} />
            <span
              className="text-[15px] font-bold leading-tight"
              style={{ color: INK }}
            >
              {label}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function RecentSearches({
  items,
  onPick,
  onRemove,
  onClear,
}: {
  items: string[];
  onPick: (t: string) => void;
  onRemove: (t: string) => void;
  onClear: () => void;
}) {
  if (items.length === 0) {
    return (
      <section className="mt-8 px-5">
        <h2 className="text-[20px] font-bold" style={{ color: INK }}>
          Kërkimet e fundit
        </h2>
        <p className="mt-4 text-sm" style={{ color: MUTED }}>
          Asnjë kërkim ende.
        </p>
      </section>
    );
  }
  return (
    <section className="mt-8 px-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[20px] font-bold" style={{ color: INK }}>
          Kërkimet e fundit
        </h2>
        <button
          type="button"
          onClick={onClear}
          className="text-sm"
          style={{ color: MUTED }}
        >
          Pastro të gjitha
        </button>
      </div>
      <ul className="mt-3">
        {items.map((t) => (
          <li
            key={t}
            className="flex items-center gap-3 border-b py-3"
            style={{ borderColor: DIVIDER }}
          >
            <Clock className="h-4 w-4" style={{ color: MUTED }} />
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onPick(t);
              }}
              className="flex-1 text-left text-[15px]"
              style={{ color: INK }}
            >
              {t}
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onRemove(t);
              }}
              aria-label="Hiq"
            >
              <X className="h-4 w-4" style={{ color: MUTED }} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ResultsSection({
  loading,
  results,
  categoryLabel,
  onClearCategory,
}: {
  loading: boolean;
  results: ListingView[];
  categoryLabel?: string;
  onClearCategory: () => void;
}) {
  return (
    <section className="mt-6 px-5">
      {categoryLabel && (
        <div className="mb-3 flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium"
            style={{ backgroundColor: INK, color: "#fff" }}
          >
            {categoryLabel}
            <button type="button" onClick={onClearCategory} aria-label="Hiq">
              <X className="h-3 w-3" />
            </button>
          </span>
        </div>
      )}
      <p className="mb-3 text-xs" style={{ color: MUTED }}>
        {loading ? "Po kërkon..." : `${results.length} rezultate`}
      </p>
      {loading ? (
        <div className="grid place-items-center py-10">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: MUTED }} />
        </div>
      ) : results.length === 0 ? (
        <div
          className="rounded-2xl p-10 text-center text-sm"
          style={{ backgroundColor: CARD, color: MUTED }}
        >
          Asnjë rezultat u gjet
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {results.map((r) => (
            <CreamListingCard key={r.id} listing={r} />
          ))}
        </div>
      )}
    </section>
  );
}

function CreamListingCard({ listing }: { listing: ListingView }) {
  return (
    <Link
      to="/product/$id"
      params={{ id: listing.id }}
      className="group block"
    >
      <div
        className="relative aspect-[4/5] overflow-hidden rounded-2xl"
        style={{ backgroundColor: CARD }}
      >
        {listing.coverUrl && (
          <img
            src={listing.coverUrl}
            alt={listing.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        <LikeButton
          listingId={listing.id}
          className="absolute right-2 top-2 h-8 w-8 shadow-sm"
        />
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
          {(listing.brand || listing.category) + " · " + listing.size}
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
          <FilterChips
            label="Kategoria"
            value={filters.category}
            onChange={(v) => setFilters((p) => ({ ...p, category: v }))}
            options={CATEGORIES.map((c) => c.value)}
          />
          <FilterChips
            label="Gjendja"
            value={filters.condition}
            onChange={(v) => setFilters((p) => ({ ...p, condition: v }))}
            options={[...CONDITIONS]}
          />
          <FilterChips
            label="Qyteti"
            value={filters.city}
            onChange={(v) => setFilters((p) => ({ ...p, city: v }))}
            options={[...CITIES]}
          />
          <FilterChips
            label="Gjinia"
            value={filters.gender}
            onChange={(v) => setFilters((p) => ({ ...p, gender: v }))}
            options={[...GENDERS]}
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
              style={{ backgroundColor: INK, color: "#ffffff" }}
            >
              Apliko
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function FilterChips({
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
              style={{
                backgroundColor: active ? INK : CARD,
                color: active ? "#ffffff" : INK,
              }}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}
