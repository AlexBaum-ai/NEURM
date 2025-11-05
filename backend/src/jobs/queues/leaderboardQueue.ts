import Queue from 'bull';
import env from '@/config/env';
import logger from '@/utils/logger';

/**
 * Leaderboard Queue
 *
 * Handles hourly recalculation of leaderboard rankings:
 * - Weekly leaderboard (top 50 users this week)
 * - Monthly leaderboard (top 50 users this month)
 * - All-time leaderboard (top 100 users ever)
 *
 * Jobs run every hour to update precomputed rankings.
 */

export interface LeaderboardJobData {
  jobType: 'recalculate_all' | 'recalculate_period';
  period?: 'weekly' | 'monthly' | 'all-time';
  triggeredAt: Date;
}

// Create leaderboard queue with Bull
export const leaderboardQueue = new Queue<LeaderboardJobData>('leaderboard', env.REDIS_URL, {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000, // Start with 5 second delay
    },
    removeOnComplete: 50, // Keep last 50 completed jobs
    removeOnFail: 50, // Keep last 50 failed jobs
    timeout: 300000, // 5 minutes timeout for calculation
  },
  settings: {
    maxStalledCount: 2,
    stalledInterval: 60000, // Check for stalled jobs every 60s
  },
});

// Queue event handlers
leaderboardQueue.on('error', (error) => {
  logger.error('Leaderboard queue error:', error);
});

leaderboardQueue.on('failed', (job, error) => {
  logger.error(`Leaderboard job ${job.id} failed:`, {
    error: error.message,
    stack: error.stack,
    data: job.data,
    attemptsMade: job.attemptsMade,
  });
});

leaderboardQueue.on('completed', (job, result) => {
  logger.info(`Leaderboard job ${job.id} completed`, {
    jobType: job.data.jobType,
    period: job.data.period,
    result,
    duration: Date.now() - new Date(job.data.triggeredAt).getTime(),
  });
});

leaderboardQueue.on('stalled', (job) => {
  logger.warn(`Leaderboard job ${job.id} stalled:`, {
    data: job.data,
    attemptsMade: job.attemptsMade,
  });
});

/**
 * Schedule hourly leaderboard recalculation
 * Runs every hour at minute 0
 */
export const scheduleHourlyRecalculation = async (): Promise<void> => {
  try {
    // Remove existing repeatable jobs to avoid duplicates
    const repeatableJobs = await leaderboardQueue.getRepeatableJobs();
    for (const job of repeatableJobs) {
      await leaderboardQueue.removeRepeatableByKey(job.key);
    }

    // Schedule new job to run every hour at minute 0
    await leaderboardQueue.add(
      {
        jobType: 'recalculate_all',
        triggeredAt: new Date(),
      },
      {
        repeat: {
          cron: '0 * * * *', // Every hour at minute 0
        },
        jobId: 'hourly-leaderboard-recalculation',
      }
    );

    logger.info('Leaderboard hourly recalculation scheduled');
  } catch (error) {
    logger.error('Failed to schedule leaderboard recalculation:', error);
    throw error;
  }
};

/**
 * Manually trigger leaderboard recalculation
 */
export const triggerRecalculation = async (
  period?: 'weekly' | 'monthly' | 'all-time'
): Promise<void> => {
  try {
    await leaderboardQueue.add({
      jobType: period ? 'recalculate_period' : 'recalculate_all',
      period,
      triggeredAt: new Date(),
    });

    logger.info('Leaderboard recalculation triggered manually', { period });
  } catch (error) {
    logger.error('Failed to trigger leaderboard recalculation:', error);
    throw error;
  }
};

/**
 * Shutdown leaderboard queue gracefully
 */
export const shutdownLeaderboardQueue = async (): Promise<void> => {
  try {
    await leaderboardQueue.close();
    logger.info('Leaderboard queue closed');
  } catch (error) {
    logger.error('Error closing leaderboard queue:', error);
    throw error;
  }
};

export default leaderboardQueue;
