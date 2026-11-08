import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { CAMERA_TEXT, fixture } from './paths';
import { CODES, TOTP_SECRET, WIFI_PASSWORD } from './codes';
import { expect, open, test } from './test';

/** RFC 6238 TOTP (SHA-1, 6 digits, 30 s), independent of the app's implementation. */
function totp(secret: string, at: number): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const c of secret) bits += alphabet.indexOf(c).toString(2).padStart(5, '0');
  const key = Buffer.from(bits.match(/.{8}/g)!.map((b) => parseInt(b, 2)));
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(at / 1000 / 30)));
  const h = createHmac('sha1', key).update(counter).digest();
  const o = h[h.length - 1] & 0xf;
  return String((h.readUInt32BE(o) & 0x7fffffff) % 1_000_000).padStart(6, '0');
}

async function upload(page: import('@playwright/test').Page, name: keyof typeof CODES) {
  await page.getByRole('tab', { name: 'Image' }).click();
  await page.getByTestId('image-input').setInputFiles(fixture(`${name}.png`));
}

async function paste(page: import('@playwright/test').Page, name: keyof typeof CODES) {
  const bytes = [...readFileSync(fixture(`${name}.png`))];
  await page.evaluate((data) => {
    const dt = new DataTransfer();
    dt.items.add(new File([new Uint8Array(data)], 'screenshot.png', { type: 'image/png' }));
    window.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true }));
  }, bytes);
}

for (const forceWasm of [false, true]) {
  test.describe(forceWasm ? 'Read (WASM fallback)' : 'Read (native detector when available)', () => {
    test.use({ forceWasm });

    test('decodes an uploaded image', async ({ page }) => {
      await open(page, '#/read');
      if (forceWasm) expect(await page.evaluate(() => 'BarcodeDetector' in window)).toBe(false);
      const wasm = forceWasm ? page.waitForResponse((r) => r.url().endsWith('.wasm')) : null;
      await upload(page, 'url');
      await expect(page.getByTestId('result-text')).toHaveText(CODES.url);
      if (wasm) expect((await wasm).status()).toBe(200);
      await expect(page.getByRole('link', { name: /Open link/ })).toHaveAttribute('href', CODES.url);
    });

    test('decodes a pasted screenshot', async ({ page }) => {
      await open(page, '#/read');
      await paste(page, 'text');
      await expect(page.getByTestId('result-text')).toHaveText(CODES.text);
    });
  });
}

test('camera: a fake device is scanned', async ({ page }) => {
  await open(page, '#/read');
  await page.getByRole('button', { name: 'Start camera' }).click();
  await expect(page.getByTestId('result-text')).toHaveText(CAMERA_TEXT, { timeout: 20_000 });
  // The stream stops once a code is found.
  await expect(page.getByLabel('Camera preview')).toHaveCount(0);
});

test('Wi-Fi result: password masked until revealed', async ({ page }) => {
  await open(page, '#/read');
  await upload(page, 'wifi');
  const fields = page.getByTestId('result-fields');
  await expect(fields).toContainText('E2E Network');
  await expect(fields).not.toContainText(WIFI_PASSWORD);
  await page.getByRole('button', { name: 'Show content' }).click();
  await expect(fields).toContainText(WIFI_PASSWORD);
  await page.getByRole('button', { name: 'Hide content' }).click();
  await expect(fields).not.toContainText(WIFI_PASSWORD);
});

test('copied secret is cleared from the clipboard after 30 s under the production Permissions-Policy', async ({ page }) => {
  await page.clock.install();
  await open(page, '#/read');
  await upload(page, 'wifi');
  await page.getByRole('button', { name: 'Copy password' }).first().click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(WIFI_PASSWORD);
  await expect(page.getByText(/Clipboard clears in/)).toBeVisible();
  await page.clock.runFor(31_000);
  await expect(page.getByText('Clipboard cleared')).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('');
});

test('otpauth result: secret masked, current TOTP code shown', async ({ page }) => {
  await open(page, '#/read');
  await upload(page, 'totp');
  await expect(page.getByTestId('result-fields')).not.toContainText(TOTP_SECRET);
  const output = page.getByTestId('otp-code').locator('output');
  await expect(output).not.toHaveText('–');
  const shown = (await output.textContent())!.replace(/\D/g, '');
  const now = Date.now();
  expect([totp(TOTP_SECRET, now - 30_000), totp(TOTP_SECRET, now), totp(TOTP_SECRET, now + 30_000)]).toContain(shown);
});
