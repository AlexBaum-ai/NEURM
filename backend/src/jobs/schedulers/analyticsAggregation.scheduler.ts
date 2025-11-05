import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import logger from '@/utils/logger';
import * as Sentry from '@sentry/node';

const prisma = new PrismaClient();

/**
 * Analytics Aggregation Scheduler
 *
 * Runs daily to aggregate article view statistics.
 * Helps improve query performance by pre-calculating:
 * - Daily view counts
 * - Weekly trending scores
 * - Monthly popularity metrics
 *
 * Schedule: Runs daily at 02:00 AM (server time)
 */

/**
 * Aggregate daily article view statistics
 * Calculates metrics for the previous day
 */
async function aggregateDailyStats(): Promise<void> {
  try {
    logger.info('Starting daily analytics aggregation...');

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get articles with views yesterday
    const articleViews = await prisma.articleView.groupBy({
      by: ['articleId'],
      where: {
        viewedAt: {
          gte: yesterday,
          lt: today,
        },
      },
      _count: {
        id: true,
      },
      _avg: {
        timeOnPage: true,
        scrollDepth: true,
      },
    });

    logger.info(`Aggregating stats for ${articleViews.length} articles`);

    // Store aggregated data (could be in a separate aggregations table if needed)
    // For now, we'll just log the results
    for (const view of articleViews) {
      const article = await prisma.article.findUnique({
        where: { id: view.articleId },
        select: { title: true, slug: true },
      });

      logger.debug('Daily stats:', {
        articleId: view.articleId,
        title: article?.title,
        views: view._count.id,
        avgTimeOnPage: Math.round(view._avg.timeOnPage || 0),
        avgScrollDepth: Math.round(view._avg.scrollDepth || 0),
      });
    }

    logger.info('Daily analytics aggregation completed successfully');
  } catch (error) {
    logger.error('Failed to aggregate daily stats:', error);
    Sentry.captureException(error, {
      tags: { scheduler: 'analytics_aggregation', task: 'daily_stats' },
    });
  }
}

/**
 * Update trending scores for articles
 * Recalculates trending scores based on recent activity
 */
async function updateTrendingScores(): Promise<void> {
  try {
    logger.info('Updating trending scores...');

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get articles with recent views
    const recentViews = await prisma.articleView.groupBy({
      by: ['articleId'],
      where: {
        viewedAt: {
          gte: sevenDaysAgo,
        },
      },
      _count: {
        id: true,
      },
      _avg: {
        timeOnPage: true,
      },
    });

    logger.info(`Updating trending scores for ${recentViews.length} articles`);

    const now = new Date();

    // Update isTrending flag for top articles
    for (const view of recentViews.slice(0, 20)) {
      // Top 20
      const article = await prisma.article.findUnique({
        where: { id: view.articleId },
        select: { publishedAt: true },
      });

      if (!article?.publishedAt) continue;

      // Calculate recency score (0-1)
      const ageMs = now.getTime() - article.publishedAt.getTime();
      const recencyScore = Math.max(0, 1 - ageMs / (30 * 24 * 60 * 60 * 1000));

      // Normalize scores
      const avgTime = view._avg.timeOnPage || 0;
      const timeScore = Math.min(1, avgTime / 600);
      const viewScore = Math.min(1, Math.log10(view._count.id + 1) / 3);

      // Calculate weighted trending score
      const trendingScore = viewScore * 0.5 + timeScore * 0.3 + recencyScore * 0.2;

      // Mark as trending if score is high enough
      const isTrending = trendingScore > 0.5;

      await prisma.article.update({
        where: { id: view.articleId },
        data: { isTrending },
      });
    }

    // Clear trending flag for articles not in top 20
    const trendingArticleIds = recentViews.slice(0, 20).map((v) => v.articleId);
    await prisma.article.updateMany({
      where: {
        id: { notIn: trendingArticleIds },
        isTrending: true,
      },
      data: { isTrending: false },
    });

    logger.info('Trending scores updated successfully');
  } catch (error) {
    logger.error('Failed to update trending scores:', error);
    Sentry.captureException(error, {
      tags: { scheduler: 'analytics_aggregation', task: 'trending_scores' },
    });
  }
}

/**
 * Cleanup old analytics data
 * Removes article view records older than 90 days
 */
async function cleanupOldAnalytics(): Promise<void> {
  try {
    logger.info('Cleaning up old analytics data...');

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const result = await prisma.articleView.deleteMany({
      where: {
        viewedAt: {
          lt: ninetyDaysAgo,
        },
      },
    });

    logger.info(`Cleaned up ${result.count} old article views`);
  } catch (error) {
    logger.error('Failed to cleanup old analytics:', error);
    Sentry.captureException(error, {
      tags: { scheduler: 'analytics_aggregation', task: 'cleanup' },
    });
  }
}

/**
 * Main aggregation job that runs daily
 */
async function runDailyAggregation(): Promise<void> {
  logger.info('=== Starting Analytics Aggregation Job ===');

  await aggregateDailyStats();
  await updateTrendingScores();
  await cleanupOldAnalytics();

  logger.info('=== Analytics Aggregation Job Completed ===');
}

/**
 * Initialize the scheduler
 * Runs daily at 02:00 AM
 */
export function initAnalyticsAggregationScheduler(): void {
  // Run daily at 02:00 AM
  cron.schedule('0 2 * * *', async () => {
    logger.info('Analytics aggregation cron job triggered');
    await runDailyAggregation();
  });

  logger.info('Analytics aggregation scheduler initialized (daily at 02:00 AM)');
}

// Export for manual execution
export { runDailyAggregation, aggregateDailyStats, updateTrendingScores, cleanupOldAnalytics };
