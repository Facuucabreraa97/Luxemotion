import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { en } from '@/locales/en';
import { es } from '@/locales/es';
import { supabase } from '@/lib/supabase';

type Language = 'en' | 'es';
type FlatDictionary = Record<string, string>;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'mivideo_language';
const CACHE_DICT_KEY = 'mivideo_i18n_dict';
const CACHE_VERSION_KEY = 'mivideo_i18n_version';

// ── Flatten nested static dictionaries into dot-path keys ──
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function flatten(obj: Record<string, any>, prefix = ''): FlatDictionary {
  const result: FlatDictionary = {};
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      Object.assign(result, flatten(obj[key], fullKey));
    } else {
      result[fullKey] = String(obj[key]);
    }
  }
  return result;
}

// Pre-flatten static dictionaries (zero-cost at import)
const staticDicts: Record<Language, FlatDictionary> = {
  en: flatten(en),
  es: flatten(es),
};

// ── Try loading cached dictionary from localStorage ──
function loadCachedDict(): Record<Language, FlatDictionary> | null {
  try {
    const raw = localStorage.getItem(CACHE_DICT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveCachedDict(dict: Record<Language, FlatDictionary>, version: number) {
  try {
    localStorage.setItem(CACHE_DICT_KEY, JSON.stringify(dict));
    localStorage.setItem(CACHE_VERSION_KEY, String(version));
  } catch { /* quota exceeded — silently fail */ }
}

function getCachedVersion(): number {
  try {
    return parseInt(localStorage.getItem(CACHE_VERSION_KEY) || '0', 10);
  } catch {
    return 0;
  }
}

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // ── Language selection (persisted to localStorage) ──
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'en' || saved === 'es') return saved;
    } catch { /* SSR safe */ }
    const browserLang = navigator.language?.slice(0, 2);
    return browserLang === 'es' ? 'es' : 'en';
  });

  // ── Dictionary: start instantly from cache or static ──
  const [dict, setDict] = useState<Record<Language, FlatDictionary>>(() => {
    const cached = loadCachedDict();
    if (cached && cached.en && cached.es) return cached;
    return staticDicts;
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* SSR safe */ }
  }, []);

  // ── SWR: Revalidate against server version ──
  useEffect(() => {
    let cancelled = false;

    const revalidate = async () => {
      try {
        // 1. Check remote version
        const { data: versionRow, error: vErr } = await supabase
          .from('i18n_version')
          .select('version')
          .eq('id', 1)
          .single();

        if (vErr || !versionRow) return; // Table might not exist yet

        const remoteVersion = versionRow.version as number;
        const localVersion = getCachedVersion();

        // 2. If local is up-to-date, skip fetch
        if (remoteVersion <= localVersion) return;

        // 3. Fetch all translations
        const { data: rows, error: tErr } = await supabase
          .from('site_translations')
          .select('translation_key, value_en, value_es');

        if (tErr || !rows || rows.length === 0) return;

        // 4. Build fresh dictionaries (merge: DB overrides static)
        const freshEn: FlatDictionary = { ...staticDicts.en };
        const freshEs: FlatDictionary = { ...staticDicts.es };

        for (const row of rows) {
          if (row.value_en) freshEn[row.translation_key] = row.value_en;
          if (row.value_es) freshEs[row.translation_key] = row.value_es;
        }

        const freshDict = { en: freshEn, es: freshEs };

        if (!cancelled) {
          setDict(freshDict);
          saveCachedDict(freshDict, remoteVersion);
        }
      } catch (err) {
        console.warn('[i18n SWR] Revalidation failed:', err instanceof Error ? err.message : 'Unknown');
        // Non-blocking: static/cached dict remains active
      }
    };

    revalidate();

    return () => { cancelled = true; };
  }, []); // Run once on mount

  // ── Translation function ──
  const t = useCallback((key: string): string => {
    return dict[language][key] ?? staticDicts[language][key] ?? key;
  }, [language, dict]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useTranslation must be used within LanguageProvider');
  return ctx;
};
