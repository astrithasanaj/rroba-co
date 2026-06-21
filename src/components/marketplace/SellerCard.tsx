import { Star, BadgeCheck } from "lucide-react";
import type { Product } from "@/data/products";

export function SellerCard({ seller }: { seller: Product["seller"] }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
      <img
        src={seller.avatar}
        alt={seller.name}
        className="h-12 w-12 shrink-0 rounded-full object-cover"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <p className="truncate text-sm font-semibold">{seller.name}</p>
          {seller.verified && (
            <BadgeCheck className="h-4 w-4 text-accent" fill="currentColor" />
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-0.5">
            <Star className="h-3 w-3" fill="currentColor" /> {seller.rating}
          </span>
          <span>·</span>
          <span>{seller.listings} artikuj</span>
        </div>
      </div>
      <button className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-secondary">
        Shiko profilin
      </button>
    </div>
  );
}
