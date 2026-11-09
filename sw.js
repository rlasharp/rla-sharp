/* RLA Sharp service worker: always try the network first (data changes all day, revalidated every time),
   fall back to the last saved copy when offline. Never caches live-score API calls. */
const CACHE = "rla-sharp-v2";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {})); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return; // ESPN live feed etc. go straight to the network
  const key = u.origin + u.pathname;                       // one saved copy per file (ignore ?t= / ?v= cache-busters)
  const net = e.request.mode === "navigate" ? fetch(u.href, { cache: "no-cache" }) : fetch(e.request);
  e.respondWith(net.then(r => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(key, cp)); } return r; })
    .catch(() => caches.match(key).then(m => m || caches.match(e.request, { ignoreSearch: true })).then(m => m || caches.match("index.html"))));
});
