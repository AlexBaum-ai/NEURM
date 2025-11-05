import { Job } from 'bull';
import { PrismaClient, ArticleStatus } from '@prisma/client';
import logger from '@/utils/logger';
import { ArticleSchedulerJobData, queueArticlePublish } from '../queues/articleSchedulerQueue';
import * as Sentry from '@sentry/node';

const prisma = new PrismaClient();

/**
 * Article Scheduler Worker
 *
 * Processes scheduled article publishing:
 * 1. check_scheduled: Finds articles ready to be published
 * 2. publish_article: Publishes a specific article
 *
 * Handles timezone-aware scheduling and notifications.
 */

export const processArticleScheduler = async (
  job: Job<ArticleSchedulerJobData>
): Promise<void> => {
  const { jobType, articleId, metadata } = job.data;

  try {
    logger.info(`Processing article scheduler job: ${jobType}`, {
      articleId,
      metadata,
    });

    switch (jobType) {
      case 'check_scheduled':
        await checkScheduledArticles();
        break;

      case 'publish_article':
        if (!articleId) {
          throw new Error('Article ID is required for publish_article job');
        }
        await publishArticle(articleId);
        break;

      default:
        throw new Error(`Unknown job type: ${jobType}`);
    }

    logger.info(`Article scheduler job completed: ${jobType}`, {
      articleId,
    });
  } catch (error) {
    logger.error('Failed to process article scheduler job:', {
      error,
      jobType,
      articleId,
    });

    Sentry.captureException(error, {
      tags: {
        worker: 'article-scheduler',
        jobType,
      },
      contexts: {
        job: {
          data: job.data,
        },
      },
    });

    throw error; // Re-throw to trigger Bull retry mechanism
  }
};

/**
 * Check for scheduled articles that are ready to be published
 */
async function checkScheduledArticles(): Promise<void> {
  try {
    const now = new Date();

    // Find articles with status 'scheduled' and scheduledAt <= now
    const articlesReadyToPublish = await prisma.article.findMany({
      where: {
        status: ArticleStatus.scheduled,
        scheduledAt: {
          lte: now,
        },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        scheduledAt: true,
        authorId: true,
      },
    });

    if (articlesReadyToPublish.length === 0) {
      logger.debug('No scheduled articles ready to publish');
      return;
    }

    logger.info(
      `Found ${articlesReadyToPublish.length} articles ready to publish`,
      {
        articleIds: articlesReadyToPublish.map((a) => a.id),
      }
    );

    // Queue each article for publishing
    for (const article of articlesReadyToPublish) {
      try {
        await queueArticlePublish(article.id, {
          title: article.title,
          slug: article.slug,
          scheduledAt: article.scheduledAt?.toISOString(),
          authorId: article.authorId,
        });
      } catch (error) {
        logger.error(`Failed to queue article ${article.id} for publishing:`, error);
        // Continue with other articles even if one fails
        Sentry.captureException(error, {
          tags: { operation: 'queue_article_publish' },
          extra: { articleId: article.id },
        });
      }
    }
  } catch (error) {
    logger.error('Failed to check scheduled articles:', error);
    Sentry.captureException(error, {
      tags: { operation: 'check_scheduled_articles' },
    });
    throw error;
  }
}

/**
 * Publish a specific article
 */
async function publishArticle(articleId: string): Promise<void> {
  try {
    logger.info(`Publishing article: ${articleId}`);

    // Get article details before publishing
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        authorId: true,
        scheduledAt: true,
        author: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    if (!article) {
      throw new Error(`Article ${articleId} not found`);
    }

    // Check if article is still in scheduled status
    if (article.status !== ArticleStatus.scheduled) {
      logger.warn(
        `Article ${articleId} is not in scheduled status (current: ${article.status})`,
        {
          articleId,
          currentStatus: article.status,
        }
      );
      return; // Skip publishing
    }

    // Update article status to published
    const publishedArticle = await prisma.article.update({
      where: { id: articleId },
      data: {
        status: ArticleStatus.published,
        publishedAt: new Date(),
      },
    });

    logger.info(`Article published successfully: ${articleId}`, {
      title: publishedArticle.title,
      slug: publishedArticle.slug,
      publishedAt: publishedArticle.publishedAt,
    });

    // Send notification to author
    if (article.authorId) {
      await sendPublishNotification(article.authorId, article);
    }

    // Invalidate caches (if Redis is available)
    await invalidateArticleCaches(article.slug);
  } catch (error) {
    logger.error(`Failed to publish article ${articleId}:`, error);

    // Log failed publish attempt
    await logFailedPublish(articleId, error);

    Sentry.captureException(error, {
      tags: { operation: 'publish_article' },
      extra: { articleId },
    });

    throw error;
  }
}

/**
 * Send notification to author when article is published
 */
async function sendPublishNotification(
  authorId: string,
  article: {
    id: string;
    title: string;
    slug: string;
  }
): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: authorId,
        type: 'system',
        title: 'Article Published',
        message: `Your article "${article.title}" has been published successfully!`,
        actionUrl: `/news/${article.slug}`,
        referenceId: article.id,
      },
    });

    logger.info(`Notification sent to author ${authorId} for article ${article.id}`);
  } catch (error) {
    logger.error(`Failed to send publish notification to author ${authorId}:`, error);
    // Don't throw - notification failures shouldn't fail the publish
    Sentry.captureException(error, {
      tags: { operation: 'send_publish_notification' },
      extra: { authorId, articleId: article.id },
    });
  }
}

/**
 * Invalidate article caches after publishing
 */
async function invalidateArticleCaches(slug: string): Promise<void> {
  try {
    // This would typically call a cache service
    // For now, just log it
    logger.debug(`Invalidating caches for article: ${slug}`);

    // TODO: Implement Redis cache invalidation
    // await redisClient.delPattern(`article:slug:${slug}:*`);
    // await redisClient.delPattern('articles:list:*');
  } catch (error) {
    logger.error(`Failed to invalidate caches for article ${slug}:`, error);
    // Don't throw - cache invalidation failures shouldn't fail the publish
  }
}

/**
 * Log failed publish attempt for debugging
 */
async function logFailedPublish(articleId: string, error: any): Promise<void> {
  try {
    await prisma.analyticsEvent.create({
      data: {
        eventType: 'article_publish_failed',
        eventData: {
          articleId,
          error: error.message || String(error),
          timestamp: new Date().toISOString(),
        },
      },
    });
  } catch (logError) {
    logger.error('Failed to log failed publish attempt:', logError);
    // Ignore logging failures
  }
}

export default processArticleScheduler;
