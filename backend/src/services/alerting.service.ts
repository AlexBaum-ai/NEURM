/**
 * Alerting Service
 *
 * Manages alerts for critical errors, performance issues, and system degradation
 */
import logger from '@/utils/logger';
import * as Sentry from '@sentry/node';
import { HealthCheckResult } from './monitoring.service';
import { getRequestMetrics } from '@/middleware/performance-monitoring.middleware';
import { getQueryMetrics } from '@/middleware/prisma-logging.middleware';

export interface AlertThresholds {
  // Performance thresholds
  avgResponseTime: number; // Average API response time (ms)
  slowResponseRate: number; // Percentage of slow responses
  errorRate: number; // Percentage of failed requests

  // Database thresholds
  avgQueryTime: number; // Average database query time (ms)
  slowQueryRate: number; // Percentage of slow queries

  // Memory thresholds
  memoryUsagePercent: number; // Memory usage percentage

  // Queue thresholds
  queueWaitingJobs: number; // Number of waiting jobs
  queueFailedJobs: number; // Number of failed jobs
}

export interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  category: 'performance' | 'error' | 'resource' | 'queue' | 'database';
  message: string;
  details: any;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
}

// Default alert thresholds
export const DEFAULT_THRESHOLDS: AlertThresholds = {
  avgResponseTime: 200, // 200ms average response time
  slowResponseRate: 10, // 10% of requests are slow
  errorRate: 5, // 5% error rate

  avgQueryTime: 100, // 100ms average query time
  slowQueryRate: 10, // 10% of queries are slow

  memoryUsagePercent: 90, // 90% memory usage

  queueWaitingJobs: 500, // 500 waiting jobs
  queueFailedJobs: 100, // 100 failed jobs
};

// Alert storage (in-memory, should be persisted in production)
const activeAlerts: Map<string, Alert> = new Map();
const alertHistory: Alert[] = [];

let alertThresholds: AlertThresholds = { ...DEFAULT_THRESHOLDS };

/**
 * Set alert thresholds
 */
export function setAlertThresholds(thresholds: Partial<AlertThresholds>): void {
  alertThresholds = {
    ...alertThresholds,
    ...thresholds,
  };

  logger.info('Alert thresholds updated', alertThresholds);
}

/**
 * Get alert thresholds
 */
export function getAlertThresholds(): AlertThresholds {
  return { ...alertThresholds };
}

/**
 * Create a new alert
 */
