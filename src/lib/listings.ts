import { supabase } from "@/integrations/supabase/client";

export type ListingRow = {
  id: string;
  user_id: string;
  title: string;
  brand: string;
  category: string;
  size: string;
  price: number;
  description: string;
  image_paths: string[];
  sold: boolean;
  status: string;
  condition: string;
  color: string;
  city: string;
  gender: string;
  created_at: string;
};

export type ListingView = ListingRow & { coverUrl: string; imageUrls: string[] };

const SIGN_TTL = 60 * 60;

export async function signPaths(paths: string[]): Promise<Record<string, string>> {
  const filtered = paths.filter(Boolean);
  if (filtered.length === 0) return {};
  const { data } = await supabase.storage.from("photos").createSignedUrls(filtered, SIGN_TTL);
  const map: Record<string, string> = {};
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) map[item.path] = item.signedUrl;
  }
  return map;
}

export async function hydrateListings(rows: ListingRow[]): Promise<ListingView[]> {
  const all = rows.flatMap((r) => r.image_paths ?? []);
  const urls = await signPaths(all);
  return rows.map((r) => {
    const imageUrls = (r.image_paths ?? []).map((p) => urls[p] ?? "").filter(Boolean);
    return { ...r, coverUrl: imageUrls[0] ?? "", imageUrls };
  });
}

export const CATEGORIES = [
  { value: "Veshje", label: "Veshje" },
  { value: "Këpucë", label: "Këpucë" },
  { value: "Aksesorë", label: "Aksesorë" },
  { value: "Fëmijë", label: "Fëmijë" },
] as const;

export const GENDERS = ["Femra", "Meshkuj", "Fëmijë", "Unisex"] as const;
export const CONDITIONS = ["Si i ri", "Shumë i mirë", "I mirë", "I përdorur"] as const;
export const CITIES = ["Prishtinë", "Prizren", "Pejë", "Tiranë"] as const;
