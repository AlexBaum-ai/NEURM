/**
 * Prisma Logging Middleware
 *
 * Logs slow queries and tracks database performance
 */
import { Prisma } from '@prisma/client';
import logger from '@/utils/logger';
import * as Sentry from '@sentry/node';

// Threshold for slow queries (in milliseconds)
const SLOW_QUERY_THRESHOLD = parseInt(process.env.SLOW_QUERY_THRESHOLD || '100', 10);
const VERY_SLOW_QUERY_THRESHOLD = parseInt(process.env.VERY_SLOW_QUERY_THRESHOLD || '1000', 10);

interface QueryMetrics {
  totalQueries: number;
  slowQueries: number;
  verySlowQueries: number;
  totalDuration: number;
  averageDuration: number;
}

const queryMetrics: QueryMetrics = {
  totalQueries: 0,
  slowQueries: 0,
  verySlowQueries: 0,
  totalDuration: 0,
  averageDuration: 0,
};

/**
 * Prisma middleware for query logging and performance tracking
 */
export const prismaLoggingMiddleware: Prisma.Middleware = async (params, next) => {
  const startTime = Date.now();

  try {
    const result = await next(params);
    const duration = Date.now() - startTime;

    // Update metrics
    queryMetrics.totalQueries++;
    queryMetrics.totalDuration += duration;
    queryMetrics.averageDuration = queryMetrics.totalDuration / queryMetrics.totalQueries;

    // Log slow queries
    if (duration >= SLOW_QUERY_THRESHOLD) {
      queryMetrics.slowQueries++;

      const logData = {
        model: params.model,
        action: params.action,
        duration: `${duration}ms`,
        args: JSON.stringify(params.args),
      };

      if (duration >= VERY_SLOW_QUERY_THRESHOLD) {
        queryMetrics.verySlowQueries++;

        // Log very slow queries as errors
        logger.error('Very slow database query detected', logData);

        // Send to Sentry for very slow queries
        Sentry.captureMessage(`Very slow query: ${params.model}.${params.action}`, {
          level: 'warning',
          tags: {
            service: 'database',
            model: params.model || 'unknown',
            action: params.action,
            queryType: 'very_slow',
          },
          extra: {
            duration,
            threshold: VERY_SLOW_QUERY_THRESHOLD,
            args: params.args,
          },
        });
      } else {
        // Log slow queries as warnings
        logger.warn('Slow database query detected', logData);
      }
    }

    // Debug log for all queries in development
    if (process.env.NODE_ENV === 'development' && process.env.LOG_LEVEL === 'debug') {
      logger.debug('Database query executed', {
        model: params.model,
        action: params.action,
        duration: `${duration}ms`,
      });
    }

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    // Log failed queries
    logger.error('Database query failed', {
      model: params.model,
      action: params.action,
      duration: `${duration}ms`,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    // Send to Sentry
    Sentry.captureException(error, {
      tags: {
        service: 'database',
        model: params.model || 'unknown',
        action: params.action,
      },
      extra: {
        duration,
        args: params.args,
      },
    });

    throw error;
  }
};

/**
 * Get current query metrics
 */
export function getQueryMetrics(): QueryMetrics {
  return { ...queryMetrics };
}

/**
 * Reset query metrics
 */
export function resetQueryMetrics(): void {
  queryMetrics.totalQueries = 0;
  queryMetrics.slowQueries = 0;
  queryMetrics.verySlowQueries = 0;
  queryMetrics.totalDuration = 0;
  queryMetrics.averageDuration = 0;
}

/**
 * Log query metrics summary
 */
export function logQueryMetricsSummary(): void {
  logger.info('Database query metrics summary', {
    total: queryMetrics.totalQueries,
    slow: queryMetrics.slowQueries,
    verySlow: queryMetrics.verySlowQueries,
    avgDuration: `${queryMetrics.averageDuration.toFixed(2)}ms`,
    slowQueryRate: `${((queryMetrics.slowQueries / queryMetrics.totalQueries) * 100).toFixed(2)}%`,
  });
}

export default prismaLoggingMiddleware;
