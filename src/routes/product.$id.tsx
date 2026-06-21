import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Heart, Share2, MessageCircle } from "lucide-react";
import { MobileShell } from "@/components/marketplace/MobileShell";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { SellerCard } from "@/components/marketplace/SellerCard";
import { PrimaryButton } from "@/components/marketplace/PrimaryButton";
import { getProduct, products } from "@/data/products";

export const Route = createFileRoute("/product/$id")({
  component: ProductDetail,
});

function ProductDetail() {
  const { id } = useParams({ from: "/product/$id" });
  const product = getProduct(id);
  const [liked, setLiked] = useState(false);

  if (!product) {
    return (
      <MobileShell>
        <div className="p-10 text-center">
          <p>Artikulli nuk u gjet.</p>
          <Link to="/" className="text-accent underline">
            Kthehu në kreu
          </Link>
        </div>
      </MobileShell>
    );
  }

  const similar = products.filter(
    (p) => p.id !== product.id && p.gender === product.gender && p.category === product.category
  );

  const meta: [string, string][] = [
    ["Gjinia", product.gender],
    ["Kategoria", product.category],
    ["Marka", product.brand],
    ["Madhësia", product.size],
    ["Gjendja", product.condition],
    ["Ngjyra", product.color],
    ["Qyteti", product.city],
  ];

  return (
    <MobileShell hideNav>
      <div className="relative">
        <img
          src={product.image}
          alt={product.title}
          className="aspect-[4/5] w-full object-cover"
        />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
          <Link
            to="/"
            className="grid h-10 w-10 place-items-center rounded-full bg-background/90 backdrop-blur"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex gap-2">
            <button className="grid h-10 w-10 place-items-center rounded-full bg-background/90 backdrop-blur">
              <Share2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setLiked((v) => !v)}
              className="grid h-10 w-10 place-items-center rounded-full bg-background/90 backdrop-blur"
            >
              <Heart className="h-4 w-4" fill={liked ? "currentColor" : "none"} />
            </button>
          </div>
        </div>
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full ${
                i === 0 ? "w-6 bg-background" : "w-1.5 bg-background/60"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="px-5 pt-5">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {product.brand}
        </p>
        <div className="mt-1 flex items-start justify-between gap-3">
          <h1 className="font-display text-3xl leading-tight">{product.title}</h1>
          <p className="shrink-0 font-display text-3xl">€{product.price}</p>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-y-3 rounded-2xl bg-secondary/60 p-4 text-sm">
          {meta.map(([k, v]) => (
            <div key={k}>
              <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {k}
              </dt>
              <dd className="mt-0.5">{v}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-5 text-sm leading-relaxed text-foreground/85">
          {product.description}
        </p>

        <div className="mt-6">
          <SellerCard seller={product.seller} />
        </div>

        {similar.length > 0 && (
          <section className="mt-8">
            <h3 className="mb-3 font-display text-2xl">Artikuj të ngjashëm</h3>
            <div className="grid grid-cols-2 gap-3">
              {similar.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        <div className="h-32" />
      </div>

      <div className="fixed bottom-0 left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 border-t border-border bg-background/95 p-4 backdrop-blur">
        <div className="flex gap-2">
          <PrimaryButton variant="secondary" className="!py-3">
            Bëj ofertë
          </PrimaryButton>
          <PrimaryButton className="!py-3">
            <MessageCircle className="h-4 w-4" /> Dërgo mesazh
          </PrimaryButton>
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </MobileShell>
  );
}
