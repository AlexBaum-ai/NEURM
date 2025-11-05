import Queue from 'bull';
import env from '@/config/env';
import logger from '@/utils/logger';

/**
 * Badge Queue
 *
 * Handles automatic badge detection and awarding:
 * - Check all users for badge eligibility
 * - Check specific user for badge eligibility
 * - Award badges when criteria are met
 * - Send notifications for earned badges
 *
 * Jobs run every hour to check badge criteria.
 */

export interface BadgeJobData {
  jobType: 'check_all_users' | 'check_user';
  userId?: string;
  triggeredAt: Date;
  triggeredBy?: 'scheduled' | 'manual' | 'event';
}

// Create badge queue with Bull
export const badgeQueue = new Queue<BadgeJobData>('badges', env.REDIS_URL, {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000, // Start with 5 second delay
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 100, // Keep last 100 failed jobs
    timeout: 600000, // 10 minutes timeout for checking all users
  },
  settings: {
    maxStalledCount: 2,
    stalledInterval: 60000, // Check for stalled jobs every 60s
  },
});

// Queue event handlers
badgeQueue.on('error', (error) => {
  logger.error('Badge queue error:', error);
});

badgeQueue.on('failed', (job, error) => {
  logger.error(`Badge job ${job.id} failed:`, {
    error: error.message,
    stack: error.stack,
    data: job.data,
    attemptsMade: job.attemptsMade,
  });
});

badgeQueue.on('completed', (job, result) => {
  logger.info(`Badge job ${job.id} completed`, {
    jobType: job.data.jobType,
    userId: job.data.userId,
    badgesAwarded: result?.badgesAwarded || 0,
    usersProcessed: result?.usersProcessed || 0,
    duration: Date.now() - new Date(job.data.triggeredAt).getTime(),
  });
});

badgeQueue.on('stalled', (job) => {
  logger.warn(`Badge job ${job.id} stalled:`, {
    data: job.data,
    attemptsMade: job.attemptsMade,
  });
});

/**
 * Schedule hourly badge checks for all users
 * Runs every hour at minute 15
 */
export const scheduleHourlyBadgeCheck = async (): Promise<void> => {
  try {
    // Remove existing repeatable jobs to avoid duplicates
    const repeatableJobs = await badgeQueue.getRepeatableJobs();
    for (const job of repeatableJobs) {
      await badgeQueue.removeRepeatableByKey(job.key);
    }

    // Schedule new job to run every hour at minute 15
    await badgeQueue.add(
      {
        jobType: 'check_all_users',
        triggeredAt: new Date(),
        triggeredBy: 'scheduled',
      },
      {
        repeat: {
          cron: '15 * * * *', // Every hour at minute 15
        },
        jobId: 'hourly-badge-check',
      }
    );

    logger.info('Badge hourly check scheduled');
  } catch (error) {
    logger.error('Failed to schedule badge check:', error);
    throw error;
  }
};

/**
 * Manually trigger badge check for a specific user
 * This is called after significant user actions (posting, voting, etc.)
 */
export const triggerUserBadgeCheck = async (userId: string): Promise<void> => {
  try {
    await badgeQueue.add({
      jobType: 'check_user',
      userId,
      triggeredAt: new Date(),
      triggeredBy: 'event',
    });

    logger.info('User badge check triggered', { userId });
  } catch (error) {
    logger.error('Failed to trigger user badge check:', error);
    throw error;
  }
};

/**
 * Manually trigger badge check for all users
 */
export const triggerAllUsersBadgeCheck = async (): Promise<void> => {
  try {
    await badgeQueue.add({
      jobType: 'check_all_users',
      triggeredAt: new Date(),
      triggeredBy: 'manual',
    });

    logger.info('All users badge check triggered manually');
  } catch (error) {
    logger.error('Failed to trigger all users badge check:', error);
    throw error;
  }
};

/**
 * Shutdown badge queue gracefully
 */
export const shutdownBadgeQueue = async (): Promise<void> => {
  try {
    await badgeQueue.close();
    logger.info('Badge queue closed');
  } catch (error) {
    logger.error('Error closing badge queue:', error);
    throw error;
  }
};

export default badgeQueue;
