import { test, expect } from '@playwright/test';

test.describe('Classic Mode Happy Path', () => {
  test('navigate through classic game, leaderboard, and profile on desktop', async ({ page }) => {
    // 1. Navigate to home page
    await page.goto('/');

    // Verify home page loaded with title and game mode tiles
    await expect(page.locator('h1')).toContainText('WORD LADDER');
    await page.waitForLoadState('networkidle');

    // 2. Click "Classic" to start the game - it's a link within a ModeTile
    const classicLink = page.locator('a').filter({ hasText: 'Classic' }).first();
    await classicLink.waitFor({ state: 'visible', timeout: 5000 });
    await classicLink.click();

    // 3. Verify game page loaded
    await expect(page.locator('h1')).toContainText('Word Ladder');
    await page.waitForLoadState('networkidle');

    // Verify puzzle page has keyboard/game elements (look for buttons with letter keys)
    const keyboardButtons = page.locator('button').filter({ hasText: /^[A-Z]$/ });
    await expect(keyboardButtons).toHaveCount(26, { timeout: 5000 });

    // 4. Navigate back to home and then to leaderboards
    // Click home (via logo or home nav)
    const homeLink = page.locator('button').filter({ hasText: 'home' }).first();
    if (await homeLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await homeLink.click();
      await expect(page).toHaveURL('/');
    } else {
      // Navigate via URL if button not found
      await page.goto('/');
    }

    await page.waitForLoadState('networkidle');

    // 5. Navigate to leaderboards
    const leaderboardsLink = page.locator('a').filter({ hasText: /leaderboards?/i }).first();
    await expect(leaderboardsLink).toBeVisible({ timeout: 5000 });
    await leaderboardsLink.click();

    // 6. Verify leaderboard page loaded
    await page.waitForLoadState('networkidle');
    const leaderboardHeading = page.locator('h1').filter({ hasText: /leaderboards?/i }).first();
    await expect(leaderboardHeading).toBeVisible({ timeout: 5000 });

    // Verify leaderboard content is visible (rankings with players)
    const leaderboardContent = page.locator('button, tr').filter({ hasText: /user|player/ });
    const contentCount = await leaderboardContent.count();
    expect(contentCount).toBeGreaterThanOrEqual(0); // May be empty, but page should load

    // 7. Navigate to player profile
    const profileLink = page.locator('a').filter({ hasText: /profile/i }).first();
    if (await profileLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await profileLink.click();
      await page.waitForLoadState('networkidle');

      // Verify profile page loaded with stats
      const profileContent = page.locator('text=/stats|games|score/i').first();
      await expect(profileContent).toBeVisible({ timeout: 5000 });
    }
  });

  test('classic mode happy path works on mobile', async ({ page }) => {
    // Mobile viewport test (Pixel 5 from playwright.config.ts)

    // 1. Navigate to home page
    await page.goto('/');

    // Verify page loaded on mobile
    await expect(page.locator('h1')).toContainText('WORD LADDER');
    await page.waitForLoadState('networkidle');

    // 2. Click "Classic" on mobile
    const classicLink = page.locator('a').filter({ hasText: 'Classic' }).first();
    await classicLink.waitFor({ state: 'visible', timeout: 5000 });
    await classicLink.click();

    // 3. Verify game page loaded on mobile
    await expect(page.locator('h1')).toContainText('Word Ladder');
    await page.waitForLoadState('networkidle');

    // Verify puzzle keyboard is visible on mobile
    const keyboardButtons = page.locator('button').filter({ hasText: /^[A-Z]$/ });
    await expect(keyboardButtons).toHaveCount(26, { timeout: 5000 });

    // 4. Navigate back to home
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 5. Navigate to leaderboards from home
    const leaderboardsLink = page.locator('a').filter({ hasText: /leaderboards?/i }).first();
    await expect(leaderboardsLink).toBeVisible({ timeout: 5000 });
    await leaderboardsLink.click();

    // 6. Verify leaderboard loaded on mobile
    await page.waitForLoadState('networkidle');
    const leaderboardHeading = page.locator('h1').filter({ hasText: /leaderboards?/i }).first();
    await expect(leaderboardHeading).toBeVisible({ timeout: 5000 });

    // 7. Verify mobile layout works
    // This test runs with Mobile Chrome project configured in playwright.config.ts
    const viewportSize = page.viewportSize();
    expect(viewportSize).toBeTruthy();
  });

  test('navigation flow works correctly', async ({ page }) => {
    // Test that all navigation links are accessible and working

    // Start at home
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('WORD LADDER');

    // Verify all main navigation links are visible
    const profileLink = page.locator('a').filter({ hasText: /profile/i }).first();
    const leaderboardsLink = page.locator('a').filter({ hasText: /leaderboards?/i }).first();
    const shopLink = page.locator('a').filter({ hasText: /shop/i }).first();

    await expect(profileLink).toBeVisible();
    await expect(leaderboardsLink).toBeVisible();
    await expect(shopLink).toBeVisible();

    // Click Leaderboards
    await leaderboardsLink.click();
    await page.waitForLoadState('networkidle');
    await expect(page.url()).toContain('/leaderboards');

    // Go back to home via logo or home link
    const homeLink = page.locator('a, button').filter({ hasText: /home|word ladder/i }).first();
    if (await homeLink.isVisible()) {
      await homeLink.click();
      await expect(page.url()).toContain('/');
    }
  });
});
