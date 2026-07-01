import { useRef, useEffect } from "react";

const EDGE_THRESHOLD = 20;
const COMPLETE_THRESHOLD = 0.4;
const EASING = "cubic-bezier(0.25, 0.46, 0.45, 0.94)";

/**
 * iOS-style swipe-back gesture.
 * Attach the returned refs/handlers to a full-viewport wrapper.
 */
export function useSwipeBack(enabled: boolean = true) {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const active = useRef(false);
  const canGoBack = useRef(true);

  useEffect(() => {
    // If there's no history to go back to, disable.
    try {
      canGoBack.current = window.history.length > 1;
    } catch {
      canGoBack.current = false;
    }
  }, []);

  const reset = () => {
    touchStartX.current = null;
    touchStartY.current = null;
    active.current = false;
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (!enabled || !canGoBack.current) return;
    const touch = e.touches[0];
    if (touch.clientX > EDGE_THRESHOLD) return;

    const target = e.target as HTMLElement | null;
    if (
      target?.closest(
        ".image-carousel, .category-scroll, .bottom-sheet, [data-no-swipe-back], [data-radix-scroll-area-viewport]"
      )
    ) {
      return;
    }

    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    active.current = false;
    if (pageRef.current) pageRef.current.style.transition = "none";
    if (overlayRef.current) overlayRef.current.style.transition = "none";
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - (touchStartY.current ?? 0);

    if (!active.current) {
      if (Math.abs(dy) > Math.abs(dx)) {
        reset();
        return;
      }
      if (dx < 8) return;
      active.current = true;
    }

    if (dx < 0) return;
    if (e.cancelable) e.preventDefault();

    if (pageRef.current) {
      pageRef.current.style.transform = `translateX(${dx}px)`;
    }
    if (overlayRef.current) {
      const progress = Math.min(1, dx / window.innerWidth);
      overlayRef.current.style.opacity = String(0.4 - progress * 0.4);
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const screenWidth = window.innerWidth;
    const wasActive = active.current;
    reset();

    if (!pageRef.current) return;
    pageRef.current.style.transition = `transform 300ms ${EASING}`;
    if (overlayRef.current) {
      overlayRef.current.style.transition = `opacity 300ms ${EASING}`;
    }

    if (wasActive && dx > screenWidth * COMPLETE_THRESHOLD) {
      pageRef.current.style.transform = `translateX(${screenWidth}px)`;
      if (overlayRef.current) overlayRef.current.style.opacity = "0";
      window.setTimeout(() => {
        window.history.back();
      }, 280);
    } else {
      pageRef.current.style.transform = "translateX(0)";
      if (overlayRef.current) overlayRef.current.style.opacity = "0.4";
    }
  };

  return { pageRef, overlayRef, onTouchStart, onTouchMove, onTouchEnd };
}
