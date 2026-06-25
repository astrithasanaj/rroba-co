import { useEffect, useRef, useState } from "react";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { Ruler, ChevronDown } from "lucide-react";

type Kind = "clothing" | "shoes" | "kids-clothing" | "kids-shoes" | "accessory";

const CLOTHING_SIZES = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL"];
const SHOE_SIZES = ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"];
const KIDS_AGES = ["0-3M", "3-6M", "6-12M", "1-2Y", "3-4Y", "5-6Y", "7-8Y", "9-10Y", "11-12Y"];
const KIDS_SHOES = ["18", "20", "22", "24", "26", "28", "30", "32", "34"];
const ACCESSORY = ["One size"];

const CLOTHING_GUIDE = [
  ["XXS", "78-82", "60-64", "32"],
  ["XS", "82-86", "64-68", "34"],
  ["S", "86-90", "68-72", "36"],
  ["M", "90-94", "72-76", "38"],
  ["L", "94-100", "76-82", "40"],
  ["XL", "100-106", "82-88", "42"],
  ["XXL", "106-112", "88-94", "44"],
  ["3XL", "112-118", "94-100", "46"],
  ["4XL", "118-124", "100-106", "48"],
];

const SHOE_GUIDE = [
  ["36", "3.5", "5.5", "23"],
  ["37", "4", "6", "23.5"],
  ["38", "5", "7", "24"],
  ["39", "6", "8", "24.5"],
  ["40", "6.5", "8.5", "25"],
  ["41", "7.5", "9.5", "26"],
  ["42", "8", "10", "26.5"],
  ["43", "9", "11", "27"],
  ["44", "9.5", "11.5", "27.5"],
  ["45", "10.5", "12.5", "28.5"],
  ["46", "11", "13", "29"],
];

const KIDS_GUIDE = [
  ["0-3M", "50-60"],
  ["3-6M", "60-68"],
  ["6-12M", "68-76"],
  ["1-2Y", "80-92"],
  ["3-4Y", "98-104"],
  ["5-6Y", "110-116"],
  ["7-8Y", "122-128"],
  ["9-10Y", "134-140"],
  ["11-12Y", "146-152"],
];

const KIDS_SHOE_GUIDE = [
  ["18", "11"],
  ["20", "12"],
  ["22", "13.5"],
  ["24", "15"],
  ["26", "16"],
  ["28", "17.5"],
  ["30", "19"],
  ["32", "20"],
  ["34", "21.5"],
];

export function getSizeKind(gender: string, category: string): Kind {
  const isKid = gender === "Fëmijë";
  const isShoes = category === "Këpucë";
  const isAccessory = category === "Çanta" || category === "Aksesorë";
  if (isAccessory) return "accessory";
  if (isKid && isShoes) return "kids-shoes";
  if (isKid) return "kids-clothing";
  if (isShoes) return "shoes";
  return "clothing";
}

function getOptions(kind: Kind): string[] {
  switch (kind) {
    case "shoes": return SHOE_SIZES;
    case "kids-clothing": return KIDS_AGES;
    case "kids-shoes": return KIDS_SHOES;
    case "accessory": return ACCESSORY;
    default: return CLOTHING_SIZES;
  }
}

function getGuide(kind: Kind): { headers: string[]; rows: string[][] } {
  switch (kind) {
    case "shoes": return { headers: ["EU", "UK", "US", "cm"], rows: SHOE_GUIDE };
    case "kids-clothing": return { headers: ["Mosha", "Gjatësia (cm)"], rows: KIDS_GUIDE };
    case "kids-shoes": return { headers: ["EU", "cm"], rows: KIDS_SHOE_GUIDE };
    case "accessory": return { headers: [], rows: [] };
    default: return { headers: ["Madhësia", "Gjoksi (cm)", "Beli (cm)", "EU"], rows: CLOTHING_GUIDE };
  }
}

export function SizePickerSheet({
  open,
  onOpenChange,
  value,
  onChange,
  gender,
  category,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  value: string;
  onChange: (v: string) => void;
  gender: string;
  category: string;
}) {
  const kind = getSizeKind(gender, category);
  const options = getOptions(kind);
  const guide = getGuide(kind);
  const [guideOpen, setGuideOpen] = useState(true);
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open && selectedRef.current) {
      setTimeout(() => selectedRef.current?.scrollIntoView({ block: "center", behavior: "smooth" }), 100);
    }
  }, [open]);

  const pick = (s: string) => {
    onChange(s);
    setTimeout(() => onOpenChange(false), 200);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="border-0" style={{ background: "#f6f1e7", maxHeight: "92vh" }}>
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
                      : { background: "#e8e3d9", color: "#1a1a1a" }
                  }
                >
                  {s}
                </button>
              );
            })}
          </div>

          {guide.rows.length > 0 && (
            <div className="mt-6 overflow-hidden rounded-2xl" style={{ background: "#ede8de" }}>
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
                <div className="px-4 pb-4">
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
                              className="py-2.5"
                              style={{ color: j === 0 ? "#1a1a1a" : "#8a8478", fontWeight: j === 0 ? 600 : 400 }}
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
