/**
 * Performance Monitoring Middleware
 *
 * Tracks API response times and performance metrics
 */
import { Request, Response, NextFunction } from 'express';
import logger from '@/utils/logger';
import * as Sentry from '@sentry/node';

// Threshold for slow API responses (in milliseconds)
const SLOW_RESPONSE_THRESHOLD = parseInt(process.env.SLOW_RESPONSE_THRESHOLD || '200', 10);
const VERY_SLOW_RESPONSE_THRESHOLD = parseInt(process.env.VERY_SLOW_RESPONSE_THRESHOLD || '1000', 10);

interface RequestMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalResponseTime: number;
  averageResponseTime: number;
  slowResponses: number;
  verySlowResponses: number;
  statusCodes: Record<number, number>;
  endpoints: Record<string, EndpointMetrics>;
}

interface EndpointMetrics {
  count: number;
  totalTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  errors: number;
}

const requestMetrics: RequestMetrics = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  totalResponseTime: 0,
  averageResponseTime: 0,
  slowResponses: 0,
  verySlowResponses: 0,
  statusCodes: {},
  endpoints: {},
};

/**
 * Performance monitoring middleware
 */
export function performanceMonitoringMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();

  // Capture response finish event
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const endpoint = `${req.method} ${req.route?.path || req.path}`;
    const statusCode = res.statusCode;

    // Update metrics
    requestMetrics.totalRequests++;
    requestMetrics.totalResponseTime += duration;
    requestMetrics.averageResponseTime =
      requestMetrics.totalResponseTime / requestMetrics.totalRequests;

    // Track status codes
    requestMetrics.statusCodes[statusCode] = (requestMetrics.statusCodes[statusCode] || 0) + 1;

    // Track success/failure
    if (statusCode >= 200 && statusCode < 400) {
      requestMetrics.successfulRequests++;
    } else {
      requestMetrics.failedRequests++;
    }

    // Track endpoint metrics
    if (!requestMetrics.endpoints[endpoint]) {
      requestMetrics.endpoints[endpoint] = {
        count: 0,
        totalTime: 0,
        avgTime: 0,
        minTime: Infinity,
        maxTime: 0,
        errors: 0,
      };
    }

    const endpointMetrics = requestMetrics.endpoints[endpoint];
    endpointMetrics.count++;
    endpointMetrics.totalTime += duration;
    endpointMetrics.avgTime = endpointMetrics.totalTime / endpointMetrics.count;
    endpointMetrics.minTime = Math.min(endpointMetrics.minTime, duration);
    endpointMetrics.maxTime = Math.max(endpointMetrics.maxTime, duration);

    if (statusCode >= 400) {
      endpointMetrics.errors++;
    }

    // Log slow responses
    if (duration >= SLOW_RESPONSE_THRESHOLD) {
      requestMetrics.slowResponses++;

      const logData = {
        method: req.method,
        url: req.originalUrl,
        statusCode,
        duration: `${duration}ms`,
        userAgent: req.get('user-agent'),
        ip: req.ip,
      };

      if (duration >= VERY_SLOW_RESPONSE_THRESHOLD) {
        requestMetrics.verySlowResponses++;

        // Log very slow responses as errors
        logger.error('Very slow API response', logData);

        // Send to Sentry
        Sentry.captureMessage(`Very slow API response: ${endpoint}`, {
          level: 'warning',
          tags: {
            service: 'api',
            endpoint,
            method: req.method,
            statusCode: statusCode.toString(),
            responseType: 'very_slow',
          },
          extra: {
            duration,
            threshold: VERY_SLOW_RESPONSE_THRESHOLD,
            url: req.originalUrl,
            query: req.query,
          },
        });
      } else {
        // Log slow responses as warnings
        logger.warn('Slow API response', logData);
      }
    }

    // Debug log for all requests in development
    if (process.env.NODE_ENV === 'development' && process.env.LOG_LEVEL === 'debug') {
      logger.debug('API request completed', {
        method: req.method,
        url: req.originalUrl,
        statusCode,
        duration: `${duration}ms`,
      });
    }

    // Add response time header
    res.setHeader('X-Response-Time', `${duration}ms`);
  });

  next();
}

