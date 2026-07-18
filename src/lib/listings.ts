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

export type ListingView = ListingRow & {
  coverUrl: string;
  imageUrls: string[];
  /** Total tall på bilder i listingen, uavhengig av om alle er signert.
   *  Bruk denne i grid-visninger for f.eks. dot-indikator. */
  imageCount: number;
  is_promoted?: boolean;
};

export function sortActiveFirst<T extends { sold?: boolean; status?: string; created_at?: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const aSold = a.sold || a.status === "sold" || a.status === "removed" ? 1 : 0;
    const bSold = b.sold || b.status === "sold" || b.status === "removed" ? 1 : 0;
    if (aSold !== bSold) return aSold - bSold;
    return (b.created_at ?? "").localeCompare(a.created_at ?? "");
  });
}

const SIGN_TTL = 60 * 60;
// Cache-oppføringer utløper 5 min før den signerte URLen faktisk går ut,
// slik at ingen henter en URL som er i ferd med å utløpe.
const CACHE_MARGIN_MS = 5 * 60 * 1000;

type CacheEntry = { url: string; expiresAt: number };

const signedUrlCache = new Map<string, CacheEntry>();
// In-flight cache: samme path (+ transform-modus) skal aldri startes to ganger
// parallelt. Fjernes etter resolve/reject.
const inFlight = new Map<string, Promise<string | undefined>>();

const cacheKeyFor = (path: string, thumbnail: boolean) =>
  thumbnail ? `thumb:${path}` : path;

const now = () => Date.now();

function readCache(path: string, thumbnail: boolean): string | undefined {
  const entry = signedUrlCache.get(cacheKeyFor(path, thumbnail));
  if (entry && entry.expiresAt > now()) return entry.url;
  return undefined;
}

function writeCache(path: string, thumbnail: boolean, url: string) {
  signedUrlCache.set(cacheKeyFor(path, thumbnail), {
    url,
    expiresAt: now() + SIGN_TTL * 1000 - CACHE_MARGIN_MS,
  });
}

/**
 * Kjør async-jobber med begrenset concurrency. Resultatene beholder input-
 * rekkefølgen. En feilet jobb påvirker ikke de andre — feilen "svelges" til
 * `undefined` slik at én ødelagt path ikke skjuler hele batchen.
 */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<(R | undefined)[]> {
  const results: (R | undefined)[] = new Array(items.length);
  let cursor = 0;
  const workers = new Array(Math.min(limit, items.length)).fill(0).map(async () => {
    while (true) {
      const idx = cursor++;
      if (idx >= items.length) return;
      try {
        results[idx] = await worker(items[idx], idx);
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn("[signPaths] worker failed", err);
        }
        results[idx] = undefined;
      }
    }
  });
  await Promise.all(workers);
  return results;
}

async function signOne(path: string, thumbnail: boolean): Promise<string | undefined> {
  if (thumbnail) {
    const { data } = await supabase.storage
      .from("photos")
      .createSignedUrl(path, SIGN_TTL, {
        transform: { width: 400, height: 400, resize: "cover", quality: 70 },
      });
    return data?.signedUrl;
  }
  const { data } = await supabase.storage
    .from("photos")
    .createSignedUrl(path, SIGN_TTL);
  return data?.signedUrl;
}

/**
 * Signerer et sett med Storage-paths og returnerer et map fra path → URL.
 *
 * - HTTP(S)-URLer og tomme strings hoppes over.
 * - Duplikater signeres én gang.
 * - Parallelle kall for samme path deler samme in-flight Promise.
 * - Kjøres med begrenset concurrency for å ikke storme storage-API-et.
 * - Én mislykket signering avbryter ikke resten.
 */
