# Fakhri Tools: products-only site

A small one-page site for marketing posts: the product list, the product window (size, specs & ratings, material),
a quote list and WhatsApp. No build step: plain HTML, CSS and JS.

- Products, photos and choice rules are read live from the main site
  (https://azizmoiz504-dotcom.github.io/Nocturne/js/data.js and js/choices.js), so every save from the product editor
  shows here within a few minutes. `js/data.js` and `js/choices.js` in this folder are a backup copy, used only if the
  main site can't be reached.
- Kept out of Google (`noindex` meta tag, `X-Robots-Tag` header in vercel.json, robots.txt) until the shop has its own domain.
- Hosting: Vercel (project name `fakhri-tools`), no settings needed: framework "Other", no build command, root folder.
