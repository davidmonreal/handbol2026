import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import type { ReactNode } from 'react';
import {
  LanguageProvider,
  useLanguage,
  useSafeTranslation,
} from './LanguageContext';
import { fallbackLanguage } from '../i18n/translations';

const withProvider = ({ children }: { children: ReactNode }) => (
  <LanguageProvider>{children}</LanguageProvider>
);

const originalLocalStorage = globalThis.localStorage;

const createStorage = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
};

describe('LanguageContext', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: createStorage(),
      writable: true,
      configurable: true,
    });
  });

  afterAll(() => {
    if (originalLocalStorage) {
      Object.defineProperty(globalThis, 'localStorage', {
        value: originalLocalStorage,
      });
    } else {
      delete (globalThis as typeof globalThis & { localStorage?: Storage }).localStorage;
    }
  });

  it('useSafeTranslation provides fallback when no provider is present', () => {
    const { result } = renderHook(() => useSafeTranslation());

    expect(result.current.language).toBe(fallbackLanguage);
    expect(result.current.t('dashboard.title')).toBe('Dashboard');
  });

  it('useSafeTranslation stays in sync with LanguageProvider', () => {
    const { result } = renderHook(() => {
      const lang = useLanguage();
      const safe = useSafeTranslation();
      return { lang, safe };
    }, { wrapper: withProvider });

    expect(result.current.safe.language).toBe(fallbackLanguage);

    act(() => {
      result.current.lang.setLanguage('es');
    });

    expect(result.current.safe.language).toBe('es');
    expect(result.current.safe.t('dashboard.newMatch')).toBe('Nuevo partido');
  });
});
