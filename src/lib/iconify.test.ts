import { afterEach, describe, expect, it, vi } from 'vitest';
import { CURATED_ICONS, CURATED_CREDITS, LEGACY_LOGO_IDS } from './logoIcons';
import { fetchIcon, iconDataUri, iconToSvg, isIconId, isOpenLicense, parseCollections, sanitizeBody, searchIcons, splitId, svgToDataUri } from './iconify';

const collections = {
  mdi: { name: 'Material Design Icons', total: 7000, license: { title: 'Apache 2.0', spdx: 'Apache-2.0' }, author: { name: 'Pictogrammers' } },
  nc: { name: 'Non commercial', total: 10, license: { title: 'CC BY-NC 4.0', spdx: 'CC-BY-NC-4.0' } },
  unknown: { name: 'Mystery', total: 1 },
  a: { name: 'Alpha', total: 5, license: { title: 'MIT', spdx: 'MIT' }, author: { name: 'Me' } },
};

const ok = (body: unknown) => ({ ok: true, json: async () => body });

afterEach(() => vi.unstubAllGlobals());

describe('collections and ids', () => {
  it('keeps open licenses only and sorts by name', () => {
    expect(isOpenLicense('MIT')).toBe(true);
    expect(isOpenLicense('CC-BY-NC-4.0')).toBe(false);
    expect(isOpenLicense(undefined)).toBe(false);
    const list = parseCollections(collections);
    expect(list.map((c) => c.prefix)).toEqual(['a', 'mdi']);
    expect(list[0].author).toBe('Me');
  });
  it('splits and validates ids', () => {
    expect(splitId('mdi:home-outline')).toEqual(['mdi', 'home-outline']);
    expect(isIconId('simple-icons:whatsapp')).toBe(true);
    for (const bad of ['', 'x', 'a:b:c', 'a:../b', 'A:b', 7]) expect(isIconId(bad)).toBe(false);
  });
  it('every curated icon is valid and its collection has a credit', () => {
    expect(CURATED_ICONS.length).toBeGreaterThanOrEqual(12);
    for (const { id } of CURATED_ICONS) {
      expect(isIconId(id)).toBe(true);
      expect(CURATED_CREDITS[splitId(id)[0]]).toBeDefined();
    }
    for (const id of Object.values(LEGACY_LOGO_IDS)) expect(CURATED_ICONS.some((c) => c.id === id)).toBe(true);
  });
});

describe('Iconify client (mocked fetch)', () => {
  it('search drops collections without an open license and caches', async () => {
    const fetchMock = vi.fn(async (url: string) => ok(url.includes('/collections') ? collections : { icons: ['mdi:home', 'nc:home', 'a:home'] }));
    vi.stubGlobal('fetch', fetchMock);
    expect(await searchIcons('home-test', null)).toEqual(['mdi:home', 'a:home']);
    await searchIcons('home-test', null);
    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual([
      'https://api.iconify.design/collections',
      'https://api.iconify.design/search?query=home-test&limit=240',
    ]);
  });

  it('loadCollections does not cache a failure', async () => {
    vi.resetModules();
    const fresh = await import('./iconify');
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(ok(collections));
    vi.stubGlobal('fetch', fetchMock);
    await expect(fresh.loadCollections()).rejects.toThrow();
    await expect(fresh.loadCollections()).resolves.toHaveLength(2);
  });

  it('fetches an icon, batches ids per collection and builds a colored data URI', async () => {
    const fetchMock = vi.fn(async (url: string) =>
      ok(
        url.includes('/lucide.json')
          ? { width: 24, height: 24, icons: { wifi: { body: '<path stroke="currentColor" d="M0 0"/>' } } }
          : { width: 24, height: 24, icons: { github: { body: '<path d="M1 1"/><script>x</script>' } } },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    const [wifi, gh] = await Promise.all([iconDataUri('lucide:wifi', '#ff0000'), iconDataUri('simple-icons:github', '#00ff00')]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const decode = (u: string) => atob(u.replace('data:image/svg+xml;base64,', ''));
    expect(wifi.startsWith('data:image/svg+xml;base64,')).toBe(true);
    expect(decode(wifi)).toContain('stroke="#ff0000"');
    expect(decode(wifi)).not.toContain('currentColor');
    expect(decode(gh)).toContain('fill="#00ff00"');
    expect(decode(gh)).not.toContain('<script');
    // Second use of the same icon is served from memory.
    await iconDataUri('lucide:wifi', '#0000ff');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('fails clearly when the network is down or the icon is unknown', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await expect(fetchIcon('lucide:offline-icon')).rejects.toThrow('Could not load lucide:offline-icon');
    vi.stubGlobal('fetch', vi.fn(async () => ok({ icons: {} })));
    await expect(fetchIcon('lucide:nope')).rejects.toThrow();
    await expect(fetchIcon('bad id')).rejects.toThrow('Unknown icon');
  });
});

describe('svg helpers', () => {
  it('colors currentColor and sets a root fill; invalid colors fall back to black', () => {
    const svg = iconToSvg({ body: '<g stroke="currentColor"/>', width: 24, height: 24 }, '#123456');
    expect(svg).toContain('viewBox="0 0 24 24"');
    expect(svg).toContain('stroke="#123456"');
    expect(iconToSvg({ body: '<path/>', width: 1, height: 1 }, 'red')).toContain('fill="#000000"');
  });
  it('encodes non-ASCII SVG as base64', () => {
    expect(atob(svgToDataUri('<svg>é</svg>').split(',')[1])).toBe(new TextDecoder('latin1').decode(new TextEncoder().encode('<svg>é</svg>')));
  });
  it('removes scripts and handlers from bodies', () => {
    expect(sanitizeBody('<path onclick="x()" d="M0"/><foreignObject>y</foreignObject>')).toBe('<path d="M0"/>');
  });
});
