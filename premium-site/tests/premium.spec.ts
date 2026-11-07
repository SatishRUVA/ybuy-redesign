import { expect, test } from '@playwright/test';
import { filterListings, listings, rentalTotal } from '../src/data';
import type { Filters } from '../src/data';
import { calendarDays, todayIso } from '../src/calendar';
import { ENDING_SOON_MS, auctionTime, createDemoAuctions, stealPercent, timeShare } from '../src/auctions';

const defaultFilters: Filters = { query: '', category: 'All gear', maxPrice: 100, sort: 'Recommended', favoritesOnly: false, favorites: [] };

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-07-01T12:00:00Z'));
});

test('calendar helpers handle month boundaries and leap years', () => {
  expect(todayIso(new Date(2026, 6, 15, 12))).toBe('2026-07-15');
  const july = calendarDays(2026, 6);
  expect(july).toHaveLength(42);
  expect(july.slice(0, 3)).toEqual([null, null, null]);
  expect(july.filter(Boolean)).toHaveLength(31);
  expect(calendarDays(2028, 1).filter(Boolean)).toHaveLength(29);
  expect(calendarDays(2026, 1).filter(Boolean)).toHaveLength(28);
  expect(calendarDays(2026, 12).filter(Boolean)[0]).toBe('2027-01-01');
});

test('ten demo auctions have unique identities and real countdown boundaries', () => {
  const auctions = createDemoAuctions(0);
  expect(auctions).toHaveLength(10);
  expect(new Set(auctions.map((auction) => auction.id)).size).toBe(10);
  expect(auctions[0].endsAt).toBe(6 * 60000);
  expect(auctions.filter((auction) => auction.endsAt <= ENDING_SOON_MS)).toHaveLength(2);
  expect(auctionTime(3661000)).toBe('01:01:01');
  expect(auctionTime(59999)).toBe('00:01:00');
  expect(auctionTime(0)).toBe('Ended');
  expect(auctionTime(-1)).toBe('Ended');
});

test('steal percentage and time share are bounded and safe', () => {
  expect(stealPercent(18, 24)).toBe(25);
  expect(stealPercent(30, 24)).toBe(0);
  expect(stealPercent(10, 0)).toBe(0);
  expect(stealPercent(Number.NaN, 20)).toBe(0);
  const window = { startedAt: 0, endsAt: 1000 };
  expect(timeShare(window, 0)).toBe(1);
  expect(timeShare(window, 250)).toBe(.75);
  expect(timeShare(window, 2000)).toBe(0);
  expect(timeShare(window, -500)).toBe(1);
  expect(timeShare({ startedAt: 5, endsAt: 5 }, 0)).toBe(0);
});

test('filtering and pricing preserve mock data', () => {
  expect(filterListings(listings, { ...defaultFilters, category: 'Cameras' })).toHaveLength(2);
  expect(filterListings(listings, { ...defaultFilters, query: '  DRILL  ' })[0].id).toBe('home-project');
  expect(filterListings(listings, { ...defaultFilters, maxPrice: 16 })).toHaveLength(2);
  expect(filterListings(listings, { ...defaultFilters, favoritesOnly: true })).toHaveLength(0);
  expect(filterListings(listings, { ...defaultFilters, favoritesOnly: true, favorites: ['sony-camera'] })[0].id).toBe('sony-camera');
  expect(filterListings(listings, { ...defaultFilters, sort: 'Price: low to high' })[0].price).toBe(12);
  expect(filterListings(listings, { ...defaultFilters, sort: 'Closest first' })[0].distance).toBe(.8);
  expect(listings[0].id).toBe('weekend-camp');
  expect(rentalTotal(28, '2026-12-01', '2026-12-04')).toEqual({ days: 3, total: 84 });
  expect(rentalTotal(28, '', '')).toBeNull();
  expect(rentalTotal(28, 'invalid', 'invalid')).toBeNull();
  expect(rentalTotal(28, '2026-12-04', '2026-12-04')).toBeNull();
  expect(rentalTotal(28, '2026-12-04', '2026-12-01')).toBeNull();
  expect(rentalTotal(20, '2026-12-31', '2027-01-02')).toEqual({ days: 2, total: 40 });
  expect(rentalTotal(20, '2026-02-30', '2026-03-04')).toBeNull();
  expect(rentalTotal(20, '2026-2-3', '2026-03-04')).toBeNull();
  expect(rentalTotal(Number.NaN, '2026-12-01', '2026-12-04')).toBeNull();
  expect(rentalTotal(-20, '2026-12-01', '2026-12-04')).toBeNull();
  expect(rentalTotal(20, '2028-02-28', '2028-03-01')).toEqual({ days: 2, total: 40 });
});

test('home has local assets, no runtime errors, and no backend requests', async ({ page }) => {
  const errors: string[] = [];
  const requests: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('More moments.Less owning.');
  await expect(page.locator('.listing-card')).toHaveCount(8);
  await page.locator('.site-footer').scrollIntoViewIfNeeded();
  await expect.poll(() => page.locator('img').evaluateAll((images) => images.every((image) => image.complete && image.naturalWidth > 0))).toBeTruthy();
  expect(errors).toEqual([]);
  expect(requests.filter((url) => !url.startsWith('http://localhost:5177'))).toEqual([]);
});

