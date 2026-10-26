import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { vault } from '../storage/vault';
import { en, type Dictionary, type StringKey } from './strings/en';
import { uk } from './strings/uk';
import { es } from './strings/es';
import { de } from './strings/de';
import { pt } from './strings/pt';

export type LanguageCode = 'en' | 'uk' | 'es' | 'de' | 'pt';

export interface LanguageInfo {
  code: LanguageCode;
  /** Name in its own language, shown in the picker. */
  nativeName: string;
  /** BCP-47 locale used for speech recognition. */
  speechLocale: string;
}

export const LANGUAGES: LanguageInfo[] = [
  { code: 'en', nativeName: 'English', speechLocale: 'en-US' },
  { code: 'uk', nativeName: 'Українська', speechLocale: 'uk-UA' },
  { code: 'es', nativeName: 'Español', speechLocale: 'es-ES' },
  { code: 'de', nativeName: 'Deutsch', speechLocale: 'de-DE' },
  { code: 'pt', nativeName: 'Português (Brasil)', speechLocale: 'pt-BR' },
];

const DICTIONARIES: Record<LanguageCode, Dictionary> = { en, uk, es, de, pt };

export function isLanguageCode(value: unknown): value is LanguageCode {
  return typeof value === 'string' && value in DICTIONARIES;
}

export function speechLocaleFor(code: LanguageCode): string {
  return LANGUAGES.find(l => l.code === code)?.speechLocale ?? 'en-US';
}

export type TParams = Record<string, string | number>;

export function translate(lang: LanguageCode, key: StringKey, params?: TParams): string {
  const template = DICTIONARIES[lang][key] ?? en[key];
  if (!params) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (match, name) =>
    name in params ? String(params[name]) : match,
  );
}

interface I18nValue {
  lang: LanguageCode;
  setLang: (lang: LanguageCode) => void;
  t: (key: StringKey, params?: TParams) => string;
  speechLocale: string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // English by default; the user's pick from the language sheet is stored.
  const [lang, setLangState] = useState<LanguageCode>('en');

  useEffect(() => {
    let alive = true;
    vault.getLanguage().then(stored => {
      if (alive && isLanguageCode(stored)) {
        setLangState(stored);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  const setLang = useCallback((next: LanguageCode) => {
    setLangState(next);
    void vault.setLanguage(next);
  }, []);

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      setLang,
      t: (key, params) => translate(lang, key, params),
      speechLocale: speechLocaleFor(lang),
    }),
    [lang, setLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used inside a LanguageProvider');
  }
  return ctx;
}

export type { StringKey };
