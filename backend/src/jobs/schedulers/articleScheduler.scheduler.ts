import cron from 'node-cron';
import { triggerScheduledCheck } from '../queues/articleSchedulerQueue';
import logger from '@/utils/logger';
import * as Sentry from '@sentry/node';

/**
 * Article Scheduler
 *
 * Runs every minute to check for articles that need to be published.
 * Uses Bull queue for processing to ensure fault-tolerance and retry logic.
 *
 * Schedule: Every minute (* * * * *)
 */
export function setupArticleScheduler(): void {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      logger.debug('Running article scheduler check');

      await triggerScheduledCheck();

      logger.debug('Article scheduler check triggered successfully');
    } catch (error) {
      logger.error('Article scheduler check failed:', error);
      Sentry.captureException(error, {
        tags: { job: 'article-scheduler' },
      });
    }
  });

  logger.info('Article scheduler initialized (runs every minute)');
}
