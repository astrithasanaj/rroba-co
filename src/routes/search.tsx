import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search as SearchIcon, X, ArrowLeft, SlidersHorizontal } from "lucide-react";
import { MobileShell } from "@/components/marketplace/MobileShell";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { CategoryChip } from "@/components/marketplace/CategoryChip";
import { products } from "@/data/products";

export const Route = createFileRoute("/search")({
  component: SearchPage,
});

const recent = ["Zara blazer", "Nike Air Max", "Vintage çantë", "\n"];

const filterGroups = [
  { label: "Gjinia", options: ["Femra", "Meshkuj", "Fëmijë"] },
  {
    label: "Nënkategoria",
    options: ["Veshje", "Këpucë", "Çanta", "Aksesorë", "Vintage", "Premium"],
  },
  { label: "Madhësia", options: ["XS", "S", "M", "L", "XL", "38", "40", "42"] },
  { label: "Marka", options: ["Zara", "Nike", "H&M", "\n", "Levi's", "Mango"] },
  { label: "Çmimi", options: ["< €20", "€20–50", "€50–100", "€100+"] },
  { label: "Gjendja", options: ["Si i ri", "Shumë i mirë", "I mirë"] },
  { label: "Qyteti", options: ["Prishtinë", "Prizren", "Pejë", "Tiranë"] },
  { label: "Ngjyra", options: ["E zezë", "E bardhë", "Blu", "Kafe", "E kuqe"] },
  { label: "Dorëzimi", options: ["Personalisht", "Postë"] },
];

const tiles = [
  {
    gender: "Femra",
    items: [
      { label: "Veshje", img: "photo-1483985988355-763728e1935b" },
      { label: "Këpucë", img: "photo-1543163521-1bf539c55dd2" },
      { label: "Çanta", img: "photo-1548036328-c9fa89d128fa" },
    ],
  },
  {
    gender: "Meshkuj",
    items: [
      { label: "Veshje", img: "photo-1516257984-b1b4d707412e" },
      { label: "Këpucë", img: "photo-1542291026-7eec264c27ff" },
      { label: "Aksesorë", img: "photo-1622434641406-a158123450f9" },
    ],
  },
  {
    gender: "Fëmijë",
    items: [
      { label: "Vajza", img: "photo-1518831959646-742c3a14ebf7" },
      { label: "Djem", img: "photo-1622290291468-a28f7a7dc480" },
    ],
  },
];

function SearchPage() {
  const [q, setQ] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const results = q
    ? products.filter((p) =>
        (p.title + " " + p.brand).toLowerCase().includes(q.toLowerCase())
      )
    : [];

  return (
    <MobileShell>
      <header className="sticky top-0 z-30 bg-background/95 px-5 pb-3 pt-4 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-full bg-secondary px-4 py-2.5">
            <SearchIcon className="h-4 w-4 text-muted-foreground" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Kërko marka, stile ose artikuj"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {q && (
              <button onClick={() => setQ("")} aria-label="Pastro">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-full bg-secondary"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>
      </header>

      {showFilters ? (
        <FiltersPanel onClose={() => setShowFilters(false)} />
      ) : q ? (
        <div className="px-5 py-4">
          <p className="mb-3 text-xs text-muted-foreground">
            {results.length} rezultate për "{q}"
          </p>
          <div className="grid grid-cols-2 gap-3">
            {results.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      ) : (
        <div className="px-5 py-4">
          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Kërkimet e fundit
            </h3>
            <div className="flex flex-wrap gap-2">
              {recent.map((r) => (
                <CategoryChip key={r} label={r} onClick={() => setQ(r)} />
              ))}
            </div>
          </section>

          <section className="mt-8">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Kategoritë
            </h3>
            <div className="space-y-5">
              {tiles.map((group) => (
                <div key={group.gender}>
                  <h4 className="font-display text-xl">{group.gender}</h4>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {group.items.map((it) => (
                      <Link
                        key={it.label}
                        to="/"
                        className="relative aspect-square overflow-hidden rounded-2xl bg-secondary"
                      >
                        <img
                          src={`https://images.unsplash.com/${it.img}?auto=format&fit=crop&w=400&q=80`}
                          alt={it.label}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                        <span className="absolute bottom-2 left-2 text-xs font-medium text-white">
                          {it.label}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </MobileShell>
  );
}

function FiltersPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="px-5 py-4">
      <div className="mb-4 flex items-center gap-2">
        <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-secondary">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h2 className="font-display text-2xl">Filtra</h2>
      </div>
      <div className="space-y-6">
        {filterGroups.map((g) => (
          <div key={g.label}>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {g.label}
            </h4>
            <div className="flex flex-wrap gap-2">
              {g.options.map((o) => (
                <CategoryChip key={o} label={o} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="sticky bottom-24 mt-8 flex gap-2">
        <button className="flex-1 rounded-full border border-border bg-background py-3 text-sm font-medium">
          Pastro
        </button>
        <button
          onClick={onClose}
          className="flex-1 rounded-full bg-foreground py-3 text-sm font-semibold text-background"
        >
          Apliko
        </button>
      </div>
    </div>
  );
}
