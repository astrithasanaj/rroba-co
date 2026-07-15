import { useEffect, useRef, useState } from "react";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { Ruler, ChevronDown } from "lucide-react";

export type SizeKind =
  | "clothing-femra"
  | "clothing-meshkuj"
  | "clothing-kids"
  | "shoes-femra"
  | "shoes-meshkuj"
  | "shoes-kids"
  | "accessory"
  | "none";

const CLOTHING_ADULT = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL"];
const KIDS_CLOTHING = [
  "0-3 muj", "3-6 muj", "6-12 muj",
  "1-2 vjeç", "2-3 vjeç", "3-4 vjeç", "4-5 vjeç", "5-6 vjeç",
  "6-7 vjeç", "7-8 vjeç", "8-9 vjeç", "9-10 vjeç",
  "10-11 vjeç", "11-12 vjeç", "12-13 vjeç", "13-14 vjeç",
];
const SHOES_FEMRA = ["34", "35", "36", "37", "38", "39", "40", "41", "42"];
const SHOES_MESHKUJ = ["38", "39", "40", "41", "42", "43", "44", "45", "46", "47"];
const SHOES_KIDS = [
  "16","17","18","19","20","21","22","23","24","25",
  "26","27","28","29","30","31","32","33","34","35",
];

const GUIDE_CLOTHING_FEMRA = {
  headers: ["Madhësia", "Gjoksi (cm)", "Beli (cm)", "EU"],
  rows: [
    ["XXS", "76-80", "58-62", "32-34"],
    ["XS", "80-84", "62-66", "34-36"],
    ["S", "84-88", "66-70", "36-38"],
    ["M", "88-92", "70-74", "38-40"],
    ["L", "96-100", "78-82", "42-44"],
    ["XL", "104-108", "86-90", "46-48"],
    ["XXL", "112-116", "94-98", "50-52"],
    ["3XL", "120-124", "102-106", "54-56"],
  ],
};

const GUIDE_CLOTHING_MESHKUJ = {
  headers: ["Madhësia", "Gjoksi (cm)", "Beli (cm)", "EU"],
  rows: [
    ["XXS", "80-84", "64-68", "42-44"],
    ["XS", "84-88", "68-72", "44-46"],
    ["S", "88-92", "72-76", "46-48"],
    ["M", "92-96", "76-80", "48-50"],
    ["L", "100-104", "84-88", "52-54"],
    ["XL", "108-112", "92-96", "56-58"],
    ["XXL", "116-120", "100-104", "60-62"],
    ["3XL", "124-128", "108-112", "64-66"],
  ],
};

const GUIDE_KIDS_CLOTHING = {
  headers: ["Mosha", "Gjatësia (cm)", "Pesha (kg)"],
  rows: [
    ["0-3 muj", "50-60", "3-6"],
    ["3-6 muj", "60-68", "6-8"],
    ["6-12 muj", "68-80", "8-10"],
    ["1-2 vjeç", "80-92", "10-13"],
    ["2-3 vjeç", "92-98", "13-15"],
    ["3-4 vjeç", "98-104", "15-17"],
    ["4-5 vjeç", "104-110", "17-19"],
    ["5-6 vjeç", "110-116", "19-21"],
    ["6-8 vjeç", "116-128", "21-26"],
    ["8-10 vjeç", "128-140", "26-32"],
    ["10-12 vjeç", "140-152", "32-40"],
    ["12-14 vjeç", "152-164", "40-50"],
  ],
};

const GUIDE_SHOES_FEMRA = {
  headers: ["EU", "UK", "US", "cm"],
  rows: [
    ["34", "1.5", "4", "21.5"],
    ["35", "2.5", "5", "22.5"],
    ["36", "3.5", "6", "23"],
    ["37", "4", "6.5", "23.5"],
    ["38", "5", "7.5", "24"],
    ["39", "6", "8.5", "25"],
    ["40", "6.5", "9", "25.5"],
    ["41", "7", "9.5", "26"],
    ["42", "8", "10.5", "26.5"],
  ],
};

const GUIDE_SHOES_MESHKUJ = {
  headers: ["EU", "UK", "US", "cm"],
  rows: [
    ["38", "5", "6", "24"],
    ["39", "6", "7", "25"],
    ["40", "6.5", "7.5", "25.5"],
    ["41", "7", "8", "26"],
    ["42", "8", "9", "26.5"],
    ["43", "9", "10", "27.5"],
    ["44", "9.5", "10.5", "28"],
    ["45", "10.5", "11.5", "29"],
    ["46", "11", "12", "29.5"],
    ["47", "12", "13", "30.5"],
  ],
};

const GUIDE_SHOES_KIDS = {
  headers: ["EU", "cm"],
  rows: [
    ["16", "10"], ["17", "11"], ["18", "11.5"], ["19", "12"], ["20", "12.5"],
    ["21", "13"], ["22", "14"], ["23", "14.5"], ["24", "15"], ["25", "15.5"],
    ["26", "16.5"], ["27", "17"], ["28", "17.5"], ["29", "18.5"], ["30", "19"],
    ["31", "19.5"], ["32", "20.5"], ["33", "21"], ["34", "21.5"], ["35", "22.5"],
  ],
};

/**
 * Decide which size flavour applies for a given sell-flow selection.
 * categoryLabel = top-level category label (e.g. "Modë & aksesorë")
 * gender = "Femra" | "Meshkuj" | "Uniseks" | ""
 * sub = subcategory id from the sell flow (e.g. "Veshje", "Këpucë", ...)
 */
