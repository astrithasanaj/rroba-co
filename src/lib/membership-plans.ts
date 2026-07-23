// Delt / kanonisk konfigurasjon for medlemskapsplaner.
// Ikke dupliser denne listen i andre komponenter — importer herfra.
// UI-etiketter og fordeler oversettes via i18n (`membership_page.*`).

export type MembershipPlanKey = "basic" | "mid" | "pro";

export type MembershipPlan = {
  key: MembershipPlanKey;
  labelKey: string; // i18n key for uppercase label
  monthlyAmount: string; // e.g. "€2.99"
  yearlyAmount: string; // e.g. "€24.99"
  perkKeys: string[]; // i18n keys for perks
  highlight?: boolean;
};

export const MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    key: "basic",
    labelKey: "membership_page.plan_basic_label",
    monthlyAmount: "€2.99",
    yearlyAmount: "€24.99",
    perkKeys: [
      "membership_page.perk_basic_1",
      "membership_page.perk_basic_2",
      "membership_page.perk_basic_3",
      "membership_page.perk_basic_4",
    ],
  },
  {
    key: "mid",
    labelKey: "membership_page.plan_mid_label",
    monthlyAmount: "€4.99",
    yearlyAmount: "€39.99",
    highlight: true,
    perkKeys: [
      "membership_page.perk_mid_1",
      "membership_page.perk_mid_2",
      "membership_page.perk_mid_3",
      "membership_page.perk_mid_4",
      "membership_page.perk_mid_5",
    ],
  },
  {
    key: "pro",
    labelKey: "membership_page.plan_pro_label",
    monthlyAmount: "€8.99",
    yearlyAmount: "€69.99",
    perkKeys: [
      "membership_page.perk_pro_1",
      "membership_page.perk_pro_2",
      "membership_page.perk_pro_3",
      "membership_page.perk_pro_4",
      "membership_page.perk_pro_5",
    ],
  },
];

export function getMembershipPlan(key: string | null | undefined): MembershipPlan | null {
  if (!key) return null;
  return MEMBERSHIP_PLANS.find((p) => p.key === key) ?? null;
}
