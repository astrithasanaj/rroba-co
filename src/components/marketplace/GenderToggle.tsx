type Option = "Të gjitha" | "Femra" | "Meshkuj" | "Fëmijë";

export function GenderToggle({
  value,
  onChange,
  options = ["Të gjitha", "Femra", "Meshkuj", "Fëmijë"],
}: {
  value: Option;
  onChange: (v: Option) => void;
  options?: Option[];
}) {
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto">
      {options.map((opt) => {
        const active = opt === value;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
              active
                ? "bg-foreground text-background"
                : "bg-secondary text-foreground/80 hover:bg-secondary/80"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
