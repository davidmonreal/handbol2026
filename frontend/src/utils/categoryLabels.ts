import { fallbackLanguage, translations } from '../i18n/translations';

type Translator = (key: string, params?: Record<string, string | number>) => string;

const CATEGORY_KEYS: Record<string, string> = {
  'SENIOR M': 'categories.senior_m',
  'SENIOR F': 'categories.senior_f',
  'JUVENIL M': 'categories.juvenil_m',
  'JUVENIL F': 'categories.juvenil_f',
  'CADET M': 'categories.cadet_m',
  'CADET F': 'categories.cadet_f',
  'INFANTIL M': 'categories.infantil_m',
  'INFANTIL F': 'categories.infantil_f',
  'ALEVÍ M': 'categories.alevi_m',
  'ALEVÍ F': 'categories.alevi_f',
  // Legacy categories default to male.
  SENIOR: 'categories.senior_m',
  JUVENIL: 'categories.juvenil_m',
  CADET: 'categories.cadet_m',
  INFANTIL: 'categories.infantil_m',
  ALEVI: 'categories.alevi_m',
};

const FALLBACK_ENGLISH: Record<string, string> = {
  'SENIOR M': 'Senior M',
  'SENIOR F': 'Senior F',
  'JUVENIL M': 'Juvenil M',
  'JUVENIL F': 'Juvenil F',
  'CADET M': 'Cadet M',
  'CADET F': 'Cadet F',
  'INFANTIL M': 'Infantil M',
  'INFANTIL F': 'Infantil F',
  'ALEVÍ M': 'Aleví M',
  'ALEVÍ F': 'Aleví F',
  SENIOR: 'Senior M',
  JUVENIL: 'Juvenil M',
  CADET: 'Cadet M',
  INFANTIL: 'Infantil M',
  ALEVI: 'Aleví M',
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
