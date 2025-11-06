/**
 * Monitoring Service
 *
 * Provides health checks, metrics collection, and system monitoring
 */
import prisma from '@/config/database';
import redisClient from '@/config/redisClient';
import logger from '@/utils/logger';
import * as Sentry from '@sentry/node';
import { analyticsQueue } from '@/jobs/queues/analyticsQueue';
import { articleSchedulerQueue } from '@/jobs/queues/articleSchedulerQueue';
import { getQueueMetrics } from '@/jobs/config/queue.config';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  services: {
    database: ServiceStatus;
    redis: ServiceStatus;
    queues: QueueStatus;
    memory: MemoryStatus;
  };
  version: string;
  environment: string;
}

export interface ServiceStatus {
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  message?: string;
  error?: string;
}

export interface QueueStatus {
  status: 'up' | 'down' | 'degraded';
  queues: {
    [queueName: string]: {
      waiting: number;
      active: number;
      completed: number;
      failed: number;
      delayed: number;
      total: number;
    };
  };
  message?: string;
}

export interface MemoryStatus {
  status: 'up' | 'degraded';
  usage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
    heapUsedMB: string;
    heapTotalMB: string;
    rssMB: string;
  };
  percentage: number;
}

export interface SystemMetrics {
  timestamp: string;
  uptime: number;
  memory: MemoryStatus;
  cpu: {
    usage: number;
  };
  requests: {
    total: number;
    successful: number;
    failed: number;
    avgResponseTime: number;
  };
}

/**
 * Check database health
 */
