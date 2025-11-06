import { Request, Response, NextFunction } from 'express';
import { performanceService } from '@/services/performance.service';
import logger from '@/utils/logger';
import * as Sentry from '@sentry/node';

/**
 * Performance Monitoring Middleware
 * Tracks API response times and alerts on slow requests
 */

export const performanceMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();

  // Track original end function
  const originalEnd = res.end;

  // Override res.end to capture response time
  res.end = function (this: Response, ...args: any[]): Response {
    const duration = Date.now() - startTime;

    // Track response time
    performanceService.trackResponseTime(duration);

    // Log request details with performance data
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Alert on very slow requests (> 1 second)
    if (duration > 1000) {
      logger.error('Very slow request detected', {
        method: req.method,
        path: req.path,
        duration: `${duration}ms`,
        query: req.query,
      });

      Sentry.captureMessage('Very slow API request', {
        level: 'error',
        tags: {
          endpoint: `${req.method} ${req.path}`,
          slow_request: 'true',
        },
        extra: {
          duration,
          method: req.method,
          path: req.path,
          query: req.query,
        },
      });
    }

    // Set performance header
    res.setHeader('X-Response-Time', `${duration}ms`);

    // Call original end function
    return originalEnd.apply(this, args);
  };

  next();
};

/**
 * Memory monitoring middleware
 * Alerts on high memory usage
 */
export const memoryMonitoringMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const memUsage = process.memoryUsage();
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
  const heapUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

  // Alert on high memory usage (> 85%)
  if (heapUsagePercent > 85) {
    logger.warn('High memory usage detected', {
      heapUsed: `${heapUsedMB}MB`,
      heapTotal: `${heapTotalMB}MB`,
      heapUsagePercent: `${heapUsagePercent.toFixed(2)}%`,
      endpoint: `${req.method} ${req.path}`,
    });

    Sentry.captureMessage('High memory usage', {
      level: 'warning',
      tags: {
        memory_alert: 'true',
      },
      extra: {
        heapUsedMB,
        heapTotalMB,
        heapUsagePercent,
        endpoint: `${req.method} ${req.path}`,
      },
    });
  }

  next();
};

/**
 * Request rate monitoring middleware
 * Tracks request rates and detects spikes
 */
class RateMonitor {
  private requestCounts: Map<string, number[]> = new Map();
  private readonly WINDOW_SIZE = 60000; // 1 minute
  private readonly SPIKE_THRESHOLD = 100; // requests per minute

  trackRequest(endpoint: string): void {
    const now = Date.now();
    const counts = this.requestCounts.get(endpoint) || [];

    // Remove old timestamps outside the window
    const recentCounts = counts.filter((timestamp) => now - timestamp < this.WINDOW_SIZE);
    recentCounts.push(now);

    this.requestCounts.set(endpoint, recentCounts);

    // Check for spike
    if (recentCounts.length > this.SPIKE_THRESHOLD) {
      logger.warn('Request rate spike detected', {
        endpoint,
        requestsPerMinute: recentCounts.length,
        threshold: this.SPIKE_THRESHOLD,
      });
    }
  }

  getRequestRate(endpoint: string): number {
    const counts = this.requestCounts.get(endpoint) || [];
    const now = Date.now();
    const recentCounts = counts.filter((timestamp) => now - timestamp < this.WINDOW_SIZE);
    return recentCounts.length;
  }

  reset(): void {
    this.requestCounts.clear();
  }
}

export const rateMonitor = new RateMonitor();

export const requestRateMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const endpoint = `${req.method} ${req.route?.path || req.path}`;
  rateMonitor.trackRequest(endpoint);
  next();
};

/**
 * Database query tracking middleware
 * Adds database query tracking to request context
 */
export const queryTrackingMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Add query tracking to request context
  (req as any).queryCount = 0;
  (req as any).queryStartTime = Date.now();

  // Track on response finish
  res.on('finish', () => {
    const queryDuration = Date.now() - (req as any).queryStartTime;
    const queryCount = (req as any).queryCount;

    if (queryCount > 20) {
      logger.warn('High query count detected', {
        endpoint: `${req.method} ${req.path}`,
        queryCount,
        queryDuration: `${queryDuration}ms`,
      });
    }
  });

  next();
};