test('search and price controls filter the actual displayed collection', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await page.getByRole('searchbox').fill('drill');
  await page.getByRole('button', { name: 'Find my next good day' }).click();
  await expect(page.locator('.listing-card')).toHaveCount(1);
  await expect(page.locator('.listing-title-row')).toContainText('For the project');
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await page.getByRole('button', { name: 'Filters', exact: true }).click();
  await page.getByRole('slider', { name: 'Maximum daily price' }).fill('16');
  await page.getByRole('button', { name: 'Show 2 finds' }).click();
  await expect(page.locator('.listing-card')).toHaveCount(2);
});

test('category and sorting selections work', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Cameras', exact: true }).click();
  await expect(page.locator('.listing-card')).toHaveCount(2);
  await page.getByLabel('Sort rentals').selectOption('Price: low to high');
  await expect(page.locator('.listing-card').first()).toContainText('Find your next perspective');
});

test('favorites stay saved across client-side navigation', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Save A weekend under the stars', exact: true }).click();
  await page.getByRole('link', { name: /^Saved/ }).first().click();
  await expect(page).toHaveURL('/saved');
  await expect(page.locator('.listing-card')).toHaveCount(1);
  await page.getByRole('button', { name: 'Unsave A weekend under the stars', exact: true }).click();
  await expect(page.locator('.empty-state')).toBeVisible();
});

test('detail uses the premium calendar and validates missing dates', async ({ page }) => {
  await page.goto('/gear/weekend-camp');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('A weekend under the stars');
  await page.getByRole('button', { name: 'Preview a borrow request' }).click();
  await expect(page.getByRole('alert')).toContainText('Choose a pickup date');
  await page.getByRole('button', { name: 'Choose pickup date' }).click();
  await page.locator('[data-date="2026-07-15"]').click();
  await page.locator('[data-date="2026-07-18"]').click();
  await expect(page.locator('.reservation-total')).toContainText('$84');
  await page.getByRole('button', { name: 'Preview a borrow request' }).click();
  await expect(page.locator('.toast')).toContainText('No booking or payment was made');
  await page.getByRole('button', { name: 'Clear dates' }).click();
  await expect(page.locator('.reservation-total')).toContainText('Choose dates');
});

test('search calendar prevents same-day returns and surfaces incomplete ranges', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await page.getByRole('button', { name: 'Choose pickup date' }).click();
  await page.locator('[data-date="2026-07-15"]').click();
  await expect(page.locator('[data-date="2026-07-15"]')).toBeDisabled();
  await expect(page.locator('[data-date="2026-07-14"]')).toBeDisabled();
  await page.getByRole('button', { name: 'Find my next good day' }).click();
  await expect(page.getByRole('alert')).toContainText('return date after the pickup date');
});

test('dialog traps keyboard focus and closes with Escape', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  for (let index = 0; index < 12; index++) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))).toBeTruthy();
  }
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Search', exact: true })).toBeFocused();
});

test('listing form never publishes or makes backend calls', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Share your gear' }).first().click();
  await page.getByLabel('What would you like to share?').fill('My tent');
  await page.getByLabel('What is your daily price?').fill('25');
  await page.getByRole('button', { name: 'Preview my listing' }).click();
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'My tent' })).toBeVisible();
  await expect(page.locator('.host-draft-summary')).toContainText('$25');
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(page.locator('.toast')).toContainText('Nothing has been published');
});

test('unknown paths and browser back work', async ({ page }) => {
  await page.goto('/not-a-page');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('This path leads');
  await page.getByRole('link', { name: 'Back to exploring' }).click();
  await expect(page).toHaveURL('/');
  await page.getByRole('link', { name: 'View A weekend under the stars' }).click();
  await expect(page).toHaveURL('/gear/weekend-camp');
  await page.goBack();
  await expect(page).toHaveURL('/');
});

for (const width of [320, 360, 390, 430, 640, 768, 1024, 1440]) {
  test(`no page overflow at ${width}px, including dialogs and details`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    expect(await page.evaluate(() => document.querySelector('[role="dialog"]')!.scrollWidth <= document.querySelector('[role="dialog"]')!.clientWidth)).toBeTruthy();
    await page.keyboard.press('Escape');
    await page.goto('/gear/weekend-camp');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  });
}

test('phone landscape search and navigation stay usable', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Find my next good day' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});

test('reduced motion keeps all content visible', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('.listing-card')).toHaveCount(8);
  expect(await page.locator('.page-intro').first().evaluate((element) => getComputedStyle(element).opacity)).toBe('1');
});

test('capture production desktop and phone review frames', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await page.locator('.site-footer').scrollIntoViewIfNeeded();
  await expect.poll(() => page.locator('img').evaluateAll((images) => images.every((image) => image.complete && image.naturalWidth > 0))).toBeTruthy();
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(800);
  await page.screenshot({ path: testInfo.outputPath('desktop-home.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: testInfo.outputPath('mobile-home.png'), fullPage: true });
  await page.goto('/gear/weekend-camp');
  await page.waitForTimeout(800);
  await page.screenshot({ path: testInfo.outputPath('mobile-detail.png'), fullPage: true });
});
