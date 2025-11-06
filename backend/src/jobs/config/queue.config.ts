import { QueueOptions, WorkerOptions, JobsOptions } from 'bullmq';
import redisClient from '@/config/redisClient';
import logger from '@/utils/logger';
import * as Sentry from '@sentry/node';

/**
 * Optimized Bull Queue Configuration
 *
 * Performance Features:
 * - Connection pooling
 * - Automatic retries with exponential backoff
 * - Rate limiting
 * - Job prioritization
 * - Dead letter queue
 * - Metrics tracking
 */

// Redis connection for BullMQ
const connection = {
  host: process.env.REDIS_URL?.split('://')[1]?.split(':')[0] || 'localhost',
  port: parseInt(process.env.REDIS_URL?.split(':')[2] || '6379', 10),
  maxRetriesPerRequest: null, // BullMQ handles retries
  enableReadyCheck: false,
  // Connection pool settings
  maxRetries: 10,
  enableOfflineQueue: true,
};

/**
 * Default queue options (optimized for performance)
 */
export const defaultQueueOptions: QueueOptions = {
  connection,
  defaultJobOptions: {
    attempts: 3, // Retry failed jobs 3 times
    backoff: {
      type: 'exponential',
      delay: 5000, // Start with 5 seconds
    },
    removeOnComplete: {
      age: 3600, // Keep completed jobs for 1 hour
      count: 1000, // Keep last 1000 completed jobs
    },
    removeOnFail: {
      age: 86400, // Keep failed jobs for 24 hours
      count: 5000, // Keep last 5000 failed jobs for analysis
    },
  },
};

/**
 * Default worker options
 */
export const defaultWorkerOptions: WorkerOptions = {
  connection,
  concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5', 10),
  lockDuration: 30000, // 30 seconds
  maxStalledCount: 3, // Retry stalled jobs 3 times
  stalledInterval: 30000, // Check for stalled jobs every 30s
  autorun: true,
};

/**
 * Priority queue options (for high-priority jobs)
 */
export const priorityQueueOptions: QueueOptions = {
  ...defaultQueueOptions,
  defaultJobOptions: {
    ...defaultQueueOptions.defaultJobOptions,
    priority: 1, // Higher priority
  },
};

/**
 * Bulk operation queue options (for large batches)
 */
export const bulkQueueOptions: QueueOptions = {
  ...defaultQueueOptions,
  defaultJobOptions: {
    ...defaultQueueOptions.defaultJobOptions,
    attempts: 5, // More retries for bulk operations
    backoff: {
      type: 'exponential',
      delay: 10000, // Start with 10 seconds
    },
  },
};

/**
 * Real-time queue options (for time-sensitive jobs)
 */
export const realtimeQueueOptions: QueueOptions = {
  ...defaultQueueOptions,
  defaultJobOptions: {
    ...defaultQueueOptions.defaultJobOptions,
    priority: 10, // Highest priority
    attempts: 1, // No retries - fail fast
    timeout: 5000, // 5 second timeout
    removeOnComplete: true, // Remove immediately
  },
};

/**
 * Rate-limited queue options (for external API calls)
 */
export const rateLimitedQueueOptions: QueueOptions = {
  ...defaultQueueOptions,
  defaultJobOptions: {
    ...defaultQueueOptions.defaultJobOptions,
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 30000, // Start with 30 seconds for rate-limited APIs
    },
  },
  limiter: {
    max: 10, // Max 10 jobs
    duration: 1000, // Per second
  },
};

/**
 * Email queue options (external service)
 */
export const emailQueueOptions: QueueOptions = {
  ...defaultQueueOptions,
  defaultJobOptions: {
    ...defaultQueueOptions.defaultJobOptions,
    attempts: 5, // Email delivery is critical
    backoff: {
      type: 'exponential',
      delay: 60000, // Start with 1 minute
    },
    removeOnComplete: {
      age: 86400, // Keep for 24 hours
      count: 10000,
    },
  },
  limiter: {
    max: 50, // Max 50 emails
    duration: 1000, // Per second (respect SendGrid limits)
  },
};

/**
 * Job type configurations
 */
export const jobTypeConfigs: Record<string, Partial<JobsOptions>> = {
  // Notifications
  'notification:send': {
    priority: 5,
    attempts: 3,
    delay: 0,
  },

  'notification:digest': {
    priority: 3,
    attempts: 5,
    removeOnComplete: 100,
  },

  // Analytics
  'analytics:aggregate': {
    priority: 2,
    attempts: 3,
    timeout: 60000, // 1 minute
  },

  'analytics:process': {
    priority: 1,
    attempts: 2,
    timeout: 30000,
  },

  // Badge processing
  'badge:check': {
    priority: 2,
    attempts: 3,
    timeout: 30000,
  },

  // Leaderboard
  'leaderboard:update': {
    priority: 3,
    attempts: 5,
    timeout: 120000, // 2 minutes for complex calculations
  },

  // Article scheduling
  'article:publish': {
    priority: 8,
    attempts: 3,
    delay: 0,
  },

  // Email
  'email:send': {
    priority: 5,
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 60000,
    },
  },

  // Job matching
  'job:match': {
    priority: 4,
    attempts: 3,
    timeout: 45000,
  },

  // Cleanup tasks
  'cleanup:sessions': {
    priority: 1,
    attempts: 2,
    timeout: 300000, // 5 minutes
  },

  'cleanup:old-data': {
    priority: 1,
    attempts: 2,
    timeout: 600000, // 10 minutes
  },
};

