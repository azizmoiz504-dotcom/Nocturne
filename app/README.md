# Sales catalogue app (Android): four shops

One phone app for the outdoor salesmen of four shops: Fakhri Tools, Bait Al Maqdis, Mabrook and Modern Electric.
On first start the salesman picks his shop; Settings can change it later.
The shop decides the app's colours, its home-screen icon and name, the order form's logo and details, and its own cart and orders.
Each shop shows only its own products.

- **Fakhri Tools**: every range, product, size and material from the website's product list (`js/data.js`). No prices.
- **Mabrook** (Mabrook Hardware, Ajman): the same products as Fakhri Tools, with its own logo, colours and order form.
- **Bait Al Maqdis** (`bam/`): products with part numbers, sizes and prices (AED; empty = on request) on flip cards, the customer book, Arabic, and the three catalogue PDFs.
- **Modern Electric** (`me/`): electrical products with Tally item names and sizes on flip cards, made from their product list by `tools/me_import.py` (category pictures by `tools/me_covers.mjs`). Prices and photos are added with the product editor.
- Works with no signal: all products, photos and PDFs are packed inside the app. When online it checks the live website for a newer Fakhri Tools list (the one the product editor saves) and downloads any new photos. Bait Al Maqdis and Modern Electric changes come with an app update.
- Placing an order saves it straight away (no WhatsApp needed). The order form PDF can then be opened, shared or sent on WhatsApp.

The Mabrook-only app (`SHOP=mabrook`) is a second app with its own package (com.mabrookhardware.catalogue), name and icon,
so it installs next to the main app. It holds only the Mabrook shop (the Fakhri Tools list), no Bait Al Maqdis or Modern Electric data.

## Build

```
sudo apt-get install android-sdk-build-tools android-sdk-platform-23 dalvik-exchange apksigner zipalign imagemagick
app/tools/import-bam.sh <BaitAlMaqdis.apk>   # once, or copy the ready app/bam/ folder from the project files
# and copy app/me/ from the project files (fakhri/app/me-catalogue)
app/build.sh <keystore.jks> <password>      # -> app/build/fakhri-catalogue.apk
app/build.sh --www                          # only the screens, in app/build/apk/assets/www (open index.html in a browser)
SHOP=mabrook app/build.sh <keystore.jks> <password>   # -> app/build/mabrook-catalogue.apk, the Mabrook-only app
```

`app/bam/` and `app/me/` are not in GitHub on purpose: this repository is public and the folders hold the shops' prices and Bait Al Maqdis's customer list.
It is made from their old app by `tools/import-bam.sh` (needs python3 with bs4, lxml and Pillow, and node). The automated phone test builds with made-up stand-ins for both (`ci/fake-bam.py`).

The release signing key is kept outside the repository. Every update must be signed with the same key, or phones refuse to update. Raise `versionCode` in `version.txt` for each new release.
The Fakhri Tools launcher entry keeps the name `.MainActivity` (the launcher of v1.5 and earlier) so home-screen icons survive the update.

- `web/` the app's screens (HTML, CSS, JS)
- `android/` the Android shell (a full-screen WebView that serves the packed files and fetches updates)
- `tools/` the Bait Al Maqdis import, and `tools/preview/` the private browser preview (photos packed into a few files, PDFs shown on the page)
- `tools/bam-editor/` the product editor for Bait Al Maqdis (behind a password) and Modern Electric (open), one link for both (`build.py` makes it, `apply.py --dir app/bam` or `--dir app/me` applies the changes file it saves)
- `tools/bam-site/` the public Bait Al Maqdis products website, with no prices (see below)
- `ci/` the automated phone test run by `.github/workflows/catalogue-app.yml`
- `build-web.sh` the iPhone web app (Fakhri Tools only, since it is public)

## Bait Al Maqdis website

`python3 app/tools/bam-site/build.py` makes the public products website from `app/bam/` into `app/build/bait-al-maqdis/`
(English, Arabic in `ar/`, a page per range, photos, the three catalogue PDFs and the search list). It needs python3 with jinja2 and Pillow, and poppler-utils.
Prices never leave the build: product lines are read as part number and size only, and the build stops if anything written looks like a price.
Every link is relative, so the folder works at any address; it is published at `<website>/bait-al-maqdis/` (`--url` sets the address used for shared-link pictures).
After applying a changes file from the Bait Al Maqdis editor, build the website again and publish the new folder.

- `build.py` the pages; `i18n.py` every English and Arabic word on them (product names come from `app/bam/ar.js`)
- `templates/` the home page, range page and frame; `static/` the look (`site.css`), the moving parts (`site.js`: search, product window, the price-request list) and the fonts (SIL Open Font License)
