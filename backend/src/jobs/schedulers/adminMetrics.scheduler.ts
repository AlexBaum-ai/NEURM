/**
 * Admin Metrics Scheduler
 *
 * Cron job to precompute daily platform metrics
 * Runs every day at midnight to calculate and store metrics for the previous day
 */

import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { AdminService } from '../../modules/admin/admin.service';
import logger from '../../utils/logger';
import * as Sentry from '@sentry/node';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const adminService = new AdminService(prisma, redis);

/**
 * Schedule daily metrics precomputation
 * Runs at 00:30 AM every day (30 minutes after midnight)
 * This gives time for any late-night transactions to complete
 */
export const scheduleAdminMetricsPrecomputation = () => {
  // Schedule: "30 0 * * *" = At 00:30 AM every day
  const cronExpression = '30 0 * * *';

  cron.schedule(
    cronExpression,
    async () => {
      const transaction = Sentry.startTransaction({
        op: 'cron',
        name: 'AdminMetricsPrecomputation',
      });

      const startTime = Date.now();

      try {
        logger.info('Starting scheduled admin metrics precomputation');

        // Calculate metrics for yesterday
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        await adminService.precomputeDailyMetrics(yesterday);

        const executionTime = Date.now() - startTime;
        logger.info('Scheduled admin metrics precomputation completed', {
          executionTime,
          date: yesterday.toISOString().split('T')[0],
        });

        transaction.finish();
      } catch (error) {
        transaction.finish();
        Sentry.captureException(error, {
          tags: {
            cronJob: 'adminMetricsPrecomputation',
          },
        });

        logger.error('Scheduled admin metrics precomputation failed', {
          error,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
    },
    {
      scheduled: true,
      timezone: process.env.TZ || 'UTC',
    }
  );

  logger.info('Admin metrics precomputation cron job scheduled', {
    schedule: cronExpression,
    timezone: process.env.TZ || 'UTC',
  });
};

/**
 * Initialize and start the scheduler
 */
export const startAdminMetricsScheduler = () => {
  try {
    scheduleAdminMetricsPrecomputation();
    logger.info('Admin metrics scheduler started successfully');
  } catch (error) {
    Sentry.captureException(error);
    logger.error('Failed to start admin metrics scheduler', { error });
    throw error;
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing admin metrics scheduler');
  await prisma.$disconnect();
  redis.disconnect();
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing admin metrics scheduler');
  await prisma.$disconnect();
  redis.disconnect();
});
