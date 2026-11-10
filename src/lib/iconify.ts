// Minimal Iconify API client: open-licensed collections, search, and one icon as a data URI.
// The only requests this app makes to another server go through here (see the Privacy notes).

export const ICONIFY_API = 'https://api.iconify.design';

/** SPDX ids of licenses that allow free reuse, commercial use included. */
const OPEN_LICENSES = new Set([
  'MIT', 'ISC', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', '0BSD', 'Unlicense', 'CC0-1.0', 'MPL-2.0',
  'CC-BY-4.0', 'CC-BY-3.0', 'CC-BY-SA-4.0', 'CC-BY-SA-3.0', 'OFL-1.1', 'WTFPL', 'Zlib',
]);

export const isOpenLicense = (spdx: string | undefined): boolean => !!spdx && OPEN_LICENSES.has(spdx);
export const licenseNeedsAttribution = (spdx: string | undefined): boolean => !!spdx && spdx.startsWith('CC-BY');

export interface IconifyCollection {
  prefix: string;
  name: string;
  total: number;
  license: { title: string; spdx?: string; url?: string };
  author?: string;
  authorUrl?: string;
  /** Multi-color collections ignore the color option. */
  palette: boolean;
}

interface RawCollection {
  name: string;
  total: number;
  author?: { name?: string; url?: string };
  license?: { title?: string; spdx?: string; url?: string };
  palette?: boolean;
}