export async function checkDatabaseHealth(): Promise<ServiceStatus> {
  const startTime = Date.now();

  try {
    // Simple query to check connectivity
    await prisma.$queryRaw`SELECT 1`;

    const responseTime = Date.now() - startTime;

    // Warn if query takes too long
    if (responseTime > 1000) {
      logger.warn(`Database health check slow: ${responseTime}ms`);
      return {
        status: 'degraded',
        responseTime,
        message: 'Database responding slowly',
      };
    }

    return {
      status: 'up',
      responseTime,
      message: 'Database connection established',
    };
  } catch (error) {
    logger.error('Database health check failed:', error);
    Sentry.captureException(error, {
      tags: { service: 'database', healthCheck: 'failed' },
    });

    return {
      status: 'down',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check Redis health
 */
export async function checkRedisHealth(): Promise<ServiceStatus> {
  const startTime = Date.now();

  try {
    // Check if Redis client is ready
    if (!redisClient.isReady) {
      return {
        status: 'down',
        responseTime: Date.now() - startTime,
        message: 'Redis client not ready',
      };
    }

    // Ping Redis
    await redisClient.ping();

    const responseTime = Date.now() - startTime;

    // Warn if Redis is slow
    if (responseTime > 500) {
      logger.warn(`Redis health check slow: ${responseTime}ms`);
      return {
        status: 'degraded',
        responseTime,
        message: 'Redis responding slowly',
      };
    }

    return {
      status: 'up',
      responseTime,
      message: 'Redis connection established',
    };
  } catch (error) {
    logger.error('Redis health check failed:', error);

    // Redis failures are non-critical - system can continue without cache
    return {
      status: 'down',
      responseTime: Date.now() - startTime,
      message: 'Redis unavailable (graceful degradation active)',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check queue health
 */
export async function checkQueueHealth(): Promise<QueueStatus> {
  try {
    const queues = [
      { name: 'analytics', queue: analyticsQueue },
      { name: 'articleScheduler', queue: articleSchedulerQueue },
    ];

    const queueStatuses: QueueStatus['queues'] = {};
    let hasFailures = false;
    let hasDegradation = false;

    for (const { name, queue } of queues) {
      const metrics = await getQueueMetrics(queue);

      if (!metrics) {
        hasFailures = true;
        continue;
      }

      queueStatuses[name] = metrics;

      // Check if queue is backed up
      if (metrics.waiting > 100 || metrics.failed > 50) {
        hasDegradation = true;
      }
    }

    return {
      status: hasFailures ? 'down' : hasDegradation ? 'degraded' : 'up',
      queues: queueStatuses,
      message: hasFailures
        ? 'One or more queues unavailable'
        : hasDegradation
        ? 'Queues experiencing high load'
        : 'All queues operational',
    };
  } catch (error) {
    logger.error('Queue health check failed:', error);
    Sentry.captureException(error, {
      tags: { service: 'queue', healthCheck: 'failed' },
    });

    return {
      status: 'down',
      queues: {},
      message: error instanceof Error ? error.message : 'Queue check failed',
    };
  }
}

/**
 * Check memory status
 */
export function checkMemoryHealth(): MemoryStatus {
  const memUsage = process.memoryUsage();

  const heapUsedMB = (memUsage.heapUsed / 1024 / 1024).toFixed(2);
  const heapTotalMB = (memUsage.heapTotal / 1024 / 1024).toFixed(2);
  const rssMB = (memUsage.rss / 1024 / 1024).toFixed(2);

  const percentage = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);

  return {
    status: percentage > 90 ? 'degraded' : 'up',
    usage: {
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss,
      heapUsedMB: `${heapUsedMB} MB`,
      heapTotalMB: `${heapTotalMB} MB`,
      rssMB: `${rssMB} MB`,
    },
    percentage,
  };
}

/**
 * Perform comprehensive health check
 */
export async function performHealthCheck(): Promise<HealthCheckResult> {
  try {
    // Run all health checks in parallel
    const [database, redis, queues] = await Promise.all([
      checkDatabaseHealth(),
      checkRedisHealth(),
      checkQueueHealth(),
    ]);

    const memory = checkMemoryHealth();

    // Determine overall health status
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';

    if (database.status === 'down') {
      overallStatus = 'unhealthy';
    } else if (
      database.status === 'degraded' ||
      redis.status === 'degraded' ||
      queues.status === 'degraded' ||
      memory.status === 'degraded'
    ) {
      overallStatus = 'degraded';
    } else if (redis.status === 'down' || queues.status === 'down') {
      // Redis and queues are non-critical, so degraded not unhealthy
      overallStatus = 'degraded';
    } else {
      overallStatus = 'healthy';
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database,
        redis,
        queues,
        memory,
      },
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };
  } catch (error) {
    logger.error('Health check failed:', error);
    Sentry.captureException(error, {
      tags: { service: 'monitoring', healthCheck: 'failed' },
    });

    throw error;
  }
}

/**
 * Get system metrics
 */
export function getSystemMetrics(): SystemMetrics {
  const memory = checkMemoryHealth();
  const cpuUsage = process.cpuUsage();

  return {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory,
    cpu: {
      usage: (cpuUsage.user + cpuUsage.system) / 1000000, // Convert to seconds
    },
    requests: {
      total: 0, // Will be populated by middleware
      successful: 0,
      failed: 0,
      avgResponseTime: 0,
    },
  };
}

/**
 * Log health check results
 */
export function logHealthCheck(result: HealthCheckResult): void {
  const logData = {
    status: result.status,
    uptime: result.uptime,
    database: result.services.database.status,
    redis: result.services.redis.status,
    queues: result.services.queues.status,
    memory: result.services.memory.percentage,
  };

  if (result.status === 'unhealthy') {
    logger.error('System health check: UNHEALTHY', logData);
  } else if (result.status === 'degraded') {
    logger.warn('System health check: DEGRADED', logData);
  } else {
    logger.info('System health check: HEALTHY', logData);
  }
}

/**
 * Check if alert should be sent
 */
export function shouldSendAlert(result: HealthCheckResult): boolean {
  // Alert on unhealthy status
  if (result.status === 'unhealthy') {
    return true;
  }

  // Alert if database is down
  if (result.services.database.status === 'down') {
    return true;
  }

  // Alert if memory usage is critical (>95%)
  if (result.services.memory.percentage > 95) {
    return true;
  }

  return false;
}

/**
 * Send alert via Sentry
 */
export function sendAlert(result: HealthCheckResult, message: string): void {
  logger.error(`ALERT: ${message}`, result);

  Sentry.captureMessage(message, {
    level: 'error',
    tags: {
      service: 'monitoring',
      alert: 'critical',
      status: result.status,
    },
    extra: {
      healthCheck: result,
    },
  });
}

export default {
  performHealthCheck,
  checkDatabaseHealth,
  checkRedisHealth,
  checkQueueHealth,
  checkMemoryHealth,
  getSystemMetrics,
  logHealthCheck,
  shouldSendAlert,
  sendAlert,
};
