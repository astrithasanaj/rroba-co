import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Bell, ArrowRight } from "lucide-react";
import { MobileShell } from "@/components/marketplace/MobileShell";
import { GenderToggle } from "@/components/marketplace/GenderToggle";
import { CategoryChip } from "@/components/marketplace/CategoryChip";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { products } from "@/data/products";

export const Route = createFileRoute("/")({
  component: HomePage,
});

const womenMenSubs = [
  "Veshje",
  "Këpucë",
  "Çanta",
  "Aksesorë",
  "Vintage",
  "Designer/Premium",
];
const kidsSubs = ["Vajza", "Djem", "Këpucë", "Aksesorë"];

function HomePage() {
  const [gender, setGender] = useState<"Të gjitha" | "Femra" | "Meshkuj" | "Fëmijë">(
    "Të gjitha"
  );
  const [sub, setSub] = useState<string | null>(null);

  const subs =
    gender === "Femra" || gender === "Meshkuj"
      ? womenMenSubs
      : gender === "Fëmijë"
      ? kidsSubs
      : null;

  const filtered = products.filter((p) => {
    if (gender !== "Të gjitha" && p.gender !== gender) return false;
    if (sub && p.category !== sub) return false;
    return true;
  });

  const newThisWeek = products.filter((p) => p.tag === "new");
  const trending = products.filter((p) => p.tag === "trending");

  return (
    <MobileShell>
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-background/95 px-5 py-4 backdrop-blur">
        <h1 className="font-display text-3xl tracking-tight">
          rroba<span className="text-accent">.</span>
        </h1>
        <div className="flex items-center gap-1">
          <Link
            to="/search"
            className="grid h-10 w-10 place-items-center rounded-full hover:bg-secondary"
          >
            <Search className="h-5 w-5" strokeWidth={1.7} />
          </Link>
          <Link
            to="/notifications"
            className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-secondary"
          >
            <Bell className="h-5 w-5" strokeWidth={1.7} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent" />
          </Link>
        </div>
      </header>

      <div className="px-5">
        <GenderToggle
          value={gender}
          onChange={(v) => {
            setGender(v);
            setSub(null);
          }}
        />

        {subs && (
          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
            {subs.map((s) => (
              <CategoryChip
                key={s}
                label={s}
                active={sub === s}
                onClick={() => setSub(sub === s ? null : s)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Hero */}
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
              <button className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-foreground px-3.5 py-2 text-xs font-semibold text-background">
                Shfleto <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <img
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80"
            alt="Modë"
            className="h-full w-full object-cover"
          />
        </div>
      </section>

      {/* New this week */}
      <Section title="E re këtë javë" subtitle="Sapo të publikuar">
        <Grid products={newThisWeek} />
      </Section>

      {/* Trending */}
      <Section title="Trending tani" subtitle="Çfarë po duan të gjithë">
        <Grid products={trending} />
      </Section>

      {/* All / filtered feed */}
      <Section title={sub ?? gender}>
        <Grid products={filtered} />
      </Section>
    </MobileShell>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8 px-5">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h3 className="font-display text-2xl">{title}</h3>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <button className="text-xs font-medium text-muted-foreground">
          Shiko të gjitha
        </button>
      </div>
      {children}
    </section>
  );
}

function Grid({ products }: { products: typeof import("@/data/products").products }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
