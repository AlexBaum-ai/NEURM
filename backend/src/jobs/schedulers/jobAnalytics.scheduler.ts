import cron from 'node-cron';
import logger from '@/utils/logger';
import * as Sentry from '@sentry/node';
import { precomputeJobAnalytics } from '@/modules/jobs/cron/precomputeJobAnalytics';
import companyAnalyticsService from '@/modules/jobs/services/companyAnalyticsService';

/**
 * Job Analytics Scheduler
 *
 * Runs daily to precompute analytics for all active jobs.
 * Helps improve query performance by pre-calculating:
 * - Application metrics
 * - Conversion rates
 * - Funnel data
 * - Demographics
 * - Quality scores
 *
 * Schedule: Runs daily at 02:00 AM (server time)
 */

/**
 * Main job analytics precomputation job
 */
async function runJobAnalyticsPrecomputation(): Promise<void> {
  logger.info('=== Starting Job Analytics Precomputation ===');

  try {
    await precomputeJobAnalytics();
    logger.info('=== Job Analytics Precomputation Completed Successfully ===');
  } catch (error) {
    logger.error('=== Job Analytics Precomputation Failed ===', error);
    Sentry.captureException(error, {
      tags: { scheduler: 'job_analytics', task: 'precomputation' },
    });
  }
}

/**
 * Initialize the scheduler
 * Runs daily at 02:00 AM (after analytics aggregation)
 */
export function initJobAnalyticsScheduler(): void {
  // Run daily at 02:30 AM (30 minutes after article analytics)
  cron.schedule('30 2 * * *', async () => {
    logger.info('Job analytics precomputation cron job triggered');
    await runJobAnalyticsPrecomputation();
  });

  logger.info(
    'Job analytics scheduler initialized (daily at 02:30 AM)'
  );
}

// Export for manual execution
export { runJobAnalyticsPrecomputation };
