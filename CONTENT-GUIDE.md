# Editing the website

This guide is for whoever keeps the site's words and figures up to date. **You do
not need to be a developer.** Everything on the site lives in plain text files
you can edit in the GitHub web interface; saving a change rebuilds and republishes
the site automatically, usually within two or three minutes.

There are only three kinds of file you will ever touch:

| You want to change… | Edit this |
|---|---|
| A word, label, heading or button anywhere on the site | `src/i18n/en.json` (English) and `src/i18n/km.json` (Khmer) |
| A service, a person, a statistic, a holiday, contact details | a file in `src/data/` |
| An article | a `.md` file in `src/content/blog/` |

---

## The two golden rules

**1. Never change a key — only a value.**

In these files, the part on the left of the colon is the *key* (the site looks it
up by name) and the part on the right is the *value* (what visitors read).

```json
"nav.about": "About"
   ↑ key      ↑ value — change this one
```

Rename a key and that piece of text disappears from the site.

**2. Keep the punctuation exactly as it is.**

JSON is fussy. Every value is wrapped in `"double quotes"`, and every line except
the last in a block ends with a comma. If you break this, the site build fails
loudly — which is deliberate, and much better than publishing a broken page. The
error message names the file and the line, so it is usually a quick fix.

---

## English and Khmer

**English is the source of truth.** Khmer is translated from it.

- English lives at the top level of the site: `app-appraisal.com/about`
- Khmer lives under `/km/`: `app-appraisal.com/km/about`

Bilingual content is written side by side, so you can see both at once:

```json
"name": {
  "en": "Real Estate Valuation",
  "km": "ការវាយតម្លៃអចលនទ្រព្យ"
}
```

**If the Khmer is missing or left empty, the site shows the English instead** —
never a blank space. That means you can translate gradually and publish at any
point without anything breaking.

> ### ⚠ All Khmer currently on the site is an unreviewed AI draft
>
> Every Khmer string was drafted by AI, not by a native speaker. It exists so the
> fonts, line-heights and reflow could be proven — **it is not publishable copy.**
> Valuation terminology in particular must be reviewed by someone working in the
> Cambodian property industry.
>
> Start with the **Khmer Glossary** sheet of the content-plan workbook: agree the
> ~25 key terms once, then apply them everywhere. That is the highest-leverage
> hour available on this project.

### Text with formatting in it

A few keys end in `Html` — for example `hero.titleHtml`. These may contain HTML
tags that control line breaks and highlighting:

```json
"hero.titleHtml": "Valuations Cambodia trusts,<br> standards <span class=\"text-gold-500\">Asia</span> recognises."
```

Translate the words **between** the tags and leave the tags themselves alone.
`<br>` forces a line break; `<span class="text-gold-500">` colours a word gold.

---

## Changing a piece of text

Open `src/i18n/en.json`, use your browser's find (Ctrl+F) to search for the words
currently on the site, and change them. Then open `src/i18n/km.json` and change
the same key there.

The keys are named after where they appear: `nav.*` is the menu, `hero.*` is the
big banner on the homepage, `footer.*` is the footer, `contact.*` is the contact
section, and so on.

---

## Company details, phone numbers, social links

All in **`src/data/site.json`**. A few things worth knowing:

- **An empty value hides that item.** No Facebook URL yet? Leave `"url": ""` and
  the icon simply does not appear. This is true throughout the site: empty means
  "not supplied", and nothing renders broken.
- **`features`** switches whole sections off without deleting them. Setting
  `"network": false` removes the Asia Network section, its page, its menu entries
  *and* the "6 Asian markets" statistic, all at once.
- **`khmer.published`** decides whether Khmer is offered to visitors. It is
  `false` for now: the Khmer pages are still built and reachable by URL for
  review, but there is no language switch and search engines are told to skip
  them. Set it to `true` once the Khmer has been reviewed.
- **`khmer.useKhmerNumerals`** decides whether the Khmer site writes numbers as
  ០១២៣ or 0123. One setting, applied to every date and figure on the site.

---

## Adding or changing a service

**`src/data/services.json`**. Each service is one block. Adding a fourth service
means copying an existing block and editing it — its page, its menu entry, its
footer link and its homepage card all appear automatically.

The `id` is also the web address: `"id": "real-estate"` produces
`/services/real-estate`. Changing an `id` changes the URL, which breaks any link
anyone has already shared — so avoid it once the site is live.

---

## Adding or changing a person

**`src/data/leadership.json`**.

