import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";

export type ColorOption = { name: string; swatch: string; ring?: string };

export const COLOR_OPTIONS: ColorOption[] = [
  { name: "E zezë", swatch: "#1a1a1a" },
  { name: "E bardhë", swatch: "#ffffff", ring: "#c8c3b9" },
  { name: "Bezhë", swatch: "#d9c7a7" },
  { name: "Kafe", swatch: "#6b3a2a" },
  { name: "Gri", swatch: "#9aa0a6" },
  { name: "Blu", swatch: "#2f6fed" },
  { name: "E gjelbër", swatch: "#3a8f4f" },
  { name: "E kuqe", swatch: "#d8352a" },
  { name: "E verdhë", swatch: "#f4cf3a" },
  { name: "Portokalli", swatch: "#ef7a1a" },
  { name: "Rozë", swatch: "#f29bc0" },
  { name: "Vjollcë", swatch: "#7a4ad1" },
  { name: "Shumëngjyrësh", swatch: "rainbow" },
];

function Swatch({ option, selected }: { option: ColorOption; selected?: boolean }) {
  const base = "h-6 w-6 rounded-full shrink-0";
  if (option.swatch === "rainbow") {
    return (
      <span
        className={base}
        style={{
          background:
            "conic-gradient(from 0deg, #ff3b3b, #ffb13b, #ffe93b, #4ade80, #22d3ee, #6366f1, #d946ef, #ff3b3b)",
          boxShadow: selected ? "0 0 0 2px #ffffff inset" : undefined,
        }}
      />
    );
  }
  const ring = selected ? "#ffffff" : option.ring;
  return (
    <span
      className={base}
      style={{
        background: option.swatch,
        boxShadow: ring ? `0 0 0 1.5px ${ring} inset` : undefined,
      }}
    />
  );
}

export function ColorPickerSheet({
  open,
  onOpenChange,
  value,
  onChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  value: string;
  onChange: (v: string) => void;
}) {
  const pick = (name: string) => {
    onChange(name);
    setTimeout(() => onOpenChange(false), 200);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="border-0" style={{ background: "#f6f1e7", maxHeight: "92vh" }}>
        <div className="mx-auto h-1.5 w-12 shrink-0 rounded-full" style={{ background: "#c8c3b9" }} />
        <div className="flex items-center justify-between px-5 pb-3 pt-4">
          <DrawerTitle className="text-base font-medium" style={{ color: "#1a1a1a" }}>
            Zgjedh ngjyrën
          </DrawerTitle>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-full px-4 py-1.5 text-sm font-medium text-white"
            style={{ background: "#1a1a1a" }}
          >
            Mbyll
          </button>
        </div>
        <div className="overflow-y-auto px-5 pb-8">
          <h2 className="mb-5 text-2xl font-bold leading-tight" style={{ color: "#1a1a1a" }}>
            Çfarë ngjyre ka artikulli?
          </h2>
          <div className="grid grid-cols-3 gap-2.5">
            {COLOR_OPTIONS.map((opt) => {
              const active = value === opt.name;
              return (
                <button
                  key={opt.name}
                  onClick={() => pick(opt.name)}
                  className="flex items-center gap-2 rounded-xl px-3 py-3.5 text-left text-sm font-semibold transition"
                  style={{
                    background: active ? "#1a1a1a" : "#e8e3d9",
                    color: active ? "#ffffff" : "#1a1a1a",
                    minHeight: 52,
                  }}
                >
                  <Swatch option={opt} selected={active} />
                  <span className="truncate">{opt.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
