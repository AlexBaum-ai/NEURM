import { test, expect } from '@playwright/test';

test.describe('Skill Endorsements E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login as test user
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('should display endorse button on skills', async ({ page }) => {
    // Visit another user's profile
    await page.goto('/profile/testuser');

    // Check for skills section
    const skillsSection = page.locator('[data-testid="skills-section"]');
    await expect(skillsSection).toBeVisible();

    // Check for endorse buttons
    const endorseButtons = page.locator('[data-testid="endorse-button"]');
    expect(await endorseButtons.count()).toBeGreaterThan(0);
  });

  test('should not show endorse button on own profile', async ({ page }) => {
    // Visit own profile
    await page.goto('/profile/me');

    // Endorse buttons should not be visible
    const endorseButtons = page.locator('[data-testid="endorse-button"]');
    expect(await endorseButtons.count()).toBe(0);
  });

  test('should endorse a skill', async ({ page }) => {
    await page.goto('/profile/testuser');

    // Find first "+ Endorse" button
    const endorseButton = page.locator('button:has-text("+ Endorse")').first();
    const skillId = await endorseButton.getAttribute('data-skill-id');

    // Get initial endorsement count
    const countElement = page.locator(`[data-skill-id="${skillId}"] [data-testid="endorsement-count"]`);
    const initialCount = parseInt((await countElement.textContent()) || '0');

    // Click endorse
    await endorseButton.click();

    // Wait for API call
    await page.waitForResponse((response) =>
      response.url().includes('/endorse') && response.request().method() === 'POST'
    );

    // Button should change to "Endorsed"
    await expect(endorseButton).toHaveText('Endorsed');

    // Count should increase
    const newCount = parseInt((await countElement.textContent()) || '0');
    expect(newCount).toBe(initialCount + 1);

    // Success message should appear
    await expect(page.locator('text=Endorsed successfully')).toBeVisible();
  });

  test('should unendorse a skill', async ({ page }) => {
    await page.goto('/profile/testuser');

    // Find first "Endorsed" button
    const endorsedButton = page.locator('button:has-text("Endorsed")').first();
    if (await endorsedButton.isVisible()) {
      const skillId = await endorsedButton.getAttribute('data-skill-id');

      // Get initial endorsement count
      const countElement = page.locator(`[data-skill-id="${skillId}"] [data-testid="endorsement-count"]`);
      const initialCount = parseInt((await countElement.textContent()) || '0');

      // Click to unendorse
      await endorsedButton.click();

      // Wait for API call
      await page.waitForResponse((response) =>
        response.url().includes('/endorse') && response.request().method() === 'DELETE'
      );

      // Button should change to "+ Endorse"
      await expect(endorsedButton).toHaveText('+ Endorse');

      // Count should decrease
      const newCount = parseInt((await countElement.textContent()) || '0');
      expect(newCount).toBe(initialCount - 1);
    }
  });

  test('should show endorsers list when count is clicked', async ({ page }) => {
    await page.goto('/profile/testuser');

    // Click on endorsement count
    const countElement = page.locator('[data-testid="endorsement-count"]').first();
    await countElement.click();

    // Endorsers modal should appear
    const modal = page.locator('[data-testid="endorsers-modal"]');
    await expect(modal).toBeVisible();

    // Should show list of endorsers
    await expect(modal.locator('text=Endorsed by')).toBeVisible();

    // Should show endorser names
    const endorsers = modal.locator('[data-testid="endorser-item"]');
    expect(await endorsers.count()).toBeGreaterThan(0);
  });

  test('should display endorser details in list', async ({ page }) => {
    await page.goto('/profile/testuser');

    const countElement = page.locator('[data-testid="endorsement-count"]').first();
    await countElement.click();

    const modal = page.locator('[data-testid="endorsers-modal"]');
    const firstEndorser = modal.locator('[data-testid="endorser-item"]').first();

    // Should show avatar
    await expect(firstEndorser.locator('[data-testid="endorser-avatar"]')).toBeVisible();

    // Should show name
    await expect(firstEndorser.locator('[data-testid="endorser-name"]')).toBeVisible();

    // Should show headline
    await expect(firstEndorser.locator('[data-testid="endorser-headline"]')).toBeVisible();

    // Should show endorsement date
    await expect(firstEndorser.locator('[data-testid="endorsement-date"]')).toBeVisible();
  });

  test('should close endorsers modal', async ({ page }) => {
    await page.goto('/profile/testuser');

    const countElement = page.locator('[data-testid="endorsement-count"]').first();
    await countElement.click();

    const modal = page.locator('[data-testid="endorsers-modal"]');
    await expect(modal).toBeVisible();

    // Click close button
    const closeButton = modal.locator('[aria-label="Close"]');
    await closeButton.click();

    // Modal should disappear
    await expect(modal).not.toBeVisible();
  });

  test('should use optimistic UI updates', async ({ page }) => {
    await page.goto('/profile/testuser');

    const endorseButton = page.locator('button:has-text("+ Endorse")').first();

    // Slow down network to test optimistic updates
    await page.route('**/api/v1/profiles/*/skills/*/endorse', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.continue();
    });

    await endorseButton.click();

    // Button should change immediately (before API response)
    await expect(endorseButton).toHaveText('Endorsed');
  });

  test('should handle endorsement errors gracefully', async ({ page }) => {
    await page.goto('/profile/testuser');

    // Mock API error
    await page.route('**/api/v1/profiles/*/skills/*/endorse', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    const endorseButton = page.locator('button:has-text("+ Endorse")').first();
    await endorseButton.click();

    // Error message should appear
    await expect(page.locator('text=Failed to endorse')).toBeVisible();

    // Button should revert to original state
    await expect(endorseButton).toHaveText('+ Endorse');
  });

  test('should trigger notification to profile owner', async ({ page }) => {
    await page.goto('/profile/testuser');

    const endorseButton = page.locator('button:has-text("+ Endorse")').first();
    await endorseButton.click();

    // Wait for endorsement to complete
    await page.waitForResponse((response) =>
      response.url().includes('/endorse') && response.status() === 200
    );

    // Login as testuser to check notification
    await page.goto('/logout');
    await page.goto('/login');
    await page.fill('input[name="email"]', 'testuser@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    // Check notifications
    await page.click('[aria-label*="notifications"]');

    // Should have endorsement notification
    await expect(page.locator('text=endorsed your skill')).toBeVisible();
  });

  test('should update endorsement count across page refreshes', async ({ page }) => {
    await page.goto('/profile/testuser');

    const endorseButton = page.locator('button:has-text("+ Endorse")').first();
    const skillId = await endorseButton.getAttribute('data-skill-id');
    const countElement = page.locator(`[data-skill-id="${skillId}"] [data-testid="endorsement-count"]`);
    const initialCount = parseInt((await countElement.textContent()) || '0');

    await endorseButton.click();
    await page.waitForResponse((response) => response.url().includes('/endorse'));

    // Refresh page
    await page.reload();

    // Count should persist
    const countAfterReload = parseInt((await countElement.textContent()) || '0');
    expect(countAfterReload).toBe(initialCount + 1);
  });

  test('should display endorsement count on skill badges', async ({ page }) => {
    await page.goto('/profile/testuser');

    const skillBadges = page.locator('[data-testid="skill-badge"]');
    const firstSkill = skillBadges.first();

    // Should show count
    const count = firstSkill.locator('[data-testid="endorsement-count"]');
    await expect(count).toBeVisible();

    // Count should be a number
    const countText = await count.textContent();
    expect(parseInt(countText || '0')).toBeGreaterThanOrEqual(0);
  });

  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/profile/testuser');

    const endorseButton = page.locator('button:has-text("+ Endorse")').first();
    await expect(endorseButton).toBeVisible();

    await endorseButton.click();
    await expect(endorseButton).toHaveText('Endorsed');
  });
});
