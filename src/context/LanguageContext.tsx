import React, { createContext, useContext, useState, ReactNode } from 'react';
import { en } from '@/locales/en';
import { es } from '@/locales/es';

type Language = 'en' | 'es';
type Translations = typeof en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const dictionaries: Record<Language, Translations> = { en, es };

const STORAGE_KEY = 'mivideo_language';

/**
 * Resolve a dot-separated key like "sidebar.studio" from a nested object.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolve(obj: Record<string, any>, path: string): string {
  const parts = path.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let current: any = obj;
  for (const part of parts) {
    if (current === undefined || current === null) return path;
    current = current[part];
  }
  return typeof current === 'string' ? current : path;
}

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'en' || saved === 'es') return saved;
    } catch { /* SSR safe */ }
    // Default: detect browser language
    const browserLang = navigator.language?.slice(0, 2);
    return browserLang === 'es' ? 'es' : 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* SSR safe */ }
  };

  const t = (key: string): string => {
    return resolve(dictionaries[language], key);
  };

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
