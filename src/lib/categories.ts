import { Shirt, Mountain, Archive, Baby, Frame, Speaker, Gamepad2 } from "lucide-react";
import { CATEGORY_TAXONOMY } from "./category-taxonomy";

export type GenderSlug = "femra" | "meshkuj" | "vajza" | "djem" | "all";

export type CategoryDef = {
  slug: string;
  label: string;
  categories: string[]; // values matching listings.category
  hasGender: boolean;
  genderOptions?: { slug: GenderSlug; label: string; dbValue: string; symbol: "♀" | "♂" }[];
};

// Single source of truth: derive DB category values from CATEGORY_TAXONOMY so
// the category route filter can never drift from what sell.tsx writes.
function taxonomyCategories(key: string): string[] {
  const node = CATEGORY_TAXONOMY.find((n) => n.key === key);
  return node ? [...node.categories] : [];
}

const GENDER_META: Record<
  string,
  { hasGender: boolean; genderOptions?: CategoryDef["genderOptions"] }
> = {
  mode: {
    hasGender: true,
    genderOptions: [
      { slug: "femra", label: "Femra", dbValue: "Femra", symbol: "♀" },
      { slug: "meshkuj", label: "Meshkuj", dbValue: "Meshkuj", symbol: "♂" },
    ],
  },
  femije: {
    hasGender: true,
    genderOptions: [
      { slug: "vajza", label: "Vajza", dbValue: "Vajza", symbol: "♀" },
      { slug: "djem", label: "Djem", dbValue: "Djem", symbol: "♂" },
    ],
  },
};

export const CATEGORY_MAP: Record<string, CategoryDef> = Object.fromEntries(
  CATEGORY_TAXONOMY.map((node) => {
    const meta = GENDER_META[node.key] ?? { hasGender: false };
    return [
      node.key,
      {
        slug: node.key,
        label: node.label,
        categories: taxonomyCategories(node.key),
        hasGender: meta.hasGender,
        genderOptions: meta.genderOptions,
      } satisfies CategoryDef,
    ];
  }),
);

export function getCategory(slug: string): CategoryDef | undefined {
  return CATEGORY_MAP[slug];
}

export const SUBCATEGORY_OPTIONS: Record<GenderSlug, string[]> = {
  femra: [
    "Bluza", "Fustane", "T-shirt", "Këmisha", "Pantallona", "Funde",
    "Xhaketa", "Pallto", "Triko", "Shorte", "Kostume banje", "Këpucë",
    "Çanta", "Aksesorë",
  ],
  meshkuj: [
    "Bluza", "T-shirt", "Këmisha", "Pantallona", "Xhaketa", "Pallto",
    "Triko", "Shorte", "Kostume banje", "Këpucë", "Çanta", "Aksesorë",
  ],
  vajza: [
    "Bluza", "T-shirt", "Pantallona", "Fustane", "Xhaketa", "Pallto",
    "Triko", "Shorte", "Pizhame", "Këpucë", "Aksesorë",
  ],
  djem: [
    "Bluza", "T-shirt", "Pantallona", "Xhaketa", "Pallto",
    "Triko", "Shorte", "Pizhame", "Këpucë", "Aksesorë",
  ],
  all: [],
};


export const HOME_CATEGORIES = [
  {
    key: "mode",
    label: "Modë & aksesorë",
    Icon: Shirt,
    boxColor: "#f0e0d8",
    iconColor: "#b85c3e",
  },
  {
    key: "outdoor",
    label: "Outdoor & sport",
    Icon: Mountain,
    boxColor: "#e3e8dc",
    iconColor: "#6b7c5b",
  },
  {
    key: "interior",
    label: "Interier & mobilie",
    Icon: Archive,
    boxColor: "#e1e7ed",
    iconColor: "#6e849e",
  },
  {
    key: "femije",
    label: "Fëmijë & bebe",
    Icon: Baby,
    boxColor: "#f8e8dc",
    iconColor: "#d9966e",
  },
  {
    key: "art",
    label: "Art & dizajn",
    Icon: Frame,
    boxColor: "#f2ead6",
    iconColor: "#b89255",
  },
  {
    key: "elektronik",
    label: "Elektronikë & zë",
    Icon: Speaker,
    boxColor: "#e0e8e6",
    iconColor: "#5e7d87",
  },
  {
    key: "hobi",
    label: "Hobi",
    Icon: Gamepad2,
    boxColor: "#ece3f0",
    iconColor: "#7a5e94",
  },
] as const;
