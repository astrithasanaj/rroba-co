import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { MobileShell } from "@/components/marketplace/MobileShell";
import { getCategory, SUBCATEGORY_OPTIONS, type GenderSlug } from "@/lib/categories";
import { SwipeBackWrapper } from "@/components/SwipeBackWrapper";

const BG = "var(--brand-surface)";
const CARD = "var(--brand-surface)";
const CHIP = "var(--brand-surface)";
const INK = "var(--brand-ink)";
const CORAL = "var(--brand-rose)";
const DISABLED = "var(--brand-border)";

export const Route = createFileRoute("/category/$slug/choose-gender")({
  component: () => (
    <SwipeBackWrapper>
      <GenderSelectPage />
    </SwipeBackWrapper>
  ),
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

  const subcategories = selectedGender ? (SUBCATEGORY_OPTIONS[selectedGender] ?? []) : [];

  const toggleSub = (s: string) => {
    setSelectedSubs((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
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
            aria-label="Kthehu"
            className="absolute left-5 top-6 grid place-items-center rounded-full transition-transform duration-150 active:scale-[0.97]"
            style={{
              width: 44,
              height: 44,
              backgroundColor: "rgba(255,255,255,0.7)",
              border: "1px solid rgba(226,226,222,0.8)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          >
            <ChevronLeft size={22} color="var(--brand-ink)" strokeWidth={2} />
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
              <h3 className="mt-5 text-[18px] font-bold" style={{ color: INK }}>
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
                        color: active ? "var(--brand-surface)" : INK,
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
                color:
                  selectedSubs.length === 0 ? "var(--brand-ink-secondary)" : "var(--brand-surface)",
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
