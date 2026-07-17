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
  delivery?: string[];
  created_at: string;

};

export type ListingView = ListingRow & { coverUrl: string; imageUrls: string[]; is_promoted?: boolean };

export function sortActiveFirst<T extends { sold?: boolean; status?: string; created_at?: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const aSold = a.sold || a.status === "sold" || a.status === "removed" ? 1 : 0;
    const bSold = b.sold || b.status === "sold" || b.status === "removed" ? 1 : 0;
    if (aSold !== bSold) return aSold - bSold;
    return (b.created_at ?? "").localeCompare(a.created_at ?? "");
  });
}

const SIGN_TTL = 60 * 60;

export async function signPaths(paths: string[]): Promise<Record<string, string>> {
  const filtered = paths.filter((p) => p && !/^https?:\/\//i.test(p));
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
  return rows
    .map((r) => {
      const imageUrls = (r.image_paths ?? [])
        .map((p) => (/^https?:\/\//i.test(p) ? p : urls[p] ?? ""))
        .filter(Boolean);
      return { ...r, coverUrl: imageUrls[0] ?? "", imageUrls };
    })
    // Hide listings whose cover image cannot be resolved — no empty boxes anywhere.
    .filter((l) => !!l.coverUrl);
}

export const CATEGORIES = [
  { value: "Veshje", label: "Veshje" },
  { value: "Këpucë", label: "Këpucë" },
  { value: "Aksesorë", label: "Aksesorë" },
  { value: "Fëmijë", label: "Fëmijë" },
] as const;

export const GENDERS = ["Femra", "Meshkuj", "Fëmijë", "Unisex"] as const;
export const CONDITIONS = ["I ri", "Mirë përdorur", "Përdorur", "Shumë përdorur"] as const;
export const CITIES = ["Prishtinë", "Prizren", "Pejë", "Tiranë"] as const;