export function parseCollections(raw: Record<string, RawCollection>): IconifyCollection[] {
  return Object.entries(raw)
    .filter(([, c]) => isOpenLicense(c.license?.spdx))
    .map(([prefix, c]) => ({
      prefix,
      name: c.name,
      total: c.total,
      license: { title: c.license?.title ?? c.license?.spdx ?? '', spdx: c.license?.spdx, url: c.license?.url },
      author: c.author?.name,
      authorUrl: c.author?.url,
      palette: !!c.palette,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function splitId(id: string): [string, string] {
  const i = id.indexOf(':');
  return [id.slice(0, i), id.slice(i + 1)];
}

/** "prefix:name" with safe characters only (it ends up in a URL). */
export const isIconId = (id: unknown): id is string => typeof id === 'string' && /^[a-z0-9][a-z0-9-]*:[a-z0-9][a-z0-9-]*$/.test(id) && id.length <= 80;

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(ICONIFY_API + path);
  if (!res.ok) throw new Error(`Iconify ${res.status}`);
  return (await res.json()) as T;
}

// In-memory caches. The service worker keeps the API responses for offline use (src/pwa/sw.ts).
let collectionsPromise: Promise<IconifyCollection[]> | null = null;
const searches = new Map<string, Promise<string[]>>();
const collectionLists = new Map<string, Promise<string[]>>();

/** Open-licensed collections only. A failed request is not cached, so a retry works. */
export function loadCollections(): Promise<IconifyCollection[]> {
  collectionsPromise ??= getJson<Record<string, RawCollection>>('/collections').then(parseCollections);
  collectionsPromise.catch(() => (collectionsPromise = null));
  return collectionsPromise;
}

function memo<T>(map: Map<string, Promise<T>>, key: string, make: () => Promise<T>): Promise<T> {
  let p = map.get(key);
  if (!p) {
    p = make();
    map.set(key, p);
    p.catch(() => map.delete(key));
  }
  return p;
}

/** "prefix:name" ids matching a query; results from collections without an open license are dropped. */
export async function searchIcons(query: string, prefix: string | null, limit = 240): Promise<string[]> {
  const open = new Set((await loadCollections()).map((c) => c.prefix));
  const q = new URLSearchParams({ query, limit: String(limit) });
  if (prefix) q.set('prefix', prefix);
  return memo(searches, q.toString(), async () => {
    const res = await getJson<{ icons: string[] }>(`/search?${q}`);
    return res.icons.filter((id) => open.has(splitId(id)[0]));
  });
}

/** Every icon of a collection as "prefix:name" ids. */
export const listCollection = (prefix: string): Promise<string[]> =>
  memo(collectionLists, prefix, async () => {
    const res = await getJson<{ uncategorized?: string[]; categories?: Record<string, string[]> }>(`/collection?prefix=${encodeURIComponent(prefix)}`);
    const names = new Set<string>([...(res.uncategorized ?? []), ...Object.values(res.categories ?? {}).flat()]);
    return [...names].map((n) => `${prefix}:${n}`);
  });

export interface IconData {
  body: string;
  width: number;
  height: number;
}

/** Drops anything executable from third-party SVG body markup. */
export const sanitizeBody = (body: string): string =>
  body.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '').replace(/\son\w+\s*=\s*("[^"]*"|'[^']*')/gi, '');

const icons = new Map<string, IconData | null>();
const waiting = new Map<string, ((d: IconData | null) => void)[]>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const BATCH = 40;

async function flush() {
  flushTimer = null;
  const pending = [...waiting.entries()];
  waiting.clear();
  const byPrefix = new Map<string, string[]>();
  for (const [id] of pending) {
    const [prefix, name] = splitId(id);
    byPrefix.set(prefix, [...(byPrefix.get(prefix) ?? []), name]);
  }
  const results = new Map<string, IconData>();
  await Promise.all(
    [...byPrefix].flatMap(([prefix, names]) =>
      Array.from({ length: Math.ceil(names.length / BATCH) }, (_, i) => names.slice(i * BATCH, (i + 1) * BATCH)).map(async (chunk) => {
        try {
          const res = await fetch(`${ICONIFY_API}/${encodeURIComponent(prefix)}.json?icons=${chunk.map(encodeURIComponent).join(',')}`);
          if (!res.ok) return;
          const data = (await res.json()) as { width?: number; height?: number; icons?: Record<string, { body: string; width?: number; height?: number }> };
          for (const [name, ic] of Object.entries(data.icons ?? {})) {
            results.set(`${prefix}:${name}`, { body: sanitizeBody(ic.body), width: ic.width ?? data.width ?? 16, height: ic.height ?? data.height ?? 16 });
          }
        } catch {
          /* unresolved: null below, retried on the next request */
        }
      }),
    ),
  );
  for (const [id, resolvers] of pending) {
    const d = results.get(id) ?? null;
    if (d) icons.set(id, d);
    resolvers.forEach((r) => r(d));
  }
}

/** Icon shapes for the grid and for the final SVG. Requests made in the same tick become one `/{prefix}.json?icons=` call. Resolves null when unavailable. */
export function requestIcon(id: string): Promise<IconData | null> {
  const hit = icons.get(id);
  if (hit) return Promise.resolve(hit);
  return new Promise((resolve) => {
    waiting.set(id, [...(waiting.get(id) ?? []), resolve]);
    flushTimer ??= setTimeout(() => void flush(), 16);
  });
}

/** Like requestIcon, but throws (with a message fit for the UI) when the icon cannot be loaded. */
export async function fetchIcon(id: string): Promise<IconData> {
  if (!isIconId(id)) throw new Error('Unknown icon');
  const d = await requestIcon(id);
  if (!d) throw new Error(`Could not load ${id}`);
  return d;
}

const HEX = /^#[0-9a-f]{6}$/i;

/** SVG markup of an icon in one color. Mono icons use currentColor or inherit a fill; both end up as `color`. */
export function iconToSvg(icon: IconData, color: string): string {
  const c = HEX.test(color) ? color : '#000000';
  const body = icon.body.replace(/currentColor/gi, c);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${icon.width} ${icon.height}" width="${icon.width}" height="${icon.height}" fill="${c}">${body}</svg>`;
}

/** Same format as an uploaded SVG: a base64 `data:image/svg+xml` URI, usable by the QR renderer offline. */
export function svgToDataUri(svg: string): string {
  const bytes = new TextEncoder().encode(svg);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return `data:image/svg+xml;base64,${btoa(bin)}`;
}

export async function iconDataUri(id: string, color: string): Promise<string> {
  return svgToDataUri(iconToSvg(await fetchIcon(id), color));
}

export const DEFAULT_ICON_COLOR = '#172e37';
