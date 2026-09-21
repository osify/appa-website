/**
 * ============================================================================
 * Content access helpers
 * ----------------------------------------------------------------------------
 * Every page loads its data through this module rather than calling
 * `getCollection()` directly, so that sorting, draft handling and the
 * site.json feature switches are applied consistently in one place.
 * ============================================================================
 */

import { getCollection, type CollectionEntry } from 'astro:content';

import siteData from '../data/site.json';
import navigationData from '../data/navigation.json';
import { DEFAULT_LOCALE, LOCALES, pick, type Locale, type UIKey } from '../i18n/utils';

export type Site = typeof siteData;
export const site = siteData;

/* ── Feature switches ────────────────────────────────────────────────────── */

export type FeatureName = keyof Omit<typeof siteData.features, '_readme'>;

/** Is this section of the site switched on in site.json? */
export function isEnabled(feature: FeatureName | string | undefined): boolean {
  if (!feature) return true;
  const features = siteData.features as Record<string, unknown>;
  return features[feature] !== false;
}

/* ── Structured data ─────────────────────────────────────────────────────── */

const byOrder = (a: { data: { order: number } }, b: { data: { order: number } }) =>
  a.data.order - b.data.order;

export async function getServices(): Promise<CollectionEntry<'services'>[]> {
  return (await getCollection('services')).sort(byOrder);
}

export async function getLeadership(
  opts: { homepageOnly?: boolean } = {},
): Promise<CollectionEntry<'leadership'>[]> {
  const all = (await getCollection('leadership')).sort(byOrder);
  return opts.homepageOnly ? all.filter((p) => p.data.onHomepage) : all;
}

/**
 * External partners — the specialists APP brings in from outside Cambodia.
 * Switched off as a group by site.json → features.partners.
 */
export async function getPartners(): Promise<CollectionEntry<'partners'>[]> {
  if (!isEnabled('partners')) return [];
  return (await getCollection('partners')).sort(byOrder);
}

export async function getStandards(): Promise<CollectionEntry<'standards'>[]> {
  return (await getCollection('standards')).sort(byOrder);
}

export async function getNetwork(): Promise<CollectionEntry<'network'>[]> {
  if (!isEnabled('network')) return [];
  return (await getCollection('network')).sort(byOrder);
}

/**
 * Only figures that are both marked `published` and not gated behind a switched
 * off feature. This is what keeps the three unsubstantiated placeholder figures
 * off the live site.
 */
export async function getStats(): Promise<CollectionEntry<'stats'>[]> {
  const all = await getCollection('stats');
  return all.filter((s) => s.data.published && isEnabled(s.data.feature)).sort(byOrder);
}

/**
 * Office closures, soonest first. Past dates are dropped so the list never goes
 * stale, but only if that still leaves something to show — an empty "we are
 * closed on these days" heading looks broken.
 */
/**
 * Public holidays / office closures.
 * Switched off as a group by site.json → features.holidays, which empties the
 * list and so removes the whole block from the contact section.
 */
export async function getHolidays(
  opts: { upcomingOnly?: boolean; limit?: number } = {},
): Promise<CollectionEntry<'holidays'>[]> {
  if (!isEnabled('holidays')) return [];

  const all = (await getCollection('holidays')).sort((a, b) =>
    a.data.date.localeCompare(b.data.date),
  );

  let list = all;
  if (opts.upcomingOnly !== false) {
    const today = new Date().toISOString().slice(0, 10);
    const upcoming = all.filter((h) => h.data.date >= today);
    list = upcoming.length > 0 ? upcoming : all;
  }

  return opts.limit ? list.slice(0, opts.limit) : list;
}

/* ── Articles ────────────────────────────────────────────────────────────── */

export type Post = CollectionEntry<'blog'>;

/** The language a post is filed under, taken from its folder: `en/…` or `km/…`. */
export function postLocale(post: Post): Locale {
  const prefix = post.id.split('/')[0];
  return LOCALES.includes(prefix as Locale) ? (prefix as Locale) : DEFAULT_LOCALE;
}

/** The URL slug of a post — its id with the language folder stripped off. */
export function postSlug(post: Post): string {
  return post.id.split('/').slice(1).join('/') || post.id;
}

