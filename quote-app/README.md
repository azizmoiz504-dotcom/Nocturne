# Fakhri Quote App

Two pages for Fakhri Tools & Workshop Materials Trading LLC:

- `/quote` — staff: paste/photo/PDF a customer request → AI picks the items → check lines → customer PDF + WhatsApp text
- `/owner` — owner: cost prices, markup, sell prices, profit per quote, settings

Cost prices, markup and profit never leave the owner routes (`app/api/owner/*`). Staff routes build their answers
with `toStaffProduct` / `toStaffQuote` (field by field), and `tests/security.test.mjs` checks this.

## Run on Vercel
- Root Directory: `quote-app`
- Environment variables: `OWNER_PASSWORD`, `ANTHROPIC_API_KEY`, and the database (`POSTGRES_URL` from the Supabase
  integration, or `DATABASE_URL`). Tables are created and the product list is loaded on first start.
- Optional: `AI_LIMIT_PER_HOUR` (per staff member, default 30), `AI_LIMIT_PER_DAY` (all staff, default 300).

## Product list
`data/products.csv` is built from the Fakhri website data (291 products → one row per size × material):
`node tools/build-products.mjs <folder with js/data.js and js/choices.js> > data/products.csv`.
Cost prices are blank: the owner fills them and imports the file in Owner → Prices.

## Tests
`npm test` (source checks). With a running copy on a TEST database:
`BASE=http://localhost:3100 OWNER_PASSWORD=... npm test` (changes settings and prices, never use the real database).
