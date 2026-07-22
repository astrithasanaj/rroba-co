import { useEffect, useRef, useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

type Props = {
  images: string[];
  alt: string;
};

export function ImageGallery({ images, alt }: Props) {
  const [active, setActive] = useState(0);
  const [zoomedIndex, setZoomedIndex] = useState<number | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const multiple = images.length > 1;
  const isZoomed = zoomedIndex !== null;

  // Preload neighbors
  useEffect(() => {
    const toPreload = [active - 1, active + 1].filter(
      (i) => i >= 0 && i < images.length,
    );
    toPreload.forEach((i) => {
      const img = new Image();
      img.src = images[i];
    });
  }, [active, images]);

  const onScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    if (idx !== active) setActive(idx);
  };

  const goTo = (i: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!multiple || isZoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const third = rect.width / 3;
    if (x < third && active > 0) goTo(active - 1);
    else if (x > rect.width - third && active < images.length - 1) goTo(active + 1);
  };

  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden">
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        onClick={handleTap}
        className="flex h-full w-full snap-x snap-mandatory overflow-y-hidden scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{
          scrollSnapType: isZoomed ? "none" : "x mandatory",
          overflowX: isZoomed ? "hidden" : "auto",
          willChange: "transform",
        }}
      >
        {images.map((src, i) => (
          <div key={i} className="relative h-full w-full flex-shrink-0 snap-center snap-always">
            <TransformWrapper
              doubleClick={{ mode: "toggle", step: 1.5 }}
              pinch={{ step: 5 }}
              wheel={{ disabled: true }}
              panning={{ disabled: false }}
              minScale={1}
              maxScale={4}
              onTransformed={(_ref: unknown, state: { scale: number }) => {
                if (state.scale > 1.01) {
                  setZoomedIndex(i);
                } else if (zoomedIndex === i) {
                  setZoomedIndex(null);
                }
              }}
            >
              <TransformComponent
                wrapperStyle={{ width: "100%", height: "100%" }}
                contentStyle={{ width: "100%", height: "100%" }}
              >
                <img
                  src={src}
                  alt={`${alt} ${i + 1}`}
                  draggable={false}
                  className="h-full w-full object-cover"
                />
              </TransformComponent>
            </TransformWrapper>
          </div>
        ))}
      </div>

      {multiple && (
        <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex gap-1">
          {images.map((_, i) => (
            <div
              key={i}
              className={`h-0.5 flex-1 rounded-full transition-opacity ${
                i === active ? "bg-white opacity-100" : "bg-white opacity-30"
              }`}
            />
          ))}
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-b from-transparent to-background/40" />
    </div>
  );
}
