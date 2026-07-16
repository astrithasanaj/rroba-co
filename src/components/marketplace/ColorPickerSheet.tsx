import { useEffect, useState } from "react";
import { ChevronLeft, ArrowLeft } from "lucide-react";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";

export type ColorOption = {
  name: string;
  inner: string;
  innerRing?: string;
  selectedBorder: string;
};

export const COLOR_OPTIONS: ColorOption[] = [
  { name: "E zezë", inner: "#1a1a1a", selectedBorder: "#2d1521" },
  { name: "Gri", inner: "#9e9e9e", selectedBorder: "#9e9e9e" },
  { name: "E bardhë", inner: "#f5f5f5", innerRing: "#c8c3b9", selectedBorder: "#c8c3b9" },
  { name: "Shumëngjyrësh", inner: "rainbow", selectedBorder: "#2d1521" },
  { name: "Bezhë", inner: "#d4b896", selectedBorder: "#bca07d" },
  { name: "E gjelbër", inner: "#43a047", selectedBorder: "#2e7d32" },
  { name: "Kaki", inner: "#8a8c5a", selectedBorder: "#6b6d45" },
  { name: "Blu", inner: "#42a5f5", selectedBorder: "#1976d2" },
  { name: "Blu marine", inner: "#1a237e", selectedBorder: "#2d1521" },
  { name: "Turkez", inner: "#26c6da", selectedBorder: "#0097a7" },
  { name: "Vjollcë", inner: "#8e24aa", selectedBorder: "#6a1b9a" },
  { name: "Rozë", inner: "#f48fb1", selectedBorder: "#c2185b" },
  { name: "E kuqe", inner: "#e53935", selectedBorder: "#c62828" },
  { name: "Burgundy", inner: "#7b1a2a", selectedBorder: "#2d1521" },
  { name: "Kafe", inner: "#8B5E3C", selectedBorder: "#5d4037" },
  { name: "Portokalli", inner: "#fb8c00", selectedBorder: "#ef6c00" },
  { name: "E verdhë", inner: "#fdd835", selectedBorder: "#fbc02d" },
  { name: "Argjend", inner: "#c0c0c0", selectedBorder: "#9e9e9e" },
  { name: "Ari", inner: "#d4af37", selectedBorder: "#b8860b" },
];

const RAINBOW =
  "conic-gradient(from 0deg, #ff3b3b, #ffb13b, #ffe93b, #4ade80, #22d3ee, #6366f1, #d946ef, #ff3b3b)";

export function ColorPickerSheet({
  open,
  onOpenChange,
  value,
  onChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (open) setSelected(value);
  }, [open, value]);

  const toggle = (name: string) => {
    setSelected((prev) => {
      if (prev.includes(name)) return prev.filter((n) => n !== name);
      if (prev.length >= 2) return [...prev.slice(1), name];
      return [...prev, name];
    });
  };

  const confirm = () => {
    onChange(selected);
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#ffffff",
        zIndex: 60,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        className="shrink-0"
        style={{
          background: "#2d1521",
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)",
          paddingBottom: 12,
          paddingLeft: 16,
          paddingRight: 16,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          aria-label="Kthehu"
          className="grid place-items-center rounded-full transition-transform duration-150 active:scale-90"
          style={{
            width: 36,
            height: 36,
            backgroundColor: "rgba(255,255,255,0.12)",
          }}
        >
          <ChevronLeft size={18} color="#ffffff" strokeWidth={2} />
        </button>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <h2 className="text-base font-medium" style={{ color: "#ffffff" }}>
            Zgjedh ngjyrën
          </h2>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>
            Mund të zgjedhësh deri në dy ngjyra.
          </p>
        </div>
      </div>

        <div className="flex-1 overflow-y-auto px-5 pb-6">
          <div className="grid grid-cols-4 gap-x-3 gap-y-5">
            {COLOR_OPTIONS.map((opt) => {
              const active = selected.includes(opt.name);
              return (
                <button
                  key={opt.name}
                  type="button"
                  onClick={() => toggle(opt.name)}
                  className="flex flex-col items-center gap-2"
                >
                  <div
                    className="relative flex h-[72px] w-[72px] items-center justify-center rounded-full transition"
                    style={{
                      background: "#e2e2de",
                      boxShadow: active ? `0 0 0 2px ${opt.selectedBorder} inset` : undefined,
                    }}
                  >
                    <div
                      className="h-11 w-11 rounded-full"
                      style={{
                        background: opt.inner === "rainbow" ? RAINBOW : opt.inner,
                        boxShadow: opt.innerRing ? `0 0 0 1.5px ${opt.innerRing} inset` : undefined,
                      }}
                    />
                  </div>
                  <span className="text-center text-[11px] font-medium" style={{ color: "#2d1521" }}>
                    {opt.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div
          className="shrink-0 px-5 pt-3"
          style={{
            background: "#ffffff",
            paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)",
          }}
        >
          <button
            type="button"
            onClick={confirm}
            disabled={selected.length === 0}
            className="w-full rounded-[14px] py-4 text-sm font-semibold text-white transition disabled:opacity-100"
            style={{ background: selected.length ? "linear-gradient(120deg, #e8836a, #c65a7a)" : "#c8c3b9" }}
          >
            Konfirmo
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
