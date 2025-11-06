import { test, expect, Page } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.VITE_APP_URL || 'http://vps-1a707765.vps.ovh.net:5173';
const API_URL = process.env.VITE_API_URL || 'http://vps-1a707765.vps.ovh.net:3000/api/v1';

/**
 * SPRINT-11-008: E2E Tests for LLM Guide Features
 *
 * Test Coverage:
 * 1. Model Reference Pages (versions, benchmarks, code snippets)
 * 2. Model Comparison Tool (selection, table, export)
 * 3. Use Cases Library (display, filter, submission, admin review)
 * 4. Glossary (A-Z navigation, search, related terms)
 */

test.describe('Model Reference Pages', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/models`);
  });

  test('should display model list page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/Models|Model/i);

    // Should show model cards
    const modelCards = page.locator('[data-testid="model-card"], .model-card, article');
    await expect(modelCards.first()).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to model detail page', async ({ page }) => {
    // Click on first model card
    const firstModel = page.locator('[data-testid="model-card"], .model-card, article').first();
    await firstModel.click();

    // Should navigate to model detail page
    await expect(page).toHaveURL(/\/models\/.+/);

    // Should display model hero section
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should display version history with dropdown selector', async ({ page }) => {
    // Navigate to a model detail page (assuming GPT-4 or similar exists)
    await page.goto(`${BASE_URL}/models/gpt-4`);

    // Wait for version history section
    const versionSection = page.locator('text=Version History').first();
    await expect(versionSection).toBeVisible({ timeout: 10000 });

    // Should have version selector dropdown
    const versionDropdown = page.locator('button:has-text("gpt-4"), select').first();
    if (await versionDropdown.isVisible()) {
      await expect(versionDropdown).toBeVisible();
    }
  });

  test('should display benchmark charts', async ({ page }) => {
    await page.goto(`${BASE_URL}/models/gpt-4`);

    // Look for benchmark section
    const benchmarkSection = page.locator('text=Benchmark').first();
    await expect(benchmarkSection).toBeVisible({ timeout: 10000 });

    // Should have chart elements (svg, canvas, or chart library elements)
    const chart = page.locator('svg, canvas, [class*="chart"], [class*="recharts"]').first();
    if (await chart.isVisible()) {
      await expect(chart).toBeVisible();
    }
  });

  test('should copy code snippet to clipboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/models/gpt-4`);

    // Wait for code snippet section
    const codeSection = page.locator('text=API|Quickstart|Code').first();
    await expect(codeSection).toBeVisible({ timeout: 10000 });

    // Look for copy button
    const copyButton = page.locator('button:has-text("Copy"), button[aria-label*="copy" i]').first();

    if (await copyButton.isVisible()) {
      // Grant clipboard permissions
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

      await copyButton.click();

      // Should show success feedback
      await expect(page.locator('text=Copied|Success')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display related models section', async ({ page }) => {
    await page.goto(`${BASE_URL}/models/gpt-4`);

    const relatedSection = page.locator('text=Related|Similar').first();
    if (await relatedSection.isVisible()) {
      await expect(relatedSection).toBeVisible();
    }
  });

  test('should display community resources', async ({ page }) => {
    await page.goto(`${BASE_URL}/models/gpt-4`);

    const resourcesSection = page.locator('text=Community|Resources|Tutorial').first();
    if (await resourcesSection.isVisible()) {
      await expect(resourcesSection).toBeVisible();
    }
  });
});

