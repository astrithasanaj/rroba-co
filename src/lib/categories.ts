export type GenderSlug = "femra" | "meshkuj" | "vajza" | "djem" | "all";

export type CategoryDef = {
  slug: string;
  label: string;
  categories: string[]; // values matching listings.category
  hasGender: boolean;
  genderOptions?: { slug: GenderSlug; label: string; dbValue: string; symbol: "♀" | "♂" }[];
};

export const CATEGORY_MAP: Record<string, CategoryDef> = {
  mode: {
    slug: "mode",
    label: "Modë & aksesorë",
    categories: ["Veshje", "Këpucë", "Aksesorë"],
    hasGender: true,
    genderOptions: [
      { slug: "femra", label: "Femra", dbValue: "Femra", symbol: "♀" },
      { slug: "meshkuj", label: "Meshkuj", dbValue: "Meshkuj", symbol: "♂" },
    ],
  },
  femije: {
    slug: "femije",
    label: "Fëmijë & bebe",
    categories: ["Fëmijë"],
    hasGender: true,
    genderOptions: [
      { slug: "vajza", label: "Vajza", dbValue: "Vajza", symbol: "♀" },
      { slug: "djem", label: "Djem", dbValue: "Djem", symbol: "♂" },
    ],
  },
  outdoor: { slug: "outdoor", label: "Outdoor & sport", categories: ["Outdoor"], hasGender: false },
  interior: { slug: "interior", label: "Interiør & mobilje", categories: ["Interier"], hasGender: false },
  art: { slug: "art", label: "Art & dizajn", categories: ["Art"], hasGender: false },
  elektronik: { slug: "elektronik", label: "Elektronikë & zë", categories: ["Elektronikë"], hasGender: false },
  hobi: { slug: "hobi", label: "Hobi", categories: ["Hobi"], hasGender: false },
};

export function getCategory(slug: string): CategoryDef | undefined {
  return CATEGORY_MAP[slug];
}
