import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search as SearchIcon,
  X,
  SlidersHorizontal,
  Loader2,
  Clock,
  Users,
  ChevronRight,
  ChevronLeft,
  Shirt,
  Baby,
  Archive,
  Mountain,
  Frame,
  Speaker,
  Gamepad2,
  LayoutGrid,
  Venus,
  Mars,
} from "lucide-react";
import { MobileShell } from "@/components/marketplace/MobileShell";
import { supabase } from "@/integrations/supabase/client";
import { HOME_CATEGORIES } from "@/lib/categories";
import {
  CONDITIONS,
  GENDERS,
  hydrateListings,
  type ListingRow,
  type ListingView,
} from "@/lib/listings";
import { useCities } from "@/hooks/useCities";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LikeButton } from "@/components/marketplace/LikeButton";
import { CategoryPickerSheet } from "@/components/marketplace/CategoryPickerSheet";
import {
  emptySelection,
  selectedDbCategories,
  selectedSubcategoryLabels,
  selectionChips,
  selectionCount,
  CATEGORY_TAXONOMY,
  type CategorySelection,
} from "@/lib/category-taxonomy";

const BG = "var(--brand-surface)";
const CARD = "var(--brand-surface)";
const INK = "var(--brand-ink)";
const MUTED = "var(--brand-ink-secondary)";
const DIVIDER = "var(--brand-border)";
const CORAL = "var(--brand-rose)";

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
  size?: string;
  condition?: string;
  city?: string;
  gender?: string;
  priceMin?: string;
  priceMax?: string;
};

type Tab = "main" | "profile" | "brand" | "category";

