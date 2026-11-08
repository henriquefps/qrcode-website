import { expect, open, sideScroll, test } from './test';

for (const theme of ['light', 'dark'] as const) {
  test.describe(`${theme} theme`, () => {
    test.use({ colorScheme: theme });
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem('qrcode.theme', t), theme);
    });

    test('Create, Read, Batch and Quick show fit the screen without sideways scrolling', async ({ page }) => {
      await open(page);
      await expect(page.locator('html')).toHaveClass(new RegExp(theme));
      expect(await sideScroll(page)).toBe(0);
      await page.getByRole('button', { name: 'Batch' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      expect(await sideScroll(page)).toBe(0);
      await page.getByRole('button', { name: 'Close' }).first().click();
      await page.getByRole('tab', { name: 'Read' }).click();
      await expect(page.getByRole('heading', { name: 'Read a QR code' })).toBeVisible();
      expect(await sideScroll(page)).toBe(0);
      await page.getByRole('button', { name: 'Quick show' }).click();
      await page.getByLabel('Text to show as a QR code').fill('a fairly long password with words in it');
      expect(await sideScroll(page)).toBe(0);
    });
  });
}