/**
 * Published articles in one language, newest first, featured ones pinned to the
 * top. Drafts are visible while running `npm run dev` and excluded from builds,
 * so a work-in-progress can be previewed without risk of publishing it.
 */
export async function getPosts(lang: Locale, opts: { limit?: number } = {}): Promise<Post[]> {
  const all = await getCollection('blog', ({ data }) => import.meta.env.DEV || !data.draft);

  const posts = all
    .filter((post) => postLocale(post) === lang)
    .sort((a, b) => {
      if (a.data.featured !== b.data.featured) return a.data.featured ? -1 : 1;
      return b.data.pubDate.valueOf() - a.data.pubDate.valueOf();
    });

  return opts.limit ? posts.slice(0, opts.limit) : posts;
}

/**
 * The same article in the other language, matched on `translationKey`.
 * Returns null when no translation exists — the language switch then falls back
 * to the news index, which is better than a 404.
 */
export async function getPostTranslation(post: Post, target: Locale): Promise<Post | null> {
  const key = post.data.translationKey;
  if (!key) return null;

  const all = await getCollection('blog', ({ data }) => import.meta.env.DEV || !data.draft);
  return (
    all.find((p) => postLocale(p) === target && p.data.translationKey === key) ?? null
  );
}

/* ── Legal pages ─────────────────────────────────────────────────────────── */

/**
 * Load `src/content/legal/<lang>/<slug>.md`, falling back to the English
 * document if the translation has not been written yet — a reader is better
 * served an English privacy policy than none at all. Returns null when neither
 * exists, and the page renders a "being prepared" placeholder.
 */
export async function getLegalPage(
  lang: Locale,
  slug: 'terms' | 'privacy',
): Promise<{ entry: CollectionEntry<'legal'>; isFallback: boolean } | null> {
  const all = await getCollection('legal');

  const localised = all.find((entry) => entry.id === `${lang}/${slug}`);
  if (localised) return { entry: localised, isFallback: false };

  const english = all.find((entry) => entry.id === `${DEFAULT_LOCALE}/${slug}`);
  return english ? { entry: english, isFallback: lang !== DEFAULT_LOCALE } : null;
}

/* ── Navigation ──────────────────────────────────────────────────────────── */

export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

interface RawNavItem {
  labelKey?: string;
  href?: string;
  feature?: string;
  childrenFrom?: string;
  itemsFrom?: string;
}

/**
 * Turn the declarative menus in navigation.json into ready-to-render items:
 * labels translated, feature-switched entries removed, and `childrenFrom:
 * "services"` expanded from services.json so a service is named in one place.
 */
async function resolveItems(
  raw: RawNavItem[] | RawNavItem,
  lang: Locale,
  t: (key: UIKey) => string,
): Promise<NavItem[]> {
  // A whole menu can be replaced by { itemsFrom: "services" }.
  if (!Array.isArray(raw)) {
    return raw.itemsFrom === 'services' ? serviceNavItems(await getServices(), lang) : [];
  }

  const items: NavItem[] = [];

  for (const entry of raw) {
    if (!isEnabled(entry.feature)) continue;
    if (!entry.labelKey || !entry.href) continue;

    const item: NavItem = {
      label: t(entry.labelKey as UIKey),
      href: entry.href,
    };

    if (entry.childrenFrom === 'services') {
      item.children = serviceNavItems(await getServices(), lang);
    }

    items.push(item);
  }

  return items;
}

function serviceNavItems(services: CollectionEntry<'services'>[], lang: Locale): NavItem[] {
  return services.map((service) => ({
    label: pick(service.data.name, lang),
    href: `/services/${service.id}`,
  }));
}

export interface Navigation {
  main: NavItem[];
  footerCompany: NavItem[];
  footerServices: NavItem[];
  footerLegal: NavItem[];
}

export async function getNavigation(lang: Locale, t: (key: UIKey) => string): Promise<Navigation> {
  const nav = navigationData as unknown as Record<string, RawNavItem[] | RawNavItem>;
  return {
    main: await resolveItems(nav.main, lang, t),
    footerCompany: await resolveItems(nav.footerCompany, lang, t),
    footerServices: await resolveItems(nav.footerServices, lang, t),
    footerLegal: await resolveItems(nav.footerLegal, lang, t),
  };
}
