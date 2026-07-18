import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Kushtet e shërbimit — Rroba" },
      { name: "description", content: "Kushtet e shërbimit të Rroba." },
    ],
  }),
  component: TermsPage,
});

const CREAM = "#ffffff";
const INK = "#2d1521";

const PARAGRAPHS = [
  "Duke përdorur Rroba, ti pranon këto kushte. Përdoruesit janë përgjegjës për saktësinë e informacionit të artikujve dhe për transaksionet e tyre.",
  "Ndalohen artikujt e falsifikuar, të vjedhur ose të papërshtatshëm. Rroba rezervon të drejtën të heqë artikuj që shkelin këto kushte.",
  "Pagesat, kthimet dhe mosmarrëveshjet trajtohen sipas politikave tona. Për pyetje, na kontaktoni në support@rroba.app.",
];

function TermsPage() {
  return (
    <div style={{ position: "absolute", inset: 0, overflowY: "auto", background: CREAM }}>
      <div className="mx-auto w-full max-w-[520px] px-5 pt-4 pb-10">
        <Link
          to="/auth/signup-full"
          aria-label="Kthehu"
          className="grid place-items-center rounded-full transition-transform duration-150 active:scale-90"
          style={{
            width: 36,
            height: 36,
            backgroundColor: "rgba(255,255,255,0.7)",
            border: "1px solid rgba(226,226,222,0.8)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
          onClick={(e) => {
            if (window.history.length > 1) {
              e.preventDefault();
              window.history.back();
            }
          }}
        >
          <ChevronLeft size={18} color="#2d1521" strokeWidth={2} />
        </Link>
        <h1
          className="italic mt-2"
          style={{ fontFamily: '"Instrument Serif", serif', fontSize: 30, color: INK, fontWeight: 400 }}
        >
          Kushtet e shërbimit
        </h1>
        <div className="mt-5 space-y-3">
          {PARAGRAPHS.map((p, i) => (
            <p key={i} style={{ fontSize: 14, lineHeight: 1.55, color: INK }}>{p}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
