// Minimal service worker — just enough to satisfy "installable PWA" criteria
// on Android, with a basic offline fallback. Network-first: always tries the
// live site first (so you always get fresh data/code), falls back to cache
// only if the network is unavailable.
const CACHE = "businessos-shell-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, clone));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
