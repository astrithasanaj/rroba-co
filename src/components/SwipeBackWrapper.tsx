import { ReactNode } from "react";
import { useSwipeBack } from "@/hooks/useSwipeBack";

interface SwipeBackWrapperProps {
  children: ReactNode;
  enabled?: boolean;
  className?: string;
}

/**
 * Wraps a page with iOS-style swipe-back gesture support.
 * The child page slides right with the finger; a fading dark overlay
 * reveals the previous page underneath.
 *
 * Do NOT use on root tab pages (/, /search, /profile, /messages).
 */
export function SwipeBackWrapper({
  children,
  enabled = true,
  className,
}: SwipeBackWrapperProps) {
  const { pageRef, overlayRef, onTouchStart, onTouchMove, onTouchEnd } =
    useSwipeBack(enabled);

  return (
    <>
      {/* Dark overlay that sits above the (revealed) previous page. */}
      <div
        ref={overlayRef}
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,1)",
          opacity: 0.4,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        ref={pageRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className={className}
        style={{
          position: "relative",
          minHeight: "100dvh",
          background: "#ffffff",
          willChange: "transform",
          touchAction: "pan-y",
          zIndex: 1,
        }}
      >
        {children}
      </div>
    </>
  );
}
