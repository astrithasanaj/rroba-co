// Minimal, dependency-free i18n for Rroba.
//
// - Languages: "sq" (Albanian, default/fallback) and "en" (American English).
// - Persists selection in localStorage under "rroba-language".
// - Provides `useTranslation()` and `t(key, params?)` with dotted keys.
// - Falls back to Albanian when an English key is missing, and logs a dev warning.
// - Updates <html lang> whenever the language changes.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { sq } from "./translations/sq";
import { en } from "./translations/en";

export type Language = "sq" | "en";

const STORAGE_KEY = "rroba-language";
const DEFAULT: Language = "sq";
const DICTS = { sq, en } as const;

// Read stored language once at module load — safe on the server (returns default).
function readStored(): Language {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === "en" || v === "sq" ? v : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

function getByPath(obj: unknown, path: string): string | undefined {
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return undefined;
    }
  }
  return typeof cur === "string" ? cur : undefined;
}

function format(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    Object.prototype.hasOwnProperty.call(params, k) ? String(params[k]) : `{${k}}`,
  );
}

type Ctx = {
  language: Language;
  setLanguage: (l: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  locale: string;
};

const LanguageContext = createContext<Ctx | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(DEFAULT);

  // Hydrate from localStorage after mount — avoids SSR mismatch.
  useEffect(() => {
    const stored = readStored();
    if (stored !== language) setLanguageState(stored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reflect language on <html lang="…">.
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("lang", language);
    }
  }, [language]);

  const setLanguage = useCallback((l: Language) => {
    setLanguageState(l);
    try {
      if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore quota / privacy errors */
    }
  }, []);

  const t = useCallback<Ctx["t"]>(
    (key, params) => {
      const primary = getByPath(DICTS[language], key);
      if (primary !== undefined) return format(primary, params);
      const fallback = getByPath(DICTS[DEFAULT], key);
      if (fallback !== undefined) {
        if (language !== DEFAULT && typeof console !== "undefined") {
          console.warn(`[i18n] Missing translation for "${key}" in "${language}"`);
        }
        return format(fallback, params);
      }
      if (typeof console !== "undefined") console.warn(`[i18n] Missing key "${key}"`);
      return key;
    },
    [language],
  );

  const locale = language === "en" ? "en-US" : "sq-AL";

  const value = useMemo<Ctx>(() => ({ language, setLanguage, t, locale }), [
    language,
    setLanguage,
    t,
    locale,
  ]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useTranslation(): Ctx {
  const ctx = useContext(LanguageContext);
  if (ctx) return ctx;
  // Safe no-context fallback (e.g. rendered outside provider in a test) —
  // returns Albanian strings without throwing.
  return {
    language: DEFAULT,
    setLanguage: () => {},
    locale: "sq-AL",
    t: (key, params) => {
      const s = getByPath(DICTS[DEFAULT], key);
      return s !== undefined ? format(s, params) : key;
    },
  };
}
