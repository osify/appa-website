/**
 * ============================================================================
 * Date formatting — English and Khmer
 * ----------------------------------------------------------------------------
 * WHY THIS FILE EXISTS
 *
 * The Cambodian Chhankitek (ចន្ទគតិ) lunar calendar — the waxing/waning day
 * (កើត / រោច), the lunar month name, the animal year and the era-year — CANNOT
 * be derived from a Gregorian date by formula. It has leap months and leap days
 * set by rules that a `date + offset` cannot reproduce. So:
 *
 *   • The GREGORIAN half (weekday, day, month, year, Khmer numerals) is
 *     COMPUTED here — always correct for any date.
 *   • The LUNAR half is DATA, not computed. Each holiday in
 *     src/data/holidays.json stores the exact Khmer string supplied by the
 *     client. That string is the source of truth; never try to regenerate it.
 *
 * Everything here runs at build time, so the rendered dates ship as plain HTML
 * and need no JavaScript in the browser.
 * ============================================================================
 */

import { toKhmerNumerals, type Locale } from '../i18n/utils';

const KH_WEEKDAY = ['អាទិត្យ', 'ចន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'];

const KH_MONTH = [
  'មករា',
  'កុម្ភៈ',
  'មីនា',
  'មេសា',
  'ឧសភា',
  'មិថុនា',
  'កក្កដា',
  'សីហា',
  'កញ្ញា',
  'តុលា',
  'វិច្ឆិកា',
  'ធ្នូ',
];

const EN_WEEKDAY = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const EN_MONTH = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * Parse an ISO `YYYY-MM-DD` string as UTC midnight, so the weekday never
 * shifts by the build machine's timezone. Returns `null` on a malformed date.
 */
export function parseISODate(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  const date = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Coerce a `Date` (from Markdown frontmatter) or an ISO string to a UTC Date. */
function asDate(value: Date | string): Date | null {
  return value instanceof Date ? value : parseISODate(value);
}

/** `"Friday, 17 July 2026"` */
export function formatDateEnglish(value: Date | string, opts?: { weekday?: boolean }): string {
  const d = asDate(value);
  if (!d) return '';
  const weekday = opts?.weekday ? `${EN_WEEKDAY[d.getUTCDay()]}, ` : '';
  return `${weekday}${d.getUTCDate()} ${EN_MONTH[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** `"ថ្ងៃសុក្រ ទី១៧ ខែកក្កដា ឆ្នាំ២០២៦"` */
export function formatDateKhmer(
  value: Date | string,
  opts?: { weekday?: boolean; khmerNumerals?: boolean },
): string {
  const d = asDate(value);
  if (!d) return '';
  const num = (n: number) => (opts?.khmerNumerals === false ? String(n) : toKhmerNumerals(n));
  const weekday = opts?.weekday ? `ថ្ងៃ${KH_WEEKDAY[d.getUTCDay()]} ` : '';
  return `${weekday}ទី${num(d.getUTCDate())} ខែ${KH_MONTH[d.getUTCMonth()]} ឆ្នាំ${num(d.getUTCFullYear())}`;
}

/** Format a date in the reader's language. */
export function formatDate(
  value: Date | string,
  lang: Locale,
  opts?: { weekday?: boolean; khmerNumerals?: boolean },
): string {
  return lang === 'km' ? formatDateKhmer(value, opts) : formatDateEnglish(value, opts);
}

/**
 * The full formal Khmer holiday line: the supplied lunar string followed by the
 * computed Gregorian tail, in the client's `"…ត្រូវនឹងថ្ងៃទី…"` pattern.
 */
export function formatFullKhmerHoliday(
  lunar: string,
  iso: string,
  khmerNumerals = true,
): string {
  const gregorian = formatDateKhmer(iso, { weekday: false, khmerNumerals });
  if (!gregorian) return lunar;
  return `${lunar} ត្រូវនឹងថ្ងៃ${gregorian}`;
}

/** ISO `YYYY-MM-DD` for `<time datetime="…">`. */
export function toISODateString(value: Date | string): string {
  const d = asDate(value);
  return d ? d.toISOString().slice(0, 10) : '';
}

/** Is this date today or later? Used to hide holidays that have passed. */
export function isUpcoming(value: Date | string, from: Date = new Date()): boolean {
  const d = asDate(value);
  if (!d) return false;
  const today = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  return d.getTime() >= today;
}

/** Rough reading time for an article body, in whole minutes (min 1). */
export function readingTime(text: string, lang: Locale): number {
  if (lang === 'km') {
    // Khmer has no spaces between words, so word-splitting does not work.
    // Roughly 250 Khmer characters ≈ one minute of reading.
    const chars = text.replace(/\s+/g, '').length;
    return Math.max(1, Math.round(chars / 250));
  }
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
