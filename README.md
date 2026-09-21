# APP Appraisal — website

Bilingual (English / ខ្មែរ) static site for **Asia Pacific Property Appraisal
Co., Ltd.**, Phnom Penh.

Built with **Astro 7**, **Vue 3** (interactive islands only) and **Tailwind CSS 4**,
deployed to **GitHub Pages**. Ported from the signed-off static prototype in
`../document/prototype/`.

> **Editing content?** You want **[CONTENT-GUIDE.md](./CONTENT-GUIDE.md)**, not this
> file. Nothing on this page is needed to change the site's words, figures or
> articles.

---

## Quick start

```sh
npm install
npm run dev        # http://localhost:4321
```

| Command | What it does |
|---|---|
| `npm run dev` | Development server with live reload |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the built site at http://localhost:4322 |
| `npm run check` | Type-check every component, page and content file |

`npm run check` validates the JSON and Markdown content against the schemas in
`src/content.config.ts`. A mistyped field fails the build with the exact file and
field name rather than quietly publishing a half-empty page. It runs in CI before
every deploy.

---

## How the two languages work

English is the default and lives at the site root; Khmer is prefixed.

```
/                    /km/
/about               /km/about
/services/business   /km/services/business
/news/<slug>         /km/news/<slug>
```

**Both are real, pre-rendered static pages.** None of the runtime string-swapping
from the prototype ships — `<html lang>` is written into the served HTML, so Khmer
never flashes in a Latin font and the language choice needs no JavaScript.

Every page is generated twice by a single file, using the `[...lang]` rest
parameter in `src/pages/`. `lang: undefined` produces the unprefixed English
route; see `localePaths()` in `src/i18n/utils.ts`.

Three helpers do all the work, and **nothing should bypass them** — hard-coding
`/km/` or the deployment base path is what breaks a GitHub Pages sub-directory
deploy:

| Helper | Use |
|---|---|
| `t('some.key')` | A translated UI string, falling back to English |
| `path(lang, '/about')` | A URL in the current language, with `base` applied |
| `pick(field, lang)` | The right half of a bilingual `{ en, km }` data field |

A key missing from `km.json` falls back to English rather than rendering blank,
so the site is always shippable mid-translation.

---

## Where things live

```
src/
├── data/                 ← JSON content: the client's main editing surface
│   ├── site.json           company details, contact, feature switches
│   ├── navigation.json     the menus
│   ├── services.json       3 services  → /services/<id> pages
│   ├── leadership.json     5 people
│   ├── standards.json      IVS · RICS · CVEA · AVA
│   ├── network.json        6 Asian markets
│   ├── stats.json          the figures, each with a `published` flag
│   └── holidays.json       office closures + Khmer lunar dates
│
├── content/              ← Markdown
│   ├── blog/en/  blog/km/  articles, one file each
│   └── legal/en/ legal/km/ terms + privacy
│
├── i18n/
│   ├── en.json             every UI string — the source of truth
│   ├── km.json             the Khmer for the same keys
│   └── utils.ts            t() · path() · pick() · locale helpers
│
├── content.config.ts     ← schemas: the contract for everything above
├── lib/
│   ├── content.ts          collection access, sorting, feature gating
│   └── dates.ts            English + Khmer date formatting
│
├── components/
│   ├── sections/           the homepage sections
│   ├── vue/                the three interactive islands
│   └── *.astro             cards, header, footer, icons
│
├── layouts/BaseLayout.astro
├── pages/[...lang]/        every page, generated in both languages
└── styles/global.css       design tokens, Khmer typography, prose styles
```

### Design tokens

There is **no `tailwind.config.mjs`**. Tailwind 4 reads the tokens from the
`@theme` block at the top of `src/styles/global.css`. Adding
`--color-brand-500` there immediately makes `bg-brand-500`, `text-brand-500` and
friends available.

| Token | Value | Use |
|---|---|---|
| `navy-900` | `#0B1622` | Primary dark |
| `navy-800` | `#12233A` | Standards section |
| `gold-500` | `#C6A662` | Brand accent, from the APP logo |
| `slate-500` | `#56697C` | Body text |
| `sand` | `#F7F4EE` | Warm neutral band |

