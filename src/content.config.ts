/**
 * ============================================================================
 * Content collections
 * ----------------------------------------------------------------------------
 * This file is the contract for every piece of editable content on the site.
 *
 *   • Structured data lives in src/data/*.json  (services, leadership, …)
 *   • Articles live in    src/content/blog/<lang>/*.md
 *
 * The schemas below are enforced at build time. If a required field is missing
 * or misspelled, `npm run build` fails with the exact file and field name
 * instead of quietly publishing a half-empty page. That is deliberate: it is
 * the safety net that makes the JSON files safe for non-developers to edit.
 * ============================================================================
 */

import { defineCollection, z } from 'astro:content';
import { file, glob } from 'astro/loaders';

/**
 * A bilingual string. English is required; Khmer is optional so the site can be
 * built and shipped while the translation is still being reviewed — a missing
 * Khmer value falls back to English rather than rendering blank.
 */
const i18nField = z.object({
  en: z.string(),
  km: z.string().optional(),
});

/** A list of bilingual strings — tag lists, bullet lists, asset types. */
const i18nList = z.array(i18nField);

/* ── Services ─────────────────────────────────────────────────────────────
   Drives the homepage services section, /services, each /services/<id> detail
   page, the Services dropdown in the main nav and the footer services column. */
const services = defineCollection({
  loader: file('src/data/services.json'),
  schema: z.object({
    /** Also the URL: /services/<id>. Changing it changes the page's address. */
    id: z.string(),
    order: z.number(),
    name: i18nField,
    /** Short form used in menus and the enquiry form's service picker. */
    shortName: i18nField,
    /** Two lines maximum — used on cards. */
    summary: i18nField,
    /** Opening paragraph of the detail page. */
    intro: i18nField,
    assetTypes: i18nList,
    purposes: i18nList,
    /** Path inside public/, e.g. "/images/services/real-estate.jpg". */
    image: z.string().default(''),
    imageAlt: i18nField.optional(),
  }),
});

/* ── Leadership ───────────────────────────────────────────────────────── */
const leadership = defineCollection({
  loader: file('src/data/leadership.json'),
  schema: z.object({
    id: z.string(),
    order: z.number(),
    /** The one person shown in the large featured card. */
    featured: z.boolean().default(false),
    /** Fallback monogram, shown until a real photograph is supplied. */
    initials: z.string(),
    name: i18nField,
    role: i18nField,
    bio: i18nField,
    qualifications: i18nList.default([]),
    memberships: i18nList.default([]),
    /** Path inside public/, e.g. "/images/leadership/sorn-seap.jpg". */
    photo: z.string().default(''),
    onHomepage: z.boolean().default(true),
  }),
});

/* ── Partners ─────────────────────────────────────────────────────────────
   The specialists APP brings in from outside Cambodia. Rendered under "Our
   Partners" on /leadership, below the APP team, and gated behind
   site.json → features.partners. */
const partners = defineCollection({
  loader: file('src/data/partners.json'),
  schema: z.object({
    id: z.string(),
    order: z.number(),
    /** Fallback monogram, shown until a real photograph is supplied. */
    initials: z.string(),
    name: i18nField,
    position: i18nField,
    /** The firm the partner leads — shown under their name. */
    institution: i18nField,
    country: i18nField,
    /** Rendered as pills. Keep each one to a few words. */
    expertise: i18nList.default([]),
    /** Both optional — an empty string hides the link rather than dead-ending. */
    website: z.string().default(''),
    linkedin: z.string().default(''),
    /** Path inside public/, e.g. "/images/partners/milton-tan.jpg". */
    photo: z.string().default(''),
  }),
});

/* ── Standards (IVS · RICS · CVEA · AVA) ──────────────────────────────── */
const standards = defineCollection({
  loader: file('src/data/standards.json'),
  schema: z.object({
    id: z.string(),
    order: z.number(),
    /** Text mark shown until an official logo asset is cleared for use. */
    abbr: z.string(),
    name: i18nField,
    summary: i18nField,
    /** Longer copy, shown only on the /standards page. */
    detail: i18nField.optional(),
    logo: z.string().default(''),
    url: z.string().default(''),
  }),
});

