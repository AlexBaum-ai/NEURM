import Queue from 'bull';
import { unifiedConfig } from '@/config/unifiedConfig';
import logger from '@/utils/logger';
import * as Sentry from '@sentry/node';
import DigestService from '@/modules/notifications/digest/digest.service';
import DigestRepository from '@/modules/notifications/digest/digest.repository';
import { DigestType } from '@prisma/client';

/**
 * Bull Queue for Email Digests
 * Handles scheduled daily and weekly digest generation and sending
 */

// Create digest queue
export const digestQueue = new Queue('digest', unifiedConfig.redis.url, {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 500, // Keep last 500 failed jobs
  },
});

// Initialize services
const digestService = new DigestService();
const digestRepository = new DigestRepository();

// ============================================================================
// JOB PROCESSORS
// ============================================================================

/**
 * Process individual digest job
 */
digestQueue.process('send-digest', async (job) => {
  const { userId, type } = job.data as { userId: string; type: DigestType };

  try {
    logger.info(`Processing ${type} digest for user ${userId}`);

    await digestService.generateAndSendDigest(userId, type);

    logger.info(`Successfully sent ${type} digest to user ${userId}`);

    return { success: true, userId, type };
  } catch (error) {
    logger.error(`Failed to send ${type} digest to user ${userId}:`, error);
    Sentry.captureException(error, {
      tags: { queue: 'digest', job: 'send-digest' },
      extra: { userId, type },
    });
    throw error;
  }
});

/**
 * Process daily digest batch job
 * Triggered by cron, finds eligible users and enqueues individual digest jobs
 */
digestQueue.process('batch-daily-digest', async (job) => {
  const { time, timezones } = job.data as { time: string; timezones: string[] };

  try {
    logger.info(`Processing daily digest batch for time ${time}, timezones: ${timezones.join(', ')}`);

    // Get eligible users
    const users = await digestRepository.getUsersForDailyDigest(time, timezones);

    logger.info(`Found ${users.length} users eligible for daily digest at ${time}`);

    // Enqueue individual digest jobs
    const jobs = users.map((user) =>
      digestQueue.add(
        'send-digest',
        {
          userId: user.id,
          type: 'daily' as DigestType,
        },
        {
          // Spread out sends over 10 minutes to avoid rate limits
          delay: Math.floor(Math.random() * 10 * 60 * 1000),
        }
      )
    );

    await Promise.all(jobs);

    logger.info(`Enqueued ${jobs.length} daily digest jobs`);

    return { success: true, userCount: users.length, time, timezones };
  } catch (error) {
    logger.error('Failed to process daily digest batch:', error);
    Sentry.captureException(error, {
      tags: { queue: 'digest', job: 'batch-daily-digest' },
      extra: { time, timezones },
    });
    throw error;
  }
});

/**
 * Process weekly digest batch job
 * Triggered by cron every Monday, finds eligible users and enqueues individual digest jobs
 */
digestQueue.process('batch-weekly-digest', async (job) => {
  const { timezones } = job.data as { timezones: string[] };

  try {
    logger.info(`Processing weekly digest batch for timezones: ${timezones.join(', ')}`);

    // Get eligible users
    const users = await digestRepository.getUsersForWeeklyDigest(timezones);

    logger.info(`Found ${users.length} users eligible for weekly digest`);

    // Enqueue individual digest jobs
    const jobs = users.map((user) =>
      digestQueue.add(
        'send-digest',
        {
          userId: user.id,
          type: 'weekly' as DigestType,
        },
        {
          // Spread out sends over 30 minutes to avoid rate limits
          delay: Math.floor(Math.random() * 30 * 60 * 1000),
        }
      )
    );

    await Promise.all(jobs);

    logger.info(`Enqueued ${jobs.length} weekly digest jobs`);

    return { success: true, userCount: users.length, timezones };
  } catch (error) {
    logger.error('Failed to process weekly digest batch:', error);
    Sentry.captureException(error, {
      tags: { queue: 'digest', job: 'batch-weekly-digest' },
      extra: { timezones },
    });
    throw error;
  }
});

