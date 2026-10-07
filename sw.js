const CACHE = "khushi-birthday-master-v3";
const ASSETS = [
  "404.html",
  "RELEASE-INVENTORY.txt",
  "admin/css/admin.css",
  "admin/js/admin.js",
  "cake-celebration.html",
  "css/animations.css",
  "css/cake-celebration.css",
  "css/fun-zone.css",
  "css/memories.css",
  "css/memory-booth.css",
  "css/message-wall.css",
  "css/mystery-gifts.css",
  "css/part7-polish.css",
  "css/sticker-studio.css",
  "css/story.css",
  "css/style.css",
  "css/wish-generator.css",
  "favicon.svg",
  "fun-zone.html",
  "images/anime/anime-demo-01.svg",
  "images/memories/memory-01.jpg",
  "images/memories/memory-02.jpg",
  "images/memories/memory-03.jpg",
  "images/memories/memory-04.jpg",
  "images/memories/our-journey.jpg",
  "images/story/chapter-01.jpg",
  "images/story/chapter-02.jpg",
  "images/story/chapter-03.jpg",
  "images/story/chapter-04.jpg",
  "index.html",
  "js/animations.js",
  "js/cake-celebration.js",
  "js/config.js",
  "js/easter-eggs.js",
  "js/fun-zone.js",
  "js/main.js",
  "js/media-data.js",
  "js/memories.js",
  "js/memory-booth.js",
  "js/message-wall.js",
  "js/mystery-gifts.js",
  "js/progress.js",
  "js/sticker-studio.js",
  "js/story.js",
  "js/surprise.js",
  "js/wish-generator.js",
  "memories.html",
  "memory-booth.html",
  "message.html",
  "mystery-gifts.html",
  "robots.txt",
  "sticker-studio.html",
  "story.html",
  "surprise.html",
  "wish-generator.html"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(ASSETS.map((path) => `./${path}`)))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.includes("/php/") || url.pathname.includes("/admin/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches.match(request)
            .then((cached) => cached || caches.match("./index.html"))
        )
    );
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      })
  );
});
