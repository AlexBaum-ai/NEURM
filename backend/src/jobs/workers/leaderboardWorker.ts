import { Job } from 'bull';
import { container } from 'tsyringe';
import * as Sentry from '@sentry/node';
import logger from '@/utils/logger';
import { leaderboardQueue, LeaderboardJobData } from '../queues/leaderboardQueue';
import { LeaderboardService } from '@/modules/forum/services/leaderboardService';

/**
 * Leaderboard Worker
 *
 * Processes leaderboard recalculation jobs:
 * - Recalculate all periods (weekly, monthly, all-time)
 * - Recalculate specific period
 * - Clear caches after recalculation
 */

// Resolve service from DI container
const getLeaderboardService = (): LeaderboardService => {
  return container.resolve(LeaderboardService);
};

/**
 * Process leaderboard jobs
 */
leaderboardQueue.process(async (job: Job<LeaderboardJobData>) => {
  const startTime = Date.now();

  try {
    logger.info(`Processing leaderboard job ${job.id}`, {
      jobType: job.data.jobType,
      period: job.data.period,
    });

    const leaderboardService = getLeaderboardService();

    let result: any;

    switch (job.data.jobType) {
      case 'recalculate_all':
        result = await leaderboardService.recalculateAllRankings();
        logger.info('All leaderboard rankings recalculated', {
          weekly: result.weekly,
          monthly: result.monthly,
          allTime: result.allTime,
          duration: Date.now() - startTime,
        });
        break;

      case 'recalculate_period':
        if (!job.data.period) {
          throw new Error('Period is required for recalculate_period job');
        }
        const count = await leaderboardService.recalculateRankings(job.data.period);
        result = { period: job.data.period, userCount: count };
        logger.info('Leaderboard period recalculated', {
          period: job.data.period,
          userCount: count,
          duration: Date.now() - startTime,
        });
        break;

      default:
        throw new Error(`Unknown job type: ${job.data.jobType}`);
    }

    Sentry.addBreadcrumb({
      category: 'jobs',
      message: 'Leaderboard job completed successfully',
      level: 'info',
      data: {
        jobId: job.id,
        jobType: job.data.jobType,
        result,
        duration: Date.now() - startTime,
      },
    });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error(`Leaderboard job ${job.id} failed:`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      jobData: job.data,
      attemptsMade: job.attemptsMade,
      duration,
    });

    Sentry.captureException(error, {
      tags: {
        worker: 'leaderboardWorker',
        jobType: job.data.jobType,
        jobId: String(job.id),
      },
      extra: {
        jobData: job.data,
        attemptsMade: job.attemptsMade,
        duration,
      },
    });

    throw error;
  }
});

logger.info('Leaderboard worker started');

export default leaderboardQueue;
