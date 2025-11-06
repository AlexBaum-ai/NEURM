import cron from 'node-cron';
import * as Sentry from '@sentry/node';
import { GDPRRepository } from '@/modules/gdpr/gdpr.repository';
import prisma from '@/config/database';
import logger from '@/utils/logger';

/**
 * Data Retention Cleanup Scheduler
 * Automatically deletes old data based on retention policies
 * Runs daily at 2 AM
 */

const gdprRepository = new GDPRRepository();

/**
 * Clean up old session data
 */
async function cleanupSessions(retentionDays: number) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await prisma.session.deleteMany({
      where: {
        lastActiveAt: {
          lt: cutoffDate,
        },
      },
    });

    logger.info(`Cleaned up ${result.count} expired sessions older than ${retentionDays} days`);
    return result.count;
  } catch (error) {
    Sentry.captureException(error, {
      tags: { job: 'dataRetention', task: 'cleanupSessions' },
    });
    logger.error('Failed to cleanup sessions:', error);
    throw error;
  }
}

/**
 * Clean up old analytics events
 */
async function cleanupAnalytics(retentionDays: number) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await prisma.analyticsEvent.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    logger.info(`Cleaned up ${result.count} analytics events older than ${retentionDays} days`);
    return result.count;
  } catch (error) {
    Sentry.captureException(error, {
      tags: { job: 'dataRetention', task: 'cleanupAnalytics' },
    });
    logger.error('Failed to cleanup analytics:', error);
    throw error;
  }
}

/**
 * Clean up old search history
 */
async function cleanupSearchHistory(retentionDays: number) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await prisma.searchHistory.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    logger.info(`Cleaned up ${result.count} search history entries older than ${retentionDays} days`);
    return result.count;
  } catch (error) {
    Sentry.captureException(error, {
      tags: { job: 'dataRetention', task: 'cleanupSearchHistory' },
    });
    logger.error('Failed to cleanup search history:', error);
    throw error;
  }
}

/**
 * Clean up old notifications (read notifications only)
 */
async function cleanupNotifications(retentionDays: number) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await prisma.notification.deleteMany({
      where: {
        isRead: true,
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    logger.info(`Cleaned up ${result.count} read notifications older than ${retentionDays} days`);
    return result.count;
  } catch (error) {
    Sentry.captureException(error, {
      tags: { job: 'dataRetention', task: 'cleanupNotifications' },
    });
    logger.error('Failed to cleanup notifications:', error);
    throw error;
  }
}

/**
 * Clean up old consent logs (keep recent for audit)
 */
async function cleanupConsentLogs(retentionDays: number) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await prisma.consentLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    logger.info(`Cleaned up ${result.count} consent logs older than ${retentionDays} days`);
    return result.count;
  } catch (error) {
    Sentry.captureException(error, {
      tags: { job: 'dataRetention', task: 'cleanupConsentLogs' },
    });
    logger.error('Failed to cleanup consent logs:', error);
    throw error;
  }
}

/**
 * Clean up old article views
 */
async function cleanupArticleViews(retentionDays: number) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await prisma.articleView.deleteMany({
      where: {
        viewedAt: {
          lt: cutoffDate,
        },
      },
    });

    logger.info(`Cleaned up ${result.count} article views older than ${retentionDays} days`);
    return result.count;
  } catch (error) {
    Sentry.captureException(error, {
      tags: { job: 'dataRetention', task: 'cleanupArticleViews' },
    });
    logger.error('Failed to cleanup article views:', error);
    throw error;
  }
}

/**
 * Main data retention cleanup task
 */
export async function runDataRetentionCleanup() {
  try {
    logger.info('Starting data retention cleanup job');

    // Get active retention policies
    const policies = await gdprRepository.getActiveRetentionPolicies();

    // Create a map of data types to retention days
    const retentionMap = new Map(
      policies.map(p => [p.dataType, p.retentionDays])
    );

    // Default retention periods if not configured
    const defaults = {
      sessions: 90,
      analytics: 365,
      search_history: 90,
      notifications: 90,
      consent_logs: 730, // 2 years for compliance
      article_views: 180,
    };

    // Run cleanup tasks
    const results = await Promise.allSettled([
      cleanupSessions(retentionMap.get('sessions') || defaults.sessions),
      cleanupAnalytics(retentionMap.get('analytics') || defaults.analytics),
      cleanupSearchHistory(retentionMap.get('search_history') || defaults.search_history),
      cleanupNotifications(retentionMap.get('notifications') || defaults.notifications),
      cleanupConsentLogs(retentionMap.get('consent_logs') || defaults.consent_logs),
      cleanupArticleViews(retentionMap.get('article_views') || defaults.article_views),
    ]);

    // Count successes and failures
    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    logger.info(`Data retention cleanup completed: ${succeeded} succeeded, ${failed} failed`);

    if (failed > 0) {
      const errors = results
        .filter(r => r.status === 'rejected')
        .map(r => (r as PromiseRejectedResult).reason);

      Sentry.captureException(new Error('Some data retention cleanup tasks failed'), {
        tags: { job: 'dataRetentionCleanup' },
        extra: { errors, succeeded, failed },
      });
    }

    return { succeeded, failed };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { job: 'dataRetentionCleanup' },
    });
    logger.error('Data retention cleanup job failed:', error);
    throw error;
  }
}

/**
 * Schedule data retention cleanup job
 * Runs daily at 2:00 AM
 */
export function scheduleDataRetentionCleanup() {
  // Run every day at 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    logger.info('Data retention cleanup job triggered by schedule');
    try {
      await runDataRetentionCleanup();
    } catch (error) {
      logger.error('Scheduled data retention cleanup failed:', error);
    }
  }, {
    timezone: 'UTC',
  });

  logger.info('Data retention cleanup job scheduled (daily at 2:00 AM UTC)');
}

export default scheduleDataRetentionCleanup;
