import { localeBundles, type LocaleCode } from '../../locales/bundles.js';
import type { Locale } from '../../app/types.js';

type Vars = Record<string, string | number>;

type NamespaceMap = Record<string, Record<string, string>>;

const FALLBACK_LOCALE: Locale = 'en';

export function supportedLocales(): Locale[] {
  return Object.keys(localeBundles) as Locale[];
}

export function normalizeLocale(value: string | null): Locale {
  return value === 'en' || value === 'ru' ? value : 'ru';
}

export function createTranslator(locale: Locale) {
  const active = localeBundles[locale as LocaleCode] as NamespaceMap;
  const fallback = localeBundles[FALLBACK_LOCALE] as NamespaceMap;
  return (key: string, vars: Vars = {}) => {
    const namespace = key.split('.')[0] ?? 'common';
    const direct = active?.[namespace]?.[key] ?? fallback?.[namespace]?.[key];
    const searched = direct ?? findKey(active, key) ?? findKey(fallback, key) ?? key;
    return interpolate(searched, vars);
  };
}

function interpolate(template: string, vars: Vars): string {
  return template.replace(/{{\s*([\w.]+)\s*}}/g, (_, name: string) => String(vars[name] ?? ''));
}

function findKey(bundle: NamespaceMap, key: string): string | undefined {
  for (const namespace of Object.values(bundle)) {
    const value = namespace[key];
    if (typeof value === 'string') return value;
  }
  return undefined;
}
