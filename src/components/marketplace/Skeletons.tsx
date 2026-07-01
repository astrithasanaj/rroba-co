const CARD_BG = "#ede8de";

const shimmerStyle: React.CSSProperties = {
  backgroundColor: CARD_BG,
  animation: "rroba-shimmer 1.4s ease-in-out infinite",
};

export function SkeletonBox({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return <div className={className} style={{ ...shimmerStyle, ...style }} />;
}

export function ListingCardSkeleton({ aspect = "3/4" }: { aspect?: "3/4" | "1/1" | "4/5" }) {
  const aspectClass =
    aspect === "1/1" ? "aspect-square" : aspect === "4/5" ? "aspect-[4/5]" : "aspect-[3/4]";
  return (
    <div>
      <SkeletonBox className={`w-full ${aspectClass} rounded-2xl`} />
      <div className="mt-2 space-y-1.5 px-0.5">
        <SkeletonBox className="h-3 w-3/4 rounded" />
        <SkeletonBox className="h-3 w-1/2 rounded" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({
  count = 6,
  aspect = "3/4",
}: {
  count?: number;
  aspect?: "3/4" | "1/1" | "4/5";
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <ListingCardSkeleton key={i} aspect={aspect} />
      ))}
    </div>
  );
}

export function ProfileGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-px">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonBox key={i} className="aspect-square w-full" />
      ))}
    </div>
  );
}

export function ProductPageSkeleton() {
  return (
    <div>
      <SkeletonBox className="w-full" style={{ aspectRatio: "4 / 5" }} />
      <div className="space-y-3 px-5 pt-5">
        <SkeletonBox className="h-3 w-24 rounded" />
        <SkeletonBox className="h-8 w-3/4 rounded" />
        <SkeletonBox className="h-6 w-1/3 rounded" />
        <SkeletonBox className="mt-4 h-32 w-full rounded-2xl" />
      </div>
    </div>
  );
}

export function ConversationListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <SkeletonBox className="h-12 w-12 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <SkeletonBox className="h-3 w-1/3 rounded" />
            <SkeletonBox className="h-3 w-3/4 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
