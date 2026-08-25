import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { useTranslation } from "@/i18n";
import { PRIVACY_POLICY } from "@/lib/privacy-policy-content";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Politika e privatësisë — Rroba" },
      {
        name: "description",
        content:
          "Si i mbledh, ruan dhe mbron Rroba të dhënat e tua personale: profili publik, mesazhet private, fshirja e llogarisë dhe të drejtat GDPR.",
      },
      { property: "og:title", content: "Politika e privatësisë — Rroba" },
      {
        property: "og:description",
        content: "Politika e privatësisë e Rroba: të dhënat, GDPR dhe fshirja e llogarisë.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyPage,
});

const CREAM = "#ffffff";
const INK = "#2d1521";
const MUTED = "rgba(45,21,33,0.6)";

function PrivacyPage() {
  const { language } = useTranslation();
  const doc = PRIVACY_POLICY[language] ?? PRIVACY_POLICY.sq;

  return (
    <div style={{ position: "absolute", inset: 0, overflowY: "auto", background: CREAM }}>
      <div className="mx-auto w-full max-w-[520px] px-5 pt-4 pb-14">
        <Link
          to="/auth/signup-full"
          aria-label={language === "en" ? "Back" : "Kthehu"}
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
          <ChevronLeft size={22} color={INK} strokeWidth={2} />
        </Link>

        <h1
          className="italic mt-2"
          style={{
            fontFamily: '"Instrument Serif", serif',
            fontSize: 30,
            color: INK,
            fontWeight: 400,
          }}
        >
          {doc.title}
        </h1>
        <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>{doc.updated}</div>

        <div className="mt-4 space-y-3">
          {doc.intro.map((p, i) => (
            <p key={i} style={{ fontSize: 14, lineHeight: 1.6, color: INK }}>
              {p}
            </p>
          ))}
        </div>

        {doc.sections.map((s) => (
          <section key={s.heading} className="mt-7">
            <h2 style={{ fontSize: 15, fontWeight: 600, color: INK }}>{s.heading}</h2>
            <div className="mt-2 space-y-2">
              {s.body.map((p, i) => (
                <p key={i} style={{ fontSize: 14, lineHeight: 1.6, color: INK }}>
                  {p}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
