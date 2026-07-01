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

export const CATEGORY_TAXONOMY: CategoryNode[] = [
  {
    key: "mode",
    label: "Modë & aksesorë",
    categories: ["Veshje", "Këpucë", "Aksesorë"],
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
    categories: ["Fëmijë"],
    groups: [
      { label: "Veshje fëmijësh", children: ["Vajza", "Djem", "Bebe", "Të tjera"] },
      { label: "Këpucë fëmijësh", children: ["Vajza", "Djem", "Bebe"] },
      {
        label: "Lodra",
        children: ["Lodra të buta", "Lego & ndërtim", "Kukulla", "Automjete", "Edukative", "Të tjera"],
      },
      {
        label: "Pajisje bebeje",
        children: ["Karrocë", "Djep & krevat", "Ushqyerje", "Siguri", "Të tjera"],
      },
      { label: "Libra & shkollë" },
      { label: "Të tjera" },
    ],
  },
  {
    key: "interior",
    label: "Interiør & mobilje",
    categories: ["Interier"],
    groups: [
      {
        label: "Dhoma e ndenjes",
        children: ["Sofa & kolltuk", "Tavolinë kafeje", "Raft & bufe", "Qilim", "Të tjera"],
      },
      {
        label: "Dhoma gjumit",
        children: ["Krevat & dyshek", "Dollap", "Komodinë", "Të tjera"],
      },
      {
        label: "Kuzhinë",
        children: ["Tavolina & karrige", "Enë & takëm", "Pajisje kuzhine", "Të tjera"],
      },
      {
        label: "Dekor",
        children: ["Llamba & ndriçim", "Pasqyra", "Bimë & vazo", "Tabllo & poster", "Të tjera"],
      },
      { label: "Antikvitete & koleksione" },
      { label: "Tekstil shtëpiak" },
      { label: "Të tjera" },
    ],
  },
  {
    key: "outdoor",
    label: "Outdoor & sport",
    categories: ["Outdoor"],
    groups: [
      { label: "Veshje sportive", children: ["Femra", "Meshkuj", "Fëmijë"] },
      { label: "Këpucë sportive", children: ["Vrapim", "Futboll", "Basketboll", "Të tjera"] },
      { label: "Fitness", children: ["Pajisje fitness", "Shtanga & pesë", "Yoga & pilates", "Të tjera"] },
      { label: "Futboll", children: ["Topa", "Fanella", "Këpucë futbolli", "Pajisje", "Të tjera"] },
      { label: "Vrapim & çiklizëm", children: ["Bicikleta", "Pajisje vrapimi", "Të tjera"] },
      { label: "Kampim & hiking" },
      { label: "Ski & borë" },
      { label: "Raketa & top" },
      { label: "Të tjera" },
    ],
  },
  {
    key: "art",
    label: "Art & dizajn",
    categories: ["Art"],
    groups: [
      { label: "Pikturë & vizatim" },
      { label: "Print & poster" },
      { label: "Fotografi" },
      { label: "Skulpturë & qeramikë" },
      { label: "Tekstil dekorativ & qëndisje" },
      { label: "Krijime artizanale" },
      { label: "Të tjera" },
    ],
  },
  {
    key: "elektronik",
    label: "Elektronikë & zë",
    categories: ["Elektronikë"],
    groups: [
      {
        label: "Apple",
        children: ["iPhone", "iPad", "MacBook", "AirPods", "Apple Watch", "Aksesorë Apple"],
      },
      {
        label: "Telefona & tableta",
        children: ["Samsung", "Huawei", "Të tjera Android"],
      },
      { label: "Laptopë & kompjuterë" },
      { label: "Kufje & altoparlantë" },
      { label: "Kamera & foto" },
      { label: "Konsolë lojrash" },
      { label: "Aksesorë elektronikë" },
      { label: "Të tjera" },
    ],
  },
  {
    key: "hobi",
    label: "Hobi",
    categories: ["Hobi"],
    groups: [
      { label: "Libra" },
      { label: "Libra shkollore & universitare" },
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
