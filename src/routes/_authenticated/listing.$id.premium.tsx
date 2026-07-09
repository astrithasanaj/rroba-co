import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { MobileShell } from "@/components/marketplace/MobileShell";
import { SwipeBackWrapper } from "@/components/SwipeBackWrapper";

export const Route = createFileRoute("/_authenticated/listing/$id/premium")({
  component: () => (
    <SwipeBackWrapper>
      <PremiumPage />
    </SwipeBackWrapper>
  ),
});

const CREAM = "#f6f1e7";
const CARD = "#ede8de";
const INK = "#1a1a1a";
const MUTED = "#a89f94";
const CORAL = "#e8826a";

type Plan = {
  key: string;
  label: string;
  price: string;
  annual: string;
  perks: string[];
  highlight?: boolean;
};

const PLANS: Plan[] = [
  {
    key: "basic",
    label: "BAZË",
    price: "€2.99/muaj",
    annual: "ose €24.99/vit",
    perks: [
      "5 promovime falas në krye të listës/muaj",
      "5 ditë plassim i sponsorizuar/muaj",
      "Shenjë verifikimi premium",
      "Statistika të avancuara",
    ],
  },
  {
    key: "mid",
    label: "MESATAR",
    price: "€4.99/muaj",
    annual: "ose €39.99/vit",
    highlight: true,
    perks: [
      "12 promovime falas/muaj",
      "12 ditë plassim i sponsorizuar/muaj",
      "Shenjë verifikimi premium ari",
      "Statistika të avancuara",
      "Prioritet në kërkim gjithmonë",
    ],
  },
  {
    key: "pro",
    label: "PRO",
    price: "€8.99/muaj",
    annual: "ose €69.99/vit",
    perks: [
      "20 promovime falas/muaj",
      "30 ditë plassim i sponsorizuar/muaj",
      "Shenjë verifikimi PRO",
      "Shfaqje në faqen kryesore",
      "Statistika të avancuara",
      "Mbështetje prioritare",
    ],
  },
];

function PremiumPage() {
  const [selected, setSelected] = useState("mid");
  const [comingSoon, setComingSoon] = useState(false);

  return (
    <MobileShell hideNav>
      <div className="min-h-screen" style={{ backgroundColor: CREAM }}>
        <header
          className="sticky top-0 z-30 flex items-center px-4 pt-4 pb-3"
          style={{ backgroundColor: CREAM }}
        >
          <button
            onClick={() => window.history.back()}
            className="grid h-10 w-10 place-items-center rounded-full"
            style={{ backgroundColor: CARD }}
            aria-label="Kthehu"
          >
            <ArrowLeft className="h-5 w-5" style={{ color: INK }} />
          </button>
          <h1 className="flex-1 px-3 text-center font-display text-[22px] italic" style={{ color: INK }}>
            Rroba Premium
          </h1>
          <div className="h-10 w-10" />
        </header>

        <div className="px-4 pt-2 pb-32">
          {PLANS.map((p) => {
            const isSel = selected === p.key;
            return (
              <div key={p.key} className="relative mb-6">
                {p.highlight && (
                  <div
                    className="absolute left-1/2 top-0 z-10"
                    style={{
                      transform: "translate(-50%, -50%)",
                      backgroundColor: CORAL,
                      color: "#ffffff",
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: 0.5,
                      padding: "6px 12px",
                      borderRadius: 999,
                    }}
                  >
                    MË I POPULLARIZUAR
                  </div>
                )}
                <button
                  onClick={() => setSelected(p.key)}
                  className="block w-full text-left"
                  style={{
                    backgroundColor: CARD,
                    borderRadius: 16,
                    padding: 20,
                    border: `2px solid ${isSel ? INK : "transparent"}`,
                  }}
                >
                  <p
                    className="text-center"
                    style={{ color: MUTED, fontSize: 11, fontWeight: 700, letterSpacing: 1 }}
                  >
                    {p.label}
                  </p>
                  <p
                    className="text-center"
                    style={{ color: INK, fontSize: 28, fontWeight: 700, marginTop: 4 }}
                  >
                    {p.price}
                  </p>
                  <p className="text-center" style={{ color: MUTED, fontSize: 13, marginTop: 2 }}>
                    {p.annual}
                  </p>
                  <ul className="mt-4 space-y-2">
                    {p.perks.map((perk) => (
                      <li key={perk} className="flex items-start gap-2 text-[13px]" style={{ color: INK }}>
                        <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: CORAL }} />
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>
                </button>
              </div>
            );
          })}
        </div>

        <div
          className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3"
          style={{ backgroundColor: CREAM, borderTop: `1px solid #ddd8ce` }}
        >
          <button
            onClick={() => setComingSoon(true)}
            className="w-full"
            style={{
              backgroundColor: INK,
              color: "#ffffff",
              height: 52,
              borderRadius: 14,
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            Vazhdo
          </button>
        </div>

        {comingSoon && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            onClick={() => setComingSoon(false)}
          >
            <div
              className="w-full max-w-[440px]"
              style={{
                backgroundColor: CREAM,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                padding: "20px 20px 28px",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto h-1 w-10 rounded-full" style={{ backgroundColor: "#ddd8ce" }} />
              <p className="mt-4 text-[18px] font-bold" style={{ color: INK }}>
                Së shpejti
              </p>
              <p className="mt-2 text-[14px]" style={{ color: MUTED, lineHeight: 1.5 }}>
                Pagesat po vijnë së shpejti. Do të njoftohesh kur të aktivizohen.
              </p>
              <button
                onClick={() => setComingSoon(false)}
                className="mt-5 w-full"
                style={{
                  backgroundColor: INK,
                  color: "#ffffff",
                  height: 50,
                  borderRadius: 14,
                  fontWeight: 700,
                  fontSize: 15,
                }}
              >
                Në rregull
              </button>
            </div>
          </div>
        )}
      </div>
    </MobileShell>
  );
}
