import { test as base, expect, type Page } from '@playwright/test';

/** Console messages that are not app errors (none so far; add with a reason). */
const ALLOWED_CONSOLE: RegExp[] = [];

interface Guard {
  /** Errors, CSP violations and off-origin requests seen so far. */
  problems: string[];
  /** Requests to the Iconify API (the one allowed external server: icon browsing). Specs mock them with `mockIconify`. */
  iconify: string[];
}

export const ICONIFY = 'https://api.iconify.design';

/** Answers the Iconify API with a tiny fixed catalog so tests are hermetic: every icon is a filled square with a hole. */
export async function mockIconify(page: Page) {
  const collections = {
    lucide: { name: 'Lucide', total: 3, license: { title: 'ISC', spdx: 'ISC' }, author: { name: 'Lucide Contributors' } },
    mdi: { name: 'Material Design Icons', total: 3, license: { title: 'Apache 2.0', spdx: 'Apache-2.0' }, author: { name: 'Pictogrammers' } },
    nc: { name: 'Closed', total: 1, license: { title: 'CC BY-NC 4.0', spdx: 'CC-BY-NC-4.0' } },
  };
  await page.route(`${ICONIFY}/**`, (route) => {
    const url = new URL(route.request().url());
    const json = (body: unknown) => route.fulfill({ json: body, headers: { 'access-control-allow-origin': '*' } });
    if (url.pathname === '/collections') return json(collections);
    if (url.pathname === '/search') return json({ icons: ['mdi:heart', 'nc:heart', 'lucide:heart'] });
    const m = /^\/([a-z-]+)\.json$/.exec(url.pathname);
    if (m) {
      const names = (url.searchParams.get('icons') ?? '').split(',');
      return json({ prefix: m[1], width: 24, height: 24, icons: Object.fromEntries(names.map((n) => [n, { body: '<path fill="currentColor" fill-rule="evenodd" d="M3 3h18v18H3zm6 6v6h6V9z"/>' }])) });
    }
    return route.fulfill({ status: 404 });
  });
}

/**
 * Every test fails on a console error, an uncaught exception, a CSP violation or a request to another origin:
 * the app promises that nothing leaves the device and the production headers must not break anything.
 */
export const test = base.extend<{ guard: Guard; forceWasm: boolean }>({
  forceWasm: [false, { option: true }],
  guard: [
    async ({ page, baseURL, forceWasm }, use) => {
      const problems: string[] = [];
      const iconify: string[] = [];
      const origin = new URL(baseURL!).origin;
      page.on('console', (msg) => {
        if (msg.type() !== 'error' && !(msg.type() === 'warning' && /Content Security Policy|Permissions policy/i.test(msg.text()))) return;
        if (ALLOWED_CONSOLE.some((re) => re.test(msg.text()))) return;
        problems.push(`console.${msg.type()}: ${msg.text()}`);
      });
      page.on('pageerror', (err) => problems.push(`pageerror: ${err.message}`));
      page.on('request', (req) => {
        const url = req.url();
        if (/^(data|blob):/.test(url)) return;
        if (new URL(url).origin === ICONIFY) iconify.push(url);
        else if (new URL(url).origin !== origin) problems.push(`external request: ${url}`);
      });
      await page.addInitScript((wasm) => {
        document.addEventListener('securitypolicyviolation', (e) => console.error(`CSP violation: ${e.violatedDirective} ${e.blockedURI}`));
        // Forces the zxing WASM fallback, as on Safari and Firefox.
        if (wasm) delete (window as { BarcodeDetector?: unknown }).BarcodeDetector;
      }, forceWasm);
      await use({ problems, iconify });
      expect(problems, 'console errors, CSP violations or external requests').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

/** Opens a route and waits for the app shell. */
export async function open(page: Page, hash = '#/create') {
  await page.goto(`/${hash}`);
  await expect(page.getByRole('tablist', { name: 'Section' })).toBeVisible();
  if (hash.startsWith('#/read')) await expect(page.getByRole('heading', { name: 'Read a QR code' })).toBeVisible();
}

/** Width of horizontal overflow of the document, 0 when nothing scrolls sideways. */
export const sideScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
