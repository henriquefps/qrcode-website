import { readFileSync } from 'node:fs';
import JSZip from 'jszip';
import { expect, mockIconify, open, test } from './test';

const TYPES = ['URL', 'Text', 'Wi-Fi', 'Email', 'SMS', 'Phone', 'WhatsApp', 'vCard', 'Event', 'Location', '2FA (OTP)'];

const status = (page: import('@playwright/test').Page) => page.getByRole('status').filter({ hasText: /Scannable|May not scan|Checking|Not checked/ });

// The Iconify mocks (page.route) cannot see requests made by the service worker, which takes control of a fresh page
// within a moment and would send them to the real API. server.spec.ts covers the service worker itself.
test.use({ serviceWorkers: 'block' });

test.describe('Create', () => {
  for (const name of TYPES) {
    test(`${name}: renders and the default code is scannable`, async ({ page }) => {
      await open(page);
      await page.getByRole('tab', { name, exact: true }).click();
      await expect(page.getByRole('tab', { name, exact: true })).toHaveAttribute('aria-selected', 'true');
      await expect(page.getByRole('img', { name: 'QR code preview' }).locator('canvas')).toBeVisible();
      await expect(status(page)).toContainText('Scannable', { timeout: 15_000 });
    });
  }

  test('a typed URL is checked again and stays scannable', async ({ page }) => {
    await open(page);
    await page.getByLabel('Website URL').fill('qrcode.hfps.dev/e2e');
    await expect(status(page)).toContainText('Checking');
    await expect(status(page)).toContainText('Scannable', { timeout: 15_000 });
  });

  test('downloads PNG and SVG', async ({ page }) => {
    await open(page);
    await page.getByLabel('Website URL').fill('example.com/download');
    await page.getByRole('radio', { name: '256 px' }).click();
    const [png] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download PNG' }).click()]);
    expect(png.suggestedFilename()).toBe('qrcode.png');
    const pngBytes = readFileSync((await png.path())!);
    expect(pngBytes.subarray(1, 4).toString()).toBe('PNG');
    expect(pngBytes.readUInt32BE(16)).toBe(256); // IHDR width

    const [svg] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download SVG' }).click()]);
    expect(svg.suggestedFilename()).toBe('qrcode.svg');
    expect(readFileSync((await svg.path())!, 'utf8')).toMatch(/<svg[\s>]/);
  });

  test('batch: three rows become a ZIP with three PNGs', async ({ page }) => {
    await open(page);
    await page.getByRole('button', { name: 'Batch' }).click();
    const dialog = page.getByRole('dialog', { name: /Batch create/ });
    await dialog.getByLabel('Rows').fill('example.com/one\nexample.com/two\nexample.com/three');
    await expect(dialog.getByText('3 codes')).toBeVisible();
    await expect(dialog.getByRole('combobox', { name: 'File names' })).toHaveText('Row number (qrcode-1)');
    const [zipDownload] = await Promise.all([page.waitForEvent('download'), dialog.getByRole('button', { name: 'Download ZIP' }).click()]);
    expect(zipDownload.suggestedFilename()).toBe('qrcode-batch-url.zip');
    const zip = await JSZip.loadAsync(readFileSync((await zipDownload.path())!));
    const names = Object.keys(zip.files).sort();
    expect(names).toEqual(['qrcode-1.png', 'qrcode-2.png', 'qrcode-3.png']);
    for (const n of names) expect((await zip.file(n)!.async('nodebuffer')).subarray(1, 4).toString()).toBe('PNG');
    await expect(page.getByText('3 codes saved to a ZIP file.')).toBeVisible();
  });

  const centerColored = (page: import('@playwright/test').Page) =>
    page.getByRole('img', { name: 'QR code preview' }).locator('canvas').evaluate((canvas: HTMLCanvasElement) => {
      const ctx = canvas.getContext('2d')!;
      const s = Math.round(canvas.width / 6);
      const { data } = ctx.getImageData(canvas.width / 2 - s / 2, canvas.height / 2 - s / 2, s, s);
      let colored = 0;
      for (let i = 0; i < data.length; i += 4) if (Math.max(data[i], data[i + 1], data[i + 2]) - Math.min(data[i], data[i + 1], data[i + 2]) > 60) colored++;
      return colored;
    });

  test('makes no request to another server until the Logo section is opened', async ({ page, guard }) => {
    await mockIconify(page);
    await open(page);
    await page.getByLabel('Website URL').fill('example.com/private');
    await expect(status(page)).toContainText('Scannable', { timeout: 15_000 });
    expect(guard.iconify).toEqual([]);
  });

  for (const preset of ['WhatsApp', 'Instagram']) {
    test(`curated icon ${preset} is fetched from Iconify, colored, drawn in the code and still scans`, async ({ page, guard }) => {
      await mockIconify(page);
      await open(page);
      await page.getByRole('button', { name: 'Logo', exact: true }).click();
      await page.getByRole('group', { name: 'Logo presets' }).getByRole('button', { name: preset }).click();
      const logo = page.getByRole('img', { name: 'Logo preview' });
      await expect(logo).toBeVisible();
      expect(await logo.getAttribute('src')).toMatch(/^data:image\/svg\+xml;base64,/);
      await expect(page.getByText(/Icon from Simple Icons by Simple Icons Collaborators/)).toBeVisible();
      expect(guard.iconify.length).toBeGreaterThan(0);
      // Pick a color: the icon takes it over (the default dark one leaves the middle black and white).
      await page.getByLabel('Icon color hex value').fill('#e1306c');
      await expect.poll(() => centerColored(page)).toBeGreaterThan(50);
      await expect(status(page)).toContainText('Scannable', { timeout: 15_000 });
    });
  }

  test('searches all open collections, picks a result and keeps rendering offline', async ({ page, context }) => {
    await mockIconify(page);
    await open(page);
    await page.getByRole('button', { name: 'Logo', exact: true }).click();
    await page.getByRole('button', { name: 'Search all icons' }).click();
    await page.getByLabel('Search icons').fill('heart');
    const grid = page.getByRole('group', { name: 'Icon search results' });
    // Icons of collections without an open license are filtered out.
    await expect(grid.getByRole('button')).toHaveText(['', '']);
    await expect(grid.getByRole('button', { name: 'Use icon nc:heart' })).toHaveCount(0);
    await grid.getByRole('button', { name: 'Use icon mdi:heart' }).click();
    await expect(grid.getByRole('button', { name: 'Use icon mdi:heart' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText(/Icon from Material Design Icons by Pictogrammers/)).toBeVisible();
    await expect(page.getByRole('img', { name: 'Logo preview' })).toBeVisible();
    await expect(status(page)).toContainText('Scannable', { timeout: 15_000 });
    // The chosen icon is a data URI in the style: changing its color and the content works with no network.
    await context.setOffline(true);
    await page.getByLabel('Icon color hex value').fill('#e1306c');
    await page.getByLabel('Website URL').fill('example.com/offline');
    await expect.poll(() => centerColored(page)).toBeGreaterThan(50);
    await expect(status(page)).toContainText('Scannable', { timeout: 15_000 });
  });

  test('grid icons move with the arrow keys', async ({ page }) => {
    await mockIconify(page);
    await open(page);
    await page.getByRole('button', { name: 'Logo', exact: true }).click();
    await page.getByRole('button', { name: 'Search all icons' }).click();
    await page.getByLabel('Search icons').fill('heart');
    const grid = page.getByRole('group', { name: 'Icon search results' });
    await grid.getByRole('button').first().focus();
    await page.keyboard.press('ArrowRight');
    await expect(grid.getByRole('button').nth(1)).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(grid.getByRole('button').nth(1)).toHaveAttribute('aria-pressed', 'true');
  });

  test('shows a clear message when the icon cannot be loaded, and retries', async ({ page }) => {
    // An API that answers without the icon (a failed request would also log a console error, which the guard rejects).
    await page.route('https://api.iconify.design/**', (route) => route.fulfill({ json: { icons: {} }, headers: { 'access-control-allow-origin': '*' } }));
    await open(page);
    await page.getByRole('button', { name: 'Logo', exact: true }).click();
    await page.getByRole('group', { name: 'Logo presets' }).getByRole('button', { name: 'Wi-Fi' }).click();
    await expect(page.getByRole('alert')).toContainText('Could not load this icon');
    await page.unroute('https://api.iconify.design/**');
    await mockIconify(page);
    await page.getByRole('button', { name: 'Retry' }).click();
    await expect(page.getByRole('img', { name: 'Logo preview' })).toBeVisible();
  });

  test('an uploaded image still works as a logo', async ({ page }) => {
    await open(page);
    await page.getByRole('button', { name: 'Logo', exact: true }).click();
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    await page.locator('input[type=file][accept^="image/png"]').setInputFiles({ name: 'mine.png', mimeType: 'image/png', buffer: png });
    await expect(page.getByRole('img', { name: 'Logo preview' })).toBeVisible();
    await expect(page.getByText('mine.png')).toBeVisible();
    await expect(status(page)).toContainText(/Scannable|May not scan/, { timeout: 15_000 });
  });
});
