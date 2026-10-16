# Fakhri Tools catalogue app (Android)

A phone app for the outdoor salesman: Home, Orders (order form) and Cart, with every range, product, size and material from the website's product list (`js/data.js`). No prices anywhere.

- Works with no signal: all products and photos are packed inside the app.
- When the phone is online it checks the live website for a newer product list (the one the product editor saves) and downloads any new photos.
- Orders and the cart are sent to the shop on WhatsApp (+971 52 276 7034).

## Build

```
sudo apt-get install android-sdk-build-tools android-sdk-platform-23 dalvik-exchange apksigner zipalign imagemagick
app/build.sh <keystore.jks> <password>      # -> app/build/fakhri-catalogue.apk
```

The release signing key is kept outside the repository. Every update must be signed with the same key, or phones refuse to update. Raise `versionCode` in `version.txt` for each new release.

- `web/` the app's screens (HTML, CSS, JS)
- `android/` the Android shell (a full-screen WebView that serves the packed files and fetches updates)
- `ci/` the automated phone test run by `.github/workflows/catalogue-app.yml`