- `featured: true` gives that person the wide dark card. Only one person should
  have it.
- `initials` is the monogram shown when there is no photograph. Mr. Ngorn Sokun
  Rathna has no portrait by decision, so his monogram is final, not a placeholder.
- To add a photograph: put the file in `public/images/leadership/`, then set
  `"photo": "/images/leadership/their-name.jpg"`.
- `order` controls the sequence.

The site lists two people: Mr. Sorn Seap (Chairman) and Mr. Ngorn Sokun Rathna
(General Manager). Adding a third is a matter of copying an existing block and
changing the values — nothing else needs to be touched.

---

## Adding or changing a partner

**`src/data/partners.json`** — the "Our Partners" block at the foot of
`/leadership`. These are named individuals at other firms, not APP staff, so
each entry carries their `institution` and `country` rather than an APP job
title.

- `expertise` is the list of gold pills. A few words each.
- `website` and `linkedin` are optional — leave either as `""` and that link
  simply does not appear.
- Photographs work exactly as they do for leadership: put the file in
  `public/images/partners/` and set `"photo": "/images/partners/their-name.jpg"`.
  Neither current partner has one by decision — both monograms are final.
- To hide the whole block without deleting anyone, set `features.partners` to
  `false` in `site.json`.

---

## Changing the statistics

**`src/data/stats.json`**.

Each figure has a `published` flag. **`false` hides it completely.** Three figures
are currently hidden because nobody has supplied a real number for them:
valuations completed, portfolio value appraised, and institutional clients.

To publish one: set its real `value`, then set `"published": true`.

> If a figure is not impressive yet, **leave it hidden rather than rounding up.**
> This is a firm that sells numerical accuracy; a padded statistic on the homepage
> undermines the entire proposition.

The `evidence` field is an internal note recording where each figure came from.
It is never shown on the site — keep it accurate for whoever audits this later.

---

## Public holidays / office closures

**`src/data/holidays.json`**. Dates that have already passed drop off the list
automatically, so it never goes stale.

```json
{
  "id": "2026-05-14",
  "date": "2026-05-14",
  "khmerLunar": "ថ្ងៃព្រហស្បតិ៍ ១៣រោច ខែពិសាខ ...",
  "name": { "en": "Birthday of H.M. King Norodom Sihamoni", "km": "ព្រះរាជពិធី..." },
  "officeClosed": true
}
```

**`khmerLunar` must be typed in, not calculated.** The Cambodian Chhankitek lunar
calendar — the កើត/រោច day, the lunar month, the animal year — cannot be derived
from a Gregorian date by any formula; it has leap months and leap days set by
rules a computer cannot reproduce from the date alone. Paste the exact string
supplied by the office. The Gregorian half ("Thursday, 20 August 2026") *is*
calculated, and is always correct.

**Entries with an empty `name` show a visible "to be confirmed" marker on the
site.** Holiday names are never invented. Currently only the King's Birthday has a
confirmed name; the other seven need filling in, and the list itself should be
checked against the official public-holiday sub-decree.

---

## Writing an article

Create a new `.md` file:

- English → `src/content/blog/en/your-article-name.md`
- Khmer → `src/content/blog/km/your-article-name.md`

The filename becomes the web address, so use lowercase words joined by hyphens.

Every article starts with a block of settings between two `---` lines, then the
article itself in Markdown:

```markdown
---
title: 'What makes a valuation defensible'
description: 'One or two sentences. Shown on the news index and in Google results.'
pubDate: 2026-08-01
author: 'APP Appraisal'
tags: ['Valuation', 'Standards']
draft: false
featured: false
translationKey: 'defensible-valuation'
---

Write the article here.

## A subheading

Normal paragraphs. **Bold text** with double asterisks, *italic* with single.

- A bullet
- Another bullet

[A link](/contact)
```

| Setting | What it does |
|---|---|
| `title` | The headline |
| `description` | Summary for the index page and search engines |
| `pubDate` | Publication date, always `YYYY-MM-DD` |
| `author` | Optional |
| `tags` | Optional labels |
| `draft` | `true` hides it from the live site — safe for works in progress |
| `featured` | `true` pins it to the top of the news page |
| `translationKey` | See below |

### Linking an article to its translation

Give the English file and the Khmer file **the same `translationKey`**. Then a
reader who switches language mid-article lands on the translation instead of back
on the index.

Articles do not have to exist in both languages. Write Khmer only if that suits —
the language switch just sends readers to the news index instead, and never to a
page that does not exist.

### Adding a picture to an article

