// StarQuest Pipeline — service worker
// Network-first for the live views (so the iPad always gets fresh data when
// online), falling back to the last cached copy when offline. Cache-first
// for the static app shell (icons, manifest) since those rarely change.

const CACHE = "starquest-pipeline-v1";

// Paths are relative to this file's scope: /sqpn-dashboard/starquest-pipeline/
const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
];

// The three Canonical Pipeline Views live one directory up.
const VIEWS = ["../greenroom.html", "../pipeline.html", "../standby.html"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll([...SHELL, ...VIEWS]))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const isView = VIEWS.some((v) => req.url.endsWith(v.replace("../", "/")));
  const isShell = SHELL.some((s) => req.url.endsWith(s.replace("./", "/")) || req.url.endsWith("/"));

  if (isView || isShell) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req))
    );
  }
});
