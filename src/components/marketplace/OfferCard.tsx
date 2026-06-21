export function OfferCard({
  amount,
  status = "Në pritje",
}: {
  amount: number;
  status?: "Në pritje" | "Pranuar" | "Refuzuar";
}) {
  const tone =
    status === "Pranuar"
      ? "bg-accent/30 text-foreground"
      : status === "Refuzuar"
      ? "bg-destructive/15 text-destructive"
      : "bg-secondary text-foreground/80";
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Ofertë
        </p>
        <p className="font-display text-2xl">€{amount}</p>
      </div>
      <span className={`rounded-full px-3 py-1 text-xs font-medium ${tone}`}>
        {status}
      </span>
    </div>
  );
}
