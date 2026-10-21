# Sales catalogue app (Android): Fakhri Tools + Bait Al Maqdis

One phone app for the outdoor salesmen of both shops. On first start the salesman picks his branch; Settings can change it later.
The branch decides the app's colours, its home-screen icon and name, the order form's logo and details, and its own cart and orders.
Every salesman sees both catalogues: his branch's products first, the other shop's under "More from ...", all on one order form.

- **Bait Al Maqdis** (`bam/`): 597 products with part numbers, sizes and prices (AED; empty = on request) on flip cards, the customer book, Arabic, and the three catalogue PDFs.
- **Fakhri Tools**: every range, product, size and material from the website's product list (`js/data.js`). No prices.
- Works with no signal: all products, photos and PDFs are packed inside the app. When online it checks the live website for a newer Fakhri Tools list (the one the product editor saves) and downloads any new photos. Bait Al Maqdis prices change with an app update.
- Placing an order saves it straight away (no WhatsApp needed). The order form PDF can then be opened, shared or sent on WhatsApp.

## Build

```
sudo apt-get install android-sdk-build-tools android-sdk-platform-23 dalvik-exchange apksigner zipalign imagemagick
app/tools/import-bam.sh <BaitAlMaqdis.apk>   # once, or copy the ready app/bam/ folder from the project files
app/build.sh <keystore.jks> <password>      # -> app/build/fakhri-catalogue.apk
app/build.sh --www                          # only the screens, in app/build/apk/assets/www (open index.html in a browser)
```

`app/bam/` is not in GitHub on purpose: this repository is public and the folder holds Bait Al Maqdis prices and their customer list.
It is made from their old app by `tools/import-bam.sh` (needs python3 with bs4, lxml and Pillow, and node). The automated phone test builds with a made-up stand-in (`ci/fake-bam.py`).

The release signing key is kept outside the repository. Every update must be signed with the same key, or phones refuse to update. Raise `versionCode` in `version.txt` for each new release.
The Fakhri Tools launcher entry keeps the name `.MainActivity` (the launcher of v1.5 and earlier) so home-screen icons survive the update.

- `web/` the app's screens (HTML, CSS, JS)
- `android/` the Android shell (a full-screen WebView that serves the packed files and fetches updates)
- `tools/` the Bait Al Maqdis import
- `ci/` the automated phone test run by `.github/workflows/catalogue-app.yml`
- `build-web.sh` the iPhone web app (Fakhri Tools only, since it is public)
