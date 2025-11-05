import crypto from 'crypto';
import { Job } from 'bull';
import { PrismaClient } from '@prisma/client';
import logger from '@/utils/logger';
import { AnalyticsEventData } from '../queues/analyticsQueue';
import * as Sentry from '@sentry/node';
import ArticleViewsRepository from '@/modules/analytics/articleViews.repository';

const prisma = new PrismaClient();
const viewsRepository = new ArticleViewsRepository(prisma);

/**
 * Analytics Worker
 *
 * Processes analytics events from the queue and stores them in the database.
 * Handles:
 * - Article view tracking
 * - Article read tracking
 * - Article share tracking
 * - Article bookmark tracking
 *
 * All operations are idempotent and fault-tolerant.
 */

/**
 * Hash IP address using SHA-256 for privacy
 */
function hashIp(ipAddress: string): string {
  return crypto.createHash('sha256').update(ipAddress).digest('hex');
}

export const processAnalyticsEvent = async (job: Job<AnalyticsEventData>): Promise<void> => {
  const { eventType, entityType, entityId, userId, sessionId, ipAddress, userAgent, referrer, metadata } = job.data;

  try {
    logger.info(`Processing analytics event: ${eventType}`, {
      entityType,
      entityId,
      userId,
    });

    // Store event in analytics_events table (generic)
    await prisma.analyticsEvent.create({
      data: {
        eventType,
        eventData: {
          entityType,
          entityId,
          sessionId,
          referrer,
          ...metadata,
        },
        userId: userId || null,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    });

    // Special handling for article views - store in dedicated table
    if (entityType === 'article' && eventType === 'article_view') {
      await viewsRepository.createView({
        articleId: entityId,
        userId,
        ipHash: ipAddress ? hashIp(ipAddress) : undefined,
        sessionId,
        timeOnPage: metadata?.timeOnPage || 0,
        scrollDepth: metadata?.scrollDepth || 0,
        userAgent,
        referrer,
      });
    }

    // Update article counters based on event type
    if (entityType === 'article') {
      await updateArticleCounters(entityId, eventType);
    }

    logger.info(`Analytics event processed successfully: ${eventType}`, {
      entityType,
      entityId,
    });
  } catch (error) {
    logger.error('Failed to process analytics event:', {
      error,
      eventType,
      entityId,
    });

    Sentry.captureException(error, {
      tags: {
        worker: 'analytics',
        eventType,
        entityType,
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
 * Update article counters based on analytics event
 */
async function updateArticleCounters(articleId: string, eventType: string): Promise<void> {
  try {
    switch (eventType) {
      case 'article_view':
        await prisma.article.update({
          where: { id: articleId },
          data: {
            viewCount: { increment: 1 },
          },
        });
        break;

      case 'article_share':
        await prisma.article.update({
          where: { id: articleId },
          data: {
            shareCount: { increment: 1 },
          },
        });
        break;

      case 'article_bookmark':
        // Bookmark count is handled separately in the bookmarks module
        // This is just for analytics tracking
        break;

      case 'article_read':
        // Read events are tracked but don't update counters
        // They can be used for engagement metrics
        break;

      default:
        logger.warn(`Unknown event type for counter update: ${eventType}`);
    }
  } catch (error) {
    logger.error('Failed to update article counters:', {
      error,
      articleId,
      eventType,
    });

    Sentry.captureException(error, {
      tags: {
        operation: 'update_article_counters',
        eventType,
      },
      extra: { articleId },
    });

    // Don't throw - counter updates are not critical
  }
}

/**
 * Cleanup old analytics events (run as scheduled job)
 * Keep events for 90 days
 */
export const cleanupOldAnalyticsEvents = async (): Promise<void> => {
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const result = await prisma.analyticsEvent.deleteMany({
      where: {
        createdAt: {
          lt: ninetyDaysAgo,
        },
      },
    });

    logger.info(`Cleaned up ${result.count} old analytics events`);
  } catch (error) {
    logger.error('Failed to cleanup old analytics events:', error);
    Sentry.captureException(error);
  }
};

export default processAnalyticsEvent;
