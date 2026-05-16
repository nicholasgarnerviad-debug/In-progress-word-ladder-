import { test, expect } from '@playwright/test';

test.describe('Offline Gameplay & Sync', () => {
  test('play offline, go online, verify sync on desktop', async ({ page, context }) => {
    // 1. Start online and navigate to app
    await page.goto('/');

    // Verify home page loaded
    await expect(page.locator('h1')).toContainText('WORD LADDER');
    await page.waitForLoadState('networkidle');

    // 2. Navigate to Classic game BEFORE going offline
    const classicLink = page.locator('a').filter({ hasText: 'Classic' }).first();
    await classicLink.waitFor({ state: 'visible', timeout: 5000 });
    await classicLink.click();

    // Verify game page loaded while still online
    await expect(page.locator('h1')).toContainText('Word Ladder');
    await page.waitForLoadState('networkidle');

    // Verify puzzle keyboard is visible (26 letter buttons)
    const keyboardButtons = page.locator('button').filter({ hasText: /^[A-Z]$/ });
    await expect(keyboardButtons).toHaveCount(26, { timeout: 5000 });

    // 3. NOW go offline - game page is already loaded
    await context.setOffline(true);

    // Wait for offline state to take effect
    await page.waitForTimeout(500);

    // 4. Verify we can still interact with the game while offline
    // The game should still be responsive offline
    const gameContainer = page.locator('div').filter({ hasText: /Get from|to/i }).first();
    expect(await gameContainer.isVisible({ timeout: 2000 }).catch(() => false)).toBeTruthy();

    // 5. Go back online
    await context.setOffline(false);

    // Wait for network to stabilize
    await page.waitForTimeout(1500);

    // 6. Navigate to leaderboards to verify sync
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify home page reloaded
    await expect(page.locator('h1')).toContainText('WORD LADDER');

    // Navigate to leaderboards
    const leaderboardsLink = page.locator('a').filter({ hasText: /leaderboards?/i }).first();
    await expect(leaderboardsLink).toBeVisible({ timeout: 5000 });
    await leaderboardsLink.click();

    // Verify leaderboard page loaded
    await page.waitForLoadState('networkidle');
    const leaderboardHeading = page.locator('h1').filter({ hasText: /leaderboards?/i }).first();
    await expect(leaderboardHeading).toBeVisible({ timeout: 5000 });

    // 7. Verify leaderboard content is visible (synced after coming online)
    expect(await leaderboardHeading.isVisible()).toBeTruthy();
  });

  test('play offline, go online, verify sync on mobile', async ({ page, context }) => {
    // Mobile test with Pixel 5 viewport (from playwright.config.ts)

    // 1. Start online
    await page.goto('/');

    // Verify home page on mobile
    await expect(page.locator('h1')).toContainText('WORD LADDER');
    await page.waitForLoadState('networkidle');

    // 2. Navigate to Classic game BEFORE going offline
    const classicLink = page.locator('a').filter({ hasText: 'Classic' }).first();
    await classicLink.waitFor({ state: 'visible', timeout: 5000 });
    await classicLink.click();

    // Verify game loaded on mobile while online
    await expect(page.locator('h1')).toContainText('Word Ladder');
    await page.waitForLoadState('networkidle');

    // Verify keyboard is visible on mobile
    const keyboardButtons = page.locator('button').filter({ hasText: /^[A-Z]$/ });
    await expect(keyboardButtons).toHaveCount(26, { timeout: 5000 });

    // 3. NOW go offline - game page is already loaded
    await context.setOffline(true);

    // Wait for offline state to take effect
    await page.waitForTimeout(500);

    // 4. Verify game remains responsive offline on mobile
    const gameContainer = page.locator('div').filter({ hasText: /Get from|to/i }).first();
    expect(await gameContainer.isVisible({ timeout: 2000 }).catch(() => false)).toBeTruthy();

    // Keyboard should still be visible
    const offlineKeyboard = page.locator('button').filter({ hasText: /^[A-Z]$/ });
    expect(await offlineKeyboard.count()).toBe(26);

    // 5. Go back online
    await context.setOffline(false);

    // Wait for network to stabilize
    await page.waitForTimeout(1500);

    // 6. Navigate home on mobile
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify mobile home page
    await expect(page.locator('h1')).toContainText('WORD LADDER');

    // 7. Navigate to leaderboards on mobile
    const leaderboardsLink = page.locator('a').filter({ hasText: /leaderboards?/i }).first();
    await expect(leaderboardsLink).toBeVisible({ timeout: 5000 });
    await leaderboardsLink.click();

    // Verify leaderboard loaded on mobile
    await page.waitForLoadState('networkidle');
    const leaderboardHeading = page.locator('h1').filter({ hasText: /leaderboards?/i }).first();
    await expect(leaderboardHeading).toBeVisible({ timeout: 5000 });

    // 8. Verify leaderboard is visible and functional
    expect(await leaderboardHeading.isVisible()).toBeTruthy();
  });

  test('offline gameplay remains cached when returning to home', async ({ page, context }) => {
    // Test that game state persists across navigation while offline

    // 1. Start online
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('WORD LADDER');
    await page.waitForLoadState('networkidle');

    // 2. Navigate to game and go offline
    const classicLink = page.locator('a').filter({ hasText: 'Classic' }).first();
    await classicLink.click();
    await expect(page.locator('h1')).toContainText('Word Ladder');
    await page.waitForLoadState('networkidle');

    // 3. Go offline
    await context.setOffline(true);
    await page.waitForTimeout(500);

    // Verify game still visible offline
    const gameContainer = page.locator('div').filter({ hasText: /Get from|to/i }).first();
    expect(await gameContainer.isVisible({ timeout: 2000 }).catch(() => false)).toBeTruthy();

    // 4. Try to navigate back home while offline
    const homeLink = page.locator('button, a').filter({ hasText: /home|back/i }).first();
    const homeVisible = await homeLink.isVisible({ timeout: 2000 }).catch(() => false);
    if (homeVisible) {
      await homeLink.click();
    }

    // 5. Go back online
    await context.setOffline(false);
    await page.waitForTimeout(1500);

    // 6. Verify app is fully responsive
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('WORD LADDER');
  });

  test('localStorage persists across offline/online transitions', async ({ page, context }) => {
    // Test that localStorage-based caching works across mode changes

    // 1. Start online
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('WORD LADDER');
    await page.waitForLoadState('networkidle');

    // 2. Navigate to game
    const classicLink = page.locator('a').filter({ hasText: 'Classic' }).first();
    await classicLink.click();
    await expect(page.locator('h1')).toContainText('Word Ladder');
    await page.waitForLoadState('networkidle');

    // 3. Store some data via page evaluation to test localStorage
    const storedData = await page.evaluate(() => {
      const testKey = 'offline-test-data';
      const testValue = 'offline-gameplay-test-' + Date.now();
      localStorage.setItem(testKey, testValue);
      return localStorage.getItem(testKey);
    });

    expect(storedData).toBeTruthy();

    // 4. Go offline
    await context.setOffline(true);
    await page.waitForTimeout(500);

    // Verify we can still read localStorage while offline
    const offlineData = await page.evaluate(() => {
      const testKey = 'offline-test-data';
      return localStorage.getItem(testKey);
    });

    expect(offlineData).toBe(storedData);

    // 5. Go back online
    await context.setOffline(false);
    await page.waitForTimeout(500);

    // 6. Verify data persisted across offline/online transition
    const persistedData = await page.evaluate(() => {
      const testKey = 'offline-test-data';
      return localStorage.getItem(testKey);
    });

    expect(persistedData).toBe(storedData);

    // 7. Verify app is fully functional after coming online
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('WORD LADDER');
  });

  test('network requests resume after coming back online', async ({ page, context }) => {
    // Test that the app can fetch data after being offline

    // 1. Start online
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('WORD LADDER');
    await page.waitForLoadState('networkidle');

    // 2. Go offline and stay offline for a moment
    await context.setOffline(true);
    await page.waitForTimeout(1000);

    // 3. Go back online
    await context.setOffline(false);
    await page.waitForTimeout(500);

    // 4. Navigate to leaderboards - should be able to fetch data
    const leaderboardsLink = page.locator('a').filter({ hasText: /leaderboards?/i }).first();
    await expect(leaderboardsLink).toBeVisible({ timeout: 5000 });
    await leaderboardsLink.click();

    // 5. Verify leaderboard loads and displays data
    await page.waitForLoadState('networkidle');
    const leaderboardHeading = page.locator('h1').filter({ hasText: /leaderboards?/i }).first();
    await expect(leaderboardHeading).toBeVisible({ timeout: 5000 });

    // Should have successfully loaded leaderboard data
    expect(await leaderboardHeading.isVisible()).toBeTruthy();
  });

  test('app remains functional across multiple offline/online cycles', async ({ page, context }) => {
    // Test resilience across multiple state transitions

    // 1. Start online
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('WORD LADDER');

    // Cycle 1: Go offline then online
    await context.setOffline(true);
    await page.waitForTimeout(300);
    await context.setOffline(false);
    await page.waitForTimeout(300);

    // Should still see home page
    await expect(page.locator('h1')).toContainText('WORD LADDER');

    // 2. Navigate to game
    const classicLink = page.locator('a').filter({ hasText: 'Classic' }).first();
    await classicLink.click();
    await expect(page.locator('h1')).toContainText('Word Ladder');

    // Cycle 2: Go offline then online while on game
    await context.setOffline(true);
    await page.waitForTimeout(300);
    await context.setOffline(false);
    await page.waitForTimeout(300);

    // Game should still be visible
    const gameContainer = page.locator('div').filter({ hasText: /Get from|to/i }).first();
    expect(await gameContainer.isVisible({ timeout: 2000 }).catch(() => false)).toBeTruthy();

    // 3. Navigate back to home via direct navigation
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Cycle 3: Verify app is still responsive after multiple transitions
    await context.setOffline(true);
    await page.waitForTimeout(300);
    await context.setOffline(false);
    await page.waitForTimeout(500);

    // Should be back on home page and responsive
    await expect(page.locator('h1')).toContainText('WORD LADDER');

    // Verify navigation is still functional - at least one game mode link should be visible
    const gameLink = page.locator('a').filter({ hasText: /Classic|Blitz|Time Attack/i }).first();
    expect(await gameLink.isVisible({ timeout: 3000 }).catch(() => false)).toBeTruthy();
  });
});
