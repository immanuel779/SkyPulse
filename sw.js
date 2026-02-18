/* ===========================
   SkyPulse Service Worker
=========================== */

const CACHE_VERSION = "v1";
const STATIC_CACHE  = `skypulse-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `skypulse-dynamic-${CACHE_VERSION}`;

/* ===========================
   Static Assets
=========================== */
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/style.css",
  "/script.js",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

/* ===========================
   INSTALL
=========================== */
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

/* ===========================
   ACTIVATE
=========================== */
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => ![STATIC_CACHE, DYNAMIC_CACHE].includes(key))
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

/* ===========================
   FETCH
=========================== */
self.addEventListener("fetch", event => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== "GET") return;

  // HTML navigation (App Shell)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          const cloned = response.clone();
          caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, cloned));
          return response;
        })
        .catch(() => caches.match("/index.html"))
    );
    return;
  }

  // API requests (network first)
  if (request.url.includes("api.open-meteo.com")) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const cloned = response.clone();
          caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, cloned));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Static assets (cache first)
  event.respondWith(
    caches.match(request).then(cached => {
      return (
        cached ||
        fetch(request).then(response => {
          const cloned = response.clone();
          caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, cloned));
          return response;
        })
      );
    })
  );
});
