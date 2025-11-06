/**
 * Admin Tools E2E Tests
 *
 * End-to-end tests for admin dashboard, user management, and content moderation
 * Using Playwright
 */

import { test, expect, Page } from '@playwright/test';

const ADMIN_EMAIL = 'admin@neurmatic.com';
const ADMIN_PASSWORD = 'Admin123!@#';
const BASE_URL = process.env.VITE_APP_URL || 'http://localhost:5173';
const API_URL = process.env.VITE_API_URL || 'http://localhost:3000';

// Helper function to login as admin
async function loginAsAdmin(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[name="email"]', ADMIN_EMAIL);
  await page.fill('input[name="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE_URL}/admin`, { timeout: 10000 });
}

// Helper function to login as regular user
async function loginAsUser(page: Page, email: string, password: string) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE_URL}/`);
}

test.describe('Admin Dashboard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should display admin dashboard with all metrics', async ({ page }) => {
    // Verify we're on the admin dashboard
    await expect(page).toHaveURL(`${BASE_URL}/admin`);

    // Check page title
    await expect(page.locator('h1')).toContainText('Admin Dashboard');

    // Verify metrics cards are displayed
    await expect(page.locator('[data-testid="metrics-cards"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-dau"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-mau"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-mrr"]')).toBeVisible();

    // Verify real-time stats
    await expect(page.locator('[data-testid="realtime-users-online"]')).toBeVisible();
    await expect(page.locator('[data-testid="realtime-posts-per-hour"]')).toBeVisible();

    // Verify growth charts
    await expect(page.locator('[data-testid="user-growth-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="content-growth-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="revenue-growth-chart"]')).toBeVisible();

    // Verify activity feed
    await expect(page.locator('[data-testid="activity-feed"]')).toBeVisible();

    // Verify alerts panel
    await expect(page.locator('[data-testid="alerts-panel"]')).toBeVisible();

    // Verify system health
    await expect(page.locator('[data-testid="system-health"]')).toBeVisible();
  });

  test('should update dashboard with date range selection', async ({ page }) => {
    // Open date range picker
    await page.click('[data-testid="date-range-picker"]');

    // Select "Last 7 Days"
    await page.click('[data-testid="preset-7days"]');

    // Wait for data to reload
    await page.waitForResponse((response) =>
      response.url().includes('/api/admin/dashboard') && response.status() === 200
    );

    // Verify charts updated
    await expect(page.locator('[data-testid="user-growth-chart"]')).toBeVisible();
  });

  test('should export dashboard data as CSV', async ({ page }) => {
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('[data-testid="export-button"]'),
      page.click('[data-testid="export-csv"]'),
    ]);

    expect(download.suggestedFilename()).toContain('.csv');
  });

  test('should refresh dashboard cache', async ({ page }) => {
    // Click refresh button
    await page.click('[data-testid="refresh-dashboard"]');

    // Wait for refresh to complete
    await page.waitForResponse((response) =>
      response.url().includes('/api/admin/dashboard/refresh') && response.status() === 200
    );

    // Verify success message
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
  });

  test('should navigate between admin sections', async ({ page }) => {
    // Click on Users menu item
    await page.click('[data-testid="sidebar-users"]');
    await expect(page).toHaveURL(`${BASE_URL}/admin/users`);

    // Click on Content menu item
    await page.click('[data-testid="sidebar-content"]');
    await expect(page).toHaveURL(`${BASE_URL}/admin/content`);

    // Click on Analytics menu item
    await page.click('[data-testid="sidebar-analytics"]');
    await expect(page).toHaveURL(`${BASE_URL}/admin/analytics`);

    // Click on Settings menu item
    await page.click('[data-testid="sidebar-settings"]');
    await expect(page).toHaveURL(`${BASE_URL}/admin/settings`);

    // Return to Dashboard
    await page.click('[data-testid="sidebar-dashboard"]');
    await expect(page).toHaveURL(`${BASE_URL}/admin`);
  });
});

test.describe('User Management E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/admin/users`);
  });

  test('should display user management page with user list', async ({ page }) => {
    // Verify page title
    await expect(page.locator('h1')).toContainText('User Management');

    // Verify search bar exists
    await expect(page.locator('[data-testid="user-search"]')).toBeVisible();

    // Verify filters exist
    await expect(page.locator('[data-testid="filter-role"]')).toBeVisible();
    await expect(page.locator('[data-testid="filter-status"]')).toBeVisible();

    // Verify user table exists
    await expect(page.locator('[data-testid="user-table"]')).toBeVisible();

    // Verify pagination exists
    await expect(page.locator('[data-testid="pagination"]')).toBeVisible();
  });

  test('should search for users by email', async ({ page }) => {
    // Enter search term
    await page.fill('[data-testid="user-search"]', 'test@example.com');

    // Wait for search results
    await page.waitForResponse((response) =>
      response.url().includes('/api/admin/users') && response.status() === 200
    );

    // Verify filtered results
    const userRows = page.locator('[data-testid="user-row"]');
    await expect(userRows.first()).toBeVisible();
  });

  test('should filter users by role', async ({ page }) => {
    // Click role filter
    await page.click('[data-testid="filter-role"]');

    // Select ADMIN role
    await page.click('[data-testid="role-option-admin"]');

    // Wait for filtered results
    await page.waitForResponse((response) =>
      response.url().includes('/api/admin/users?role=ADMIN') && response.status() === 200
    );

    // Verify all displayed users are admins
    const roleBadges = page.locator('[data-testid="user-role-badge"]');
    const count = await roleBadges.count();
    for (let i = 0; i < count; i++) {
      await expect(roleBadges.nth(i)).toContainText('ADMIN');
    }
  });

  test('should suspend a user', async ({ page }) => {
    // Click on first user's actions menu
    await page.click('[data-testid="user-actions-0"]');

    // Click suspend option
    await page.click('[data-testid="action-suspend"]');

    // Fill suspend modal
    await expect(page.locator('[data-testid="suspend-modal"]')).toBeVisible();
    await page.fill('[data-testid="suspend-reason"]', 'Violation of community guidelines');
    await page.fill('[data-testid="suspend-duration"]', '7');

    // Confirm suspension
    await page.click('[data-testid="confirm-suspend"]');

    // Wait for success
    await page.waitForResponse((response) =>
      response.url().includes('/suspend') && response.status() === 200
    );

    // Verify success message
    await expect(page.locator('[data-testid="toast-success"]')).toContainText('User suspended');
  });

  test('should ban a user', async ({ page }) => {
    // Click on first user's actions menu
    await page.click('[data-testid="user-actions-0"]');

    // Click ban option
    await page.click('[data-testid="action-ban"]');

    // Fill ban modal
    await expect(page.locator('[data-testid="ban-modal"]')).toBeVisible();
    await page.fill('[data-testid="ban-reason"]', 'Severe policy violation');

    // Confirm ban
    await page.click('[data-testid="confirm-ban"]');

    // Wait for success
    await page.waitForResponse((response) =>
      response.url().includes('/ban') && response.status() === 200
    );

    // Verify success message
    await expect(page.locator('[data-testid="toast-success"]')).toContainText('User banned');
  });

  test('should change user role', async ({ page }) => {
    // Click on first user to open details
    await page.click('[data-testid="user-row-0"]');

    // Verify user detail panel/page
    await expect(page.locator('[data-testid="user-detail"]')).toBeVisible();

    // Click role dropdown
    await page.click('[data-testid="user-role-select"]');

    // Select MODERATOR role
    await page.click('[data-testid="role-option-moderator"]');

    // Wait for update
    await page.waitForResponse((response) =>
      response.url().includes('/role') && response.status() === 200
    );

    // Verify success message
    await expect(page.locator('[data-testid="toast-success"]')).toContainText('Role updated');
  });

  test('should manually verify user email', async ({ page }) => {
    // Click on first user's actions menu
    await page.click('[data-testid="user-actions-0"]');

    // Click verify email option
    await page.click('[data-testid="action-verify-email"]');

    // Wait for success
    await page.waitForResponse((response) =>
      response.url().includes('/verify') && response.status() === 200
    );

    // Verify success message
    await expect(page.locator('[data-testid="toast-success"]')).toContainText('Email verified');
  });
});

