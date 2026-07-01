import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { MobileShell } from "@/components/marketplace/MobileShell";
import { getCategory, SUBCATEGORY_OPTIONS, type GenderSlug } from "@/lib/categories";

const BG = "#f6f1e7";
const CARD = "#ede8de";
const CHIP = "#ede8de";
const INK = "#1a1a1a";
const CORAL = "#e8826a";
const DISABLED = "#ddd8ce";

export const Route = createFileRoute("/category/$slug/choose-gender")({
  component: GenderSelectPage,
});

function GenderSelectPage() {
  const { slug } = useParams({ from: "/category/$slug/choose-gender" });
  const navigate = useNavigate();
  const def = getCategory(slug);
  const [selectedGender, setSelectedGender] = useState<GenderSlug | null>(null);
  const [selectedSubs, setSelectedSubs] = useState<string[]>([]);

  if (!def || !def.hasGender || !def.genderOptions) {
    navigate({ to: "/category/$slug/$gender", params: { slug, gender: "all" }, replace: true });
    return null;
  }

  const subcategories = selectedGender ? SUBCATEGORY_OPTIONS[selectedGender] ?? [] : [];

  const toggleSub = (s: string) => {
    setSelectedSubs((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  };

  const pickGender = (g: GenderSlug) => {
    if (selectedGender !== g) {
      setSelectedGender(g);
      setSelectedSubs([]);
    }
  };

  const goAll = () => {
    if (!selectedGender) return;
    navigate({
      to: "/category/$slug/$gender",
      params: { slug, gender: selectedGender },
    });
  };

  const applyFilters = () => {
    if (!selectedGender || selectedSubs.length === 0) return;
    navigate({
      to: "/category/$slug/$gender",
      params: { slug, gender: selectedGender },
      search: { subcategories: selectedSubs.join(",") } as never,
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
          <h2 className="text-[22px] font-bold leading-tight" style={{ color: INK }}>
            Për kend po kërkon?
          </h2>

          <div className="mt-6 grid grid-cols-2 gap-3">
            {def.genderOptions.map((g) => {
              const active = selectedGender === g.slug;
              return (
                <button
                  key={g.slug}
                  type="button"
                  onClick={() => pickGender(g.slug)}
                  className="flex flex-col items-center justify-center rounded-2xl transition-all"
                  style={{
                    backgroundColor: CARD,
                    height: 140,
                    color: INK,
                    border: `2px solid ${active ? CORAL : "transparent"}`,
                  }}
                >
                  <span style={{ fontSize: 36, lineHeight: 1, color: INK }}>{g.symbol}</span>
                  <span className="mt-3 text-[15px] font-bold" style={{ color: INK }}>
                    {g.label}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedGender && (
            <div
              key={selectedGender}
              className="animate-fade-in"
              style={{ animationDuration: "200ms" }}
            >
              <h3
                className="mt-5 text-[18px] font-bold"
                style={{ color: INK }}
              >
                Çfarë je duke kërkuar?
              </h3>

              <div className="mt-3 grid grid-cols-3 gap-2">
                {subcategories.map((s) => {
                  const active = selectedSubs.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSub(s)}
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
            </div>
          )}

          <button
            type="button"
            onClick={goAll}
            disabled={!selectedGender}
            className="mt-5 flex h-12 w-full items-center justify-center rounded-full border text-[14px] font-semibold disabled:opacity-50"
            style={{ borderColor: INK, color: INK, backgroundColor: "transparent" }}
          >
            Shiko të gjitha
          </button>

          {selectedGender && (
            <button
              type="button"
              onClick={applyFilters}
              disabled={selectedSubs.length === 0}
              className="mt-3 flex h-12 w-full items-center justify-center rounded-full text-[14px] font-semibold transition-colors"
              style={{
                backgroundColor: selectedSubs.length === 0 ? DISABLED : INK,
                color: selectedSubs.length === 0 ? "#8a8275" : "#fff",
              }}
            >
              Apliko filtrat
            </button>
          )}
        </div>
      </div>
    </MobileShell>
  );
}
