import type { ReactNode } from "react";

export function MobileShell({
  children,
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
        className="page-wrapper page-wrapper-fixed bg-muted/40"
      >
        <div
          className="relative mx-auto w-full max-w-[480px] bg-background"
          style={{ height: "100%", overflow: "hidden" }}
        >
          {children}
        </div>
      </div>
    );
  }
  return (
    <div className="page-wrapper bg-muted/40">
      <div
        className="relative mx-auto w-full max-w-[480px] bg-background"
        style={{ minHeight: "100%" }}
      >
        {children}
      </div>
    </div>
  );
}