type ProfileRow = {
  id: string;
  name: string | null;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  city: string | null;
};

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
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [pickerInitialKey, setPickerInitialKey] = useState<string | undefined>(undefined);
  const [pickerInitialGroupLabel, setPickerInitialGroupLabel] = useState<string | undefined>(undefined);
  const [pickerInitialBucket, setPickerInitialBucket] = useState(false);
  const [genderTab, setGenderTab] = useState<"Femra" | "Meshkuj" | "Fëmijë" | null>(null);
  const [filters, setFilters] = useState<Filters>({});
  const [catSelection, setCatSelection] = useState<CategorySelection>(() => {
    const sel = emptySelection();
    // Handoff from other pages via sessionStorage
    if (typeof window !== "undefined") {
      try {
        const raw = window.sessionStorage.getItem("rroba-cat-selection");
        if (raw) {
          const parsed = JSON.parse(raw) as { categories?: string[]; subcategories?: string[] };
          (parsed.categories ?? []).forEach((c) => sel.categories.add(c));
          (parsed.subcategories ?? []).forEach((s) => sel.subcategories.add(s));
          window.sessionStorage.removeItem("rroba-cat-selection");
          return sel;
        }
      } catch {
        /* ignore */
      }
    }
    // Support deep-link ?category=Veshje etc.
    if (initialCategory) {
      const node = CATEGORY_TAXONOMY.find((n) => n.categories.includes(initialCategory));
      if (node) sel.categories.add(node.key);
    }
    return sel;
  });

  const [results, setResults] = useState<ListingView[]>([]);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>(() => loadRecent());
  const inputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<Tab>("main");
  const [me, setMe] = useState<string | null>(null);
  const [profileResults, setProfileResults] = useState<ProfileRow[]>([]);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileCounts, setProfileCounts] = useState<Record<string, number>>({});
  const [followingSet, setFollowingSet] = useState<Set<string>>(new Set());
  const [brandResults, setBrandResults] = useState<string[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMe(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    setQ(initialQ ?? "");
  }, [initialQ]);

  const activeCount = useMemo(
    () => Object.values(filters).filter((v) => v && v.length > 0).length,
    [filters],
  );

  const catChips = useMemo(() => selectionChips(catSelection), [catSelection]);
  const dbCategories = useMemo(() => selectedDbCategories(catSelection), [catSelection]);
  const subLabels = useMemo(() => selectedSubcategoryLabels(catSelection), [catSelection]);

  const hasQuery = q.trim().length > 0;
  const hasCategory = selectionCount(catSelection) > 0;
  const showResults = hasQuery || hasCategory || !!section;

  useEffect(() => {
    if (!showResults) {
      setResults([]);
      return;
    }
    let active = true;
    const run = async () => {
      setLoading(true);
      let query = supabase.from("listings").select("*").eq("status", "active");
      if (q.trim()) {
        const term = `%${q.trim()}%`;
        query = query.or(
          `title.ilike.${term},description.ilike.${term},brand.ilike.${term}`,
        );
      }
      if (dbCategories.length > 0) query = query.in("category", dbCategories);
      if (subLabels.length > 0) {
        // Match against the stored subcategory column (single source of truth
        // set by the sell form). Fall back to title ilike for legacy rows.
        const orExpr = [
          `subcategory.in.(${subLabels.map((s) => `"${s.replace(/"/g, "")}"`).join(",")})`,
          ...subLabels.map(
            (s) => `title.ilike.%${s.replace(/[,()"']/g, "")}%`,
          ),
        ].join(",");
        query = query.or(orExpr);
      }
      if (filters.size) query = query.ilike("size", filters.size);
      if (filters.condition) query = query.eq("condition", filters.condition);
      if (filters.city) query = query.eq("city", filters.city);
      if (filters.gender) query = query.eq("gender", filters.gender);
      if (genderTab === "Femra" || genderTab === "Meshkuj") {
        query = query.eq("gender", genderTab);
      } else if (genderTab === "Fëmijë") {
        query = query.eq("category", "Fëmijë & bebe");
      }
      if (filters.priceMin) query = query.gte("price", Number(filters.priceMin));
      if (filters.priceMax) query = query.lte("price", Number(filters.priceMax));
      query = query.order("created_at", { ascending: section !== "trending" });
      const { data } = await query.limit(60);

      const { data: activeBoosts } = await supabase
        .from("promotions")
        .select("listing_id")
        .eq("type", "search_top")
        .eq("status", "active")
        .gt("ends_at", new Date().toISOString());

      const boostedIds = new Set((activeBoosts ?? []).map((p) => p.listing_id));

      const sorted = [...(data ?? [])].sort((a, b) => {
        const aBoosted = boostedIds.has(a.id) ? 1 : 0;
        const bBoosted = boostedIds.has(b.id) ? 1 : 0;
        return bBoosted - aBoosted;
      });

      const hydrated = await hydrateListings(sorted as ListingRow[], { thumbnail: true });
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
  }, [q, filters, section, showResults, dbCategories, subLabels, genderTab]);

  // Profile + brand search
  useEffect(() => {
    if (!hasQuery) {
      setProfileResults([]);
      setBrandResults([]);
      setProfileCounts({});
      return;
    }
    let active = true;
    const run = async () => {
      setProfileLoading(true);
      const term = `%${q.trim()}%`;
      const { data: profs } = await supabase
        .from("public_profiles")
        .select("id,name,display_name,username,avatar_url,city")
        .or(`username.ilike.${term},display_name.ilike.${term},name.ilike.${term}`)
        .limit(20);
      if (!active) return;
      const list = (profs ?? []) as ProfileRow[];
      setProfileResults(list);

      // Counts of active listings per matched profile
      if (list.length > 0) {
        const ids = list.map((p) => p.id);
        const { data: cnt } = await supabase
          .from("listings")
          .select("user_id")
          .in("user_id", ids)
          .eq("status", "active");
        const counts: Record<string, number> = {};
        (cnt ?? []).forEach((r: any) => {
          counts[r.user_id] = (counts[r.user_id] ?? 0) + 1;
        });
        if (active) setProfileCounts(counts);

        // Following state for current user
        const meId = (await supabase.auth.getUser()).data.user?.id ?? null;
        if (meId && active) {
          const { data: mine } = await supabase
            .from("followers")
            .select("following_id")
            .eq("follower_id", meId)
            .in("following_id", ids);
          if (active) {
            setFollowingSet((prev) => {
              const next = new Set(prev);
              (mine ?? []).forEach((r: any) => next.add(r.following_id));
              return next;
            });
          }
        }
      } else {
        setProfileCounts({});
      }

      // Brand suggestions from listings
      const { data: brandRows } = await supabase
        .from("listings")
        .select("brand")
        .ilike("brand", term)
        .eq("status", "active")
        .not("brand", "is", null)
        .limit(60);
      if (active) {
        const uniq = Array.from(
          new Set(
            (brandRows ?? [])
              .map((r: any) => (r.brand as string | null) ?? "")
              .filter((b) => b.trim().length > 0),
          ),
        ).slice(0, 20);
        setBrandResults(uniq);
      }
      if (active) setProfileLoading(false);
    };
    const t = setTimeout(run, 250);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [q, hasQuery]);

  const toggleFollow = async (targetId: string) => {
    if (!me || me === targetId) return;
    const isFollowing = followingSet.has(targetId);
    const next = new Set(followingSet);
    if (isFollowing) {
      next.delete(targetId);
      setFollowingSet(next);
      const { error } = await supabase
        .from("followers")
        .delete()
        .eq("follower_id", me)
        .eq("following_id", targetId);
      if (error) {
        const revert = new Set(next);
        revert.add(targetId);
        setFollowingSet(revert);
      }
    } else {
      next.add(targetId);
      setFollowingSet(next);
      const { error } = await supabase
        .from("followers")
        .insert({ follower_id: me, following_id: targetId });
      if (error) {
        const revert = new Set(next);
        revert.delete(targetId);
        setFollowingSet(revert);
      }
    }
  };

  const matchedCategories = useMemo(() => {
    if (!hasQuery) return [];
    const term = q.trim().toLowerCase();
    return HOME_CATEGORIES.filter((c) => c.label.toLowerCase().includes(term));
  }, [q, hasQuery]);

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

  const pickCategoryCard = (key: string) => {
    const sel = emptySelection();
    sel.categories.add(key);
    setCatSelection(sel);
    navigate({ to: "/search", search: {} });
  };

  const removeChip = (id: string) => {
    setCatSelection((prev) => {
      const next: CategorySelection = {
        categories: new Set(prev.categories),
        subcategories: new Set(prev.subcategories),
      };
      if (id.startsWith("cat:")) next.categories.delete(id.slice(4));
      else if (id.startsWith("sub:")) next.subcategories.delete(id.slice(4));
      return next;
    });
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
            style={{ backgroundColor: CARD, border: "1px solid var(--brand-border)" }}
            onClick={() => inputRef.current?.focus()}
          >
            <SearchIcon aria-hidden="true" className="h-5 w-5 shrink-0" style={{ color: MUTED }} />
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
              enterKeyHint="search"
              inputMode="search"
              autoComplete="off"
              aria-label="Kërko"
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
                aria-label="Pastro kërkimin"
                className="-mr-2 grid h-11 w-11 place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-rose)]"
              >
                <X aria-hidden="true" className="h-5 w-5" style={{ color: MUTED }} />
              </button>
            )}
          </div>

          {/* Gender tabs — Femra / Meshkuj / Fëmijë */}
          <GenderTabs value={genderTab} onChange={setGenderTab} />


          {/* Selected chip tags */}
          {catChips.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {catChips.map((c) => (
                <span
                  key={c.id}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white"
                  style={{ backgroundColor: CORAL }}
                >
                  {c.label}
                  <button
                    type="button"
                    onClick={() => removeChip(c.id)}
                    aria-label="Hiq"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          {/* Tab bar — only visible when the user is actively searching */}
          {hasQuery && (
            <TabBar tab={tab} setTab={setTab} />
          )}
        </header>

        {focused && !hasQuery ? (
          <BrowseAndRecent
            recent={recent}
            onBrowseAll={() => navigate({ to: "/users" })}
            onPick={(t) => {
              setQ(t);
              commitRecent(t);
            }}
            onRemove={removeRecent}
            onClear={clearRecent}
          />
        ) : showResults ? (
          <TabbedResults
            tab={tab}
            loading={loading}
            profileLoading={profileLoading}
            results={results}
            profiles={profileResults}
            profileCounts={profileCounts}
            followingSet={followingSet}
            me={me}
            onToggleFollow={toggleFollow}
            brands={brandResults}
            matchedCategories={matchedCategories}
            onPickBrand={(b) => setQ(b)}
            onPickCategory={pickCategoryCard}
          />
        ) : (
          <EksploreList
            genderTab={genderTab}
            onOpenPicker={(key, initialBucket, groupLabel) => {
              setPickerInitialKey(key);
              setPickerInitialGroupLabel(groupLabel);
              setPickerInitialBucket(!!initialBucket);
              setShowCategoryPicker(true);
            }}
          />
        )}

        {showResults && (
          <button
            type="button"
            onClick={() => setShowFilters(true)}
            className="fixed bottom-28 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full px-5 py-3 shadow-lg"
            style={{ backgroundColor: INK, color: "var(--brand-surface)" }}
          >
            <SlidersHorizontal aria-hidden="true" className="h-4 w-4" />
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
        )}
      </div>

      <CategoryPickerSheet
        open={showCategoryPicker}
        onOpenChange={(v) => {
          setShowCategoryPicker(v);
          if (!v) {
            setPickerInitialKey(undefined);
            setPickerInitialGroupLabel(undefined);
            setPickerInitialBucket(false);
          }
        }}
        value={catSelection}
        onApply={setCatSelection}
        initialNodeKey={pickerInitialKey}
        initialGroupLabel={pickerInitialGroupLabel}
        initialBucket={pickerInitialBucket}
        gender={genderTab ?? "Femra"}
      />

      <FiltersSheet
        open={showFilters}
        onOpenChange={setShowFilters}
        filters={filters}
        setFilters={setFilters}
      />
    </MobileShell>
  );
}

const EKSPLORE_ROWS: {
  key: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; style?: React.CSSProperties }>;
}[] = [
  { key: "mode", label: "Modë & aksesorë", Icon: Shirt },
  { key: "femije", label: "Fëmijë & bebe", Icon: Baby },
  { key: "interior", label: "Interier & mobilie", Icon: Archive },
  { key: "outdoor", label: "Outdoor & sport", Icon: Mountain },
  { key: "art", label: "Art & dizajn", Icon: Frame },
  { key: "elektronik", label: "Elektronikë & zë", Icon: Speaker },
  { key: "hobi", label: "Hobi", Icon: Gamepad2 },
];

function GenderTabs({
  value,
  onChange,
}: {
  value: "Femra" | "Meshkuj" | "Fëmijë" | null;
  onChange: (v: "Femra" | "Meshkuj" | "Fëmijë" | null) => void;
}) {
  const tabs: ("Femra" | "Meshkuj" | "Fëmijë")[] = ["Femra", "Meshkuj", "Fëmijë"];
  return (
    <div
      role="tablist"
      aria-label="Filtro sipas gjinisë"
      className="mt-4 flex items-center gap-6"
      style={{ borderBottom: "1px solid var(--brand-border)" }}
    >
      {tabs.map((t) => {
        const active = value === t;
        return (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(active ? null : t)}
            className="relative pb-3 pt-1 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-rose)] rounded-sm"
            style={{
              color: active ? INK : MUTED,
              fontWeight: active ? 600 : 500,
            }}
          >
            {t}
            {active && (
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: -1,
                  height: 2,
                  background: "var(--brand-coral)",
                  borderRadius: 2,
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

function EksploreList({
  genderTab,
  onOpenPicker,
}: {
  genderTab: "Femra" | "Meshkuj" | "Fëmijë" | null;
  onOpenPicker: (key?: string, initialBucket?: boolean, groupLabel?: string) => void;
}) {
  const femijeRows = CATEGORY_TAXONOMY.find((n) => n.key === "femije")?.groups ?? [];
  const UNIVERSAL_KEYS = ["interior", "art", "elektronik", "hobi"];
  const rows = EKSPLORE_ROWS.filter(
    (row) => row.key !== "femije" && !UNIVERSAL_KEYS.includes(row.key)
  );
  const childIcons: Record<string, typeof Baby> = {
    Vajza: Venus,
    Djem: Mars,
    Bebe: Baby,
  };

  return (
    <section className="mt-4">
      {genderTab === "Fëmijë" ? (
        femijeRows.map(({ label }) => {
          const Icon = childIcons[label] ?? Baby;
          return (
            <button
              key={label}
              type="button"
              onClick={() => onOpenPicker("femije", false, label)}
              className="flex w-full items-center gap-3 px-5 py-3.5 text-left"
              style={{ borderBottom: "1px solid var(--brand-border)", background: BG }}
            >
              <span
                className="grid place-items-center"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "var(--brand-ink)",
                  flexShrink: 0,
                }}
              >
                <Icon size={18} strokeWidth={1.7} style={{ color: "var(--brand-coral)" }} />
              </span>
              <span className="flex-1 text-[15px] font-medium" style={{ color: INK }}>
                {label}
              </span>
              <ChevronRight aria-hidden="true" className="h-5 w-5" style={{ color: "var(--brand-ink-muted)" }} />
            </button>
          );
        })
      ) : (
        <>
          {rows.map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => onOpenPicker(key)}
              className="flex w-full items-center gap-3 px-5 py-3.5 text-left"
              style={{ borderBottom: "1px solid var(--brand-border)", background: BG }}
            >
              <span
                className="grid place-items-center"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "var(--brand-ink)",
                  flexShrink: 0,
                }}
              >
                <Icon size={18} strokeWidth={1.7} style={{ color: "var(--brand-coral)" }} />
              </span>
              <span className="flex-1 text-[15px] font-medium" style={{ color: INK }}>
                {label}
              </span>
              <ChevronRight aria-hidden="true" className="h-5 w-5" style={{ color: "var(--brand-ink-muted)" }} />
            </button>
          ))}
          <button
            type="button"
            onClick={() => onOpenPicker(undefined, true)}
            className="flex w-full items-center gap-3 px-5 py-3.5 text-left"
            style={{ borderBottom: "1px solid var(--brand-border)", background: BG }}
          >
            <span
              className="grid place-items-center"
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "var(--brand-ink)",
                flexShrink: 0,
              }}
            >
              <LayoutGrid aria-hidden="true" size={18} strokeWidth={1.7} style={{ color: "var(--brand-coral)" }} />
            </span>
            <span className="flex-1 text-[15px] font-medium" style={{ color: INK }}>
              Për të gjithë
            </span>
            <ChevronRight aria-hidden="true" className="h-5 w-5" style={{ color: "var(--brand-ink-muted)" }} />
          </button>
        </>
      )}
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
            <Clock aria-hidden="true" className="h-4 w-4" style={{ color: MUTED }} />
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

function TabBar({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const items: { key: Tab; label: string }[] = [
    { key: "main", label: "Kryesore" },
    { key: "profile", label: "Profile" },
    { key: "brand", label: "Marka" },
    { key: "category", label: "Kategori" },
  ];
  return (
    <div role="tablist" aria-label="Filtro rezultatet" className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
      {items.map((it) => {
        const active = tab === it.key;
        return (
          <button
            key={it.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => setTab(it.key)}
            className="rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-rose)]"
            style={{
              backgroundColor: active ? INK : CARD,
              color: active ? "var(--brand-surface)" : INK,
            }}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

function BrowseAndRecent({
  recent,
  onBrowseAll,
  onPick,
  onRemove,
  onClear,
}: {
  recent: string[];
  onBrowseAll: () => void;
  onPick: (t: string) => void;
  onRemove: (t: string) => void;
  onClear: () => void;
}) {
  return (
    <>
      <section className="mt-6 px-5">
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            onBrowseAll();
          }}
          className="flex w-full items-center gap-3 rounded-2xl p-4 text-left"
          style={{ backgroundColor: CARD }}
        >
          <div
            className="grid h-11 w-11 place-items-center rounded-full"
            style={{ backgroundColor: "var(--brand-cream)" }}
          >
            <Users aria-hidden="true" className="h-5 w-5" style={{ color: INK }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold" style={{ color: INK }}>
              Të gjithë përdoruesit
            </p>
            <p className="text-xs" style={{ color: MUTED }}>
              Shfleto profilet e Rroba
            </p>
          </div>
          <ChevronRight aria-hidden="true" className="h-5 w-5" style={{ color: MUTED }} />
        </button>
      </section>
      <RecentSearches items={recent} onPick={onPick} onRemove={onRemove} onClear={onClear} />
    </>
  );
}

function TabbedResults({
  tab,
  loading,
  profileLoading,
  results,
  profiles,
  profileCounts,
  followingSet,
  me,
  onToggleFollow,
  brands,
  matchedCategories,
  onPickBrand,
  onPickCategory,
}: {
  tab: Tab;
  loading: boolean;
  profileLoading: boolean;
  results: ListingView[];
  profiles: ProfileRow[];
  profileCounts: Record<string, number>;
  followingSet: Set<string>;
  me: string | null;
  onToggleFollow: (id: string) => void;
  brands: string[];
  matchedCategories: (typeof HOME_CATEGORIES)[number][];
  onPickBrand: (b: string) => void;
  onPickCategory: (key: string) => void;
}) {
  if (tab === "profile") {
    return (
      <section className="mt-6 px-5">
        <p className="mb-3 text-xs" style={{ color: MUTED }}>
          {profileLoading ? "Po kërkon..." : `${profiles.length} profile`}
        </p>
        {profileLoading ? (
          <div role="status" aria-live="polite" className="grid place-items-center py-10">
            <Loader2 aria-hidden="true" className="h-6 w-6 animate-spin" style={{ color: MUTED }} />
            <span className="sr-only">Po ngarkohet</span>
          </div>
        ) : profiles.length === 0 ? (
          <div role="status" className="rounded-2xl p-10 text-center text-sm" style={{ backgroundColor: CARD, color: MUTED }}>
            Asnjë profil u gjet
          </div>
        ) : (
          <ul className="divide-y" style={{ borderColor: DIVIDER }}>
            {profiles.map((p) => (
              <ProfileListRow
                key={p.id}
                profile={p}
                count={profileCounts[p.id] ?? 0}
                isFollowing={followingSet.has(p.id)}
                isMe={me === p.id}
                canFollow={!!me}
                onToggleFollow={() => onToggleFollow(p.id)}
              />
            ))}
          </ul>
        )}
      </section>
    );
  }

  if (tab === "brand") {
    return (
      <section className="mt-6 px-5">
        <p className="mb-3 text-xs" style={{ color: MUTED }}>
          {brands.length} marka
        </p>
        {brands.length === 0 ? (
          <div role="status" className="rounded-2xl p-10 text-center text-sm" style={{ backgroundColor: CARD, color: MUTED }}>
            Asnjë markë u gjet
          </div>
        ) : (
          <ul>
            {brands.map((b) => (
              <li key={b} className="border-b" style={{ borderColor: DIVIDER }}>
                <button
                  type="button"
                  onClick={() => onPickBrand(b)}
                  className="w-full py-3 text-left text-[15px] font-medium"
                  style={{ color: INK }}
                >
                  {b}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }

  if (tab === "category") {
    return (
      <section className="mt-6 px-5">
        {matchedCategories.length === 0 ? (
          <div role="status" className="rounded-2xl p-10 text-center text-sm" style={{ backgroundColor: CARD, color: MUTED }}>
            Asnjë kategori
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {matchedCategories.map(({ key, label, Icon, boxColor, iconColor }) => (
              <button
                key={key}
                type="button"
                onClick={() => onPickCategory(key)}
                className="flex h-[140px] flex-col items-start justify-between rounded-2xl p-4 text-left"
                style={{ backgroundColor: boxColor }}
              >
                <Icon className="h-8 w-8" strokeWidth={1.5} style={{ color: iconColor }} />
                <span className="text-[15px] font-bold leading-tight" style={{ color: INK }}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>
    );
  }

  // "main" / Kryesore — mixed
  return (
    <>
      {profiles.length > 0 && (
        <section className="mt-6 px-5">
          <h3 className="mb-2 text-sm font-bold" style={{ color: INK }}>
            Profile
          </h3>
          <ul>
            {profiles.slice(0, 3).map((p) => (
              <ProfileListRow
                key={p.id}
                profile={p}
                count={profileCounts[p.id] ?? 0}
                isFollowing={followingSet.has(p.id)}
                isMe={me === p.id}
                canFollow={!!me}
                onToggleFollow={() => onToggleFollow(p.id)}
              />
            ))}
          </ul>
        </section>
      )}
      {matchedCategories.length > 0 && (
        <section className="mt-4 px-5">
          <h3 className="mb-2 text-sm font-bold" style={{ color: INK }}>
            Kategoritë
          </h3>
          <div className="flex flex-wrap gap-2">
            {matchedCategories.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => onPickCategory(key)}
                className="rounded-full px-3 py-1.5 text-xs font-semibold"
                style={{ backgroundColor: CARD, color: INK }}
              >
                {label}
              </button>
            ))}
          </div>
        </section>
      )}
      <ResultsSection loading={loading} results={results} />
    </>
  );
}

function ProfileListRow({
  profile,
  count,
  isFollowing,
  isMe,
  canFollow,
  onToggleFollow,
}: {
  profile: ProfileRow;
  count: number;
  isFollowing: boolean;
  isMe: boolean;
  canFollow: boolean;
  onToggleFollow: () => void;
}) {
  const label = profile.display_name || profile.name || profile.username || "Përdorues";
  return (
    <li
      className="flex items-center gap-3 border-b py-3"
      style={{ borderColor: DIVIDER }}
    >
      <Link
        to="/user/$id"
        params={{ id: profile.id }}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        <img
          src={profile.avatar_url || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(label)}`}
          alt=""
          className="h-11 w-11 shrink-0 rounded-full object-cover"
          style={{ backgroundColor: CARD }}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold" style={{ color: INK }}>
            {label}
          </p>
          <p className="truncate text-xs" style={{ color: MUTED }}>
            {[profile.city, `${count} ${count === 1 ? "artikull" : "artikuj"}`]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      </Link>
      {!isMe && canFollow && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleFollow();
          }}
          className="shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-opacity active:opacity-80"
          style={{
            backgroundColor: isFollowing ? "var(--brand-rose-soft)" : CORAL,
            color: isFollowing ? "var(--brand-rose-ink)" : "var(--brand-surface)",
            border: "none",
            fontWeight: 600,
          }}
        >
          {isFollowing ? "Duke ndjekur" : "Ndiq"}
        </button>
      )}
    </li>
  );
}

function ResultsSection({
  loading,
  results,
}: {
  loading: boolean;
  results: ListingView[];
}) {
  return (
    <section className="mt-6 px-5" aria-busy={loading}>
      <p className="mb-3 text-xs" style={{ color: MUTED }} aria-live="polite">
        {loading ? "Po kërkon..." : `${results.length} rezultate`}
      </p>
      {loading ? (
        <div role="status" aria-live="polite" className="grid place-items-center py-10">
          <Loader2 aria-hidden="true" className="h-6 w-6 animate-spin" style={{ color: MUTED }} />
          <span className="sr-only">Po kërkon</span>
        </div>
      ) : results.length === 0 ? (
        <div
          role="status"
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
        className="relative aspect-[3/4] overflow-hidden rounded-2xl"
        style={{ backgroundColor: CARD }}
      >
        {listing.coverUrl && (
          <img
            src={listing.coverUrl}
            alt={listing.title}
            loading="lazy"
            className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
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
  const { cities } = useCities();
  const cityNames = cities.map((c) => c.name);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        hideClose
        className="overflow-y-auto border-0"
        style={{ backgroundColor: BG }}
      >
        <div className="flex items-center gap-3 pb-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Kthehu"
            className="grid place-items-center rounded-full transition-transform duration-150 active:scale-90"
            style={{
              width: 44,              height: 44,              backgroundColor: "rgba(255,255,255,0.7)",
              border: "1px solid rgba(226,226,222,0.8)",
              backdropFilter: "blur(8px)",
            }}
          >
            <ChevronLeft size={18} color="var(--brand-ink)" strokeWidth={2} />
          </button>
          <SheetTitle style={{ color: INK }}>Filtra</SheetTitle>
        </div>
        <div className="mt-4 space-y-5">
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
            options={cityNames}
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
              style={{ backgroundColor: INK, color: "var(--brand-surface)" }}
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
                color: active ? "var(--brand-surface)" : INK,
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