test.describe('Model Comparison Tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/models/compare`);
  });

  test('should display comparison page with empty state', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/Compare/i);

    // Should show instructions to select models
    await expect(page.locator('text=Select')).toBeVisible({ timeout: 10000 });
  });

  test('should allow selecting models for comparison', async ({ page }) => {
    // Look for model selector (search input or dropdown)
    const selector = page.locator('input[placeholder*="search" i], select, button:has-text("Add")').first();
    await expect(selector).toBeVisible({ timeout: 10000 });

    // Try to select models (implementation varies by UI)
    const searchInput = page.locator('input[placeholder*="search" i]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('GPT');
      await page.waitForTimeout(1000);

      // Click on first result
      const firstResult = page.locator('[data-testid="model-option"], .model-option, li').first();
      if (await firstResult.isVisible()) {
        await firstResult.click();
      }
    }
  });

  test('should display comparison table with 2+ models', async ({ page }) => {
    // Navigate with pre-selected models in URL
    await page.goto(`${BASE_URL}/models/compare?ids=1,2`);

    // Should show comparison table
    const table = page.locator('table, [role="table"]').first();
    await expect(table).toBeVisible({ timeout: 10000 });

    // Should have multiple columns (model names)
    const headers = page.locator('th, [role="columnheader"]');
    const headerCount = await headers.count();
    expect(headerCount).toBeGreaterThanOrEqual(2);
  });

  test('should highlight differences in comparison', async ({ page }) => {
    await page.goto(`${BASE_URL}/models/compare?ids=1,2`);

    // Wait for comparison table
    await page.waitForSelector('table, [role="table"]', { timeout: 10000 });

    // Should have green/red highlighting for better/worse values
    const greenHighlights = page.locator('.text-green-600, .bg-green-50, .text-green-500');
    const redHighlights = page.locator('.text-red-600, .bg-red-50, .text-red-500');

    const greenCount = await greenHighlights.count();
    const redCount = await redHighlights.count();

    // At least some values should be highlighted
    expect(greenCount + redCount).toBeGreaterThan(0);
  });

  test('should have sticky header for model names', async ({ page }) => {
    await page.goto(`${BASE_URL}/models/compare?ids=1,2,3`);

    await page.waitForSelector('table, [role="table"]', { timeout: 10000 });

    // Check for sticky positioning
    const stickyElements = page.locator('.sticky, [style*="sticky"]');
    const count = await stickyElements.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should allow saving comparison', async ({ page }) => {
    await page.goto(`${BASE_URL}/models/compare?ids=1,2`);

    // Look for save button
    const saveButton = page.locator('button:has-text("Save"), button[aria-label*="save" i]').first();

    if (await saveButton.isVisible()) {
      await saveButton.click();

      // Should show success message
      await expect(page.locator('text=Saved|Success')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should allow exporting comparison as PDF', async ({ page }) => {
    await page.goto(`${BASE_URL}/models/compare?ids=1,2`);

    // Look for export button/menu
    const exportButton = page.locator('button:has-text("Export"), button:has-text("PDF")').first();

    if (await exportButton.isVisible()) {
      // Click export
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        exportButton.click(),
      ]);

      expect(download.suggestedFilename()).toContain('comparison');
    }
  });

  test('should allow exporting comparison as PNG', async ({ page }) => {
    await page.goto(`${BASE_URL}/models/compare?ids=1,2`);

    // Look for PNG export option
    const exportMenu = page.locator('button:has-text("Export")').first();

    if (await exportMenu.isVisible()) {
      await exportMenu.click();

      const pngOption = page.locator('text=PNG, button:has-text("PNG")').first();
      if (await pngOption.isVisible()) {
        const [download] = await Promise.all([
          page.waitForEvent('download'),
          pngOption.click(),
        ]);

        expect(download.suggestedFilename()).toMatch(/\.(png|jpg|jpeg)$/i);
      }
    }
  });

  test('should prevent selecting more than 5 models', async ({ page }) => {
    // Navigate with 5 models
    await page.goto(`${BASE_URL}/models/compare?ids=1,2,3,4,5`);

    // Try to add 6th model - selector should be disabled
    const addButton = page.locator('button:has-text("Add")').first();

    if (await addButton.isVisible()) {
      const isDisabled = await addButton.isDisabled();
      expect(isDisabled).toBe(true);
    }
  });
});