**Type:** Source Serif 4 (Latin headings) + Inter (Latin body) +
**Kantumruy Pro** (all Khmer, headings and body). All three are self-hosted
variable fonts split by `unicode-range`, so a page downloads only the slice it
renders — an English page never pays for the Khmer file.

---

## Vue islands

Vue is used only where there is genuine interactive state. Everything else is
static `.astro` that ships **zero** JavaScript.

| Island | Loads | Why it is a component |
|---|---|---|
| `MobileMenu.vue` | `client:idle` | Open/closed, Escape to close, focus trap, scroll lock |
| `StatCounter.vue` | `client:visible` | Count-up animation with correctness guards |

The desktop navigation, the language switch and the holiday list are deliberately
**not** islands — they are plain server-rendered HTML, fully crawlable and working
with JavaScript disabled.

---

## Deploying

Push to `main`. `.github/workflows/deploy.yml` type-checks, builds and publishes.

`site` and `base` are the only two values that change between hosting setups, and
CI derives both from `actions/configure-pages`, so a project site, a user site and
a custom domain all work without editing anything. Locally they default to
`https://app-appraisal.com` and `/`; override with the `SITE_URL` and `SITE_BASE`
environment variables.

**Getting `base` wrong is the number-one cause of "the site loads but has no CSS"
on GitHub Pages.** Always build links with `path()`.

For a custom domain, add a `CNAME` file containing the domain to `public/`.
`public/.nojekyll` is already present — without it GitHub Pages would silently
drop the `_astro/` asset directory.

---

## Things not to break

All four were bugs found and fixed during development. Each looks like harmless
polish and each silently breaks the site.

1. **The `.js` class scoping on `.reveal`.** The scroll-reveal animation starts at
   `opacity: 0`, scoped to `.js .reveal`, and the `js` class is set by an inline
   script in `<head>`. Remove that scoping and anyone with JavaScript disabled
   gets a **completely blank page**.

2. **The stat-counter guards.** `requestAnimationFrame` is paused in background
   tabs, so a naive count-up freezes mid-animation and leaves a *wrong number* on
   screen — "2+ years of experience" where the truth is "10+". The reduced-motion
   check, the `document.hidden` check and the safety timer all exist so the figure
   is always correct. On a site selling numerical accuracy, the number matters
   more than the animation.

3. **The Khmer line-height and letter-spacing overrides** in `global.css`. They
   look like arbitrary `!important` noise. They are not. Khmer stacks diacritics
   above the baseline and subscript consonants (*coeng*) below it, so the display
   leading used for English clips both; and Latin letter-spacing pulls a *coeng*
   away from the character it belongs to, changing how the word reads. `word-break`
   is deliberately left alone — Khmer has no spaces between words and forcing
   `break-word` would split inside a cluster and produce nonsense.

4. **The logo inherits `currentColor`.** The wordmark's barcode and its "APPRAISAL"
   caption take their colour from the anchor wrapping them, which is how the header
   recolours the whole mark in one step as it scrolls from transparent to solid.
   Hard-code a colour on either and it disappears against one of the two headers.

---

## Before this goes live

Content owners: see the checklist at the end of
**[CONTENT-GUIDE.md](./CONTENT-GUIDE.md)**. The two that block launch:

1. **The Twin Pillars relationship is unconfirmed.** The Asia Network section
   states APP is the Cambodia practice of the Twin Pillars group. That is sourced
   from twinpillars.asia's own *Team Asia* page, **not** from APP. If it cannot be
   confirmed in writing, set `features.network` to `false` in `site.json` — the
   section, its page, its menu entries and the "6 Asian markets" statistic all
   disappear together and nothing else breaks.

2. **All Khmer is an unreviewed AI draft** and is not publishable copy.

Also outstanding: the terms and privacy documents are drafts needing legal review;
and no photography or logo artwork has been supplied beyond the Chairman's
portrait.

---

## Verified

- 29 pages build clean; `npm run check` reports 0 errors, 0 warnings.
- Every page exists in both languages, with `hreflang` alternates and a canonical.
- All content is present in the served HTML — the site is readable with JavaScript
  disabled.
- Stat counters land on their true values, including in throttled and background
  tabs.
- Khmer renders in Kantumruy Pro with no clipped diacritics or *coeng*.
- No horizontal overflow.
- Nothing references an asset that does not exist: no broken images, no dead
  `og:image`, no 404 icon requests.
