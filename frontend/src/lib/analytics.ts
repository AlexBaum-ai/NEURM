/**
 * Analytics tracking utility
 * Tracks user events for analytics and monitoring
 */
import { addSentryBreadcrumb } from './sentry';

export type AnalyticsEventName =
  | 'related_article_click'
  | 'article_view'
  | 'article_bookmark'
  | 'article_share'
  | 'category_filter'
  | 'tag_filter'
  | 'search_query'
  | 'user_signup'
  | 'user_login';

export interface AnalyticsEventData {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Track an analytics event
 * Sends events to Sentry breadcrumbs and can be extended to other analytics platforms
 */
export function trackEvent(eventName: AnalyticsEventName, data?: AnalyticsEventData): void {
  // Log to console in development
  if (import.meta.env.DEV) {
    console.log('[Analytics]', eventName, data);
  }

  // Send to Sentry as breadcrumb
  addSentryBreadcrumb(
    `User event: ${eventName}`,
    'user-action',
    'info',
    data
  );

  // TODO: Add Google Analytics tracking when configured
  // if (window.gtag) {
  //   window.gtag('event', eventName, data);
  // }

  // TODO: Add Plausible Analytics tracking when configured
  // if (window.plausible) {
  //   window.plausible(eventName, { props: data });
  // }
}

/**
 * Track a related article click with contextual data
 */
export function trackRelatedArticleClick(params: {
  articleId: string;
  articleSlug: string;
  articleTitle: string;
  sourceArticleId: string;
  sourceArticleSlug: string;
  position: number;
}): void {
  trackEvent('related_article_click', {
    article_id: params.articleId,
    article_slug: params.articleSlug,
    article_title: params.articleTitle,
    source_article_id: params.sourceArticleId,
    source_article_slug: params.sourceArticleSlug,
    position: params.position,
  });
}

/**
 * Track article view
 */
export function trackArticleView(articleId: string, articleSlug: string, articleTitle: string): void {
  trackEvent('article_view', {
    article_id: articleId,
    article_slug: articleSlug,
    article_title: articleTitle,
  });
}

/**
 * Track article bookmark toggle
 */
export function trackArticleBookmark(articleId: string, isBookmarked: boolean): void {
  trackEvent('article_bookmark', {
    article_id: articleId,
    action: isBookmarked ? 'add' : 'remove',
  });
}

/**
 * Track article share
 */
export function trackArticleShare(articleId: string, platform: string): void {
  trackEvent('article_share', {
    article_id: articleId,
    platform,
  });
}

/**
 * Track filter usage
 */
export function trackCategoryFilter(categorySlug: string): void {
  trackEvent('category_filter', {
    category: categorySlug,
  });
}

export function trackTagFilter(tagSlug: string): void {
  trackEvent('tag_filter', {
    tag: tagSlug,
  });
}

/**
 * Track search queries
 */
export function trackSearchQuery(query: string, resultsCount: number): void {
  trackEvent('search_query', {
    query,
    results_count: resultsCount,
  });
}