/**
 * Request logging middleware
 */
export function requestLoggingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();

  // Log request
  logger.info('Incoming request', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Capture response
  res.on('finish', () => {
    const duration = Date.now() - startTime;

    logger.info('Request completed', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });
  });

  next();
}

/**
 * Get current request metrics
 */
export function getRequestMetrics(): RequestMetrics {
  return JSON.parse(JSON.stringify(requestMetrics));
}

/**
 * Get endpoint metrics sorted by average response time
 */
export function getSlowestEndpoints(limit: number = 10): Array<{
  endpoint: string;
  metrics: EndpointMetrics;
}> {
  return Object.entries(requestMetrics.endpoints)
    .map(([endpoint, metrics]) => ({ endpoint, metrics }))
    .sort((a, b) => b.metrics.avgTime - a.metrics.avgTime)
    .slice(0, limit);
}

/**
 * Get endpoint metrics sorted by error rate
 */
export function getEndpointsWithMostErrors(limit: number = 10): Array<{
  endpoint: string;
  metrics: EndpointMetrics;
  errorRate: number;
}> {
  return Object.entries(requestMetrics.endpoints)
    .map(([endpoint, metrics]) => ({
      endpoint,
      metrics,
      errorRate: (metrics.errors / metrics.count) * 100,
    }))
    .filter((item) => item.metrics.errors > 0)
    .sort((a, b) => b.errorRate - a.errorRate)
    .slice(0, limit);
}

/**
 * Reset request metrics
 */
export function resetRequestMetrics(): void {
  requestMetrics.totalRequests = 0;
  requestMetrics.successfulRequests = 0;
  requestMetrics.failedRequests = 0;
  requestMetrics.totalResponseTime = 0;
  requestMetrics.averageResponseTime = 0;
  requestMetrics.slowResponses = 0;
  requestMetrics.verySlowResponses = 0;
  requestMetrics.statusCodes = {};
  requestMetrics.endpoints = {};
}

/**
 * Log request metrics summary
 */
export function logRequestMetricsSummary(): void {
  const successRate = (requestMetrics.successfulRequests / requestMetrics.totalRequests) * 100;
  const slowResponseRate = (requestMetrics.slowResponses / requestMetrics.totalRequests) * 100;

  logger.info('API request metrics summary', {
    total: requestMetrics.totalRequests,
    successful: requestMetrics.successfulRequests,
    failed: requestMetrics.failedRequests,
    avgResponseTime: `${requestMetrics.averageResponseTime.toFixed(2)}ms`,
    slowResponses: requestMetrics.slowResponses,
    verySlowResponses: requestMetrics.verySlowResponses,
    successRate: `${successRate.toFixed(2)}%`,
    slowResponseRate: `${slowResponseRate.toFixed(2)}%`,
    statusCodes: requestMetrics.statusCodes,
  });

  // Log slowest endpoints
  const slowestEndpoints = getSlowestEndpoints(5);
  if (slowestEndpoints.length > 0) {
    logger.info('Slowest endpoints', {
      endpoints: slowestEndpoints.map((e) => ({
        endpoint: e.endpoint,
        avgTime: `${e.metrics.avgTime.toFixed(2)}ms`,
        maxTime: `${e.metrics.maxTime}ms`,
        count: e.metrics.count,
      })),
    });
  }

  // Log endpoints with most errors
  const errorEndpoints = getEndpointsWithMostErrors(5);
  if (errorEndpoints.length > 0) {
    logger.warn('Endpoints with most errors', {
      endpoints: errorEndpoints.map((e) => ({
        endpoint: e.endpoint,
        errors: e.metrics.errors,
        errorRate: `${e.errorRate.toFixed(2)}%`,
        count: e.metrics.count,
      })),
    });
  }
}

/**
 * Schedule periodic metrics logging
 */
export function scheduleMetricsLogging(intervalMinutes: number = 60): NodeJS.Timeout {
  const intervalMs = intervalMinutes * 60 * 1000;

  return setInterval(() => {
    logRequestMetricsSummary();
  }, intervalMs);
}

export default performanceMonitoringMiddleware;
