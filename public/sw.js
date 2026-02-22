const CACHE_NAME = "prepmate-v2";

const STATIC_ASSETS = [
    "/",
    "/dashboard",
    "/tasks",
    "/timetable",
    "/velocity",
    "/study-plans",
    "/profile",
    "/settings",
    "/logo_icon_light.png",
    "/logo_icon_dark.png",
    "/logo_text_light.png",
    "/logo_text_dark.png",
    "/manifest.json",
];

const API_CACHE_NAME = "prepmate-api-v1";
const CACHEABLE_API_ROUTES = [
    "/api/tasks",
    "/api/studyplans",
    "/api/auth/profile",
    "/api/auth/timetable",
];

// Install — cache static shell
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
    );
    self.skipWaiting();
});

// Activate — clean up old caches
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME && key !== API_CACHE_NAME)
                    .map((key) => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

// Fetch — network-first for API, cache-first for static
self.addEventListener("fetch", (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Only handle same-origin requests
    if (url.origin !== location.origin) return;

    // API routes: network-first with cache fallback
    if (CACHEABLE_API_ROUTES.some((route) => url.pathname.startsWith(route))) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Clone and cache the fresh response
                    const clone = response.clone();
                    caches.open(API_CACHE_NAME).then((cache) => cache.put(request, clone));
                    return response;
                })
                .catch(() => caches.match(request))
        );
        return;
    }

    // Static assets & pages: cache-first with network fallback
    event.respondWith(
        caches.match(request).then((cached) => {
            if (cached) return cached;
            return fetch(request).then((response) => {
                // Cache navigations and static files
                if (request.mode === "navigate" || url.pathname.match(/\.(js|css|png|svg|ico|woff2?)$/)) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                }
                return response;
            });
        })
    );
});
