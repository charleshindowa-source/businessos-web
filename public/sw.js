// Service worker for MiKish Store. Network-first: always tries the live
// site first (so you get fresh code/data when online), falling back to
// cache when the network is unavailable — this is what makes the app
// installable and usable offline once it's been opened at least once.
const CACHE = "mikish-store-shell-v1";

// Stable-named shell files precached on install, so a first-ever offline
// launch (no prior visit to warm the cache) still has something to show.
const PRECACHE_URLS = [
  "./", "./index.html", "./manifest.json",
  "./icon-192.png", "./icon-512.png", "./icon-512-maskable.png",
  "./favicon.png", "./logomark.png", "./logo.png", "./apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE_URLS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const isNavigation = event.request.mode === "navigate";

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, clone));
        return res;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        // SPA offline fallback: an uncached deep link still gets the app
        // shell, which then renders the right screen client-side.
        if (isNavigation) return caches.match("./index.html");
        return Response.error();
      })
  );
});
