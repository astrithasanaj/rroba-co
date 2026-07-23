import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, Check } from "lucide-react";
import { MobileShell } from "@/components/marketplace/MobileShell";
import { SwipeBackWrapper } from "@/components/SwipeBackWrapper";
import { useTranslation } from "@/i18n";
import { MEMBERSHIP_PLANS } from "@/lib/membership-plans";


export const Route = createFileRoute("/_authenticated/listing/$id/premium")({
  component: () => (
    <SwipeBackWrapper>
      <PremiumPage />
    </SwipeBackWrapper>
  ),
});

const CREAM = "var(--brand-surface)";
const CARD = "var(--brand-surface)";
const INK = "var(--brand-ink)";
const MUTED = "var(--brand-ink-secondary)";
const DIVIDER = "var(--brand-border)";
const ROSE = "var(--brand-rose)";
const FOCUS_CLASS =
  "focus:outline-none focus-visible:shadow-[0_0_0_3px_rgba(198,90,122,0.35)]";

function PremiumPage() {
  return (
    <MobileShell hideNav>
      <div className="min-h-screen" style={{ backgroundColor: CREAM }}>
        <header
          className="sticky top-0 z-30 flex items-center px-4 pt-4 pb-3"
          style={{ backgroundColor: CREAM }}
        >
          <button
            type="button"
            onClick={() => window.history.back()}
            aria-label="Kthehu"
            className={`grid place-items-center rounded-full transition-transform duration-150 active:scale-[0.97] ${FOCUS_CLASS}`}
            style={{
              width: 44,
              height: 44,
              backgroundColor: CARD,
              border: `1px solid ${DIVIDER}`,
            }}
          >
            <ChevronLeft size={22} aria-hidden="true" style={{ color: INK }} />
          </button>
          <h1
            className="flex-1 px-3 text-center font-display italic"
            style={{ color: INK, fontSize: 22 }}
          >
            Rroba Premium
          </h1>
          <div style={{ width: 44 }} />
        </header>

        <div className="px-4 pt-2 pb-32">
          {MEMBERSHIP_PLANS.map((plan) => (
            <article
              key={plan.key}
              aria-label={plan.label}
              className="mb-4"
              style={{
                backgroundColor: CARD,
                border: `1px solid ${plan.highlight ? ROSE : DIVIDER}`,
                borderRadius: 16,
                padding: 20,
              }}
            >
              <p
                className="uppercase"
                style={{
                  color: MUTED,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 1,
                }}
              >
                {plan.label}
              </p>
              <p
                style={{
                  color: INK,
                  fontSize: 22,
                  fontWeight: 700,
                  marginTop: 4,
                }}
              >
                {plan.monthlyPrice}
              </p>
              <p style={{ color: MUTED, fontSize: 13, marginTop: 2 }}>
                ose {plan.yearlyPrice}
              </p>
              <ul className="mt-4 space-y-2">
                {plan.perks.map((perk) => (
                  <li
                    key={perk}
                    className="flex items-start gap-2 text-[13px]"
                    style={{ color: INK }}
                  >
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0"
                      aria-hidden="true"
                      style={{ color: ROSE }}
                    />
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}

          <p
            className="mt-6 text-center"
            style={{ color: MUTED, fontSize: 13 }}
          >
            Anëtarësimet do të jenë të disponueshme së shpejti.
          </p>
        </div>
      </div>
    </MobileShell>
  );
}
