/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { SHARE_CACHE, handleShareTarget, isShareTargetRequest } from './shareTarget';

declare let self: ServiceWorkerGlobalScope & { __WB_MANIFEST: (string | { url: string; revision: string | null })[] };

// autoUpdate: a new version takes over at once.
void self.skipWaiting();
clientsClaim();

// The shell, Latin Inter and the main chunks (the list is injected at build time; see vite.config.ts).
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html'), { denylist: [/^\/sw\.js$/] }));

// Web Share Target: images shared from other apps (manifest share_target). Handled here because it is a POST.
registerRoute(({ request }) => isShareTargetRequest(request), ({ request }) => handleShareTarget(request, self.caches), 'POST');

// The zxing WASM fallback (its chunk and binary) is cached on first use or by the idle prefetch, never precached.
registerRoute(
  ({ url }) => /\/assets\/(wasm-.*\.js|.*\.wasm)$/.test(url.pathname),
  new CacheFirst({ cacheName: 'zxing-wasm', plugins: [new ExpirationPlugin({ maxEntries: 6 }), new CacheableResponsePlugin({ statuses: [200] })] }),
);

// Non-Latin Inter subsets, on first use.
registerRoute(
  ({ url }) => /\/assets\/.*\.woff2$/.test(url.pathname),
  new CacheFirst({ cacheName: 'fonts', plugins: [new ExpirationPlugin({ maxEntries: 20 }), new CacheableResponsePlugin({ statuses: [200] })] }),
);

// A share that was never picked up (window closed mid-handoff) is dropped when a new worker starts.
self.addEventListener('activate', (event) => {
  event.waitUntil(self.caches.delete(SHARE_CACHE));
});
