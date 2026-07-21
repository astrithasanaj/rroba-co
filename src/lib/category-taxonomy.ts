// Full category taxonomy used by the Tise-style category picker.
// The "categories" values map to listings.category in the DB; subcategory
// selections are matched against the listing title.

export type SubcategoryNode = {
  label: string;
  children?: string[]; // leaf subcategory names
};

export type CategoryNode = {
  key: string;
  label: string;
  categories: string[]; // DB values for listings.category
  groups: SubcategoryNode[];
};

// Only these categories carry a gender on listings and should be filtered by
// preferences.genders. Everything else (Interier, Outdoor, Art, Elektronikë,
// Hobi, …) is neutral and must always pass personalization.
export const GENDER_SPECIFIC_CATEGORIES: readonly string[] = [
  "Veshje",
  "Këpucë",
  "Aksesorë",
  "Çanta",
];

export function isGenderSpecificCategory(category: string | null | undefined): boolean {
  return !!category && GENDER_SPECIFIC_CATEGORIES.includes(category);
}

export const CATEGORY_TAXONOMY: CategoryNode[] = [
  {
    key: "mode",
    label: "Modë & aksesorë",
    categories: ["Veshje", "Këpucë", "Aksesorë", "Çanta"],
    groups: [
      {
        label: "Veshje",
        children: [
          "Bluza", "Fustane", "T-shirt", "Këmisha", "Pantallona", "Funde",
          "Xhaketa", "Pallto", "Triko", "Shorte", "Kostume banje", "Pizhame", "Të tjera",
        ],
      },
      {
        label: "Çanta",
        children: ["Çanta dore", "Çanta shpine", "Çanta udhëtimi", "Portofol", "Të tjera"],
      },
      {
        label: "Këpucë",
        children: ["Të përditshme", "Sportet", "Me taka", "Sandale", "Çizme", "Të tjera"],
      },
      {
        label: "Aksesorë",
        children: ["Kapele", "Shall & doreza", "Rripa", "Syze", "Bizhuteri", "Ora", "Të tjera"],
      },
      {
        label: "Kozmetikë & bukuri",
        children: ["Parfume", "Kujdes lëkure", "Make-up", "Flokë", "Të tjera"],
      },
      { label: "Vintage & koleksione" },
      { label: "Designer/Premium" },
      { label: "Të tjera" },
    ],
  },
  {
    key: "femije",
    label: "Fëmijë & bebe",
    categories: ["Fëmijë & bebe"],
    groups: [
      {
        label: "Vajza",
        children: ["Veshje", "Këpucë", "Lodra", "Karrocë", "Aksesorë bebeje", "Të tjera"],
      },
      {
        label: "Djem",
        children: ["Veshje", "Këpucë", "Lodra", "Karrocë", "Aksesorë bebeje", "Të tjera"],
      },
      {
        label: "Bebe",
        children: ["Veshje", "Këpucë", "Të tjera"],
      },
    ],
  },
  {
    key: "interior",
    label: "Interier & mobilie",
    categories: ["Interier & mobilie"],
    groups: [
      { label: "Mobilje" },
      { label: "Dekor" },
      { label: "Ndriçim" },
      { label: "Kuzhinë" },
      { label: "Tekstil" },
      { label: "Të tjera" },
    ],
  },
  {
    key: "outdoor",
    label: "Outdoor & sport",
    categories: ["Outdoor & sport"],
    groups: [
      { label: "Veshje sportive" },
      { label: "Këpucë sportive" },
      { label: "Bicikletë" },
      { label: "Kampim" },
      { label: "Ski & dëborë" },
      { label: "Fitness" },
      { label: "Të tjera" },
    ],
  },
  {
    key: "art",
    label: "Art & dizajn",
    categories: ["Art & dizajn"],
    groups: [
      { label: "Pikturë" },
      { label: "Print & poster" },
      { label: "Fotografi" },
      { label: "Skulpturë" },
      { label: "Dekor" },
      { label: "Të tjera" },
    ],
  },
  {
    key: "elektronik",
    label: "Elektronikë & zë",
    categories: ["Elektronikë & zë"],
    groups: [
      { label: "Telefona" },
      { label: "Kompjuterë" },
      { label: "Audio" },
      { label: "Kamera" },
      { label: "Aksesorë" },
      { label: "Të tjera" },
    ],
  },
  {
    key: "hobi",
    label: "Hobi",
    categories: ["Hobi"],
    groups: [
      { label: "Libra" },
      { label: "Muzikë & instrumente" },
      { label: "Lojra tavoline & kartela" },
      { label: "Koleksione" },
      { label: "Foto & kamera" },
      { label: "Krijime me duar" },
      { label: "Kafshë shtëpiake" },
      { label: "Bileta koncerti & ngjarje" },
      { label: "Të tjera" },
    ],
  },
];

export type CategorySelection = {
  // main category keys fully selected (all-of)
  categories: Set<string>;
  // "categoryKey::subLabel" pairs (leaf or group)
  subcategories: Set<string>;
};

export function emptySelection(): CategorySelection {
  return { categories: new Set(), subcategories: new Set() };
}

export function cloneSelection(s: CategorySelection): CategorySelection {
  return {
    categories: new Set(s.categories),
    subcategories: new Set(s.subcategories),
  };
}

export function selectionCount(s: CategorySelection): number {
  return s.categories.size + s.subcategories.size;
}

// Collect all leaf subcategory labels for a given group (including the group label itself when no children)
export function groupLeafLabels(group: SubcategoryNode): string[] {
  return group.children && group.children.length > 0 ? group.children : [group.label];
}

// Returns the DB category values selected (from full-category selections)
export function selectedDbCategories(s: CategorySelection): string[] {
  const out = new Set<string>();
  for (const node of CATEGORY_TAXONOMY) {
    if (s.categories.has(node.key)) node.categories.forEach((c) => out.add(c));
  }
  return [...out];
}

// Returns subcategory labels (used for ilike title matching)
export function selectedSubcategoryLabels(s: CategorySelection): string[] {
  const out = new Set<string>();
  for (const key of s.subcategories) {
    const [, label] = key.split("::");
    if (label) out.add(label);
  }
  return [...out];
}

// Returns a human summary chip label list
export function selectionChips(s: CategorySelection): { id: string; label: string }[] {
  const chips: { id: string; label: string }[] = [];
  for (const node of CATEGORY_TAXONOMY) {
    if (s.categories.has(node.key)) chips.push({ id: `cat:${node.key}`, label: node.label });
  }
  for (const sub of s.subcategories) {
    const [key, label] = sub.split("::");
    if (label) chips.push({ id: `sub:${sub}`, label });
    void key;
  }
  return chips;
}