test.describe('Content Moderation E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/admin/content`);
  });

  test('should display content moderation queue', async ({ page }) => {
    // Verify page title
    await expect(page.locator('h1')).toContainText('Content Moderation');

    // Verify tabs
    await expect(page.locator('[data-testid="tab-all"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-pending"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-reported"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-flagged"]')).toBeVisible();

    // Verify content list
    await expect(page.locator('[data-testid="content-list"]')).toBeVisible();
  });

  test('should filter reported content', async ({ page }) => {
    // Click on Reported tab
    await page.click('[data-testid="tab-reported"]');

    // Wait for reported content
    await page.waitForResponse((response) =>
      response.url().includes('/api/admin/content/reported') && response.status() === 200
    );

    // Verify reported content items
    const contentItems = page.locator('[data-testid="content-item"]');
    await expect(contentItems.first()).toBeVisible();
  });

  test('should approve content', async ({ page }) => {
    // Click on first content item
    await page.click('[data-testid="content-item-0"]');

    // Verify review panel opens
    await expect(page.locator('[data-testid="review-panel"]')).toBeVisible();

    // Click approve button
    await page.click('[data-testid="approve-button"]');

    // Wait for success
    await page.waitForResponse((response) =>
      response.url().includes('/approve') && response.status() === 200
    );

    // Verify success message
    await expect(page.locator('[data-testid="toast-success"]')).toContainText('Content approved');
  });

  test('should reject content with reason', async ({ page }) => {
    // Click on first content item
    await page.click('[data-testid="content-item-0"]');

    // Click reject button
    await page.click('[data-testid="reject-button"]');

    // Fill reject reason
    await page.fill('[data-testid="reject-reason"]', 'Spam content');

    // Confirm rejection
    await page.click('[data-testid="confirm-reject"]');

    // Wait for success
    await page.waitForResponse((response) =>
      response.url().includes('/reject') && response.status() === 200
    );

    // Verify success message
    await expect(page.locator('[data-testid="toast-success"]')).toContainText('Content rejected');
  });

  test('should perform bulk approve action', async ({ page }) => {
    // Select multiple content items
    await page.click('[data-testid="checkbox-content-0"]');
    await page.click('[data-testid="checkbox-content-1"]');
    await page.click('[data-testid="checkbox-content-2"]');

    // Click bulk approve button
    await page.click('[data-testid="bulk-approve"]');

    // Confirm bulk action
    await page.click('[data-testid="confirm-bulk-action"]');

    // Wait for success
    await page.waitForResponse((response) =>
      response.url().includes('/api/admin/content/bulk') && response.status() === 200
    );

    // Verify success message
    await expect(page.locator('[data-testid="toast-success"]')).toContainText('3 items approved');
  });
});

