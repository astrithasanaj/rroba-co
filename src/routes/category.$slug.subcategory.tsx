import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { MobileShell } from "@/components/marketplace/MobileShell";
import { getCategory } from "@/lib/categories";
import { CATEGORY_TAXONOMY } from "@/lib/category-taxonomy";
import { SwipeBackWrapper } from "@/components/SwipeBackWrapper";
import { useTranslation } from "@/i18n";
import { tCategory } from "@/i18n/tCategory";

const BG = "var(--brand-surface)";
const CHIP = "var(--brand-surface)";
const INK = "var(--brand-ink)";
const DISABLED = "var(--brand-border)";

export const Route = createFileRoute("/category/$slug/subcategory")({
  component: () => (
    <SwipeBackWrapper>
      <SubcategorySelectPage />
    </SwipeBackWrapper>
  ),
});

function SubcategorySelectPage() {
  const { slug } = useParams({ from: "/category/$slug/subcategory" });
  const navigate = useNavigate();
  const { t } = useTranslation();
  const def = getCategory(slug);
  const subcategories = useMemo<string[]>(() => {
    const node = CATEGORY_TAXONOMY.find((n) => n.key === slug);
    return node ? node.groups.map((g) => g.label) : [];
  }, [slug]);
  const [selected, setSelected] = useState<string[]>([]);

  if (!def || subcategories.length === 0) {
    navigate({ to: "/category/$slug/$gender", params: { slug, gender: "all" }, replace: true });
    return null;
  }

  const toggle = (s: string) =>
    setSelected((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const goAll = () => navigate({ to: "/category/$slug/$gender", params: { slug, gender: "all" } });

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
            aria-label={t("common.back")}
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
            {tCategory(def.label, t)}
          </h1>
        </header>

        <div className="px-5 pt-8">
          <h3 className="text-[18px] font-bold" style={{ color: INK }}>
            {t("category.what_looking_for")}
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
                    backgroundColor: active ? INK : "transparent",
                    color: active ? "var(--brand-surface)" : INK,
                    border: active ? "none" : "1px solid var(--brand-border)",
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
            {t("common.seeAll")}
          </button>

          <button
            type="button"
            onClick={applyFilters}
            disabled={selected.length === 0}
            className="mt-3 flex h-12 w-full items-center justify-center rounded-full text-[14px] font-semibold transition-colors"
            style={{
              backgroundColor: selected.length === 0 ? DISABLED : INK,
              color: selected.length === 0 ? "var(--brand-ink-secondary)" : "var(--brand-surface)",
            }}
          >
            {t("category.apply_filters")}
          </button>
        </div>
      </div>
    </MobileShell>
  );
}
