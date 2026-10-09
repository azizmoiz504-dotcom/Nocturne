# SEO log

What was changed for search, why, and what to check next. Newest first. The full audit, keyword research, competitor study and the Google Business Profile plan are kept in the project files under `fakhri/seo/`.

## 9 Oct 2026: groundwork (PR #1)

**State found**
- The published copy on `gh-pages` carries `noindex, nofollow` on every page, so Google cannot list the site. The source in this repo does not. The tag was added at publish time.
- No domain of its own (`azizmoiz504-dotcom.github.io/Nocturne/`).
- 75 of 85 product descriptions and their photos are copied from aqmoilfield.com, and 10 photos come from mabrook-uae.com. Copied pages do not rank.
- No sitemap, robots.txt, canonical links, structured data or analytics.

**Changed**
| Change | Why |
|---|---|
| Canonical link, Open Graph and Twitter tags on every page, built from `SITE.url` | Tells Google which address is the real one, and gives WhatsApp link previews a logo card (`assets/img/brand/share.png`) |
| `HardwareStore` JSON-LD on home, about and contact; `BreadcrumbList` on inner pages; `WebSite` on home | Lets Google read name, address, phone and hours. No `geo` because our pin is approximate. No `Product` because Google requires a price or review for it and we show neither |
| Titles name the product plus Dubai or Al Quoz; product meta descriptions cut at a word and end with the phone | Titles are the strongest on-page signal, and the old ones named no place |
| `sitemap.xml` (90 URLs) and `robots.txt` from `tools/build-pages.mjs` | Helps Google find every page. Note: robots.txt only counts at the root of a domain, so it starts working once the site moves to its own domain |
| Legal page `noindex, follow`; branded `404.html` (`noindex`) | The legal page is placeholder text. The 404 page keeps lost visitors |
| Nine product URLs fixed (`needal-valves` → `needle-valves`, etc.) | Clean URLs. Free to change now, because nothing is indexed yet |
| Fonts served as files instead of inside the CSS (198 KB → 48 KB), main font preloaded | Faster first paint on phones (Largest Contentful Paint) |
| `src/js/track.js`: `click_call`, `click_whatsapp`, `click_email`, `click_directions`, `add_to_quote`, `copy_quote_list`, `copy_enquiry`, `generate_lead` | Measures what turns into orders. Switched on by `SITE.ga4` |
| `NOINDEX=1 npm run build` | Builds a preview copy that Google ignores |

`assets/img/brand/logo-stacked.png` (600×600) and `share.png` (1200×630) were rendered once from the SVG logos in headless Chromium.

**Waiting on the owner**
1. Domain. Then set `SITE.url` in `tools/build-data.py` and `src/data.js`, add a `CNAME` file, rebuild, and publish **without** noindex.
2. The list of lines the Al Quoz branch really stocks, and whether it sells tools. Then rewrite the descriptions in our own words, take our own photos, and add 12 category landing pages.
3. WhatsApp number and quote email (`SITE.whatsapp`, `SITE.email`).
4. GA4 Measurement ID (`SITE.ga4`).
5. Google Business Profile share link, to replace `SITE.maps`.

**Check next**
- After launch: Search Console → Pages (indexed count), Enhancements (breadcrumbs, and the LocalBusiness rich result test at search.google.com/test/rich-results).
- PageSpeed Insights, mobile, home and one product page. Target LCP under 2.5 s.
