import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { useState } from "react";
import type { Product } from "@/data/products";

export function ProductCard({ product }: { product: Product }) {
  const [liked, setLiked] = useState(!!product.liked);
  return (
    <Link
      to="/product/$id"
      params={{ id: product.id }}
      className="group block"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted">
        <img
          src={product.image}
          alt={product.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setLiked((v) => !v);
          }}
          className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-background/85 backdrop-blur"
          aria-label="Ruaj"
        >
          <Heart
            className="h-4 w-4"
            fill={liked ? "currentColor" : "none"}
            strokeWidth={1.8}
          />
        </button>
        {product.tag === "new" && (
          <span className="absolute left-2 top-2 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-medium tracking-wide">
            E re
          </span>
        )}
      </div>
      <div className="mt-2 px-0.5">
        <div className="flex items-start justify-between gap-2">
          <p className="line-clamp-1 text-sm font-medium">{product.title}</p>
          <p className="shrink-0 text-sm font-semibold">€{product.price}</p>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {product.size} · {product.condition}
        </p>
        <p className="text-xs text-muted-foreground">{product.city}</p>
      </div>
    </Link>
  );
}