/**
 * Get job options for specific job type
 */
export function getJobOptions(jobType: string): Partial<JobsOptions> {
  return jobTypeConfigs[jobType] || {};
}

/**
 * Queue event handlers (for monitoring)
 */
export function setupQueueEventHandlers(queue: any, queueName: string): void {
  queue.on('error', (error: Error) => {
    logger.error(`Queue ${queueName} error:`, error);
    Sentry.captureException(error, {
      tags: { queue: queueName, service: 'bull' },
    });
  });

  queue.on('waiting', (jobId: string) => {
    logger.debug(`Job ${jobId} waiting in queue ${queueName}`);
  });

  queue.on('active', (job: any) => {
    logger.debug(`Job ${job.id} active in queue ${queueName}`);
  });

  queue.on('completed', (job: any, result: any) => {
    logger.info(`Job ${job.id} completed in queue ${queueName}`, {
      duration: job.processedOn ? Date.now() - job.processedOn : 'unknown',
    });
  });

  queue.on('failed', (job: any, error: Error) => {
    logger.error(`Job ${job?.id} failed in queue ${queueName}:`, error);

    Sentry.captureException(error, {
      tags: {
        queue: queueName,
        jobId: job?.id,
        jobType: job?.name,
        service: 'bull',
      },
      extra: {
        jobData: job?.data,
        attemptsMade: job?.attemptsMade,
        stacktrace: job?.stacktrace,
      },
    });
  });

  queue.on('stalled', (jobId: string) => {
    logger.warn(`Job ${jobId} stalled in queue ${queueName}`);

    Sentry.captureMessage(`Job stalled: ${jobId}`, {
      level: 'warning',
      tags: { queue: queueName, service: 'bull' },
    });
  });

  queue.on('progress', (job: any, progress: number) => {
    logger.debug(`Job ${job.id} progress: ${progress}%`);
  });

  queue.on('removed', (job: any) => {
    logger.debug(`Job ${job.id} removed from queue ${queueName}`);
  });

  queue.on('drained', () => {
    logger.info(`Queue ${queueName} drained (all jobs processed)`);
  });

  queue.on('paused', () => {
    logger.warn(`Queue ${queueName} paused`);
  });

  queue.on('resumed', () => {
    logger.info(`Queue ${queueName} resumed`);
  });
}

/**
 * Worker event handlers
 */
export function setupWorkerEventHandlers(worker: any, workerName: string): void {
  worker.on('error', (error: Error) => {
    logger.error(`Worker ${workerName} error:`, error);
    Sentry.captureException(error, {
      tags: { worker: workerName, service: 'bull' },
    });
  });

  worker.on('ready', () => {
    logger.info(`Worker ${workerName} ready`);
  });

  worker.on('active', (job: any) => {
    logger.debug(`Worker ${workerName} processing job ${job.id}`);
  });

  worker.on('completed', (job: any) => {
    const processingTime = job.finishedOn - job.processedOn;
    logger.info(`Worker ${workerName} completed job ${job.id}`, {
      processingTime: `${processingTime}ms`,
    });
  });

  worker.on('failed', (job: any, error: Error) => {
    logger.error(`Worker ${workerName} failed job ${job?.id}:`, error);
  });

  worker.on('stalled', (jobId: string) => {
    logger.warn(`Worker ${workerName} job ${jobId} stalled`);
  });

  worker.on('paused', () => {
    logger.warn(`Worker ${workerName} paused`);
  });

  worker.on('resumed', () => {
    logger.info(`Worker ${workerName} resumed`);
  });

  worker.on('closing', () => {
    logger.info(`Worker ${workerName} closing`);
  });

  worker.on('closed', () => {
    logger.info(`Worker ${workerName} closed`);
  });
}

/**
 * Get queue metrics
 */
export async function getQueueMetrics(queue: any): Promise<any> {
  try {
    const [
      waitingCount,
      activeCount,
      completedCount,
      failedCount,
      delayedCount,
    ] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    return {
      waiting: waitingCount,
      active: activeCount,
      completed: completedCount,
      failed: failedCount,
      delayed: delayedCount,
      total: waitingCount + activeCount + delayedCount,
    };
  } catch (error) {
    logger.error('Failed to get queue metrics:', error);
    return null;
  }
}

/**
 * Clean up old jobs (maintenance)
 */
export async function cleanupQueue(queue: any, options: {
  grace?: number;
  status?: 'completed' | 'failed' | 'delayed';
  limit?: number;
} = {}): Promise<void> {
  try {
    const grace = options.grace || 86400000; // 24 hours
    const status = options.status || 'completed';
    const limit = options.limit || 1000;

    await queue.clean(grace, limit, status);

    logger.info(`Cleaned up ${status} jobs from queue ${queue.name}`);
  } catch (error) {
    logger.error(`Failed to clean up queue ${queue.name}:`, error);
    throw error;
  }
}

export default {
  defaultQueueOptions,
  defaultWorkerOptions,
  priorityQueueOptions,
  bulkQueueOptions,
  realtimeQueueOptions,
  rateLimitedQueueOptions,
  emailQueueOptions,
  getJobOptions,
  setupQueueEventHandlers,
  setupWorkerEventHandlers,
  getQueueMetrics,
  cleanupQueue,
};
