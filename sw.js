const CACHE_NAME = "videovault-v1";

const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./style.css",
    "./script.js",
    "./management.js",
    "./manifest.json",
    "./icons/icon-192.png",
    "./icons/icon-512.png"
];

// Встановлення Service Worker
self.addEventListener("install", event => {

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(FILES_TO_CACHE))
    );

    self.skipWaiting();

});

// Активація та очищення старого кешу
self.addEventListener("activate", event => {

    event.waitUntil(
        caches.keys().then(cacheNames => {

            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );

        })
    );

    self.clients.claim();

});

// Обробка запитів
self.addEventListener("fetch", event => {

    const request = event.request;

    // Працюємо тільки з GET-запитами
    if (request.method !== "GET") {
        return;
    }

    // Не кешуємо сторонні сайти
    const url = new URL(request.url);

    if (url.origin !== self.location.origin) {
        return;
    }

    // Для переходів між сторінками спочатку пробуємо мережу
    if (request.mode === "navigate") {

        event.respondWith(
            fetch(request)
                .then(response => {

                    const responseCopy = response.clone();

                    caches.open(CACHE_NAME).then(cache => {
                        cache.put("./index.html", responseCopy);
                    });

                    return response;

                })
                .catch(() => {
                    return caches.match("./index.html");
                })
        );

        return;
    }

    // Для інших файлів спочатку використовуємо кеш
    event.respondWith(
        caches.match(request)
            .then(cachedResponse => {

                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(request).then(response => {

                    if (response.ok) {
                        const responseCopy = response.clone();

                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(request, responseCopy);
                        });
                    }

                    return response;

                });

            })
    );

});
