import cron from 'node-cron';
import SessionsService from '@/modules/users/sessions.service';
import logger from '@/utils/logger';
import * as Sentry from '@sentry/node';

/**
 * Session Cleanup Scheduler
 * Runs daily at 2:00 AM to clean up expired sessions
 */
export function setupSessionCleanupScheduler(): void {
  // Run daily at 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    try {
      logger.info('Starting session cleanup job');

      const deletedCount = await SessionsService.cleanupExpiredSessions();

      logger.info(`Session cleanup job completed. Deleted ${deletedCount} expired sessions`);
    } catch (error) {
      logger.error('Session cleanup job failed:', error);
      Sentry.captureException(error, {
        tags: { job: 'session-cleanup' },
      });
    }
  });

  logger.info('Session cleanup scheduler initialized (runs daily at 2:00 AM)');
}
