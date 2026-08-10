/// <reference lib="esnext" />
/// <reference lib="webworker" />

import type { PrecacheEntry, SerwistGlobalConfig, SerwistPlugin } from "serwist";
import {
  CacheFirst,
  CacheableResponsePlugin,
  ExpirationPlugin,
  NetworkFirst,
  Serwist,
  StaleWhileRevalidate,
  copyResponse,
} from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const DAY = 24 * 60 * 60 * 1000;
const TRAIN_CACHE = "venaarauhassa-trains-v1";
const HOME_CACHE = "venaarauhassa-home-v1";
const METADATA_CACHE = "venaarauhassa-cache-metadata-v1";
const TRAIN_PATH = /^\/train\/\d{4}-\d{2}-\d{2}\/\d+$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

function canonicalTrainUrl(value: string | URL): URL | null {
  const url = new URL(value, self.location.origin);
  if (url.origin !== self.location.origin || !TRAIN_PATH.test(url.pathname)) return null;
  url.search = "";
  url.hash = "";
  return url;
}

function canonicalHomeUrl(value: string | URL): URL | null {
  const url = new URL(value, self.location.origin);
  if (url.origin !== self.location.origin || url.pathname !== "/") return null;

  const date = url.searchParams.get("date");
  url.search = "";
  url.hash = "";
  if (date && DATE.test(date)) url.searchParams.set("date", date);
  return url;
}

async function readCachedAt(url: URL): Promise<number | null> {
  const metadata = await caches.open(METADATA_CACHE);
  const response = await metadata.match(url.href);
  if (!response) return null;
  const cachedAt = Number(await response.text());
  return Number.isFinite(cachedAt) ? cachedAt : null;
}

async function cacheDocument(
  url: URL,
  cacheName: string,
  maxEntries: number,
  requiredMarker?: string
) {
  const existingCachedAt = await readCachedAt(url);
  if (existingCachedAt && Date.now() - existingCachedAt < 10 * 60 * 1000) return;

  const response = await fetch(url.href, {
    cache: "no-store",
    credentials: "same-origin",
    headers: { Accept: "text/html" },
  });
  const contentType = response.headers.get("content-type") ?? "";
  if (!response.ok || !contentType.includes("text/html")) return;

  if (requiredMarker && !(await response.clone().text()).includes(requiredMarker)) return;

  const cache = await caches.open(cacheName);
  const metadata = await caches.open(METADATA_CACHE);
  await Promise.all([cache.delete(url.href), metadata.delete(url.href)]);
  await Promise.all([
    cache.put(url.href, response),
    metadata.put(url.href, new Response(String(Date.now()))),
  ]);

  const keys = await cache.keys();
  const excessKeys = keys.slice(0, Math.max(0, keys.length - maxEntries));
  await Promise.all(excessKeys.flatMap((key) => [cache.delete(key), metadata.delete(key.url)]));
}

async function getCachedDocument(cacheName: string, url: URL): Promise<Response | undefined> {
  const cachedAt = await readCachedAt(url);
  const cache = await caches.open(cacheName);

  if (!cachedAt || Date.now() - cachedAt >= DAY) {
    await Promise.all([
      cache.delete(url.href),
      caches.open(METADATA_CACHE).then((m) => m.delete(url.href)),
    ]);
    return undefined;
  }

  const response = await cache.match(url.href);
  if (!response) return undefined;

  return copyResponse(response, (init) => {
    const headers = new Headers(init.headers);
    headers.append("Server-Timing", 'pwa-cache;desc="Served from CacheStorage"');
    return { ...init, headers };
  });
}

const markCachedResponse: SerwistPlugin = {
  async cachedResponseWillBeUsed({ cachedResponse }) {
    if (!cachedResponse) return null;
    return copyResponse(cachedResponse, (init) => {
      const headers = new Headers(init.headers);
      headers.set("X-PWA-Cache", "true");
      return { ...init, headers };
    });
  },
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  precacheOptions: {
    cleanupOutdatedCaches: true,
    ignoreURLParametersMatching: [/^utm_/, /^fbclid$/],
  },
  clientsClaim: true,
  navigationPreload: false,
  disableDevLogs: true,
});

serwist.registerCapture(
  ({ sameOrigin, url }) => sameOrigin && url.pathname === "/api/trains",
  new NetworkFirst({
    cacheName: "venaarauhassa-train-lists-v1",
    networkTimeoutSeconds: 5,
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({ maxEntries: 3, maxAgeSeconds: DAY / 1000 }),
      markCachedResponse,
    ],
  })
);

serwist.registerCapture(
  ({ request, sameOrigin }) => sameOrigin && request.destination === "image",
  new StaleWhileRevalidate({
    cacheName: "venaarauhassa-images-v1",
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: (30 * DAY) / 1000 }),
    ],
  })
);

serwist.registerCapture(
  ({ request, sameOrigin, url }) =>
    !sameOrigin &&
    request.method === "GET" &&
    request.destination === "" &&
    url.pathname.endsWith(".svg"),
  new CacheFirst({
    cacheName: "venaarauhassa-floorplans-v1",
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({ maxEntries: 48, maxAgeSeconds: (30 * DAY) / 1000 }),
    ],
  })
);

serwist.registerCapture(
  ({ request, sameOrigin, url }) =>
    sameOrigin && request.mode === "navigate" && url.pathname !== "/~offline",
  async ({ request, url }) => {
    try {
      return await fetch(request);
    } catch (error) {
      const trainUrl = canonicalTrainUrl(url);
      const homeUrl = canonicalHomeUrl(url);
      const cached = trainUrl
        ? await getCachedDocument(TRAIN_CACHE, trainUrl)
        : homeUrl
          ? await getCachedDocument(HOME_CACHE, homeUrl)
          : undefined;
      if (cached) return cached;

      const offlinePage = await serwist.matchPrecache("/~offline");
      if (offlinePage) return offlinePage;
      throw error;
    }
  }
);

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.delete(TRAIN_CACHE),
      caches.delete(HOME_CACHE),
      caches.delete(METADATA_CACHE),
    ])
  );
});

self.addEventListener("message", (event) => {
  const data = event.data as { type?: string; url?: unknown } | undefined;

  if (data?.type === "CACHE_HOME") {
    const url = canonicalHomeUrl(typeof data.url === "string" ? data.url : "/");
    if (url) event.waitUntil(cacheDocument(url, HOME_CACHE, 4));
  }

  if (data?.type === "CACHE_TRAIN" && typeof data.url === "string") {
    const url = canonicalTrainUrl(data.url);
    if (url) event.waitUntil(cacheDocument(url, TRAIN_CACHE, 3, "data-pwa-train-page"));
  }
});

serwist.addEventListeners();
