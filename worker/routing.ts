// Routing for the `qrcode` Worker. Static assets are served by the assets binding;
// this runs first only to retire the old Qrgo host (qrgo.hfps.dev).

export const NEW_ORIGIN = 'https://qrcode.hfps.dev';
export const OLD_HOST = 'qrgo.hfps.dev';

// Served at qrgo.hfps.dev/sw.js so existing Qrgo PWA installs drop their caches
// and navigate their open windows to the new origin.
export const KILL_SW = `self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch {}
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: 'window' });
    for (const client of clients) {
      try { client.navigate(${JSON.stringify(NEW_ORIGIN + '/')}); } catch {}
    }
  })());
});
`;

export interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

/** The manifest's share_target action; normally answered by the service worker (src/pwa/sw.ts). */
export const SHARE_TARGET_PATH = '/share-target';
export const READ_PATH = '/#/read';

export async function handle(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  if (url.hostname !== OLD_HOST) {
    // A share that reaches the network means the service worker was not active yet (first launch, or it
    // was cleared). The images are not stored anywhere: open Read instead of answering 405.
    if (url.pathname === SHARE_TARGET_PATH) return seeOther(new URL(READ_PATH, url.origin).href);
    return env.ASSETS.fetch(request);
  }

  if (url.pathname === '/sw.js') {
    return new Response(KILL_SW, {
      headers: {
        'content-type': 'text/javascript; charset=utf-8',
        'cache-control': 'no-cache, no-store, must-revalidate',
      },
    });
  }
  return Response.redirect(NEW_ORIGIN + url.pathname + url.search, 301);
}

/** 303 so the browser follows with a GET; the request body is never read. */
function seeOther(location: string): Response {
  return new Response(null, { status: 303, headers: { location, 'cache-control': 'no-store' } });
}
