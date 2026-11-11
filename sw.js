/*
 * Service Worker: macht die App offline-fähig.
 * - App-Dateien: zuerst Netz (immer aktuell), ohne Netz aus dem Speicher
 * - Kartenkacheln (nur Quellen mit offline: true): zuerst Speicher, sonst Netz und speichern
 * - Daten (Claims, Minen, Geologie) speichert die App selbst (js/app.js, cachedFetch)
 */
importScripts("config.js");

var APP_CACHE = "gc-app-v" + APP_CONFIG.appVersion;
var TILE_CACHE = "gc-tiles";

var APP_FILES = [
  "./", "index.html", "style.css", "config.js", "manifest.webmanifest",
  "js/storage.js", "js/app.js", "js/points.js", "js/exportimport.js", "js/offline.js",
  "js/auth.js", "js/admin.js", "js/coords.js", "js/claims.js", "js/tracks.js", "js/parking.js", "js/help.js", "js/sync.js",
  "lib/leaflet.js", "lib/leaflet.css", "lib/supabase.js", "lib/qrcode.js",
  "lib/images/marker-icon.png", "lib/images/marker-icon-2x.png", "lib/images/marker-shadow.png",
  "lib/images/layers.png", "lib/images/layers-2x.png",
  "icons/icon-192.png", "icons/icon-512.png"
].concat(
  APP_CONFIG.overlays.filter(function (o) { return o.type === "file"; })
    .reduce(function (all, o) { return all.concat(o.files || []); }, [])
);

// Adress-Anfang jeder offline-fähigen Kachelquelle
function prefix(url) {
  var i = url.search(/[{?]/);
  return i < 0 ? url : url.slice(0, i);
}
var TILE_PREFIXES = APP_CONFIG.basemaps.concat(APP_CONFIG.overlays)
  .filter(function (s) { return s.offline && (s.type === "tiles" || !s.type); })
  .map(function (s) { return prefix(s.url); });

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(APP_CACHE).then(function (c) {
    // einzeln, damit eine fehlende Datei nicht alles verhindert
    return Promise.all(APP_FILES.map(function (f) { return c.add(f).catch(function () {}); }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf("gc-app-") === 0 && k !== APP_CACHE; })
      .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function startsWithAny(url, list) {
  return list.some(function (p) { return url.indexOf(p) === 0; });
}

// Zuerst Netz; bei schlechtem Empfang nach 4 Sekunden auf die gespeicherte Version ausweichen
function networkFirst(req, cacheName) {
  var fromCache = function () {
    return caches.open(cacheName).then(function (c) { return c.match(req, { ignoreVary: true }); });
  };
  var net = fetch(req).then(function (res) {
    if (res.ok) {
      var copy = res.clone();
      caches.open(cacheName).then(function (c) { c.put(req, copy); });
    }
    return res;
  });
  var slow = new Promise(function (resolve) {
    setTimeout(function () { fromCache().then(function (hit) { if (hit) resolve(hit); }); }, 4000);
  });
  return Promise.race([net, slow]).catch(function () {
    return fromCache().then(function (hit) { return hit || Response.error(); });
  });
}

function cacheFirst(req, cacheName) {
  return caches.open(cacheName).then(function (c) {
    return c.match(req.url, { ignoreVary: true }).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (res) {
        if (res.ok && res.type !== "opaque") c.put(req.url, res.clone());
        return res;
      });
    });
  });
}

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = req.url;
  if (url.indexOf(self.location.origin) === 0) {
    e.respondWith(networkFirst(req, APP_CACHE));
  } else if (startsWithAny(url, TILE_PREFIXES)) {
    e.respondWith(cacheFirst(req, TILE_CACHE));
  }
});
