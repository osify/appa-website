// @ts-check
import { readFileSync } from 'node:fs';

import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vue from '@astrojs/vue';
import tailwindcss from '@tailwindcss/vite';

/**
 * ── DEPLOYMENT SETTINGS ──────────────────────────────────────────────────────
 *
 * `site` and `base` are the only two values that change between hosting setups.
 * Both can be overridden by environment variables so the GitHub Actions workflow
 * can set them without editing this file.
 *
 *   A. Custom domain (e.g. https://app-appraisal.com)
 *        SITE = 'https://app-appraisal.com'      BASE = '/'
 *
 *   B. GitHub Pages project site (https://<user>.github.io/<repo>)
 *        SITE = 'https://<user>.github.io'       BASE = '/<repo>'
 *
 *   C. GitHub Pages user/org site (https://<user>.github.io)
 *        SITE = 'https://<user>.github.io'       BASE = '/'
 *
 * Getting `base` wrong is the #1 cause of "the site loads but has no CSS" on
 * GitHub Pages. Never hard-code a leading path anywhere else — always build
 * links with the helpers in src/i18n/utils.ts, which apply `base` for you.
 */
const SITE = process.env.SITE_URL ?? 'https://app-appraisal.com';
const BASE = process.env.SITE_BASE ?? '/';

/**
 * Hostnames allowed to reach the dev/preview server from outside this machine.
 *
 * Vite answers any Host header it was not told about with "Blocked request.
 * This host is not allowed", so any hostname other than localhost used to
 * reach a preview has to be named.
 * Set PREVIEW_HOSTS (comma separated) in the environment that serves the site;
 * localhost never needs listing, and the published static build has no server,
 * so none of this reaches production. Kept out of the file rather than
 * hard-coded, because this repository is public.
 */
const PREVIEW_HOSTS = (process.env.PREVIEW_HOSTS ?? '')
  .split(',')
  .map((host) => host.trim())
  .filter(Boolean);

/**
 * The Khmer launch switch, read from the same place the site reads it
 * (src/data/site.json → khmer.published). While it is false the /km pages are
 * still built and still reachable — they are simply kept out of the sitemap,
 * to match the `noindex` the layout puts on them.
 */
const KHMER_PUBLISHED = JSON.parse(
  readFileSync(new URL('./src/data/site.json', import.meta.url), 'utf-8'),
).khmer.published;

export default defineConfig({
  site: SITE,
  base: BASE,

  // Directory-style output (/about/index.html) — required for clean URLs on
  // GitHub Pages, which has no server-side rewriting.
  build: { format: 'directory' },
  trailingSlash: 'ignore',

  /**
   * English is the default language and lives at the site root (`/about`).
   * Khmer is prefixed (`/km/about`).
   *
   * Routing itself is done explicitly by the `[...lang]` page routes so that
   * every page is a real, pre-rendered static file in both languages. This
   * block gives us the `astro:i18n` URL helpers and correct sitemap output.
   */
  i18n: {
    locales: ['en', 'km'],
    defaultLocale: 'en',
    routing: {
      prefixDefaultLocale: false,
    },
  },

  integrations: [
    /**
     * Vue 3 powers the interactive islands only — the mobile menu, the contact
     * form, the animated stat counters and the sticky-header state. Everything
     * else is static .astro that ships zero JavaScript, which is what keeps the
     * site fast and keeps every word of content readable without JS.
     */
    vue(),

    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: { en: 'en', km: 'km' },
      },
      // Legal pages carry no search value and the 404 must never be indexed.
      // Khmer joins the sitemap the day `khmer.published` is flipped to true.
      filter: (page) =>
        !/\/(404|terms|privacy)\/?$/.test(page) && (KHMER_PUBLISHED || !/\/km(\/|$)/.test(page)),
    }),
  ],

  vite: {
    // Dev/preview only — see PREVIEW_HOSTS above.
    preview: { allowedHosts: PREVIEW_HOSTS },
    server: { allowedHosts: PREVIEW_HOSTS },
    plugins: [tailwindcss()],
  },
});
