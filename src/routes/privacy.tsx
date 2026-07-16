import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Politika e privatësisë — Rroba" },
      { name: "description", content: "Politika e privatësisë e Rroba." },
    ],
  }),
  component: PrivacyPage,
});

const CREAM = "#ffffff";
const INK = "#2d1521";

const PARAGRAPHS = [
  "Ne respektojmë privatësinë tënde. Të dhënat që mbledhim përdoren vetëm për të ofruar shërbimin Rroba dhe për të përmirësuar përvojën tënde.",
  "Emri, email-i dhe fotoja e profilit shfaqen publikisht kur listoni artikuj. Adresa dhe informacionet e pagesës mbahen private.",
  "Ti mund të kërkosh fshirjen e llogarisë dhe të dhënave në çdo kohë përmes seksionit të mbështetjes.",
];

function PrivacyPage() {
  return (
    <div style={{ position: "absolute", inset: 0, overflowY: "auto", background: CREAM }}>
      <div className="mx-auto w-full max-w-[520px] px-5 pt-4 pb-10">
        <Link
          to="/auth/signup-full"
          className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full"
          style={{ color: INK }}
          aria-label="Kthehu"
          onClick={(e) => {
            if (window.history.length > 1) {
              e.preventDefault();
              window.history.back();
            }
          }}
        >
          <ArrowLeft size={22} />
        </Link>
        <h1
          className="italic mt-2"
          style={{ fontFamily: '"Instrument Serif", serif', fontSize: 30, color: INK, fontWeight: 400 }}
        >
          Politika e privatësisë
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
