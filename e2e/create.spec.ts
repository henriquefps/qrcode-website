import { readFileSync } from 'node:fs';
import JSZip from 'jszip';
import { expect, open, test } from './test';

const TYPES = ['URL', 'Text', 'Wi-Fi', 'Email', 'SMS', 'Phone', 'WhatsApp', 'vCard', 'Event', 'Location', '2FA (OTP)'];

const status = (page: import('@playwright/test').Page) => page.getByRole('status').filter({ hasText: /Scannable|May not scan|Checking|Not checked/ });

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

  for (const preset of ['WhatsApp', 'Instagram']) {
    test(`logo preset ${preset} is served, drawn in the code and still scans`, async ({ page }) => {
      await open(page);
      const res = await page.request.get(`/${preset.toLowerCase()}.png`);
      expect(res.status()).toBe(200);
      expect(res.headers()['content-type']).toBe('image/png');

      await page.getByRole('group', { name: 'Logo presets' }).getByRole('button', { name: preset }).click();
      const logo = page.getByRole('img', { name: 'Logo preview' });
      await expect(logo).toBeVisible();
      await expect.poll(() => logo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth)).toBeGreaterThan(0);
      // The brand colours show up in the middle of the preview canvas (a missing logo leaves it black and white).
      await expect
        .poll(() =>
          page.getByRole('img', { name: 'QR code preview' }).locator('canvas').evaluate((canvas: HTMLCanvasElement) => {
            const ctx = canvas.getContext('2d')!;
            const s = Math.round(canvas.width / 6);
            const { data } = ctx.getImageData(canvas.width / 2 - s / 2, canvas.height / 2 - s / 2, s, s);
            let colored = 0;
            for (let i = 0; i < data.length; i += 4) if (Math.max(data[i], data[i + 1], data[i + 2]) - Math.min(data[i], data[i + 1], data[i + 2]) > 60) colored++;
            return colored;
          }),
        )
        .toBeGreaterThan(50);
      await expect(status(page)).toContainText('Scannable', { timeout: 15_000 });
    });
  }
});
