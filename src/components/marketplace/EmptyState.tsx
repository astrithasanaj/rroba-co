import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-8 py-20 text-center">
      {icon && (
        <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-secondary text-foreground/70">
          {icon}
        </div>
      )}
      <h3 className="font-display text-2xl">{title}</h3>
      {description && (
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-6 w-full max-w-xs">{action}</div>}
    </div>
  );
}