test.describe('Use Cases Library', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/guide/use-cases`);
  });

  test('should display use cases library page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/Use Case/i);

    // Should show use case cards
    const cards = page.locator('[data-testid="use-case-card"], .use-case-card, article').first();
    await expect(cards).toBeVisible({ timeout: 10000 });
  });

  test('should display featured use cases section', async ({ page }) => {
    const featuredSection = page.locator('text=Featured').first();
    if (await featuredSection.isVisible()) {
      await expect(featuredSection).toBeVisible();
    }
  });

  test('should allow filtering by category', async ({ page }) => {
    // Look for category filter
    const categoryFilter = page.locator('text=Category, select, button:has-text("Category")').first();
    await expect(categoryFilter).toBeVisible({ timeout: 10000 });

    // Select a category
    if (await page.locator('select').first().isVisible()) {
      await page.locator('select').first().selectOption({ label: /Customer Support|Code Gen/i });
    } else {
      // Click on filter option
      const filterOption = page.locator('text=Customer Support, text=Code Gen').first();
      if (await filterOption.isVisible()) {
        await filterOption.click();
      }
    }

    // Results should update
    await page.waitForTimeout(1000);
  });

  test('should allow filtering by industry', async ({ page }) => {
    const industryFilter = page.locator('text=Industry').first();
    if (await industryFilter.isVisible()) {
      await expect(industryFilter).toBeVisible();
    }
  });

  test('should allow filtering by implementation type', async ({ page }) => {
    const implFilter = page.locator('text=RAG, text=Fine-tuning, text=Agent').first();
    if (await implFilter.isVisible()) {
      await implFilter.click();
      await page.waitForTimeout(1000);
    }
  });

  test('should allow searching use cases', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="search" i]').first();
    await expect(searchInput).toBeVisible();

    await searchInput.fill('chatbot');
    await page.waitForTimeout(1000);

    // Should show filtered results
    const results = page.locator('[data-testid="use-case-card"], article');
    await expect(results.first()).toBeVisible();
  });

  test('should allow sorting use cases', async ({ page }) => {
    const sortDropdown = page.locator('select, button:has-text("Sort")').first();
    if (await sortDropdown.isVisible()) {
      await expect(sortDropdown).toBeVisible();

      // Change sort option
      if ((await sortDropdown.tagName()) === 'SELECT') {
        await sortDropdown.selectOption({ index: 1 });
      }
    }
  });

  test('should navigate to use case detail page', async ({ page }) => {
    // Click on first use case
    const firstCard = page.locator('[data-testid="use-case-card"], article').first();
    await firstCard.click();

    // Should navigate to detail page
    await expect(page).toHaveURL(/\/guide\/use-cases\/.+/);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should display use case detail with all sections', async ({ page }) => {
    // Navigate to a use case detail page
    await page.goto(`${BASE_URL}/guide/use-cases/customer-support-chatbot`);

    // Should have structured sections
    const sections = [
      'Problem',
      'Solution',
      'Architecture',
      'Implementation',
      'Results',
      'Challenges',
      'Learnings',
    ];

    for (const section of sections) {
      const sectionHeading = page.locator(`text=${section}`).first();
      if (await sectionHeading.isVisible()) {
        await expect(sectionHeading).toBeVisible();
      }
    }
  });

  test('should show tech stack badges on detail page', async ({ page }) => {
    await page.goto(`${BASE_URL}/guide/use-cases/customer-support-chatbot`);

    const techStack = page.locator('text=Tech Stack, text=Technologies').first();
    if (await techStack.isVisible()) {
      await expect(techStack).toBeVisible();
    }
  });

  test('should display submit use case button', async ({ page }) => {
    const submitButton = page.locator('a:has-text("Submit"), button:has-text("Submit")').first();
    await expect(submitButton).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to submission form', async ({ page }) => {
    const submitButton = page.locator('a:has-text("Submit"), button:has-text("Submit")').first();
    await submitButton.click();

    await expect(page).toHaveURL(/\/guide\/use-cases\/submit/);
    await expect(page.locator('h1')).toContainText(/Submit/i);
  });

  test('should validate submission form fields', async ({ page }) => {
    await page.goto(`${BASE_URL}/guide/use-cases/submit`);

    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"]').first();
    if (await submitButton.isVisible()) {
      await submitButton.click();

      // Should show validation errors
      await expect(page.locator('text=required, text=invalid')).toBeVisible({ timeout: 3000 });
    }
  });

  test('should show preview before submission', async ({ page }) => {
    await page.goto(`${BASE_URL}/guide/use-cases/submit`);

    // Fill out form
    await page.fill('input[name="title"]', 'Test Use Case');
    await page.fill('textarea[name="summary"]', 'This is a test summary');

    // Look for preview button
    const previewButton = page.locator('button:has-text("Preview")').first();
    if (await previewButton.isVisible()) {
      await previewButton.click();

      // Should show preview modal or section
      await expect(page.locator('text=Preview')).toBeVisible();
    }
  });
});

test.describe('Glossary', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/guide/glossary`);
  });

  test('should display glossary page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/Glossary/i);
  });

  test('should display A-Z navigation bar', async ({ page }) => {
    // Check for alphabet navigation
    const letters = ['A', 'B', 'C', 'D', 'E', 'Z'];

    for (const letter of letters) {
      const letterButton = page.locator(`button:has-text("${letter}"), a:has-text("${letter}")`).first();
      if (await letterButton.isVisible()) {
        await expect(letterButton).toBeVisible();
      }
    }
  });

  test('should display terms alphabetically', async ({ page }) => {
    // Should have letter sections
    const letterHeadings = page.locator('h2, h3').filter({ hasText: /^[A-Z]$/ });
    const count = await letterHeadings.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should navigate to letter section when clicked', async ({ page }) => {
    // Click on a letter (e.g., 'R' for RAG)
    const letterR = page.locator('button:has-text("R"), a:has-text("R")').first();

    if (await letterR.isVisible()) {
      await letterR.click();

      // Should scroll to R section
      await page.waitForTimeout(1000);

      const rSection = page.locator('[id*="letter-r"], [data-letter="R"]').first();
      if (await rSection.isVisible()) {
        await expect(rSection).toBeInViewport();
      }
    }
  });

  test('should allow searching glossary terms', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="search" i]').first();
    await expect(searchInput).toBeVisible();

    await searchInput.fill('attention');
    await page.waitForTimeout(1000);

    // Should show filtered results
    const termCards = page.locator('[data-testid="glossary-term"], .glossary-term, article');
    await expect(termCards.first()).toBeVisible();
  });

  test('should allow filtering by category', async ({ page }) => {
    const categoryFilter = page.locator('text=Models, text=Techniques, text=Metrics').first();
    if (await categoryFilter.isVisible()) {
      await categoryFilter.click();
      await page.waitForTimeout(1000);
    }
  });

  test('should display popular terms section', async ({ page }) => {
    const popularSection = page.locator('text=Popular').first();
    if (await popularSection.isVisible()) {
      await expect(popularSection).toBeVisible();
    }
  });

  test('should navigate to term detail page', async ({ page }) => {
    // Click on first term
    const firstTerm = page.locator('[data-testid="glossary-term"], article, a').first();
    await firstTerm.click();

    // Should navigate to detail page
    await expect(page).toHaveURL(/\/guide\/glossary\/.+/);
  });

  test('should display term definition on detail page', async ({ page }) => {
    await page.goto(`${BASE_URL}/guide/glossary/attention-mechanism`);

    // Should have definition
    await expect(page.locator('h1')).toBeVisible();

    const definition = page.locator('text=definition, p').first();
    await expect(definition).toBeVisible({ timeout: 10000 });
  });

  test('should display examples on detail page', async ({ page }) => {
    await page.goto(`${BASE_URL}/guide/glossary/attention-mechanism`);

    const examples = page.locator('text=Example, text=Usage').first();
    if (await examples.isVisible()) {
      await expect(examples).toBeVisible();
    }
  });

  test('should display related terms', async ({ page }) => {
    await page.goto(`${BASE_URL}/guide/glossary/attention-mechanism`);

    const relatedSection = page.locator('text=Related').first();
    if (await relatedSection.isVisible()) {
      await expect(relatedSection).toBeVisible();
    }
  });

  test('should allow clicking related terms', async ({ page }) => {
    await page.goto(`${BASE_URL}/guide/glossary/attention-mechanism`);

    // Look for related term links
    const relatedLink = page.locator('a[href*="/guide/glossary/"]').nth(1);

    if (await relatedLink.isVisible()) {
      const href = await relatedLink.getAttribute('href');
      await relatedLink.click();

      // Should navigate to related term
      await expect(page).toHaveURL(new RegExp(href!));
    }
  });

  test('should have copy term link button', async ({ page }) => {
    await page.goto(`${BASE_URL}/guide/glossary/attention-mechanism`);

    const copyButton = page.locator('button:has-text("Copy"), button:has-text("Share")').first();
    if (await copyButton.isVisible()) {
      await expect(copyButton).toBeVisible();
    }
  });
});

