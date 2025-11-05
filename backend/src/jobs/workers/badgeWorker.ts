import { Job } from 'bull';
import { container } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import * as Sentry from '@sentry/node';
import logger from '@/utils/logger';
import { badgeQueue, BadgeJobData } from '../queues/badgeQueue';
import { BadgeService } from '@/modules/forum/services/badgeService';

/**
 * Badge Worker
 *
 * Processes badge checking and awarding jobs:
 * - Check all users for badge eligibility (hourly)
 * - Check specific user for badge eligibility (event-driven)
 * - Award badges when criteria are met
 * - Send notifications for earned badges
 */

const prisma = new PrismaClient();

// Resolve service from DI container
const getBadgeService = (): BadgeService => {
  return container.resolve(BadgeService);
};

/**
 * Process badge jobs
 */
badgeQueue.process(async (job: Job<BadgeJobData>) => {
  const startTime = Date.now();

  try {
    logger.info(`Processing badge job ${job.id}`, {
      jobType: job.data.jobType,
      userId: job.data.userId,
      triggeredBy: job.data.triggeredBy,
    });

    const badgeService = getBadgeService();
    let result: any;

    switch (job.data.jobType) {
      case 'check_user':
        if (!job.data.userId) {
          throw new Error('userId is required for check_user job');
        }

        const badgesAwarded = await badgeService.checkAndAwardBadges(job.data.userId);
        result = {
          userId: job.data.userId,
          badgesAwarded: badgesAwarded.length,
          badgeIds: badgesAwarded,
        };

        logger.info('User badge check completed', {
          userId: job.data.userId,
          badgesAwarded: badgesAwarded.length,
          duration: Date.now() - startTime,
        });
        break;

      case 'check_all_users':
        // Get all active users (batch processing)
        const batchSize = 100;
        let offset = 0;
        let totalUsersProcessed = 0;
        let totalBadgesAwarded = 0;

        while (true) {
          const users = await prisma.user.findMany({
            where: {
              status: 'active',
            },
            select: {
              id: true,
            },
            skip: offset,
            take: batchSize,
          });

          if (users.length === 0) {
            break;
          }

          // Process users in batch
          for (const user of users) {
            try {
              const badges = await badgeService.checkAndAwardBadges(user.id);
              totalBadgesAwarded += badges.length;
              totalUsersProcessed++;
            } catch (error) {
              logger.error(`Error checking badges for user ${user.id}:`, error);
              // Continue processing other users
            }
          }

          offset += batchSize;

          // Update job progress
          await job.progress((offset / (offset + batchSize)) * 100);
        }

        result = {
          usersProcessed: totalUsersProcessed,
          badgesAwarded: totalBadgesAwarded,
        };

        logger.info('All users badge check completed', {
          usersProcessed: totalUsersProcessed,
          badgesAwarded: totalBadgesAwarded,
          duration: Date.now() - startTime,
        });
        break;

      default:
        throw new Error(`Unknown job type: ${job.data.jobType}`);
    }

    Sentry.addBreadcrumb({
      category: 'jobs',
      message: 'Badge job completed successfully',
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

    logger.error(`Badge job ${job.id} failed:`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      jobData: job.data,
      attemptsMade: job.attemptsMade,
      duration,
    });

    Sentry.captureException(error, {
      tags: {
        worker: 'badgeWorker',
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

logger.info('Badge worker started');

export default badgeQueue;
