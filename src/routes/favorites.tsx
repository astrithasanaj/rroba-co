import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { MobileShell } from "@/components/marketplace/MobileShell";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { EmptyState } from "@/components/marketplace/EmptyState";
import { PrimaryButton } from "@/components/marketplace/PrimaryButton";
import { products } from "@/data/products";

export const Route = createFileRoute("/favorites")({
  component: Favorites,
});

function Favorites() {
  const saved = products.slice(0, 4);
  const isEmpty = false;

  return (
    <MobileShell>
      <header className="sticky top-0 z-30 bg-background/95 px-5 py-4 backdrop-blur">
        <h1 className="font-display text-3xl">Të ruajtura</h1>
      </header>

      {isEmpty ? (
        <EmptyState
          icon={<Heart className="h-6 w-6" />}
          title="Ruaj artikujt që të pëlqejnë."
          description="Prek zemrën në çdo artikull për ta gjetur më vonë."
          action={
            <Link to="/">
              <PrimaryButton>Shfleto artikuj</PrimaryButton>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 px-5 py-3">
          {saved.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </MobileShell>
  );
}
