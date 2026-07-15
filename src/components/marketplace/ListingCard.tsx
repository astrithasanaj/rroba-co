import { Link } from "@tanstack/react-router";
import { useState } from "react";
import type { ListingView } from "@/lib/listings";
import { LikeButton } from "@/components/marketplace/LikeButton";
import { prefetchListing, warmImage } from "@/lib/prefetch";

export function ListingCard({
  listing,
  aspect = "3/4",
  eager = false,
  isOnProfileGrid = false,
}: {
  listing: ListingView;
  aspect?: "3/4" | "1/1" | "4/5";
  eager?: boolean;
  isOnProfileGrid?: boolean;
}) {
  const aspectClass =
    aspect === "1/1" ? "aspect-square" : aspect === "4/5" ? "aspect-[4/5]" : "aspect-[3/4]";
  const isSold = listing.sold || listing.status === "sold";
  const [imageBroken, setImageBroken] = useState(false);
  const prefetch = () => {
    prefetchListing(listing.id);
    warmImage(listing.coverUrl);
  };
  if (!listing.coverUrl || imageBroken) return null;
  return (
    <Link
      to="/product/$id"
      params={{ id: listing.id }}
      onMouseEnter={prefetch}
      onTouchStart={prefetch}
      onFocus={prefetch}
      className="group block"
    >
      <div
        className={`relative ${aspectClass} overflow-hidden rounded-2xl bg-muted`}
        style={{ position: "relative" }}
      >
        <img
          src={listing.coverUrl}
          alt={listing.title}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          onError={() => setImageBroken(true)}
          className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
          style={{
            filter: isSold && isOnProfileGrid ? "brightness(0.82) saturate(0.65)" : "none",
          }}
        />

        {/* Rroba watermark */}
        <span
          className="pointer-events-none absolute left-2 top-2 select-none italic"
          style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: 10,
            color: "#ffffff",
            opacity: 0.85,
            letterSpacing: "0.02em",
            textShadow: "0 1px 2px rgba(0,0,0,0.25)",
          }}
        >
          Rroba
        </span>

        {listing.imageUrls.length > 1 && !isSold && (
          <div className="pointer-events-none absolute inset-x-2 top-2 flex gap-1">
            {listing.imageUrls.map((_, i) => (
              <div
                key={i}
                className={`h-0.5 flex-1 rounded-full ${i === 0 ? "bg-white opacity-100" : "bg-white opacity-30"}`}
              />
            ))}
          </div>
        )}

        {!isSold && (
          <LikeButton
            listingId={listing.id}
            className="absolute right-2 top-2 h-8 w-8 shadow-sm"
          />
        )}

        {isSold && isOnProfileGrid && (
          <span
            style={{
              position: "absolute",
              top: 18,
              right: -28,
              width: 110,
              background: "#e8826a",
              color: "#ffffff",
              fontSize: 11,
              fontWeight: 700,
              textAlign: "center",
              padding: "5px 0",
              transform: "rotate(45deg)",
              zIndex: 3,
              letterSpacing: "0.5px",
              textTransform: "uppercase",
            }}
          >
            Shitur
          </span>
        )}

        {listing.is_promoted && (
          <span
            className="pointer-events-none select-none"
            style={{
              position: "absolute",
              bottom: 8,
              left: 10,
              fontSize: 10,
              fontStyle: "italic",
              color: "rgba(255,255,255,0.72)",
              letterSpacing: "0.2px",
              textShadow: "0 1px 2px rgba(0,0,0,0.35)",
              zIndex: 2,
            }}
          >
            Sponsorizuar
          </span>
        )}
      </div>
      <div className="mt-2 px-0.5">
        <div className="flex items-start justify-between gap-2">
          <p
            className="line-clamp-1 text-sm font-medium"
            style={isSold && isOnProfileGrid ? { color: "#a89f94" } : undefined}
          >
            {listing.title}
          </p>
          <p
            className="shrink-0 text-sm font-semibold"
            style={isSold && isOnProfileGrid ? { color: "#a89f94" } : undefined}
          >
            €{listing.price}
          </p>
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
