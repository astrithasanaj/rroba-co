import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export function MobileShell({
  children,
  hideNav = false,
}: {
  children: ReactNode;
  hideNav?: boolean;
}) {
  return (
    <div className="min-h-screen bg-muted/40">
      <div className="relative mx-auto min-h-screen w-full max-w-[480px] bg-background pb-[72px]">
        {children}
        {!hideNav && <BottomNav />}
      </div>
    </div>
  );
}
