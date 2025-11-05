import Queue from 'bull';
import env from '@/config/env';
import logger from '@/utils/logger';

/**
 * Article Scheduler Queue
 *
 * Handles scheduled publishing of articles:
 * - Checks for articles with scheduledAt <= now
 * - Publishes articles automatically
 * - Sends notifications to authors
 * - Handles failed publishes with retry logic
 *
 * Runs every minute via cron scheduler
 */

export interface ArticleSchedulerJobData {
  jobType: 'check_scheduled' | 'publish_article';
  articleId?: string;
  metadata?: Record<string, any>;
}

// Create article scheduler queue with Bull
export const articleSchedulerQueue = new Queue<ArticleSchedulerJobData>(
  'article-scheduler',
  env.REDIS_URL,
  {
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000, // Start with 5 seconds
      },
      removeOnComplete: 200, // Keep last 200 completed jobs for audit
      removeOnFail: 100, // Keep last 100 failed jobs for debugging
    },
    settings: {
      maxStalledCount: 2,
      stalledInterval: 60000, // Check for stalled jobs every minute
    },
  }
);

// Queue event handlers
articleSchedulerQueue.on('error', (error) => {
  logger.error('Article scheduler queue error:', error);
});

articleSchedulerQueue.on('failed', (job, error) => {
  logger.error(`Article scheduler job ${job.id} failed:`, {
    error: error.message,
    data: job.data,
    attemptsMade: job.attemptsMade,
  });
});

articleSchedulerQueue.on('completed', (job) => {
  logger.debug(`Article scheduler job ${job.id} completed`, {
    jobType: job.data.jobType,
    articleId: job.data.articleId,
  });
});

articleSchedulerQueue.on('stalled', (job) => {
  logger.warn(`Article scheduler job ${job.id} stalled`, {
    jobType: job.data.jobType,
    articleId: job.data.articleId,
  });
});

articleSchedulerQueue.on('active', (job) => {
  logger.debug(`Article scheduler job ${job.id} started`, {
    jobType: job.data.jobType,
    articleId: job.data.articleId,
  });
});

// Helper function to trigger scheduled articles check
export const triggerScheduledCheck = async (): Promise<void> => {
  try {
    await articleSchedulerQueue.add(
      { jobType: 'check_scheduled' },
      {
        priority: 1, // High priority
        jobId: `scheduled-check-${Date.now()}`, // Unique ID to prevent duplicates
        removeOnComplete: true, // Clean up immediately
      }
    );
    logger.debug('Triggered scheduled articles check');
  } catch (error) {
    logger.error('Failed to trigger scheduled check:', error);
    // Don't throw - scheduler will retry
  }
};

// Helper function to queue individual article publish
export const queueArticlePublish = async (
  articleId: string,
  metadata?: Record<string, any>
): Promise<void> => {
  try {
    await articleSchedulerQueue.add(
      {
        jobType: 'publish_article',
        articleId,
        metadata,
      },
      {
        priority: 2, // Normal priority
        jobId: `publish-${articleId}`, // Prevent duplicate publish jobs
      }
    );
    logger.info(`Queued article publish: ${articleId}`);
  } catch (error) {
    logger.error(`Failed to queue article publish for ${articleId}:`, error);
    throw error; // Throw here as this is a critical operation
  }
};

// Graceful shutdown
export const shutdownArticleSchedulerQueue = async (): Promise<void> => {
  logger.info('Shutting down article scheduler queue...');
  await articleSchedulerQueue.close();
  logger.info('Article scheduler queue closed');
};

export default articleSchedulerQueue;