Put the image file in the same folder as the `.md` file, then:

```markdown
cover: ./photo.jpg
coverAlt: 'A short description of the photograph, for screen readers'
```

The site resizes and optimises it for you. Use owned or licensed photography only.

---

## Photographs elsewhere on the site

Put files in `public/images/`, then reference them by path:

| Where | Setting | Suggested size |
|---|---|---|
| Homepage banner | `site.json` → `images.hero` | 2400 × 1400 |
| About section | `site.json` → `images.about` | 1600 × 1000 |
| Service cards | `services.json` → `image` | 1400 × 900 |
| Leadership photos | `leadership.json` → `photo` | 600 × 600 |
| Partner photos | `partners.json` → `photo` | 600 × 600 |
| Social sharing card | `site.json` → `seo.ogImage` | 1200 × 630 |

All but Mr. Sorn Seap's portrait are currently empty, and the design falls back to its dark
treatment — which looks deliberate rather than unfinished. **Leave a path empty
until the file actually exists**; pointing at a missing file shows a broken image
to every visitor.

**The people without portraits are settled, not pending.** Mr. Ngorn Sokun Rathna,
Mr. Milton Tan and Mr. Siong Yoong are shown as monograms by decision — their
cards are finished as they are, and nobody needs to chase photographs for them.
Only Mr. Sorn Seap's card carries a portrait.

---

## How visitors get in touch

There is **no enquiry form**, by design. The site is served from GitHub Pages,
which serves fixed files and runs no software of its own, so there would be
nothing on the server to receive a submission.

Instead the contact panel offers three routes the visitor's own device opens:

| Route | Setting in `src/data/site.json` |
|---|---|
| Email | `contact.email` |
| Telegram | `contact.telegram` (the `t.me` link) and `contact.telegramDisplay` (what is shown) |
| Telephone | `contact.phones` |

Empty any of those and that row simply disappears — nothing breaks, and no
message about a missing form is ever shown.

> ### 🔒 Never put a Telegram bot token in these files
>
> Everything in this repository is public the moment the site is built — a token
> placed here can be read by anyone and used to control the bot.
>
> To reach Telegram safely, either put the `t.me` link in
> `site.json` → `contact.telegram` (the visitor's own Telegram app sends the
> message, so no token exists anywhere), or run the relay described in
> `document/ASTRO-CONTACT-TELEGRAM.md` on a host that executes server code.

---

## Publishing a change

**In the GitHub web interface:** open the file, click the pencil icon, make your
change, and click *Commit changes*. That is the whole process. The site rebuilds
and republishes itself within a few minutes.

**If a change does not appear:** open the **Actions** tab in GitHub. A green tick
means it published. A red cross means the build found a problem — click into it
and the error names the file and line. Almost always this is a missing comma or
quotation mark in a JSON file. The previous version of the site stays live until
the problem is fixed, so a mistake never takes the site down.

---

## Still outstanding

These are the things the site is waiting on. Each is listed against its source in
the content-plan workbook.

| # | Needed | Where it goes |
|---|---|---|
| 1 | **Confirm the Twin Pillars relationship in writing** | Not confirmed, so `features.network` is now `false` and the section is off. Confirm it to switch back on |
| 2 | Real figures: valuations completed, portfolio value, institutional clients | `stats.json` |
| 3 | Native Khmer review of every string | `km.json`, `services.json`, `leadership.json`, `partners.json`, all `.md`. The Khmer pages are built but unpublished (`khmer.published`) until this is done |
| 4 | Legal review of the terms and privacy drafts | `src/content/legal/` |
| 5 | Official public-holiday list + the seven missing holiday names | `holidays.json`. The block is hidden for now (`features.holidays`), so this is only needed if it is switched back on |
| 6 | The real APP wordmark as an SVG | `public/images/`, then `Logo.astro` |
| 7 | Photography: hero, about, three services | `public/images/`. Portraits are settled — only Mr. Sorn Seap has one, the other three are monograms by decision |
| 8 | Written permission before using the IVS / RICS logos | `standards.json` → `logo` |
| 9 | Facebook URL, LinkedIn if one exists, Telegram | `site.json` → `social` |
| 10 | Office hours, registration numbers | `site.json`. The address and the Google Maps link are now supplied |
| 11 | The real response-time commitment, if any | `contact.sub` in `en.json` |

On #11: the prototype promised a reply "usually within one business day". That was
invented, not supplied, so it has been **removed** from the copy. Put it back only
if the team can actually commit to it.
