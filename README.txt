FAKHRI TOOLS & WORKSHOP MATERIALS TRADING LLC — WEBSITE
=======================================================

HOME PAGE
---------
index.html  (the whole site is this one page)


WHAT IT IS BUILT WITH
---------------------
Plain HTML, CSS and JavaScript. There is no framework and no build step.
Everything the site needs is inside this folder, so it also works offline.

Libraries (in the vendor/ folder):
  - GSAP 3.12.5 + ScrollTrigger ... scroll animations
  - Lenis 1.1.13 .................. smooth scrolling
  - Three.js r128 ................. the 3D valve
  - d3 7.8.5 + topojson-client 3.1.0 + world-atlas land-110m ... the globe

Fonts (in the fonts/ folder): Barlow, Barlow Condensed, Barlow Semi Condensed.


HOW TO RUN IT
-------------
There is nothing to build or install.

Option 1: double-click index.html. It opens in your browser.

Option 2 (recommended, the closest to a real website): start a small local
web server in this folder, then open the address it gives you.
    python -m http.server 8000
    then open http://localhost:8000

To put it online: upload everything in this folder to any static web host
(keep the folders exactly as they are). index.html is the home page.


FOLDERS
-------
index.html ........ the page
css/style.css ..... all styles
js/config.js ...... contact details (phone, WhatsApp, email, maps link, opening hours)
js/data.js ........ product catalogue (18 categories, 114 products) and brands list
js/main.js ........ page behaviour (menus, products showroom, quote list, form)
js/valve3d.js ..... 3D valve
js/globe.js ....... globe in the "Visit" section
assets/ ........... logos, favicon, product photos (assets/products/), brand logos (assets/brands/)
fonts/ ............ font files + fonts.css
vendor/ ........... the libraries listed above


STILL TO FILL IN
----------------
  - WhatsApp number ... js/config.js -> whatsappDisplay and whatsappDigits
  - Email ............. js/config.js -> email
  - Google Maps link .. js/config.js -> mapsUrl (the Maps search link is used until then)
  - Website domain .... index.html, comment near the top (canonical link)
  - Social media ...... nothing is shown until links are added
  - Brand logos ....... put files in assets/brands/ and set "logo" for each brand in js/data.js
Until the WhatsApp number and email are added, those buttons show a
"not added yet — please call +971 4 285 0135" message.


NOTES
-----
  - The product photos and the "Industries" section were taken from the
    SYN Trading website (syntrading.com). Make sure you have permission to
    use them before the site goes live.
  - Licences: GSAP (GreenSock standard no-charge licence), Lenis and Three.js
    (MIT), d3 and topojson (ISC), fonts (SIL Open Font License, see
    fonts/OFL-NOTICE.txt).
