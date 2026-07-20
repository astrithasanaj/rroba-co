import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, Check, Loader2 } from "lucide-react";
import { MobileShell } from "@/components/marketplace/MobileShell";
import { SwipeBackWrapper } from "@/components/SwipeBackWrapper";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser } from "@/hooks/useCurrentUser";
import {
  MEMBERSHIP_PLANS,
  getMembershipPlan,
  type MembershipPlanKey,
} from "@/lib/membership-plans";

export const Route = createFileRoute("/_authenticated/membership")({
  component: () => (
    <SwipeBackWrapper>
      <MembershipPage />
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

type Status = {
  tier: MembershipPlanKey | null;
  topCredits: number;
  ppDays: number;
  renewedAt: string | null;
};

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("sq-AL", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

function MembershipPage() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<Status>({
    tier: null,
    topCredits: 0,
    ppDays: 0,
    renewedAt: null,
  });

  useEffect(() => {
    (async () => {
      const user = await getCurrentUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select(
          "membership_tier, top_of_list_credits, paid_placement_days, membership_renewed_at",
        )
        .eq("id", user.id)
        .maybeSingle();
      const p = (data ?? {}) as {
        membership_tier?: string | null;
        top_of_list_credits?: number;
        paid_placement_days?: number;
        membership_renewed_at?: string | null;
      };
      const raw = p.membership_tier ?? null;
      const tier: MembershipPlanKey | null =
        raw === "basic" || raw === "mid" || raw === "pro" ? raw : null;
      setStatus({
        tier,
        topCredits: p.top_of_list_credits ?? 0,
        ppDays: p.paid_placement_days ?? 0,
        renewedAt: p.membership_renewed_at ?? null,
      });
      setLoading(false);
    })();
  }, []);

  const activePlan = getMembershipPlan(status.tier);
  const renewedAt = formatDate(status.renewedAt);

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
            Anëtarësimi
          </h1>
          <div style={{ width: 44 }} />
        </header>

        {loading ? (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center justify-center py-24"
          >
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: MUTED }} />
            <span className="sr-only">Duke ngarkuar…</span>
          </div>
        ) : (
          <div className="px-4 pb-32 pt-2">
            {activePlan ? (
              <section
                aria-label="Statusi i anëtarësimit"
                className="mb-6"
                style={{
                  backgroundColor: CARD,
                  border: `1px solid ${DIVIDER}`,
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
                  Plani yt
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <p
                    style={{ color: INK, fontSize: 22, fontWeight: 700 }}
                  >
                    {activePlan.label}
                  </p>
                  <span
                    style={{
                      color: ROSE,
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: 0.5,
                    }}
                  >
                    Aktiv
                  </span>
                </div>
                <dl className="mt-4 space-y-2 text-[14px]" style={{ color: INK }}>
                  <div className="flex justify-between">
                    <dt style={{ color: MUTED }}>Kredite për krye të kërkimit</dt>
                    <dd style={{ fontWeight: 600 }}>{status.topCredits}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt style={{ color: MUTED }}>Ditë plasim i paguar</dt>
                    <dd style={{ fontWeight: 600 }}>{status.ppDays}</dd>
                  </div>
                  {renewedAt && (
                    <div className="flex justify-between">
                      <dt style={{ color: MUTED }}>Aktivizuar / rinovuar më</dt>
                      <dd style={{ fontWeight: 600 }}>{renewedAt}</dd>
                    </div>
                  )}
                </dl>
              </section>
            ) : (
              <section
                aria-label="Rreth anëtarësimit"
                className="mb-6"
                style={{
                  backgroundColor: CARD,
                  border: `1px solid ${DIVIDER}`,
                  borderRadius: 16,
                  padding: 20,
                }}
              >
                <p style={{ color: INK, fontSize: 15, fontWeight: 600 }}>
                  Shiko planet dhe përfitimet
                </p>
                <p className="mt-1" style={{ color: MUTED, fontSize: 13 }}>
                  Anëtarësimet do të jenë të disponueshme së shpejti.
                </p>
              </section>
            )}

            <h2
              className="uppercase"
              style={{
                color: MUTED,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 1,
                padding: "4px 4px 12px",
              }}
            >
              Planet
            </h2>

            {MEMBERSHIP_PLANS.map((plan) => {
              const isActive = activePlan?.key === plan.key;
              return (
                <article
                  key={plan.key}
                  aria-label={plan.label}
                  className="mb-4"
                  style={{
                    backgroundColor: CARD,
                    border: `1px solid ${isActive ? ROSE : DIVIDER}`,
                    borderRadius: 16,
                    padding: 20,
                  }}
                >
                  <div className="flex items-center justify-between">
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
                    {isActive && (
                      <span
                        style={{
                          color: ROSE,
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: 0.5,
                        }}
                      >
                        Aktiv
                      </span>
                    )}
                  </div>
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
              );
            })}

            <p
              className="mt-6 text-center"
              style={{ color: MUTED, fontSize: 12 }}
            >
              Anëtarësimet do të jenë të disponueshme së shpejti.
            </p>
          </div>
        )}
      </div>
    </MobileShell>
  );
}
