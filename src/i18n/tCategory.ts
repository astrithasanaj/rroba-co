// Shared helper to translate category, gender, and subcategory labels
// while preserving the underlying database/source values.
const LABEL_TO_KEY: Record<string, string> = {
  // Top-level categories
  "Modë & aksesorë": "categories.mode",
  "Fëmijë & bebe": "categories.femije",
  "Fëmijë": "categories.femije",
  "Interier & mobilie": "categories.interior",
  "Outdoor & sport": "categories.outdoor",
  "Art & dizajn": "categories.art",
  "Elektronikë & zë": "categories.elektronik",
  "Hobi": "categories.hobi",
  // Genders
  "Femra": "search.gender_femra",
  "Meshkuj": "search.gender_meshkuj",
  "Vajza": "categories.vajza",
  "Djem": "categories.djem",
  "Bebe": "categories.bebe",
  // Subcategories — fashion
  "Veshje": "subcats.veshje",
  "Bluza": "subcats.bluza",
  "Fustane": "subcats.fustane",
  "T-shirt": "subcats.tshirt",
  "Këmisha": "subcats.kemisha",
  "Pantallona": "subcats.pantallona",
  "Funde": "subcats.funde",
  "Xhaketa": "subcats.xhaketa",
  "Pallto": "subcats.pallto",
  "Triko": "subcats.triko",
  "Shorte": "subcats.shorte",
  "Kostume banje": "subcats.kostume_banje",
  "Pizhame": "subcats.pizhame",
  "Të tjera": "subcats.te_tjera",
  // Shoes
  "Këpucë": "subcats.kepuce",
  "Të përditshme": "subcats.te_perditshme",
  "Sportet": "subcats.sportet",
  "Me taka": "subcats.me_taka",
  "Sandale": "subcats.sandale",
  "Çizme": "subcats.cizme",
  // Bags
  "Çanta": "subcats.canta",
  "Çanta dore": "subcats.canta_dore",
  "Çanta shpine": "subcats.canta_shpine",
  "Çanta udhëtimi": "subcats.canta_udhetimi",
  "Portofol": "subcats.portofol",
  // Accessories
  "Aksesorë": "subcats.aksesore",
  "Kapele": "subcats.kapele",
  "Shall & doreza": "subcats.shall_doreza",
  "Rripa": "subcats.rripa",
  "Syze": "subcats.syze",
  "Bizhuteri": "subcats.bizhuteri",
  "Ora": "subcats.ora",
  // Beauty
  "Kozmetikë & bukuri": "subcats.kozmetike",
  "Parfume": "subcats.parfume",
  "Kujdes lëkure": "subcats.kujdes_lekure",
  "Make-up": "subcats.makeup",
  "Flokë": "subcats.floke",
  "Vintage & koleksione": "subcats.vintage",
  "Designer/Premium": "subcats.designer",
  // Kids
  "Lodra": "subcats.lodra",
  "Karrocë": "subcats.karroce",
  "Aksesorë bebeje": "subcats.aksesore_bebeje",
  // Interior
  "Mobilje": "subcats.mobilje",
  "Dekor": "subcats.dekor",
  "Ndriçim": "subcats.ndricim",
  "Kuzhinë": "subcats.kuzhine",
  "Tekstil": "subcats.tekstil",
  // Outdoor
  "Veshje sportive": "subcats.veshje_sportive",
  "Këpucë sportive": "subcats.kepuce_sportive",
  "Bicikletë": "subcats.bicikleta",
  "Kampim": "subcats.kampim",
  "Ski & dëborë": "subcats.ski",
  "Fitness": "subcats.fitness",
  // Art
  "Pikturë": "subcats.pikture",
  "Print & poster": "subcats.print_poster",
  "Fotografi": "subcats.fotografi",
  "Skulpturë": "subcats.skulpture",
  // Electronics
  "Telefona": "subcats.telefona",
  "Kompjuterë": "subcats.kompjutere",
  "Audio": "subcats.audio",
  "Kamera": "subcats.kamera",
  // Hobi
  "Libra": "subcats.libra",
  "Muzikë & instrumente": "subcats.muzike",
  "Lojra tavoline & kartela": "subcats.lojra",
  "Koleksione": "subcats.koleksione",
  "Foto & kamera": "subcats.foto_kamera",
  "Krijime me duar": "subcats.krijime",
  "Kafshë shtëpiake": "subcats.kafshe",
  "Bileta koncerti & ngjarje": "subcats.bileta",
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
