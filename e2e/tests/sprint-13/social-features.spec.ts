import { test, expect } from '@playwright/test';

test.describe('Social Features E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login as test user
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test.describe('Activity Feed', () => {
    test('should display activity tab on user profile', async ({ page }) => {
      await page.goto('/profile/testuser');

      const activityTab = page.locator('text=Activity');
      await expect(activityTab).toBeVisible();
    });

    test('should show user activities grouped by time', async ({ page }) => {
      await page.goto('/profile/testuser/activity');

      // Check for time groupings
      const todayHeader = page.locator('text=Today');
      const thisWeekHeader = page.locator('text=This Week');

      const hasGroupings =
        (await todayHeader.isVisible()) || (await thisWeekHeader.isVisible());
      expect(hasGroupings).toBeTruthy();
    });

    test('should display activity items with icons', async ({ page }) => {
      await page.goto('/profile/testuser/activity');

      const activityItems = page.locator('[data-testid="activity-item"]');
      const firstActivity = activityItems.first();

      // Should have icon
      await expect(firstActivity.locator('[data-testid="activity-icon"]')).toBeVisible();

      // Should have description
      await expect(firstActivity.locator('[data-testid="activity-description"]')).toBeVisible();

      // Should have timestamp
      await expect(firstActivity.locator('[data-testid="activity-timestamp"]')).toBeVisible();
    });

    test('should filter activities by type', async ({ page }) => {
      await page.goto('/profile/testuser/activity');

      // Click filter dropdown
      await page.click('[data-testid="activity-filter"]');

      // Select "Posted Article"
      await page.click('text=Posted Article');

      // Wait for filtered results
      await page.waitForResponse((response) =>
        response.url().includes('/activity') && response.url().includes('type=posted_article')
      );

      // All activities should be "posted_article" type
      const activities = page.locator('[data-testid="activity-item"]');
      const count = await activities.count();

      for (let i = 0; i < count; i++) {
        const type = await activities.nth(i).getAttribute('data-type');
        expect(type).toBe('posted_article');
      }
    });

    test('should implement infinite scroll', async ({ page }) => {
      await page.goto('/profile/testuser/activity');

      const initialCount = await page.locator('[data-testid="activity-item"]').count();

      // Scroll to bottom
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

      // Wait for new activities to load
      await page.waitForTimeout(1000);

      const newCount = await page.locator('[data-testid="activity-item"]').count();
      expect(newCount).toBeGreaterThanOrEqual(initialCount);
    });

    test('should link to activity target', async ({ page }) => {
      await page.goto('/profile/testuser/activity');

      const activityItem = page.locator('[data-testid="activity-item"]').first();
      const activityType = await activityItem.getAttribute('data-type');

      await activityItem.click();

      // Should navigate to relevant page based on activity type
      if (activityType === 'posted_article') {
        await expect(page).toHaveURL(/\/news\/articles\//);
      } else if (activityType === 'created_topic') {
        await expect(page).toHaveURL(/\/forum\/topics\//);
      }
    });

    test('should show empty state if no activity', async ({ page }) => {
      // Create new user with no activity
      await page.goto('/profile/newuser/activity');

      const emptyState = page.locator('text=No activity yet');
      await expect(emptyState).toBeVisible();
    });
  });

  test.describe('Following Feed', () => {
    test('should display following feed page', async ({ page }) => {
      await page.goto('/following');

      await expect(page.locator('h1')).toContainText(/following/i);
    });

    test('should show activities from followed users', async ({ page }) => {
      await page.goto('/following');

      const activities = page.locator('[data-testid="activity-item"]');
      expect(await activities.count()).toBeGreaterThan(0);

      // Each activity should show the user who performed it
      const firstActivity = activities.first();
      await expect(firstActivity.locator('[data-testid="activity-user"]')).toBeVisible();
    });

    test('should show empty state if not following anyone', async ({ page }) => {
      // Unfollow all users first
      await page.evaluate(async () => {
        await fetch('/api/v1/follows', { method: 'DELETE' });
      });

      await page.goto('/following');

      const emptyState = page.locator('text=Not following anyone');
      await expect(emptyState).toBeVisible();
    });

    test('should aggregate activities by user', async ({ page }) => {
      await page.goto('/following');

      const userAvatars = page.locator('[data-testid="activity-user-avatar"]');
      expect(await userAvatars.count()).toBeGreaterThan(0);
    });

    test('should filter following feed by activity type', async ({ page }) => {
      await page.goto('/following');

      await page.click('[data-testid="activity-filter"]');
      await page.click('text=Forum');

      await page.waitForResponse((response) =>
        response.url().includes('/following/feed')
      );

      // All activities should be forum-related
      const activities = page.locator('[data-testid="activity-item"]');
      const count = await activities.count();

      for (let i = 0; i < count; i++) {
        const type = await activities.nth(i).getAttribute('data-type');
        expect(type).toMatch(/forum|topic|reply/i);
      }
    });
  });

  test.describe('Profile Views', () => {
    test('should track profile view', async ({ page }) => {
      // View another user's profile
      await page.goto('/profile/testuser');

      // Wait for view tracking API call
      await page.waitForResponse((response) =>
        response.url().includes('/view') && response.request().method() === 'POST'
      );
    });

    test('should display view count on profile', async ({ page }) => {
      await page.goto('/profile/testuser');

      const viewCount = page.locator('[data-testid="profile-view-count"]');
      await expect(viewCount).toBeVisible();

      const count = await viewCount.textContent();
      expect(parseInt(count || '0')).toBeGreaterThanOrEqual(0);
    });

    test('should show profile viewers to premium users', async ({ page }) => {
      // Upgrade to premium (mock)
      await page.evaluate(() => {
        localStorage.setItem('user_role', 'premium');
      });

      await page.goto('/profile/views');

      // Should show viewers list
      await expect(page.locator('h1')).toContainText(/who viewed/i);

      const viewers = page.locator('[data-testid="viewer-item"]');
      expect(await viewers.count()).toBeGreaterThanOrEqual(0);
    });

    test('should display viewer details', async ({ page }) => {
      await page.evaluate(() => {
        localStorage.setItem('user_role', 'premium');
      });

      await page.goto('/profile/views');

      const firstViewer = page.locator('[data-testid="viewer-item"]').first();

      if (await firstViewer.isVisible()) {
        // Should show avatar
        await expect(firstViewer.locator('[data-testid="viewer-avatar"]')).toBeVisible();

        // Should show name
        await expect(firstViewer.locator('[data-testid="viewer-name"]')).toBeVisible();

        // Should show viewed date
        await expect(firstViewer.locator('[data-testid="viewed-date"]')).toBeVisible();
      }
    });

    test('should show company badge for recruiters', async ({ page }) => {
      await page.evaluate(() => {
        localStorage.setItem('user_role', 'premium');
      });

      await page.goto('/profile/views');

      const recruiterViewer = page.locator('[data-testid="viewer-item"][data-is-recruiter="true"]').first();

      if (await recruiterViewer.isVisible()) {
        const companyBadge = recruiterViewer.locator('[data-testid="company-badge"]');
        await expect(companyBadge).toBeVisible();
      }
    });

    test('should hide anonymous viewers', async ({ page }) => {
      await page.evaluate(() => {
        localStorage.setItem('user_role', 'premium');
      });

      await page.goto('/profile/views');

      const anonymousViewer = page.locator('[data-testid="viewer-item"][data-anonymous="true"]').first();

      if (await anonymousViewer.isVisible()) {
        // Should show "Anonymous" text
        await expect(anonymousViewer).toContainText(/anonymous/i);

        // Should not show real name
        const viewerName = await anonymousViewer.locator('[data-testid="viewer-name"]').textContent();
        expect(viewerName).toMatch(/anonymous|someone/i);
      }
    });

    test('should display views chart', async ({ page }) => {
      await page.evaluate(() => {
        localStorage.setItem('user_role', 'premium');
      });

      await page.goto('/profile/views');

      const chart = page.locator('[data-testid="views-chart"]');
      await expect(chart).toBeVisible();
    });

    test('should show premium upsell for non-premium users', async ({ page }) => {
      await page.evaluate(() => {
        localStorage.setItem('user_role', 'user');
      });

      await page.goto('/profile/views');

      // Should show upsell component
      const upsell = page.locator('[data-testid="premium-upsell"]');
      await expect(upsell).toBeVisible();

      // Should have upgrade button
      await expect(upsell.locator('button:has-text("Upgrade")')).toBeVisible();
    });

    test('should show stats cards', async ({ page }) => {
      await page.evaluate(() => {
        localStorage.setItem('user_role', 'premium');
      });

      await page.goto('/profile/views');

      // Total views card
      const totalViews = page.locator('[data-testid="stat-total-views"]');
      await expect(totalViews).toBeVisible();

      // Unique viewers card
      const uniqueViewers = page.locator('[data-testid="stat-unique-viewers"]');
      await expect(uniqueViewers).toBeVisible();
    });

    test('should implement pagination for viewers', async ({ page }) => {
      await page.evaluate(() => {
        localStorage.setItem('user_role', 'premium');
      });

      await page.goto('/profile/views');

      const pagination = page.locator('[data-testid="pagination"]');

      if (await pagination.isVisible()) {
        const nextButton = pagination.locator('button:has-text("Next")');
        await nextButton.click();

        // Wait for page 2 to load
        await page.waitForResponse((response) =>
          response.url().includes('/views') && response.url().includes('page=2')
        );
      }
    });

    test('should not track view on own profile', async ({ page }) => {
      await page.goto('/profile/me');

      // Should not make view tracking API call
      let viewTrackingCalled = false;

      page.on('request', (request) => {
        if (request.url().includes('/view') && request.method() === 'POST') {
          viewTrackingCalled = true;
        }
      });

      await page.waitForTimeout(2000);

      expect(viewTrackingCalled).toBeFalsy();
    });

    test('should deduplicate views within 24 hours', async ({ page }) => {
      // View profile twice
      await page.goto('/profile/testuser');
      await page.waitForTimeout(1000);

      const viewCountElement = page.locator('[data-testid="profile-view-count"]');
      const firstCount = parseInt((await viewCountElement.textContent()) || '0');

      // Refresh and view again
      await page.reload();
      await page.waitForTimeout(1000);

      const secondCount = parseInt((await viewCountElement.textContent()) || '0');

      // Count should not increase (same viewer within 24h)
      expect(secondCount).toBe(firstCount);
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile - notifications', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await page.click('[aria-label*="notifications"]');

      const dropdown = page.locator('[data-testid="notification-dropdown"]');
      await expect(dropdown).toBeVisible();
    });

    test('should work on mobile - activity feed', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/profile/testuser/activity');

      const activities = page.locator('[data-testid="activity-item"]');
      await expect(activities.first()).toBeVisible();
    });

    test('should work on mobile - endorsements', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/profile/testuser');

      const endorseButton = page.locator('button:has-text("+ Endorse")').first();
      await expect(endorseButton).toBeVisible();
    });

    test('should work on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      await page.goto('/profile/views');

      const viewersGrid = page.locator('[data-testid="viewers-list"]');
      await expect(viewersGrid).toBeVisible();
    });
  });
});