test.describe('Platform Settings E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/admin/settings`);
  });

  test('should display platform settings page', async ({ page }) => {
    // Verify page title
    await expect(page.locator('h1')).toContainText('Platform Settings');

    // Verify tabs
    await expect(page.locator('[data-testid="tab-general"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-features"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-integrations"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-security"]')).toBeVisible();
  });

  test('should toggle feature flag', async ({ page }) => {
    // Click Features tab
    await page.click('[data-testid="tab-features"]');

    // Toggle a feature flag
    const forumToggle = page.locator('[data-testid="feature-forum-enabled"]');
    const initialState = await forumToggle.isChecked();

    await forumToggle.click();

    // Save settings
    await page.click('[data-testid="save-settings"]');

    // Wait for success
    await page.waitForResponse((response) =>
      response.url().includes('/api/admin/settings') && response.status() === 200
    );

    // Verify success message
    await expect(page.locator('[data-testid="toast-success"]')).toContainText('Settings saved');

    // Verify toggle state changed
    await expect(forumToggle).toHaveAttribute('aria-checked', (!initialState).toString());
  });

  test('should update general settings', async ({ page }) => {
    // Update platform name
    await page.fill('[data-testid="platform-name"]', 'Neurmatic Updated');

    // Update tagline
    await page.fill('[data-testid="platform-tagline"]', 'The best LLM community');

    // Save settings
    await page.click('[data-testid="save-settings"]');

    // Wait for success
    await page.waitForResponse((response) =>
      response.url().includes('/api/admin/settings') && response.status() === 200
    );

    // Verify success message
    await expect(page.locator('[data-testid="toast-success"]')).toContainText('Settings saved');
  });
});

