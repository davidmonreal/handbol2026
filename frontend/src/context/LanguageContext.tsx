import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { availableLanguages, fallbackLanguage, getTranslation } from '../i18n/translations';
import type { LanguageCode } from '../i18n/translations';

export type TranslationParams = Record<string, string | number>;

interface LanguageContextValue {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, params?: TranslationParams) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const STORAGE_KEY = 'handbol2026:language';

const isValidLanguage = (code: string): code is LanguageCode =>
  availableLanguages.some(lang => lang.code === code);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<LanguageCode>(fallbackLanguage);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isValidLanguage(stored)) {
      setLanguageState(stored);
      return;
    }
    const browserLang = navigator.language.split('-')[0];
    if (isValidLanguage(browserLang)) {
      setLanguageState(browserLang);
    }
  }, []);

  const setLanguage = (next: LanguageCode) => {
    setLanguageState(next);
    localStorage.setItem(STORAGE_KEY, next);
  };

  const translator = useMemo(
    () => (key: string, params?: TranslationParams) => getTranslation(language, key, params),
    [language],
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: translator,
    }),
    [language, translator],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return { language: context.language, setLanguage: context.setLanguage };
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within LanguageProvider');
  }
  return { t: context.t, language: context.language };
};

export const useSafeTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    const fallbackTranslator = (key: string, params?: TranslationParams) =>
      getTranslation(fallbackLanguage, key, params);
    return { t: fallbackTranslator, language: fallbackLanguage };
  }
  return { t: context.t, language: context.language };
};
