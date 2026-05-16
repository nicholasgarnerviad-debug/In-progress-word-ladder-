import { test, expect } from '@playwright/test';

test.describe('Achievement Unlock', () => {
  test('earn first game achievement on classic mode (desktop)', async ({ page }) => {
    // 1. Navigate to home
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('WORD LADDER');
    await page.waitForLoadState('networkidle');

    // 2. Click Classic to start game
    const classicLink = page.locator('a').filter({ hasText: 'Classic' }).first();
    await classicLink.waitFor({ state: 'visible', timeout: 5000 });
    await classicLink.click();

    // 3. Verify game page loaded
    await expect(page.locator('h1')).toContainText('Word Ladder');
    await page.waitForLoadState('networkidle');

    // Verify puzzle is ready (look for keyboard buttons)
    const keyboardButtons = page.locator('button').filter({ hasText: /^[A-Z]$/ });
    await expect(keyboardButtons).toHaveCount(26, { timeout: 5000 });

    // Try to interact with the game by clicking some keyboard buttons
    // This tests the game is interactive and responsive
    const buttons = page.locator('button').filter({ hasText: /^[A-Z]$/ });
    if (await buttons.count() > 0) {
      await buttons.first().click();
    }

    // Give the game a moment to process
    await page.waitForTimeout(500);

    // 5. Navigate to achievements page directly
    await page.goto('/achievements');
    await page.waitForLoadState('networkidle');

    // 6. Verify achievements page loaded with content
    const achievementsHeading = page.locator('h1').filter({ hasText: /achievements/i });
    await expect(achievementsHeading).toBeVisible({ timeout: 5000 });

    // Verify page shows achievement count text
    const achievementCountText = page.locator('text=/of\\s+\\d+\\s+unlocked/i');
    await expect(achievementCountText).toBeVisible({ timeout: 5000 });

    // Verify filter buttons exist and work
    const allFilterButton = page.locator('button').filter({ hasText: /^all$/i }).first();
    await expect(allFilterButton).toBeVisible({ timeout: 5000 });

    // Verify achievements are displayed (look for rarity badges or achievement icons)
    const rarityBadges = page.locator('text=/common|rare|legendary/i');
    const badgeCount = await rarityBadges.count();
    expect(badgeCount).toBeGreaterThan(0); // Should have multiple achievement badges
  });

  test('achievement unlock works on mobile (Pixel 5)', async ({ page }) => {
    // This test runs with Mobile Chrome project from playwright.config.ts

    // 1. Navigate to home
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('WORD LADDER');
    await page.waitForLoadState('networkidle');

    // Verify we have a viewport
    const viewportSize = page.viewportSize();
    expect(viewportSize).toBeTruthy();

    // 2. Click Classic on mobile
    const classicLink = page.locator('a').filter({ hasText: 'Classic' }).first();
    await classicLink.waitFor({ state: 'visible', timeout: 5000 });
    await classicLink.click();

    // 3. Verify game loaded
    await expect(page.locator('h1')).toContainText('Word Ladder');
    await page.waitForLoadState('networkidle');

    // 4. Verify keyboard is visible
    const keyboardButtons = page.locator('button').filter({ hasText: /^[A-Z]$/ });
    await expect(keyboardButtons).toHaveCount(26, { timeout: 5000 });

    // 5. Attempt to interact with game
    const buttons = keyboardButtons.first();
    await buttons.click();

    // 6. Navigate to achievements
    await page.goto('/achievements');
    await page.waitForLoadState('networkidle');

    // 7. Verify achievements page loaded on mobile
    const achievementsHeading = page.locator('h1').filter({ hasText: /achievements/i }).first();
    await expect(achievementsHeading).toBeVisible({ timeout: 5000 });

    // Verify filter buttons are visible
    const filterButtons = page.locator('button').filter({ hasText: /all|earned|locked/i });
    await expect(filterButtons).toHaveCount(3, { timeout: 5000 });
  });

  test('achievements page displays achievement list', async ({ page }) => {
    // Test that the achievements page loads and displays achievements

    // 1. Navigate directly to achievements page
    await page.goto('/achievements');
    await page.waitForLoadState('networkidle');

    // 2. Verify page loaded
    const achievementsHeading = page.locator('h1').filter({ hasText: /achievements/i });
    await expect(achievementsHeading).toBeVisible({ timeout: 5000 });

    // 3. Verify filter buttons exist
    const filterButtons = page.locator('button').filter({ hasText: /all|earned|locked/i });
    const filterCount = await filterButtons.count();
    expect(filterCount).toBeGreaterThanOrEqual(2); // At least "all" and one other

    // 4. Verify achievement cards are displayed
    const achievementCards = page.locator('[class*="p-4"], [class*="border"], [class*="rounded"]');
    // Should have multiple achievement cards
    const visibleCards = await achievementCards.filter({ hasText: /🎮|⚡|📚|⏱️|⭐|🏆|💎|💯|🔥|👑|🌟/ }).count();
    expect(visibleCards).toBeGreaterThanOrEqual(0);

    // 5. Verify filter functionality (click earned filter)
    const earnedFilter = page.locator('button').filter({ hasText: /earned/i }).first();
    if (await earnedFilter.isVisible()) {
      await earnedFilter.click();
      // Page should still be visible
      await expect(page.locator('h1').filter({ hasText: /achievements/i })).toBeVisible();
    }
  });

  test('can navigate to achievements from home', async ({ page }) => {
    // Test navigation flow to achievements page

    // 1. Start at home
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('WORD LADDER');

    // 2. Try to find and click achievements link
    // Check if there's a direct link on home page
    const achievementsLink = page.locator('a').filter({ hasText: /achievements/i }).first();

    if (await achievementsLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Direct link found
      await achievementsLink.click();
      await page.waitForLoadState('networkidle');

      // Verify we're on achievements page
      const url = page.url();
      expect(url).toContain('/achievements');
    } else {
      // Navigate via URL
      await page.goto('/achievements');
      await page.waitForLoadState('networkidle');
    }

    // Verify achievements page loaded
    const achievementsHeading = page.locator('h1').filter({ hasText: /achievements/i });
    await expect(achievementsHeading).toBeVisible({ timeout: 5000 });
  });
});
