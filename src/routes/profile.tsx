import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Settings, BadgeCheck, Star, Heart } from "lucide-react";
import { MobileShell } from "@/components/marketplace/MobileShell";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { PrimaryButton } from "@/components/marketplace/PrimaryButton";
import { products } from "@/data/products";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

const tabs = ["Artikuj", "Të ruajtura", "Shitur"] as const;

function ProfilePage() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Artikuj");
  const items = tab === "Të ruajtura" ? products.slice(2, 6) : products.slice(0, 4);

  return (
    <MobileShell>
      <header className="flex items-center justify-between px-5 py-4">
        <h1 className="font-display text-2xl">Profili</h1>
        <Link to="/" className="grid h-10 w-10 place-items-center rounded-full hover:bg-secondary">
          <Settings className="h-5 w-5" strokeWidth={1.7} />
        </Link>
      </header>

      <section className="px-5">
        <div className="flex items-center gap-4">
          <img
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80"
            alt=""
            className="h-20 w-20 rounded-full object-cover"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <p className="truncate font-display text-2xl">Erza M.</p>
              <BadgeCheck className="h-5 w-5 text-accent" fill="currentColor" />
            </div>
            <p className="text-xs text-muted-foreground">Prishtinë, Kosovë</p>
            <div className="mt-1 flex items-center gap-1 text-xs">
              <Star className="h-3 w-3" fill="currentColor" />
              <span className="font-semibold">4.9</span>
              <span className="text-muted-foreground">· 87 vlerësime</span>
            </div>
          </div>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-foreground/85">
          Dashamirëse e modës vintage dhe markave skandinave. Pastroj dollapin çdo sezon ✨
        </p>

        <div className="mt-4 grid grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-card py-3 text-center">
          <Stat label="Ndjekës" value="1.2k" />
          <Stat label="Ndjek" value="184" />
          <Stat label="Artikuj" value="23" />
        </div>

        <div className="mt-4 flex gap-2">
          <PrimaryButton variant="secondary">Ndrysho profilin</PrimaryButton>
          <PrimaryButton>Verifiko profilin</PrimaryButton>
        </div>
      </section>

      <div className="mt-6 border-b border-border px-5">
        <div className="flex gap-6">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative pb-3 text-sm font-medium ${
                tab === t ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {t}
              {tab === t && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 bg-foreground" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 px-5 py-4">
        {items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      <div className="px-5">
        <Link
          to="/favorites"
          className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 text-sm"
        >
          <span className="inline-flex items-center gap-2">
            <Heart className="h-4 w-4" /> Të gjitha të ruajturat
          </span>
          <span className="text-muted-foreground">→</span>
        </Link>
      </div>
    </MobileShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-display text-xl">{value}</p>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
