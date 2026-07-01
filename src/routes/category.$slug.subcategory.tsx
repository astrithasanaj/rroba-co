import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { MobileShell } from "@/components/marketplace/MobileShell";
import { getCategory, CATEGORY_SUBCATEGORIES } from "@/lib/categories";

const BG = "#f6f1e7";
const CARD = "#ede8de";
const CHIP = "#ede8de";
const INK = "#1a1a1a";
const DISABLED = "#ddd8ce";

export const Route = createFileRoute("/category/$slug/subcategory")({
  component: SubcategorySelectPage,
});

function SubcategorySelectPage() {
  const { slug } = useParams({ from: "/category/$slug/subcategory" });
  const navigate = useNavigate();
  const def = getCategory(slug);
  const subcategories = CATEGORY_SUBCATEGORIES[slug] ?? [];
  const [selected, setSelected] = useState<string[]>([]);

  if (!def || subcategories.length === 0) {
    navigate({ to: "/category/$slug/$gender", params: { slug, gender: "all" }, replace: true });
    return null;
  }

  const toggle = (s: string) =>
    setSelected((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const goAll = () =>
    navigate({ to: "/category/$slug/$gender", params: { slug, gender: "all" } });

  const applyFilters = () => {
    if (selected.length === 0) return;
    navigate({
      to: "/category/$slug/$gender",
      params: { slug, gender: "all" },
      search: { subcategories: selected.join(",") } as never,
    });
  };

  return (
    <MobileShell>
      <div style={{ backgroundColor: BG, minHeight: "100vh" }} className="pb-32">
        <header className="relative flex items-center justify-center px-5 pt-6 pb-2">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="absolute left-5 top-6 grid h-10 w-10 place-items-center rounded-full"
            style={{ backgroundColor: CARD }}
            aria-label="Kthehu"
          >
            <ChevronLeft className="h-5 w-5" style={{ color: INK }} />
          </button>
          <h1 className="text-[17px] font-bold" style={{ color: INK }}>
            {def.label}
          </h1>
        </header>

        <div className="px-5 pt-8">
          <h3 className="text-[18px] font-bold" style={{ color: INK }}>
            Çfarë je duke kërkuar?
          </h3>

          <div className="mt-3 grid grid-cols-3 gap-2">
            {subcategories.map((s) => {
              const active = selected.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggle(s)}
                  className="rounded-full px-3 py-2 text-[13px] font-medium transition-colors"
                  style={{
                    backgroundColor: active ? INK : CHIP,
                    color: active ? "#fff" : INK,
                  }}
                >
                  {s}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={goAll}
            className="mt-6 flex h-12 w-full items-center justify-center rounded-full border text-[14px] font-semibold"
            style={{ borderColor: INK, color: INK, backgroundColor: "transparent" }}
          >
            Shiko të gjitha
          </button>

          <button
            type="button"
            onClick={applyFilters}
            disabled={selected.length === 0}
            className="mt-3 flex h-12 w-full items-center justify-center rounded-full text-[14px] font-semibold transition-colors"
            style={{
              backgroundColor: selected.length === 0 ? DISABLED : INK,
              color: selected.length === 0 ? "#8a8275" : "#fff",
            }}
          >
            Apliko filtrat
          </button>
        </div>
      </div>
    </MobileShell>
  );
}
