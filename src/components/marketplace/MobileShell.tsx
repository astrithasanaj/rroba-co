import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export function MobileShell({
  children,
  hideNav = false,
  fixed = false,
}: {
  children: ReactNode;
  hideNav?: boolean;
  /** When true, the shell locks to 100dvh with no page-level scroll — the caller
   * owns an inner scroll container. Prevents PWA/mobile viewport jumping. */
  fixed?: boolean;
}) {
  if (fixed) {
    return (
      <div
        className="bg-muted/40"
        style={{ height: "100dvh", overflow: "hidden" }}
      >
        <div
          className="relative mx-auto w-full max-w-[480px] bg-background"
          style={{ height: "100dvh", overflow: "hidden" }}
        >
          {children}
          {!hideNav && <BottomNav />}
        </div>
      </div>
    );
  }
  return (
    <div className="bg-muted/40" style={{ minHeight: "100dvh" }}>
      <div
        className="relative mx-auto w-full max-w-[480px] bg-background pb-[90px]"
        style={{ minHeight: "100dvh" }}
      >
        {children}
        {!hideNav && <BottomNav />}
      </div>
    </div>
  );
}
