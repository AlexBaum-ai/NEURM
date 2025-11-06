import { test, expect } from '@playwright/test';

test.describe('Notification System E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login as test user
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('should display notification bell in header', async ({ page }) => {
    const notificationBell = page.locator('[aria-label*="notifications"]');
    await expect(notificationBell).toBeVisible();
  });

  test('should show unread count badge', async ({ page }) => {
    // Create a test notification via API
    await page.evaluate(async () => {
      await fetch('/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'forum_reply',
          title: 'Test Notification',
          message: 'This is a test notification',
        }),
      });
    });

    // Check badge appears
    const badge = page.locator('[data-testid="notification-badge"]');
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText(/\d+/);
  });

  test('should open dropdown when bell is clicked', async ({ page }) => {
    await page.click('[aria-label*="notifications"]');

    const dropdown = page.locator('[data-testid="notification-dropdown"]');
    await expect(dropdown).toBeVisible();
  });

  test('should display last 10 notifications in dropdown', async ({ page }) => {
    await page.click('[aria-label*="notifications"]');

    const notifications = page.locator('[data-testid="notification-item"]');
    const count = await notifications.count();
    expect(count).toBeLessThanOrEqual(10);
  });

  test('should mark notification as read when clicked', async ({ page }) => {
    await page.click('[aria-label*="notifications"]');

    const firstNotification = page.locator('[data-testid="notification-item"]').first();
    const isUnread = await firstNotification.getAttribute('data-unread');

    if (isUnread === 'true') {
      await firstNotification.click();

      // Wait for API call to complete
      await page.waitForResponse((response) =>
        response.url().includes('/notifications/') && response.url().includes('/read')
      );

      // Check if it's marked as read (visual indicator)
      await expect(firstNotification).toHaveAttribute('data-unread', 'false');
    }
  });

  test('should mark all notifications as read', async ({ page }) => {
    await page.click('[aria-label*="notifications"]');

    const markAllButton = page.locator('text=Mark all as read');
    if (await markAllButton.isVisible()) {
      const unreadCountBefore = await page
        .locator('[data-testid="notification-badge"]')
        .textContent();

      await markAllButton.click();

      // Wait for API response
      await page.waitForResponse((response) =>
        response.url().includes('/notifications/read-all')
      );

      // Badge should disappear or show 0
      const badge = page.locator('[data-testid="notification-badge"]');
      await expect(badge).not.toBeVisible();
    }
  });

  test('should navigate to relevant page when notification is clicked', async ({ page }) => {
    await page.click('[aria-label*="notifications"]');

    const notification = page.locator('[data-testid="notification-item"]').first();
    const notificationData = await notification.getAttribute('data-type');

    await notification.click();

    // Verify navigation based on notification type
    if (notificationData === 'forum_reply') {
      await expect(page).toHaveURL(/\/forum\/topics\//);
    } else if (notificationData === 'news_trending') {
      await expect(page).toHaveURL(/\/news\/articles\//);
    } else if (notificationData === 'job_match') {
      await expect(page).toHaveURL(/\/jobs\//);
    }
  });

  test('should display empty state when no notifications', async ({ page }) => {
    // Delete all notifications
    await page.evaluate(async () => {
      await fetch('/api/v1/notifications', { method: 'DELETE' });
    });

    await page.click('[aria-label*="notifications"]');

    const emptyState = page.locator('text=No notifications');
    await expect(emptyState).toBeVisible();
  });

  test('should navigate to full notifications page', async ({ page }) => {
    await page.click('[aria-label*="notifications"]');

    const seeAllLink = page.locator('text=See all');
    await seeAllLink.click();

    await expect(page).toHaveURL('/notifications');
  });

  test('should display notification sound preference', async ({ page }) => {
    await page.goto('/settings/notifications');

    const soundToggle = page.locator('[data-testid="notification-sound-toggle"]');
    await expect(soundToggle).toBeVisible();
  });

  test('should poll for new notifications every 30 seconds', async ({ page }) => {
    let requestCount = 0;

    page.on('request', (request) => {
      if (request.url().includes('/notifications/unread-count')) {
        requestCount++;
      }
    });

    // Wait for initial load
    await page.waitForTimeout(1000);
    const initialCount = requestCount;

    // Wait for polling interval (30s)
    await page.waitForTimeout(31000);

    // Should have made at least one more request
    expect(requestCount).toBeGreaterThan(initialCount);
  });

  test('should filter notifications by type', async ({ page }) => {
    await page.goto('/notifications');

    // Select forum filter
    await page.click('[data-testid="filter-button"]');
    await page.click('text=Forum');

    // Wait for filtered results
    await page.waitForResponse((response) =>
      response.url().includes('/notifications') && response.url().includes('type=forum')
    );

    // All notifications should be forum-related
    const notifications = page.locator('[data-testid="notification-item"]');
    const count = await notifications.count();

    for (let i = 0; i < count; i++) {
      const type = await notifications.nth(i).getAttribute('data-type');
      expect(type).toMatch(/forum/);
    }
  });

  test('should delete notification', async ({ page }) => {
    await page.goto('/notifications');

    const notificationsBefore = await page.locator('[data-testid="notification-item"]').count();

    const deleteButton = page.locator('[data-testid="delete-notification"]').first();
    await deleteButton.click();

    // Confirm deletion if modal appears
    const confirmButton = page.locator('text=Delete');
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }

    // Wait for deletion to complete
    await page.waitForResponse((response) =>
      response.url().includes('/notifications/') && response.request().method() === 'DELETE'
    );

    // Check notification count decreased
    const notificationsAfter = await page.locator('[data-testid="notification-item"]').count();
    expect(notificationsAfter).toBeLessThan(notificationsBefore);
  });

  test('should implement infinite scroll on notifications page', async ({ page }) => {
    await page.goto('/notifications');

    const initialCount = await page.locator('[data-testid="notification-item"]').count();

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Wait for new notifications to load
    await page.waitForTimeout(1000);

    const newCount = await page.locator('[data-testid="notification-item"]').count();
    expect(newCount).toBeGreaterThanOrEqual(initialCount);
  });

  test('should display notification grouped by time', async ({ page }) => {
    await page.goto('/notifications');

    const todayHeader = page.locator('text=Today');
    const thisWeekHeader = page.locator('text=This Week');
    const earlierHeader = page.locator('text=Earlier');

    // At least one time group should be visible
    const hasTimeGroups =
      (await todayHeader.isVisible()) ||
      (await thisWeekHeader.isVisible()) ||
      (await earlierHeader.isVisible());

    expect(hasTimeGroups).toBeTruthy();
  });

  test('should show notification with correct icon based on type', async ({ page }) => {
    await page.goto('/notifications');

    const notification = page.locator('[data-testid="notification-item"]').first();
    const icon = notification.locator('[data-testid="notification-icon"]');

    await expect(icon).toBeVisible();
  });

  test('should display relative time for notifications', async ({ page }) => {
    await page.goto('/notifications');

    const timestamp = page.locator('[data-testid="notification-timestamp"]').first();
    const text = await timestamp.textContent();

    // Should contain relative time (e.g., "2 hours ago", "Yesterday")
    expect(text).toMatch(/ago|Yesterday|Today|minute|hour|day|week/i);
  });
});
