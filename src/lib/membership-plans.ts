// Delt / kanonisk konfigurasjon for medlemskapsplaner.
// Ikke dupliser denne listen i andre komponenter — importer herfra.

export type MembershipPlanKey = "basic" | "mid" | "pro";

export type MembershipPlan = {
  key: MembershipPlanKey;
  label: string; // vist i UI (albansk, all caps)
  monthlyPrice: string;
  yearlyPrice: string;
  perks: string[];
  highlight?: boolean;
};

export const MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    key: "basic",
    label: "BAZË",
    monthlyPrice: "€2.99 / muaj",
    yearlyPrice: "€24.99 / vit",
    perks: [
      "5 kredite për krye të kërkimit në muaj",
      "5 ditë plasim i paguar në muaj",
      "Distinktiv i verifikuar",
      "Statistika",
    ],
  },
  {
    key: "mid",
    label: "MESATAR",
    monthlyPrice: "€4.99 / muaj",
    yearlyPrice: "€39.99 / vit",
    highlight: true,
    perks: [
      "12 kredite për krye të kërkimit në muaj",
      "12 ditë plasim i paguar në muaj",
      "Distinktiv i artë",
      "Përparësi në kërkim",
      "Statistika",
    ],
  },
  {
    key: "pro",
    label: "PRO",
    monthlyPrice: "€8.99 / muaj",
    yearlyPrice: "€69.99 / vit",
    perks: [
      "20 kredite për krye të kërkimit në muaj",
      "30 ditë plasim i paguar në muaj",
      "Distinktiv PRO",
      "Paraqitje në ballinë",
      "Mbështetje me përparësi",
    ],
  },
];

export function getMembershipPlan(key: string | null | undefined): MembershipPlan | null {
  if (!key) return null;
  return MEMBERSHIP_PLANS.find((p) => p.key === key) ?? null;
}
