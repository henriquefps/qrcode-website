import { expect, open, test } from './test';

const dialog = (page: import('@playwright/test').Page) => page.getByRole('dialog');
const input = (page: import('@playwright/test').Page) => page.getByLabel('Text to show as a QR code');

test('Q opens Quick show; typing draws the code; Esc closes and clears', async ({ page }) => {
  await open(page);
  await page.locator('body').press('q');
  await expect(dialog(page)).toBeVisible();
  await expect(input(page)).toBeFocused();
  await expect(input(page)).toHaveAttribute('type', 'password');
  await input(page).fill('correct horse battery staple');
  await expect(page.getByTestId('quick-show-qr').locator('svg')).toBeVisible();
  await expect(page.getByRole('timer')).toHaveAccessibleName(/Closes in 1:00|Closes in 0:5\d/);
  await page.keyboard.press('Escape');
  await expect(dialog(page)).toBeHidden();
  await page.getByRole('button', { name: 'Quick show' }).click();
  await expect(input(page)).toHaveValue('');
});

test('countdown closes Quick show after 60 s, and +60 s / pause work', async ({ page }) => {
  await page.clock.install();
  await open(page);
  await page.getByRole('button', { name: 'Quick show' }).click();
  await input(page).fill('secret');
  await page.clock.runFor(30_000);
  await expect(page.getByRole('timer')).toHaveAccessibleName('Closes in 0:30');
  await page.getByRole('button', { name: 'Add 60 seconds' }).click();
  await expect(page.getByRole('timer')).toHaveAccessibleName('Closes in 1:30');
  await page.getByRole('button', { name: 'Pause auto-close' }).click();
  await page.clock.runFor(120_000);
  await expect(dialog(page)).toBeVisible();
  await page.getByRole('button', { name: 'Resume auto-close' }).click();
  await page.clock.runFor(91_000);
  await expect(dialog(page)).toBeHidden();
  await page.getByRole('button', { name: 'Quick show' }).click();
  await expect(input(page)).toHaveValue('');
});

test('#/show opens Quick show and rewrites the URL to #/create', async ({ page }) => {
  await page.goto('/#/show');
  await expect(dialog(page)).toBeVisible();
  await expect(page).toHaveURL(/#\/create$/);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('tab', { name: 'Create' })).toHaveAttribute('aria-selected', 'true');
});

/** Rasterises the holder's svg in the page and decodes it with zxing in Node. */
async function decodeHolder(page: import('@playwright/test').Page) {
  const holder = page.getByTestId('quick-show-qr');
  await expect(holder.locator('svg')).toBeVisible();
  const img = await holder.evaluate(async (el) => {
    const svg = new XMLSerializer().serializeToString(el.querySelector('svg')!);
    const image = new Image();
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 600;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(image, 0, 0, 600, 600);
    return { data: Array.from(ctx.getImageData(0, 0, 600, 600).data), width: 600, height: 600 };
  });
  const { readBarcodes } = await import('zxing-wasm/reader');
  const results = await readBarcodes({ data: Uint8ClampedArray.from(img.data), width: img.width, height: img.height, colorSpace: 'srgb' } as ImageData);
  return results[0]?.text;
}

test('Quick show draws the code again after the text is cleared or was too long', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Quick show' }).click();
  await input(page).fill('first text');
  expect(await decodeHolder(page)).toBe('first text');

  await input(page).fill('');
  await expect(page.getByTestId('quick-show-qr')).toHaveCount(0);
  await input(page).fill('second text');
  await expect(page.getByTestId('quick-show-qr').locator('svg')).toBeVisible();
  expect(await decodeHolder(page)).toBe('second text');

  await input(page).fill('x'.repeat(5000));
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByTestId('quick-show-qr')).toHaveCount(0);
  await input(page).fill('short again');
  expect(await decodeHolder(page)).toBe('short again');
});