function createAlert(
  type: Alert['type'],
  category: Alert['category'],
  message: string,
  details: any
): Alert {
  const alert: Alert = {
    id: `${category}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    category,
    message,
    details,
    timestamp: new Date().toISOString(),
    resolved: false,
  };

  // Store alert
  activeAlerts.set(alert.id, alert);
  alertHistory.push(alert);

  // Log alert
  logger[type === 'critical' ? 'error' : type === 'warning' ? 'warn' : 'info'](
    `ALERT: ${message}`,
    {
      alertId: alert.id,
      category,
      details,
    }
  );

  // Send to Sentry for critical and warning alerts
  if (type === 'critical' || type === 'warning') {
    Sentry.captureMessage(message, {
      level: type === 'critical' ? 'error' : 'warning',
      tags: {
        service: 'alerting',
        category,
        alertType: type,
      },
      extra: {
        alertId: alert.id,
        details,
      },
    });
  }

  return alert;
}

/**
 * Resolve an alert
 */
export function resolveAlert(alertId: string): boolean {
  const alert = activeAlerts.get(alertId);

  if (!alert) {
    return false;
  }

  alert.resolved = true;
  alert.resolvedAt = new Date().toISOString();
  activeAlerts.delete(alertId);

  logger.info(`Alert resolved: ${alert.message}`, { alertId });

  return true;
}

/**
 * Get active alerts
 */
export function getActiveAlerts(): Alert[] {
  return Array.from(activeAlerts.values());
}

/**
 * Get alert history
 */
export function getAlertHistory(limit: number = 100): Alert[] {
  return alertHistory.slice(-limit);
}

/**
 * Check API performance and create alerts
 */
export function checkAPIPerformance(): Alert[] {
  const alerts: Alert[] = [];
  const metrics = getRequestMetrics();

  if (metrics.totalRequests === 0) {
    return alerts;
  }

  // Check average response time
  if (metrics.averageResponseTime > alertThresholds.avgResponseTime) {
    alerts.push(
      createAlert(
        'warning',
        'performance',
        `High average API response time: ${metrics.averageResponseTime.toFixed(2)}ms`,
        {
          current: metrics.averageResponseTime,
          threshold: alertThresholds.avgResponseTime,
          totalRequests: metrics.totalRequests,
        }
      )
    );
  }

  // Check slow response rate
  const slowResponseRate = (metrics.slowResponses / metrics.totalRequests) * 100;
  if (slowResponseRate > alertThresholds.slowResponseRate) {
    alerts.push(
      createAlert(
        'warning',
        'performance',
        `High slow response rate: ${slowResponseRate.toFixed(2)}%`,
        {
          current: slowResponseRate,
          threshold: alertThresholds.slowResponseRate,
          slowResponses: metrics.slowResponses,
          totalRequests: metrics.totalRequests,
        }
      )
    );
  }

  // Check error rate
  const errorRate = (metrics.failedRequests / metrics.totalRequests) * 100;
  if (errorRate > alertThresholds.errorRate) {
    alerts.push(
      createAlert(
        errorRate > 20 ? 'critical' : 'warning',
        'error',
        `High error rate: ${errorRate.toFixed(2)}%`,
        {
          current: errorRate,
          threshold: alertThresholds.errorRate,
          failedRequests: metrics.failedRequests,
          totalRequests: metrics.totalRequests,
          statusCodes: metrics.statusCodes,
        }
      )
    );
  }

  return alerts;
}

/**
 * Check database performance and create alerts
 */
export function checkDatabasePerformance(): Alert[] {
  const alerts: Alert[] = [];
  const metrics = getQueryMetrics();

  if (metrics.totalQueries === 0) {
    return alerts;
  }

  // Check average query time
  if (metrics.averageDuration > alertThresholds.avgQueryTime) {
    alerts.push(
      createAlert(
        'warning',
        'database',
        `High average database query time: ${metrics.averageDuration.toFixed(2)}ms`,
        {
          current: metrics.averageDuration,
          threshold: alertThresholds.avgQueryTime,
          totalQueries: metrics.totalQueries,
        }
      )
    );
  }

  // Check slow query rate
  const slowQueryRate = (metrics.slowQueries / metrics.totalQueries) * 100;
  if (slowQueryRate > alertThresholds.slowQueryRate) {
    alerts.push(
      createAlert(
        'warning',
        'database',
        `High slow query rate: ${slowQueryRate.toFixed(2)}%`,
        {
          current: slowQueryRate,
          threshold: alertThresholds.slowQueryRate,
          slowQueries: metrics.slowQueries,
          totalQueries: metrics.totalQueries,
        }
      )
    );
  }

  return alerts;
}

/**
 * Check memory usage and create alerts
 */
export function checkMemoryUsage(): Alert[] {
  const alerts: Alert[] = [];
  const memUsage = process.memoryUsage();
  const percentage = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);

  if (percentage > alertThresholds.memoryUsagePercent) {
    alerts.push(
      createAlert(
        percentage > 95 ? 'critical' : 'warning',
        'resource',
        `High memory usage: ${percentage}%`,
        {
          current: percentage,
          threshold: alertThresholds.memoryUsagePercent,
          heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
          heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
        }
      )
    );
  }

  return alerts;
}

/**
 * Check system health and create alerts
 */
export function checkSystemHealth(healthCheck: HealthCheckResult): Alert[] {
  const alerts: Alert[] = [];

  // Check overall system status
  if (healthCheck.status === 'unhealthy') {
    alerts.push(
      createAlert('critical', 'error', 'System is unhealthy', {
        health: healthCheck,
      })
    );
  }

  // Check database status
  if (healthCheck.services.database.status === 'down') {
    alerts.push(
      createAlert('critical', 'database', 'Database is down', {
        database: healthCheck.services.database,
      })
    );
  }

  // Check Redis status (non-critical but should alert)
  if (healthCheck.services.redis.status === 'down') {
    alerts.push(
      createAlert('warning', 'resource', 'Redis is unavailable', {
        redis: healthCheck.services.redis,
      })
    );
  }

  // Check queue status
  if (healthCheck.services.queues.status === 'down') {
    alerts.push(
      createAlert('warning', 'queue', 'Job queues are unavailable', {
        queues: healthCheck.services.queues,
      })
    );
  } else if (healthCheck.services.queues.status === 'degraded') {
    alerts.push(
      createAlert('warning', 'queue', 'Job queues are experiencing high load', {
        queues: healthCheck.services.queues,
      })
    );
  }

  return alerts;
}

/**
 * Run all health checks and create alerts
 */
export function checkAllSystems(healthCheck: HealthCheckResult): Alert[] {
  const alerts: Alert[] = [];

  // Check system health
  alerts.push(...checkSystemHealth(healthCheck));

  // Check API performance
  alerts.push(...checkAPIPerformance());

  // Check database performance
  alerts.push(...checkDatabasePerformance());

  // Check memory usage
  alerts.push(...checkMemoryUsage());

  return alerts;
}

/**
 * Schedule periodic alert checks
 */
export function scheduleAlertChecks(
  intervalMinutes: number = 5,
  healthCheckFn: () => Promise<HealthCheckResult>
): NodeJS.Timeout {
  const intervalMs = intervalMinutes * 60 * 1000;

  return setInterval(async () => {
    try {
      const healthCheck = await healthCheckFn();
      const newAlerts = checkAllSystems(healthCheck);

      if (newAlerts.length > 0) {
        logger.warn(`Generated ${newAlerts.length} new alerts`, {
          alerts: newAlerts.map((a) => ({
            id: a.id,
            type: a.type,
            category: a.category,
            message: a.message,
          })),
        });
      }
    } catch (error) {
      logger.error('Alert check failed:', error);
      Sentry.captureException(error, {
        tags: { service: 'alerting', operation: 'scheduled_check' },
      });
    }
  }, intervalMs);
}

export default {
  setAlertThresholds,
  getAlertThresholds,
  resolveAlert,
  getActiveAlerts,
  getAlertHistory,
  checkAPIPerformance,
  checkDatabasePerformance,
  checkMemoryUsage,
  checkSystemHealth,
  checkAllSystems,
  scheduleAlertChecks,
};