/* ── Asia network ─────────────────────────────────────────────────────────
   ⚠ Gated behind site.json → features.network until the Twin Pillars
   relationship is confirmed in writing. */
const network = defineCollection({
  loader: file('src/data/network.json'),
  schema: z.object({
    id: z.string(),
    order: z.number(),
    /** Cambodia — rendered as the highlighted "you are here" card. */
    isHome: z.boolean().default(false),
    isHQ: z.boolean().default(false),
    country: i18nField,
    practice: i18nField.optional(),
    specialism: i18nField,
    lead: i18nField.optional(),
  }),
});

/* ── Statistics band ──────────────────────────────────────────────────────
   `published: false` hides a figure completely. That is how the three
   unsubstantiated placeholder figures stay out of the live site without
   anyone having to remember to delete them. */
const stats = defineCollection({
  loader: file('src/data/stats.json'),
  schema: z.object({
    id: z.string(),
    order: z.number(),
    published: z.boolean().default(false),
    value: z.number(),
    prefix: z.string().default(''),
    suffix: z.string().default(''),
    /** Count up from zero when scrolled into view. Off for years like "2021". */
    animate: z.boolean().default(true),
    label: i18nField,
    /** Internal note: where the figure comes from. Never rendered. */
    evidence: z.string().default(''),
    /** Optional site.json → features switch that also hides this figure. */
    feature: z.string().optional(),
  }),
});

/* ── Public holidays / office closures ────────────────────────────────────
   `khmerLunar` is DATA, not something to compute: the Cambodian Chhankitek
   lunar calendar cannot be derived from a Gregorian date by formula. Paste the
   exact string supplied by the client. The Gregorian half is computed for you
   in src/lib/dates.ts. */
const holidays = defineCollection({
  loader: file('src/data/holidays.json'),
  schema: z.object({
    /** Same as the date — keeps the entries unique and sortable. */
    id: z.string(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the format YYYY-MM-DD'),
    khmerLunar: z.string().default(''),
    /** Leave blank if the official name has not been confirmed — the page
        renders a visible "to be confirmed" marker rather than inventing one. */
    name: z.object({ en: z.string(), km: z.string() }),
    officeClosed: z.boolean().default(true),
  }),
});

/* ── Articles / news ──────────────────────────────────────────────────────
   One Markdown file per article, filed by language:

     src/content/blog/en/my-article.md   →  /news/my-article
     src/content/blog/km/my-article.md   →  /km/news/my-article

   Articles are independent per language: an article may exist in Khmer only,
   which is how the current site publishes. Setting the same `translationKey`
   on two files tells the language switch they are the same article, so a
   reader switching language lands on the translation instead of the index. */
const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      author: z.string().optional(),
      tags: z.array(z.string()).default([]),
      /** Co-locate the image next to the .md file and write `cover: ./photo.jpg`.
          Astro then optimises and resizes it automatically. */
      cover: image().optional(),
      coverAlt: z.string().optional(),
      /** Hidden from the live site, still visible in `npm run dev`. */
      draft: z.boolean().default(false),
      /** Pins the pinned article to the top of /news. */
      featured: z.boolean().default(false),
      /** Shared id linking an article to its translation in the other language. */
      translationKey: z.string().optional(),
    }),
});

/* ── Legal pages ──────────────────────────────────────────────────────────
   Terms and privacy are long-form prose a lawyer will supply, so they are
   Markdown rather than JSON:

     src/content/legal/en/terms.md    →  /terms
     src/content/legal/km/privacy.md  →  /km/privacy

   A missing file is handled gracefully: the page renders a short placeholder
   explaining the document is being prepared, instead of 404ing on a link that
   the footer shows on every page. */
const legal = defineCollection({
  loader: glob({ base: './src/content/legal', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    description: z.string().default(''),
    updatedDate: z.coerce.date().optional(),
  }),
});

export const collections = {
  services,
  leadership,
  partners,
  standards,
  network,
  stats,
  holidays,
  blog,
  legal,
};
