/**
 * QBIT Hub Service Worker
 *
 * PWA service worker for the Engineer Mobile Portal.
 *
 * Strategies:
 *   - App shell (HTML, JS, CSS): stale-while-revalidate
 *   - Static assets (images, fonts, icons): cache-first
 *   - API GET (read-only): network-first, fall back to cache
 *   - API POST/PATCH/PUT/DELETE: network-only (fail if offline —
 *     client-side IndexedDB queue handles offline mutations)
 *
 * Background Sync:
 *   - Listens for 'sync' events tagged 'offline-sync'
 *   - Triggers replay of queued mutations from IndexedDB
 */

const CACHE_VERSION = "qbit-hub-v2.0.0";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const API_CACHE = `${CACHE_VERSION}-api`;
const OFFLINE_URL = "/offline";

// Assets to pre-cache on install (app shell)
const PRECACHE_URLS = [
  "/",
  "/offline",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-192.png",
  "/icons/icon-maskable-512.png",
  "/favicon-32.png",
  "/apple-touch-icon.png",
];

// Install — pre-cache app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log("[SW] Pre-caching app shell");
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn("[SW] Pre-cache partial failure:", err);
      });
    }),
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith("qbit-hub-") && name !== STATIC_CACHE && name !== API_CACHE)
          .map((name) => {
            console.log("[SW] Deleting old cache:", name);
            return caches.delete(name);
          }),
      );
    }),
  );
  self.clients.claim();
});

// Fetch — strategy router
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests for caching (mutations go to network-only)
  if (request.method !== "GET") {
    // For non-GET, attempt network. If fails, client will queue in IndexedDB.
    return;
  }

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Skip Next.js HMR + dev requests
  if (url.pathname.startsWith("/_next/webpack-hmr")) {
    return;
  }

  // Strategy: API GET → network-first with cache fallback
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirstForApi(request));
    return;
  }

  // Strategy: navigation → network-first, fall back to cache, then offline page
  if (request.mode === "navigate") {
    event.respondWith(networkFirstForNavigation(request));
    return;
  }

  // Strategy: static assets → stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request));
});

/**
 * Network-first for API GETs.
 * Try network, cache the response, fall back to cache if offline.
 */
async function networkFirstForApi(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    return new Response(
      JSON.stringify({ error: "offline", message: "You are offline. Data shown may be stale." }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }
}

/**
 * Network-first for navigations.
 * Try network, fall back to cache, then offline page.
 */
async function networkFirstForNavigation(request) {
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    const offlinePage = await caches.match(OFFLINE_URL);
    if (offlinePage) return offlinePage;
    return new Response(
      "<html><body><h1>You are offline</h1><p>Please check your internet connection.</p></body></html>",
      { status: 503, headers: { "Content-Type": "text/html" } },
    );
  }
}

/**
 * Stale-while-revalidate for static assets.
 * Serve from cache immediately, fetch fresh in background.
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse && networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}

// Background Sync — replay queued mutations when connectivity returns
self.addEventListener("sync", (event) => {
  if (event.tag === "offline-sync") {
    console.log("[SW] Background sync triggered — replaying offline queue");
    event.waitUntil(replayOfflineQueue());
  }
});

// Periodic Sync — refresh cached data in background (Chrome only)
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "refresh-jobs") {
    console.log("[SW] Periodic sync — refreshing job data");
    event.waitUntil(refreshJobData());
  }
});

/**
 * Replays offline mutations queued in IndexedDB.
 * Posts each to the server, removes on success.
 */
async function replayOfflineQueue() {
  const queue = await getOfflineQueue();
  console.log(`[SW] Replaying ${queue.length} queued mutations`);

  for (const item of queue) {
    try {
      const response = await fetch(item.url, {
        method: item.method,
        headers: { "Content-Type": "application/json", ...item.headers },
        body: item.body,
      });

      if (response.ok) {
        await removeFromQueue(item.id);
        // Notify clients that this item synced
        await notifyClients({ type: "sync-success", queueId: item.id });
      } else {
        await updateQueueItem(item.id, { attempts: item.attempts + 1, lastError: `HTTP ${response.status}` });
      }
    } catch (err) {
      await updateQueueItem(item.id, { attempts: item.attempts + 1, lastError: String(err) });
    }
  }
}

async function refreshJobData() {
  try {
    const response = await fetch("/api/fsm/work-orders?due=all", { cache: "no-store" });
    if (response.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put("/api/fsm/work-orders?due=all", response.clone());
      await notifyClients({ type: "data-refreshed" });
    }
  } catch {
    // Silent fail — will retry on next periodic sync
  }
}

// IndexedDB helpers (inline — service workers can't import modules easily)
async function getOfflineQueue() {
  return new Promise((resolve) => {
    const request = indexedDB.open("qbit-offline-queue", 1);
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("queue")) {
        resolve([]);
        return;
      }
      const tx = db.transaction("queue", "readonly");
      const store = tx.objectStore("queue");
      const getAll = store.getAll();
      getAll.onsuccess = () => resolve(getAll.result ?? []);
      getAll.onerror = () => resolve([]);
    };
    request.onerror = () => resolve([]);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("queue")) {
        db.createObjectStore("queue", { keyPath: "id" });
      }
    };
  });
}

async function removeFromQueue(id) {
  return new Promise((resolve) => {
    const request = indexedDB.open("qbit-offline-queue", 1);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction("queue", "readwrite");
      tx.objectStore("queue").delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    };
    request.onerror = () => resolve();
  });
}

async function updateQueueItem(id, patch) {
  return new Promise((resolve) => {
    const request = indexedDB.open("qbit-offline-queue", 1);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction("queue", "readwrite");
      const store = tx.objectStore("queue");
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const item = getReq.result;
        if (item) {
          Object.assign(item, patch);
          store.put(item);
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    };
    request.onerror = () => resolve();
  });
}

async function notifyClients(message) {
  const clients = await self.clients.matchAll({ includeUncontrolled: true });
  for (const client of clients) {
    client.postMessage(message);
  }
}

// Push notifications (future-ready — no provider wired yet)
self.addEventListener("push", (event) => {
  if (!event.data) return;
  const payload = event.data.json();
  event.waitUntil(
    self.registration.showNotification(payload.title ?? "QBIT Hub", {
      body: payload.body ?? "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: payload.tag ?? "default",
      data: payload.data ?? {},
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/?screen=mobile-engineer";
  event.waitUntil(self.clients.openWindow(url));
});
