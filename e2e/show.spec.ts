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