export function resolveSizeKind(
  categoryLabel: string,
  gender: string,
  sub: string,
): SizeKind {
  const isKidsCat = categoryLabel === "Artikuj për fëmijë";
  const s = (sub || "").toLowerCase();

  const clothingSubs = [
    "veshje", "bluza", "t-shirt", "këmisha", "pantallona", "funde",
    "xhaketa", "pallto", "triko", "shorte", "fustane", "kostume banje",
    "pizhame", "fitness", "veshje sportive",
  ];
  const shoeSubs = ["këpucë", "këpucë sportive"];
  const accessorySubs = ["çanta", "çanta dhe tuta", "aksesorë"];

  if (accessorySubs.includes(s)) return "accessory";

  if (shoeSubs.includes(s)) {
    if (isKidsCat) return "shoes-kids";
    return gender === "Meshkuj" ? "shoes-meshkuj" : "shoes-femra";
  }

  if (clothingSubs.includes(s)) {
    if (isKidsCat) return "clothing-kids";
    return gender === "Meshkuj" ? "clothing-meshkuj" : "clothing-femra";
  }

  // Outdoor/Interior/Art/Electronics/etc — no size
  return "none";
}

export function isSizeRequired(kind: SizeKind): boolean {
  return kind !== "accessory" && kind !== "none";
}

export function sizeKindHidden(kind: SizeKind): boolean {
  return kind === "none" || kind === "accessory";
}

function getOptions(kind: SizeKind): string[] {
  switch (kind) {
    case "clothing-femra":
    case "clothing-meshkuj":
      return CLOTHING_ADULT;
    case "clothing-kids":
      return KIDS_CLOTHING;
    case "shoes-femra":
      return SHOES_FEMRA;
    case "shoes-meshkuj":
      return SHOES_MESHKUJ;
    case "shoes-kids":
      return SHOES_KIDS;
    default:
      return [];
  }
}

function getGuide(kind: SizeKind): { headers: string[]; rows: string[][] } {
  switch (kind) {
    case "clothing-femra": return GUIDE_CLOTHING_FEMRA;
    case "clothing-meshkuj": return GUIDE_CLOTHING_MESHKUJ;
    case "clothing-kids": return GUIDE_KIDS_CLOTHING;
    case "shoes-femra": return GUIDE_SHOES_FEMRA;
    case "shoes-meshkuj": return GUIDE_SHOES_MESHKUJ;
    case "shoes-kids": return GUIDE_SHOES_KIDS;
    default: return { headers: [], rows: [] };
  }
}

export function SizePickerSheet({
  open,
  onOpenChange,
  value,
  onChange,
  kind,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  value: string;
  onChange: (v: string) => void;
  kind: SizeKind;
}) {
  const options = getOptions(kind);
  const guide = getGuide(kind);
  const [guideOpen, setGuideOpen] = useState(true);
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open && selectedRef.current) {
      setTimeout(
        () => selectedRef.current?.scrollIntoView({ block: "center", behavior: "smooth" }),
        100,
      );
    }
  }, [open]);

  const pick = (s: string) => {
    onChange(s);
    setTimeout(() => onOpenChange(false), 200);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="border-0" style={{ background: "#ffffff", maxHeight: "92vh" }}>
        <div className="mx-auto h-1.5 w-12 shrink-0 rounded-full" style={{ background: "#c8c3b9" }} />
        <div className="flex items-center justify-between px-5 pb-3 pt-4">
          <DrawerTitle className="text-base font-medium text-foreground">Zgjedh madhësinë</DrawerTitle>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-full px-4 py-1.5 text-sm font-medium text-white"
            style={{ background: "#1a1a1a" }}
          >
            Mbyll
          </button>
        </div>
        <div className="overflow-y-auto px-5 pb-8">
          <h2 className="mb-5 text-2xl font-bold leading-tight">Çfarë madhësie është në etiketë?</h2>
          <div className="grid grid-cols-3 gap-2.5">
            {options.map((s) => {
              const active = value === s;
              return (
                <button
                  key={s}
                  ref={active ? selectedRef : undefined}
                  onClick={() => pick(s)}
                  className="rounded-xl py-3.5 text-sm font-semibold transition"
                  style={
                    active
                      ? { background: "#1a1a1a", color: "#ffffff" }
                      : { background: "#ffffff", color: "#1a1a1a" }
                  }
                >
                  {s}
                </button>
              );
            })}
          </div>

          {guide.rows.length > 0 && (
            <div className="mt-6 overflow-hidden rounded-2xl" style={{ background: "#e8e3d9" }}>
              <button
                onClick={() => setGuideOpen((o) => !o)}
                className="flex w-full items-center justify-between px-4 py-3.5"
              >
                <span className="flex items-center gap-2.5">
                  <Ruler className="h-4 w-4" />
                  <span className="text-sm font-semibold">Udhëzues i madhësive</span>
                </span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${guideOpen ? "rotate-180" : ""}`}
                />
              </button>
              {guideOpen && (
                <div className="overflow-x-auto px-4 pb-4">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-xs uppercase tracking-wider" style={{ color: "#8a8478" }}>
                        {guide.headers.map((h) => (
                          <th key={h} className="py-2 font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {guide.rows.map((row, i) => (
                        <tr key={i} className="border-t" style={{ borderColor: "#d8d3c9" }}>
                          {row.map((cell, j) => (
                            <td
                              key={j}
                              className="py-2.5 pr-3 whitespace-nowrap"
                              style={{
                                color: j === 0 ? "#1a1a1a" : "#8a8478",
                                fontWeight: j === 0 ? 600 : 400,
                              }}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
