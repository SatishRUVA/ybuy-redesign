import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-07-10T12:00:00Z'));
});

test('calendar blocks past dates and supports keyboard selection across months', async ({ page }) => {
  await page.goto('/gear/weekend-camp');
  await page.getByRole('button', { name: 'Choose pickup date' }).click();
  await expect(page.locator('[data-date="2026-07-09"]')).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Previous month' })).toBeDisabled();
  await page.locator('[data-date="2026-07-31"]').click();
  await expect(page.locator('[data-date="2026-08-01"]')).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('[data-date="2026-08-02"]')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Choose return date' })).toContainText('Aug 2');
  await expect(page.locator('.reservation-total')).toContainText('$56');
  await expect(page.getByRole('button', { name: 'Choose return date' })).toBeFocused();
});

test('calendar month navigation and Escape restore the opener', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await page.getByRole('button', { name: 'Choose pickup date' }).click();
  await page.getByRole('button', { name: 'Next month' }).click();
  await expect(page.getByRole('grid', { name: 'August 2026' })).toBeVisible();
  await page.getByRole('button', { name: 'Previous month' }).click();
  await page.locator('[data-date="2026-07-20"]').focus();
  await page.keyboard.press('PageDown');
  await expect(page.locator('[data-date="2026-08-20"]')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('.range-calendar')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Choose pickup date' })).toBeFocused();
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('selected search range carries into rental details', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await page.getByRole('button', { name: 'Choose pickup date' }).click();
  await page.locator('[data-date="2026-07-15"]').click();
  await page.locator('[data-date="2026-07-18"]').click();
  await page.getByRole('button', { name: 'Find my next good day' }).click();
  await page.getByRole('link', { name: 'View A weekend under the stars' }).click();
  await expect(page.locator('.reservation-total')).toContainText('$84');
});

test('the rail starts with ten auctions and a bid updates only its card', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.auction-card')).toHaveCount(10);
  const first = page.locator('[data-auction="auction-1"]');
  await expect(first).toHaveClass(/auction-card--ending/);
  await expect(first.locator('.auction-live')).toContainText('Ending soon');
  await expect(page.locator('[data-auction="auction-5"]').locator('.auction-live')).toHaveText('Live');
  await first.getByRole('button', { name: 'Bid $20' }).click();
  await expect(first.locator('.auction-price')).toContainText('$20');
  await expect(first).toContainText('7 bids');
  await expect(first.locator('.auction-leading')).toContainText('top bidder');
  await expect(page.locator('[data-auction="auction-2"] .auction-leading')).toHaveCount(0);
  await expect(page.locator('[data-auction="auction-2"]')).toContainText('12 bids');
  await expect(page.locator('.toast')).toContainText('No payment or real bid was made');
});

test('automatic scroll really moves and can be paused or browsed manually', async ({ page }) => {
  await page.goto('/');
  await expect.poll(() => page.locator('.auction-track').evaluate((node) => node.scrollLeft)).toBeGreaterThan(15);
  await page.getByRole('button', { name: 'Pause auction scroll' }).click();
  const before = await page.locator('.auction-track').evaluate((node) => node.scrollLeft);
  await page.waitForTimeout(300);
  expect(await page.locator('.auction-track').evaluate((node) => node.scrollLeft)).toBe(before);
  await page.getByRole('button', { name: 'Next auctions' }).click();
  await expect.poll(() => page.locator('.auction-track').evaluate((node) => node.scrollLeft)).toBeGreaterThan(before + 150);
});

test('Disappear turns the card into cloud puffs then removes it', async ({ page }, testInfo) => {
  await page.goto('/');
  const card = page.locator('[data-auction="auction-1"]');
  await card.getByRole('button', { name: /^Disappear/ }).click();
  await expect(card).toHaveClass(/disappearing/);
  await expect.poll(() => card.locator('.auction-cloud-puff').first().evaluate((node) => Number(getComputedStyle(node).opacity)), { intervals: [50], timeout: 1500 }).toBeGreaterThan(.1);
  await page.screenshot({ path: testInfo.outputPath('cloud-disappear.png') });
  await expect(card).toHaveCount(0);
  await expect(page.locator('.auction-card')).toHaveCount(9);
  await expect(page.locator('.toast')).toContainText('Sample auction disappeared');
  await page.getByRole('link', { name: /^Saved/ }).first().click();
  await page.getByRole('link', { name: 'Explore', exact: true }).first().click();
  await expect(page.locator('.auction-card')).toHaveCount(9);
});

test('reduced motion removes immediately, offers an empty state, and restores ten', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.waitForTimeout(150);
  expect(await page.locator('.auction-track').evaluate((node) => node.scrollLeft)).toBe(0);
  for (let index = 0; index < 10; index++) {
    await page.locator('.auction-disappear').first().click();
    await expect(page.locator('.auction-card')).toHaveCount(9 - index);
  }
  await expect(page.locator('.auction-empty')).toContainText('All clear');
  await page.getByRole('button', { name: 'Restore 10 demo auctions' }).click();
  await expect(page.locator('.auction-card')).toHaveCount(10);
});

test('countdowns decrease and closed auctions reject bids', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.auction-timer').first()).  toContainText('00:06:00');
  await page.clock.setFixedTime(new Date('2026-07-10T12:00:01Z'));
    await expect(page.locator('.auction-timer').first()).toContainText('00:05:59');
    await page.clock.setFixedTime(new Date('2026-07-10T12:07:00Z'));
  await expect(page.locator('.auction-timer').first()).toContainText('Ended');
  await expect(page.locator('[data-auction="auction-1"]').getByRole('button', { name: 'Auction ended' })).toBeDisabled();
});

for (const width of [320, 390, 768, 1440]) {
  test(`premium calendar and auction rail fit ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'Choose pickup date' }).click();
    await page.locator('[data-date="2026-07-15"]').click();
    await page.screenshot({ path: testInfo.outputPath(`calendar-${width}.png`) });
    expect(await page.getByRole('dialog').evaluate((node) => node.scrollWidth <= node.clientWidth)).toBeTruthy();
    await page.locator('[data-date="2026-07-18"]').click();
    await page.getByRole('button', { name: 'Find my next good day' }).click();
    await page.locator('.auction-section').scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath(`auctions-${width}.png`) });
  });
}