export async function signPaths(
  paths: string[],
  options?: { thumbnail?: boolean }
): Promise<Record<string, string>> {
  const thumbnail = !!options?.thumbnail;
  const map: Record<string, string> = {};

  // 1) Filtrer bort tomme + eksterne + dedupliser
  const unique: string[] = [];
  const seen = new Set<string>();
  for (const p of paths) {
    if (!p) continue;
    if (/^https?:\/\//i.test(p)) continue;
    if (seen.has(p)) continue;
    seen.add(p);
    unique.push(p);
  }
  if (unique.length === 0) return map;

  // 2) Del inn i (cache-hit) vs (må signeres)
  const toSign: string[] = [];
  for (const p of unique) {
    const cached = readCache(p, thumbnail);
    if (cached) {
      map[p] = cached;
    } else {
      toSign.push(p);
    }
  }
  if (toSign.length === 0) return map;

  if (thumbnail) {
    // Thumbnail-transform støttes kun av singular createSignedUrl.
    // Kjør med concurrency-limit og in-flight dedup.
    await mapWithConcurrency(toSign, 8, async (path) => {
      const key = cacheKeyFor(path, true);
      let pending = inFlight.get(key);
      if (!pending) {
        pending = signOne(path, true).finally(() => {
          inFlight.delete(key);
        });
        inFlight.set(key, pending);
      }
      const url = await pending;
      if (url) {
        map[path] = url;
        writeCache(path, true, url);
      }
    });
    return map;
  }

  // Ikke-transform: batch-signering er raskest, men vi må fortsatt respektere
  // in-flight-cachen slik at samtidige kall ikke dobler opp.
  const alreadyPending: string[] = [];
  const needsBatch: string[] = [];
  for (const path of toSign) {
    const key = cacheKeyFor(path, false);
    if (inFlight.has(key)) {
      alreadyPending.push(path);
    } else {
      needsBatch.push(path);
    }
  }

  // Reserver in-flight-plassholdere så samtidige kall venter på batchen.
  let resolveBatch: ((urls: Record<string, string>) => void) | undefined;
  let rejectBatch: ((err: unknown) => void) | undefined;
  const batchPromise = new Promise<Record<string, string>>((resolve, reject) => {
    resolveBatch = resolve;
    rejectBatch = reject;
  });
  for (const path of needsBatch) {
    const key = cacheKeyFor(path, false);
    inFlight.set(
      key,
      batchPromise.then((urls) => urls[path])
    );
  }

  try {
    if (needsBatch.length > 0) {
      const { data } = await supabase.storage
        .from("photos")
        .createSignedUrls(needsBatch, SIGN_TTL);
      const batchMap: Record<string, string> = {};
      for (const item of data ?? []) {
        if (item.path && item.signedUrl) {
          batchMap[item.path] = item.signedUrl;
          map[item.path] = item.signedUrl;
          writeCache(item.path, false, item.signedUrl);
        }
      }
      resolveBatch?.(batchMap);
    } else {
      resolveBatch?.({});
    }
  } catch (err) {
    if (import.meta.env.DEV) console.warn("[signPaths] batch failed", err);
    rejectBatch?.(err);
  } finally {
    for (const path of needsBatch) inFlight.delete(cacheKeyFor(path, false));
  }

  // Vent på samtidige kall som allerede hadde in-flight for disse pathene.
  if (alreadyPending.length > 0) {
    await Promise.all(
      alreadyPending.map(async (path) => {
        try {
          const url = await inFlight.get(cacheKeyFor(path, false));
          if (url) map[path] = url;
        } catch {
          /* ignore — placeholder overtar */
        }
      })
    );
  }

  return map;
}

export type HydrateOptions = {
  thumbnail?: boolean;
  /**
   * "all" (default) signerer alle bilder — bruk på produktside/galleri.
   * "cover" signerer kun første bilde per listing — bruk i grid.
   */
  mode?: "cover" | "all";
};

export async function hydrateListings(
  rows: ListingRow[],
  options?: HydrateOptions
): Promise<ListingView[]> {
  const mode = options?.mode ?? "all";

  // Velg hvilke paths vi faktisk trenger å signere.
  const paths: string[] = [];
  for (const r of rows) {
    const list = r.image_paths ?? [];
    if (mode === "cover") {
      const first = list.find((p) => !!p);
      if (first) paths.push(first);
    } else {
      for (const p of list) if (p) paths.push(p);
    }
  }

  const urls = await signPaths(paths, { thumbnail: options?.thumbnail });

  return rows
    .map((r) => {
      const raw = r.image_paths ?? [];
      const imageCount = raw.filter(Boolean).length;

      if (mode === "cover") {
        const first = raw.find((p) => !!p) ?? "";
        const coverUrl = /^https?:\/\//i.test(first) ? first : urls[first] ?? "";
        return {
          ...r,
          coverUrl,
          imageUrls: coverUrl ? [coverUrl] : [],
          imageCount,
        };
      }

      const imageUrls = raw
        .map((p) => (/^https?:\/\//i.test(p) ? p : urls[p] ?? ""))
        .filter(Boolean);
      return {
        ...r,
        coverUrl: imageUrls[0] ?? "",
        imageUrls,
        imageCount,
      };
    })
    // Skjul listings uten cover — ListingCard viser placeholder for broken images
    // som kommer etter render, men rader helt uten paths har ingenting å vise.
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
