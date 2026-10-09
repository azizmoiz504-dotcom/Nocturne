// Fakhri Tools: client entry. Plain JS, no frameworks; every page works without it.
import { initHeader, initMenu, initSearch, initCopy, initTape, initReveal, initMap } from './js/chrome.js';
import { initHours } from './js/hours.js';
import { initQuote } from './js/quote.js';
import { initCatalogue, initProduct, initContact, initPipe } from './js/pages.js';
import { initTrack } from './js/track.js';
import { initSource } from './js/source.js';

const run = (f) => {
  try {
    f();
  } catch (e) {
    console.error(e);
  }
};

[initTrack, initSource, initHours, initHeader, initMenu, initSearch, initCopy, initQuote, initCatalogue, initProduct, initContact, initPipe, initMap, initTape, initReveal].forEach(run);
