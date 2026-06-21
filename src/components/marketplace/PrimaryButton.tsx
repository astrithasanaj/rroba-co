import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

export function PrimaryButton({
  variant = "primary",
  className = "",
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
}) {
  const styles: Record<Variant, string> = {
    primary: "bg-foreground text-background hover:bg-foreground/90",
    secondary:
      "bg-secondary text-foreground hover:bg-secondary/80 border border-border",
    ghost: "bg-transparent text-foreground hover:bg-secondary",
  };
  return (
    <button
      {...rest}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-semibold transition disabled:opacity-50 ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
