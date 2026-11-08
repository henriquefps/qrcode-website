/**
 * Web Share Target handoff. The service worker receives the POSTed images, parks them in a short-lived cache and
 * redirects to the Read view; the page takes them out and deletes the cache at once. Nothing else keeps them.
 * Runs in both the service worker and the page, so it only uses Request, Response and CacheStorage.
 */
export const SHARE_TARGET_PATH = '/share-target';
export const SHARE_CACHE = 'qrcode-share-target';
/** Where the service worker sends the window after a share; `shared=1` tells Read to pick the files up. */
export const SHARE_REDIRECT = '/#/read?shared=1';
const KEY_PREFIX = '/__shared__/';
/** Accepts at most this many images per share; Read only decodes the first. */
const MAX_FILES = 4;

export const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

export function isImage(file: Blob): boolean {
  return file.type.startsWith('image/');
}

export function isShareTargetRequest(request: Request): boolean {
  return request.method === 'POST' && new URL(request.url).pathname === SHARE_TARGET_PATH;
}

/** Service worker side: store the shared images and redirect to Read (303, so the browser GETs the page). */
export async function handleShareTarget(request: Request, caches: CacheStorage): Promise<Response> {
  const redirect = new URL(SHARE_REDIRECT, request.url).href;
  // A share that was never picked up must not linger.
  await caches.delete(SHARE_CACHE);
  let files: File[] = [];
  try {
    const form = await request.formData();
    files = form
      .getAll('image')
      .filter((v): v is File => typeof v !== 'string' && isImage(v))
      .slice(0, MAX_FILES);
  } catch {
    // Not multipart or empty: Read opens and says nothing arrived.
  }
  if (files.length > 0) {
    const cache = await caches.open(SHARE_CACHE);
    await Promise.all(
      files.map((file, i) =>
        cache.put(new URL(`${KEY_PREFIX}${i}`, request.url).href, new Response(file, { headers: { 'Content-Type': file.type, 'X-File-Name': encodeURIComponent(file.name) } })),
      ),
    );
  }
  return Response.redirect(redirect, 303);
}

/** Page side: returns the shared images (in order) and deletes them from the cache before returning. */
export async function takeSharedFiles(caches: CacheStorage | undefined): Promise<File[]> {
  if (!caches || !(await caches.has(SHARE_CACHE))) return [];
  try {
    const cache = await caches.open(SHARE_CACHE);
    const keys = (await cache.keys()).filter((r) => new URL(r.url).pathname.startsWith(KEY_PREFIX));
    keys.sort((a, b) => a.url.localeCompare(b.url, 'en', { numeric: true }));
    const files: File[] = [];
    for (const key of keys) {
      const res = await cache.match(key);
      if (!res) continue;
      const blob = await res.blob();
      const name = decodeURIComponent(res.headers.get('X-File-Name') ?? 'shared-image');
      files.push(new File([blob], name, { type: res.headers.get('Content-Type') ?? blob.type }));
    }
    return files;
  } finally {
    await caches.delete(SHARE_CACHE);
  }
}

/** True when the URL says a share just arrived (`#/read?shared=1`). */
export function isShareRedirect(hash: string): boolean {
  return /^#\/?read\?(?:.*&)?shared=1(?:&|$)/.test(hash);
}
