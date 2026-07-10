import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type City = {
  id: string;
  name: string;
  country_code: "XK" | "AL" | "MK";
  country_name: string;
  sort_order: number;
};

// Fixed country display order
export const COUNTRY_ORDER: Array<City["country_code"]> = ["XK", "AL", "MK"];
export const COUNTRY_LABEL: Record<City["country_code"], string> = {
  XK: "Kosovë",
  AL: "Shqipëri",
  MK: "Maqedoni e Veriut",
};

let cachedCities: City[] | null = null;
let inflight: Promise<City[]> | null = null;

async function fetchCities(): Promise<City[]> {
  if (cachedCities) return cachedCities;
  if (inflight) return inflight;
  inflight = (async () => {
    const { data, error } = await supabase
      .from("cities")
      .select("id, name, country_code, country_name, sort_order")
      .order("country_code")
      .order("sort_order")
      .order("name");
    if (error) throw error;
    cachedCities = (data ?? []) as City[];
    return cachedCities;
  })();
  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}

export function useCities() {
  const [cities, setCities] = useState<City[]>(cachedCities ?? []);
  const [loading, setLoading] = useState(cachedCities === null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (cachedCities) return;
    fetchCities()
      .then((rows) => {
        if (!cancelled) setCities(rows);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load cities");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return { cities, loading, error };
}

export function useCityById(id: string | null | undefined) {
  const { cities } = useCities();
  if (!id) return null;
  return cities.find((c) => c.id === id) ?? null;
}
