import { fallbackLanguage, translations } from '../i18n/translations';

type Translator = (key: string, params?: Record<string, string | number>) => string;

const CATEGORY_KEYS: Record<string, string> = {
  SENIOR: 'categories.senior',
  JUVENIL: 'categories.juvenil',
  CADET: 'categories.cadet',
  INFANTIL: 'categories.infantil',
};

const FALLBACK_ENGLISH: Record<string, string> = {
  SENIOR: 'Senior',
  JUVENIL: 'U18',
  CADET: 'U16',
  INFANTIL: 'U14',
};

export const formatCategoryLabel = (category?: string | null, t?: Translator): string => {
  if (!category) return '';
  const normalized = category.trim().toUpperCase();
  const translationKey = CATEGORY_KEYS[normalized];
  if (!translationKey) return category;
  if (t) {
    return t(translationKey);
  }
  const fallback = translations[fallbackLanguage]?.[translationKey];
  return fallback || FALLBACK_ENGLISH[normalized] || category;
};
