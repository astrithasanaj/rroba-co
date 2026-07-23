// Shared helper to translate category and gender labels while preserving DB values.
const LABEL_TO_KEY: Record<string, string> = {
  "Modë & aksesorë": "categories.mode",
  "Fëmijë & bebe": "categories.femije",
  "Fëmijë": "categories.femije",
  "Interier & mobilie": "categories.interior",
  "Outdoor & sport": "categories.outdoor",
  "Art & dizajn": "categories.art",
  "Elektronikë & zë": "categories.elektronik",
  "Hobi": "categories.hobi",
  "Femra": "search.gender_femra",
  "Meshkuj": "search.gender_meshkuj",
  "Vajza": "categories.vajza",
  "Djem": "categories.djem",
  "Bebe": "categories.bebe",
};

export function tCategory(
  label: string,
  translate: (k: string, params?: Record<string, string | number>) => string,
): string {
  const key = LABEL_TO_KEY[label];
  if (!key) return label;
  const out = translate(key);
  return out === key ? label : out;
}