test.describe('Analytics Dashboard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/admin/analytics`);
  });

  test('should display analytics dashboard', async ({ page }) => {
    // Verify page title
    await expect(page.locator('h1')).toContainText('Analytics');

    // Verify metric cards
    await expect(page.locator('[data-testid="analytics-metrics"]')).toBeVisible();

    // Verify charts
    await expect(page.locator('[data-testid="user-growth-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="engagement-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();

    // Verify top contributors table
    await expect(page.locator('[data-testid="top-contributors"]')).toBeVisible();

    // Verify traffic sources chart
    await expect(page.locator('[data-testid="traffic-sources"]')).toBeVisible();
  });

  test('should generate custom report', async ({ page }) => {
    // Click custom report builder
    await page.click('[data-testid="custom-report-button"]');

    // Select metrics
    await page.click('[data-testid="metric-dau"]');
    await page.click('[data-testid="metric-mau"]');
    await page.click('[data-testid="metric-revenue"]');

    // Select date range
    await page.fill('[data-testid="report-start-date"]', '2025-01-01');
    await page.fill('[data-testid="report-end-date"]', '2025-01-31');

    // Generate report
    await page.click('[data-testid="generate-report"]');

    // Wait for report generation
    await page.waitForResponse((response) =>
      response.url().includes('/api/admin/analytics/custom') && response.status() === 200
    );

    // Verify report displayed
    await expect(page.locator('[data-testid="custom-report-view"]')).toBeVisible();
  });

  test('should export analytics as CSV', async ({ page }) => {
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('[data-testid="export-analytics"]'),
      page.click('[data-testid="export-format-csv"]'),
    ]);

    expect(download.suggestedFilename()).toContain('.csv');
  });
});

test.describe('Security & Authorization E2E Tests', () => {
  test('should redirect non-admin users from admin routes', async ({ page }) => {
    // Login as regular user
    await loginAsUser(page, 'user@example.com', 'User123!');

    // Try to access admin dashboard
    await page.goto(`${BASE_URL}/admin`);

    // Should be redirected to home or access denied
    await page.waitForURL((url) =>
      url.pathname === '/' || url.pathname.includes('/access-denied')
    );

    // Verify access denied message or redirect
    expect(page.url()).not.toContain('/admin');
  });

  test('should require authentication for admin routes', async ({ page }) => {
    // Try to access admin dashboard without auth
    await page.goto(`${BASE_URL}/admin`);

    // Should be redirected to login
    await page.waitForURL(`${BASE_URL}/login`);
  });

  test('should display audit log for admin actions', async ({ page }) => {
    await loginAsAdmin(page);

    // Navigate to user management
    await page.goto(`${BASE_URL}/admin/users`);

    // Perform an action (e.g., suspend user)
    await page.click('[data-testid="user-actions-0"]');
    await page.click('[data-testid="action-suspend"]');
    await page.fill('[data-testid="suspend-reason"]', 'Security audit test');
    await page.fill('[data-testid="suspend-duration"]', '1');
    await page.click('[data-testid="confirm-suspend"]');

    // Navigate to audit log (assuming it exists)
    await page.goto(`${BASE_URL}/admin/audit-log`);

    // Verify action is logged
    await expect(page.locator('[data-testid="audit-log"]')).toContainText('SUSPEND_USER');
    await expect(page.locator('[data-testid="audit-log"]')).toContainText('Security audit test');
  });
});

test.describe('Performance Tests', () => {
  test('dashboard should load within performance targets', async ({ page }) => {
    await loginAsAdmin(page);

    const startTime = Date.now();
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForSelector('[data-testid="metrics-cards"]');
    const loadTime = Date.now() - startTime;

    // Dashboard should load < 1s (1000ms)
    expect(loadTime).toBeLessThan(1000);
  });

  test('user list should load within performance targets', async ({ page }) => {
    await loginAsAdmin(page);

    const startTime = Date.now();
    await page.goto(`${BASE_URL}/admin/users`);
    await page.waitForSelector('[data-testid="user-table"]');
    const loadTime = Date.now() - startTime;

    // User list should load < 2s (2000ms)
    expect(loadTime).toBeLessThan(2000);
  });

  test('analytics should load within performance targets', async ({ page }) => {
    await loginAsAdmin(page);

    const startTime = Date.now();
    await page.goto(`${BASE_URL}/admin/analytics`);
    await page.waitForSelector('[data-testid="analytics-metrics"]');
    const loadTime = Date.now() - startTime;

    // Analytics should load < 3s (3000ms)
    expect(loadTime).toBeLessThan(3000);
  });
});
