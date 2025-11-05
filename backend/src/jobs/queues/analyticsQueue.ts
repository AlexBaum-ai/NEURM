import Queue from 'bull';
import env from '@/config/env';
import logger from '@/utils/logger';

/**
 * Analytics Queue
 *
 * Handles asynchronous processing of analytics events:
 * - Article views
 * - Article reads (completed reading)
 * - Article shares
 * - Article bookmarks
 *
 * Events are processed in the background to avoid blocking API responses.
 */

export interface AnalyticsEventData {
  eventType: 'article_view' | 'article_read' | 'article_share' | 'article_bookmark';
  entityType: string;
  entityId: string;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  metadata?: Record<string, any>;
}

// Create analytics queue with Bull
export const analyticsQueue = new Queue<AnalyticsEventData>('analytics', env.REDIS_URL, {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 50,      // Keep last 50 failed jobs
  },
  settings: {
    maxStalledCount: 3,
    stalledInterval: 30000, // Check for stalled jobs every 30s
  },
});

// Queue event handlers
analyticsQueue.on('error', (error) => {
  logger.error('Analytics queue error:', error);
});

analyticsQueue.on('failed', (job, error) => {
  logger.error(`Analytics job ${job.id} failed:`, {
    error: error.message,
    data: job.data,
  });
});

analyticsQueue.on('completed', (job) => {
  logger.debug(`Analytics job ${job.id} completed`, {
    eventType: job.data.eventType,
    entityId: job.data.entityId,
  });
});

analyticsQueue.on('stalled', (job) => {
  logger.warn(`Analytics job ${job.id} stalled`, {
    eventType: job.data.eventType,
    entityId: job.data.entityId,
  });
});

// Helper function to add analytics event to queue
export const trackEvent = async (data: AnalyticsEventData): Promise<void> => {
  try {
    await analyticsQueue.add(data, {
      priority: data.eventType === 'article_view' ? 1 : 2, // Views have higher priority
    });
    logger.debug('Analytics event queued', {
      eventType: data.eventType,
      entityId: data.entityId,
    });
  } catch (error) {
    logger.error('Failed to queue analytics event:', error);
    // Don't throw - analytics failures shouldn't break the app
  }
};

// Graceful shutdown
export const shutdownAnalyticsQueue = async (): Promise<void> => {
  logger.info('Shutting down analytics queue...');
  await analyticsQueue.close();
  logger.info('Analytics queue closed');
};

export default analyticsQueue;
