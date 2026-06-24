import { Link } from "@tanstack/react-router";
import type { ListingView } from "@/lib/listings";

export function ListingCard({ listing }: { listing: ListingView }) {
  return (
    <Link
      to="/product/$id"
      params={{ id: listing.id }}
      className="group block"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted">
        {listing.coverUrl && (
          <img
            src={listing.coverUrl}
            alt={listing.title}
            loading="lazy"
            className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
              listing.sold ? "opacity-70 grayscale" : ""
            }`}
          />
        )}
        {listing.sold && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <span className="rotate-[-18deg] rounded-md bg-destructive px-4 py-1 text-xs font-black tracking-widest text-destructive-foreground shadow">
              SHITUR
            </span>
          </div>
        )}
      </div>
      <div className="mt-2 px-0.5">
        <div className="flex items-start justify-between gap-2">
          <p className="line-clamp-1 text-sm font-medium">{listing.title}</p>
          <p className="shrink-0 text-sm font-semibold">€{listing.price}</p>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {listing.brand || listing.category} · {listing.size}
        </p>
        {listing.city && (
          <p className="text-xs text-muted-foreground">{listing.city}</p>
        )}
      </div>
    </Link>
  );
}
