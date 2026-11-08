import { expect, test } from './test';

test('production headers are served', async ({ request }) => {
  const res = await request.get('/');
  const h = res.headers();
  expect(h['content-security-policy']).toContain("script-src 'self' 'wasm-unsafe-eval'");
  expect(h['permissions-policy']).toContain('clipboard-read=(self)');
  expect(h['permissions-policy']).toContain('camera=(self)');
  expect(h['referrer-policy']).toBe('no-referrer');
  expect(h['cross-origin-opener-policy']).toBe('same-origin');
});

test('a share POST that reaches the Worker is sent to Read (303), body not stored', async ({ request }) => {
  const res = await request.post('/share-target', {
    multipart: { image: { name: 'shot.png', mimeType: 'image/png', buffer: Buffer.from([137, 80, 78, 71]) } },
    maxRedirects: 0,
  });
  expect(res.status()).toBe(303);
  expect(res.headers()['location']).toMatch(/\/#\/read$/);
});

test('the service worker registers and controls the page', async ({ page }) => {
  await page.goto('/');
  await expect.poll(() => page.evaluate(async () => (await navigator.serviceWorker.ready).active?.state)).toBe('activated');
});
