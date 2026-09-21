/**
 * ============================================================================
 * i18n helpers
 * ----------------------------------------------------------------------------
 * English is the default language and lives at the site root (`/about`).
 * Khmer is prefixed (`/km/about`).
 *
 * There are three things every page needs, and they all come from here:
 *
 *   1. `t(key)`      — a translated UI string, falling back to English.
 *   2. `path(...)`   — a URL in the current language, with `base` applied.
 *   3. `pick(field)` — the right half of a bilingual `{ en, km }` data field.
 *
 * NOTHING should hard-code "/km/" or the deployment base path. Always go
 * through these helpers, or the site breaks the moment it is deployed to a
 * GitHub Pages subdirectory.
 * ============================================================================
 */

import en from './en.json';
import km from './km.json';
import site from '../data/site.json';

export const LOCALES = ['en', 'km'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

/**
 * The languages actually offered to visitors.
 *
 * Khmer pages are always built and always reachable by URL, so the copy can be
 * read and reviewed before launch. `khmer.published` in src/data/site.json
 * decides whether they are *offered*: with it false, the EN/ខ្មែរ switch
 * disappears, no hreflang alternates are emitted, the /km pages carry
 * `noindex` and they stay out of the sitemap. Flip it to true to publish
 * Khmer — nothing else needs editing.
 */
export const PUBLISHED_LOCALES: readonly Locale[] = site.khmer.published
  ? LOCALES
  : [DEFAULT_LOCALE];

/** Is this language offered to visitors, as opposed to merely built? */
export function isLocalePublished(lang: Locale): boolean {
  return PUBLISHED_LOCALES.includes(lang);
}

/** Human-readable names, used by the language switch. */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'EN',
  km: 'ខ្មែរ',
};

/** Full names for `aria-label`s and the `hreflang` tags. */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  km: 'ភាសាខ្មែរ (Khmer)',
};

const dictionaries = { en, km } as const;

/** Every valid translation key — derived from the English file. */
export type UIKey = Exclude<keyof typeof en, '_readme'>;

/**
 * Narrow an unknown route param to a Locale. An absent param means the
 * unprefixed default (English) route.
 */
export function resolveLocale(value: string | undefined): Locale {
  return LOCALES.includes(value as Locale) ? (value as Locale) : DEFAULT_LOCALE;
}

/**
 * Returns a `t()` bound to one language.
 *
 * A key missing from the Khmer file falls back to English rather than
 * rendering blank, so the site is always shippable mid-translation.
 */
export function useTranslations(lang: Locale) {
  const dict = dictionaries[lang] as Record<string, string>;
  const fallback = dictionaries[DEFAULT_LOCALE] as Record<string, string>;

  return function t(key: UIKey): string {
    const value = dict[key] ?? fallback[key];
    if (value === undefined && import.meta.env.DEV) {
      console.warn(`[i18n] Missing translation key: "${key}"`);
    }
    return value ?? key;
  };
}

/* ── URL building ────────────────────────────────────────────────────────── */

/** Astro's configured `base`, normalised to "/" or "/prefix" (no trailing /). */
const BASE = import.meta.env.BASE_URL.replace(/\/+$/, '');

/**
 * Build an absolute-from-root URL for `route` in `lang`, including the
 * deployment base path.
 *
 *   path('en', '/about')      → '/about'          (base '/')
 *   path('km', '/about')      → '/km/about'
 *   path('km', '/')           → '/km'
 *   path('en', '/about')      → '/my-repo/about'  (base '/my-repo')
 */
export function path(lang: Locale, route = '/'): string {
  const clean = `/${route.replace(/^\/+|\/+$/g, '')}`.replace(/\/$/, '') || '/';
  const localised = lang === DEFAULT_LOCALE ? clean : `/${lang}${clean === '/' ? '' : clean}`;
  return `${BASE}${localised}` || '/';
}

/**
 * The same route in the *other* language — powers the language switch, and the
 * `hreflang` alternates in <head>.
 */
export function alternateUrls(route: string): Record<Locale, string> {
  return {
    en: path('en', route),
    km: path('km', route),
  };
}

/**
 * The `getStaticPaths()` return value that generates every page twice: once at
 * the root for English, once under `/km/` for Khmer.
 *
 * `lang: undefined` is what produces the unprefixed English route.
 */
export function localePaths(): Array<{ params: { lang: string | undefined } }> {
  return LOCALES.map((locale) => ({
    params: { lang: locale === DEFAULT_LOCALE ? undefined : locale },
  }));
}

/* ── Bilingual content fields ────────────────────────────────────────────── */

/**
 * The shape every translatable field in `src/data/*.json` uses.
 * `km` is optional so the site works before the Khmer is written.
 */
export type I18nField = { en: string; km?: string };

/** Pick the right language out of an `{ en, km }` field, falling back to English. */
export function pick(field: I18nField | undefined, lang: Locale): string {
  if (!field) return '';
  return (lang === 'km' ? field.km : field.en) || field.en || '';
}

/** `pick()` for an array of bilingual fields (tag lists, bullet lists…). */
export function pickList(fields: I18nField[] | undefined, lang: Locale): string[] {
  if (!fields) return [];
  return fields.map((f) => pick(f, lang)).filter(Boolean);
}

/* ── Numbers & dates ─────────────────────────────────────────────────────── */

const KHMER_DIGITS = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];

/** Convert the ASCII digits in a string to Khmer numerals ០–៩. */
export function toKhmerNumerals(value: string | number): string {
  return String(value).replace(/[0-9]/g, (d) => KHMER_DIGITS[Number(d)]);
}

/**
 * Render a number in the reader's numeral system.
 *
 * Whether the Khmer site uses Khmer numerals at all is a client decision (see
 * the "Numerals" row of the Khmer Glossary sheet) — it is controlled by
 * `khmer.useKhmerNumerals` in src/data/site.json, not hard-coded here.
 */
export function formatNumber(value: number | string, lang: Locale, khmerNumerals: boolean): string {
  return lang === 'km' && khmerNumerals ? toKhmerNumerals(value) : String(value);
}