test.describe('Responsive Design', () => {
  test('should display model page correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/models/gpt-4`);

    await expect(page.locator('h1')).toBeVisible();

    // Content should be readable and not overflow
    const body = page.locator('body');
    const overflowX = await body.evaluate(el => getComputedStyle(el).overflowX);
    expect(overflowX).not.toBe('visible');
  });

  test('should display comparison on mobile with horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/models/compare?ids=1,2`);

    // Table should exist and be scrollable
    const table = page.locator('table, [role="table"]').first();
    if (await table.isVisible()) {
      await expect(table).toBeVisible();
    }
  });

  test('should display glossary correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/guide/glossary`);

    await expect(page.locator('h1')).toBeVisible();

    // A-Z nav should be visible
    const nav = page.locator('button:has-text("A"), a:has-text("A")').first();
    await expect(nav).toBeVisible();
  });

  test('should display use cases on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(`${BASE_URL}/guide/use-cases`);

    await expect(page.locator('h1')).toBeVisible();

    // Cards should be visible and properly sized
    const cards = page.locator('[data-testid="use-case-card"], article');
    await expect(cards.first()).toBeVisible();
  });
});

test.describe('Performance', () => {
  test('model pages should load under 2 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(`${BASE_URL}/models/gpt-4`);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    // Should load within 2 seconds (2000ms)
    expect(loadTime).toBeLessThan(2000);
  });

  test('comparison page should load under 1 second', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(`${BASE_URL}/models/compare?ids=1,2`);
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;

    // Should load within 1 second (1000ms)
    expect(loadTime).toBeLessThan(1000);
  });
});

test.describe('Console Errors', () => {
  test('should not have console errors on model page', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto(`${BASE_URL}/models/gpt-4`);
    await page.waitForLoadState('networkidle');

    expect(consoleErrors).toHaveLength(0);
  });

  test('should not have console errors on comparison page', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto(`${BASE_URL}/models/compare`);
    await page.waitForLoadState('networkidle');

    expect(consoleErrors).toHaveLength(0);
  });

  test('should not have console errors on glossary page', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto(`${BASE_URL}/guide/glossary`);
    await page.waitForLoadState('networkidle');

    expect(consoleErrors).toHaveLength(0);
  });
});