// ============================================================================
// CRON JOBS
// ============================================================================

/**
 * Schedule daily digest cron jobs
 * Runs every hour and checks for users who need digests at that time
 */
export function scheduleDailyDigestsAt(time: string, timezones: string[]) {
  // Parse time (format: "09:00")
  const [hour, minute] = time.split(':').map(Number);

  // Create cron expression: "minute hour * * *"
  const cronExpression = `${minute} ${hour} * * *`;

  digestQueue.add(
    'batch-daily-digest',
    { time, timezones },
    {
      repeat: {
        cron: cronExpression,
        tz: 'UTC', // All times are converted to UTC
      },
      jobId: `daily-digest-${time.replace(':', '')}`,
    }
  );

  logger.info(`Scheduled daily digest for ${time} (${cronExpression}), timezones: ${timezones.join(', ')}`);
}

/**
 * Schedule weekly digest cron jobs
 * Runs every Monday at 9am in user's timezone
 */
export function scheduleWeeklyDigests(timezones: string[]) {
  // Monday at 9:00 AM = "0 9 * * 1"
  const cronExpression = '0 9 * * 1';

  digestQueue.add(
    'batch-weekly-digest',
    { timezones },
    {
      repeat: {
        cron: cronExpression,
        tz: 'UTC',
      },
      jobId: 'weekly-digest',
    }
  );

  logger.info(`Scheduled weekly digest (${cronExpression}), timezones: ${timezones.join(', ')}`);
}

/**
 * Initialize all digest cron jobs
 * Called on application startup
 */
export async function initializeDigestSchedules() {
  try {
    // Remove existing cron jobs to avoid duplicates
    const repeatableJobs = await digestQueue.getRepeatableJobs();
    for (const job of repeatableJobs) {
      await digestQueue.removeRepeatableByKey(job.key);
    }

    logger.info('Cleared existing digest schedules');

    // Common timezones to support
    const commonTimezones = [
      'UTC',
      'America/New_York',
      'America/Los_Angeles',
      'America/Chicago',
      'Europe/London',
      'Europe/Paris',
      'Europe/Berlin',
      'Asia/Tokyo',
      'Asia/Shanghai',
      'Asia/Singapore',
      'Australia/Sydney',
    ];

    // Schedule daily digests for common times
    // Most users prefer morning digests (6am-10am)
    const digestTimes = ['06:00', '07:00', '08:00', '09:00', '10:00'];

    for (const time of digestTimes) {
      scheduleDailyDigestsAt(time, commonTimezones);
    }

    // Schedule weekly digest
    scheduleWeeklyDigests(commonTimezones);

    logger.info('Digest schedules initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize digest schedules:', error);
    Sentry.captureException(error, {
      tags: { queue: 'digest', method: 'initializeDigestSchedules' },
    });
    throw error;
  }
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

digestQueue.on('completed', (job, result) => {
  logger.info(`Digest job completed: ${job.id}`, { result });
});

digestQueue.on('failed', (job, err) => {
  logger.error(`Digest job failed: ${job?.id}`, { error: err.message });
});

digestQueue.on('stalled', (job) => {
  logger.warn(`Digest job stalled: ${job.id}`);
});

// ============================================================================
// MANUAL TRIGGERS (for testing)
// ============================================================================

/**
 * Manually trigger digest for a user (for testing)
 */
export async function triggerDigestForUser(userId: string, type: DigestType) {
  return digestQueue.add('send-digest', { userId, type });
}

/**
 * Manually trigger batch digest (for testing)
 */
export async function triggerBatchDigest(type: DigestType, timezones: string[] = ['UTC']) {
  if (type === 'daily') {
    return digestQueue.add('batch-daily-digest', {
      time: '09:00',
      timezones,
    });
  } else {
    return digestQueue.add('batch-weekly-digest', { timezones });
  }
}
