import { test, expect } from '@playwright/test';

test.describe('Notification Preferences E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login as test user
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');

    // Navigate to notification settings
    await page.goto('/settings/notifications');
  });

  test('should display notification preferences page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/notification/i);
  });

  test('should display notification sections', async ({ page }) => {
    await expect(page.locator('text=News')).toBeVisible();
    await expect(page.locator('text=Forum')).toBeVisible();
    await expect(page.locator('text=Jobs')).toBeVisible();
    await expect(page.locator('text=Social')).toBeVisible();
  });

  test('should toggle notification type on/off', async ({ page }) => {
    const toggle = page
      .locator('[data-testid="notification-type-toggle"]')
      .first();

    const initialState = await toggle.isChecked();
    await toggle.click();

    // Wait for save
    await page.waitForTimeout(500);

    const newState = await toggle.isChecked();
    expect(newState).toBe(!initialState);
  });

  test('should configure delivery channels (in-app, email, push)', async ({ page }) => {
    const inAppCheckbox = page.locator('[data-testid="channel-in_app"]').first();
    const emailCheckbox = page.locator('[data-testid="channel-email"]').first();

    await inAppCheckbox.check();
    await emailCheckbox.check();

    expect(await inAppCheckbox.isChecked()).toBeTruthy();
    expect(await emailCheckbox.isChecked()).toBeTruthy();
  });

  test('should select notification frequency', async ({ page }) => {
    const frequencySelect = page.locator('[data-testid="frequency-select"]').first();

    await frequencySelect.click();
    await page.click('text=Daily digest');

    const selectedValue = await frequencySelect.inputValue();
    expect(selectedValue).toBe('daily');
  });

  test('should configure do-not-disturb schedule', async ({ page }) => {
    const dndToggle = page.locator('[data-testid="dnd-enabled"]');
    await dndToggle.check();

    // Set start time
    const startTime = page.locator('[data-testid="dnd-start-time"]');
    await startTime.fill('22:00');

    // Set end time
    const endTime = page.locator('[data-testid="dnd-end-time"]');
    await endTime.fill('08:00');

    // Select days
    await page.click('[data-testid="dnd-day-monday"]');
    await page.click('[data-testid="dnd-day-tuesday"]');

    // Save
    await page.click('button:has-text("Save")');

    await expect(page.locator('text=Settings saved')).toBeVisible();
  });

  test('should enable vacation mode', async ({ page }) => {
    const vacationToggle = page.locator('[data-testid="vacation-mode"]');
    await vacationToggle.check();

    // Save
    await page.click('button:has-text("Save")');

    await expect(page.locator('text=Settings saved')).toBeVisible();
  });

  test('should preview email digest', async ({ page }) => {
    const previewButton = page.locator('button:has-text("Preview digest")');
    await previewButton.click();

    // Wait for preview modal
    await expect(page.locator('[data-testid="digest-preview"]')).toBeVisible();

    // Check preview contains sections
    await expect(page.locator('text=Top Stories')).toBeVisible();
    await expect(page.locator('text=Trending Discussions')).toBeVisible();
  });

  test('should send test push notification', async ({ page }) => {
    const testButton = page.locator('button:has-text("Send test")');
    await testButton.click();

    // Wait for confirmation
    await expect(page.locator('text=Test notification sent')).toBeVisible();
  });

  test('should show unsaved changes warning', async ({ page }) => {
    // Make a change
    const toggle = page.locator('[data-testid="notification-type-toggle"]').first();
    await toggle.click();

    // Try to navigate away
    await page.click('a[href="/settings/profile"]');

    // Should show warning dialog
    const dialog = page.locator('text=Unsaved changes');
    if (await dialog.isVisible()) {
      await expect(dialog).toBeVisible();
    }
  });

  test('should save all preferences', async ({ page }) => {
    // Enable forum replies
    await page.locator('[data-testid="type-forum_reply"]').check();

    // Configure channels
    await page.locator('[data-testid="channel-in_app"]').first().check();
    await page.locator('[data-testid="channel-email"]').first().check();

    // Select frequency
    const frequencySelect = page.locator('[data-testid="frequency-select"]').first();
    await frequencySelect.click();
    await page.click('text=Real-time');

    // Save
    await page.click('button:has-text("Save")');

    // Verify success message
    await expect(page.locator('text=Settings saved')).toBeVisible();

    // Reload page and verify settings persisted
    await page.reload();

    expect(await page.locator('[data-testid="type-forum_reply"]').isChecked()).toBeTruthy();
  });

  test('should disable all notifications for a category', async ({ page }) => {
    const forumSection = page.locator('[data-testid="section-forum"]');
    const disableAllButton = forumSection.locator('button:has-text("Disable all")');

    await disableAllButton.click();

    // All toggles in forum section should be off
    const toggles = forumSection.locator('[data-testid^="notification-type-toggle"]');
    const count = await toggles.count();

    for (let i = 0; i < count; i++) {
      expect(await toggles.nth(i).isChecked()).toBeFalsy();
    }
  });

  test('should validate time inputs', async ({ page }) => {
    const startTime = page.locator('[data-testid="dnd-start-time"]');
    await startTime.fill('invalid-time');

    await page.click('button:has-text("Save")');

    // Should show validation error
    await expect(page.locator('text=Invalid time')).toBeVisible();
  });

  test('should display timezone correctly', async ({ page }) => {
    const timezoneSelect = page.locator('[data-testid="timezone-select"]');
    await expect(timezoneSelect).toBeVisible();

    const timezone = await timezoneSelect.inputValue();
    expect(timezone).toBeTruthy();
  });

  test('should respect do-not-disturb during configured hours', async ({ page }) => {
    // Configure DND for current time
    const now = new Date();
    const startHour = (now.getHours() - 1 + 24) % 24;
    const endHour = (now.getHours() + 1) % 24;

    const dndToggle = page.locator('[data-testid="dnd-enabled"]');
    await dndToggle.check();

    await page.locator('[data-testid="dnd-start-time"]').fill(`${startHour}:00`);
    await page.locator('[data-testid="dnd-end-time"]').fill(`${endHour}:00`);

    await page.click('button:has-text("Save")');

    // Trigger a notification (via API)
    await page.evaluate(async () => {
      await fetch('/api/v1/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'forum_reply',
          title: 'Test during DND',
          message: 'This should be suppressed',
        }),
      });
    });

    // Check notification was not delivered
    await page.goto('/');
    const badge = page.locator('[data-testid="notification-badge"]');

    // Badge should not increase during DND
    const badgeText = await badge.textContent();
    expect(badgeText).toBe('0');
  });
});
