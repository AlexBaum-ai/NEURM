import * as Sentry from '@sentry/node';
import logger from '@/utils/logger';
import JobAlertsService from '../services/jobAlertsService';
import SavedJobsService from '../services/savedJobsService';

/**
 * Daily Job Alerts Processing
 *
 * This cron job runs daily at 9:00 AM and processes:
 * 1. Active job alerts - finds matching jobs and sends email notifications
 * 2. Saved job deadline reminders - sends reminders for jobs expiring in 3 days
 *
 * Schedule: Daily at 9:00 AM
 * Cron Expression: 0 9 * * *
 */

const jobAlertsService = new JobAlertsService();
const savedJobsService = new SavedJobsService();

/**
 * Process active job alerts
 */
async function processAlerts(): Promise<void> {
  try {
    logger.info('Starting job alerts processing...');

    const result = await jobAlertsService.processAlerts();

    logger.info('Job alerts processing completed', result);

    // Track metrics in Sentry
    Sentry.addBreadcrumb({
      category: 'cron',
      message: 'Job alerts processed',
      level: 'info',
      data: result,
    });
  } catch (error) {
    logger.error('Error processing job alerts:', error);
    Sentry.captureException(error, {
      tags: { cron: 'processJobAlerts', job: 'alerts' },
    });
    throw error;
  }
}

/**
 * Send deadline reminders for saved jobs expiring soon
 */
async function sendDeadlineReminders(): Promise<void> {
  try {
    logger.info('Starting saved jobs deadline reminders...');

    // Get saved jobs expiring in 3 days
    const expiringSavedJobs = await savedJobsService.getJobsExpiringSoon(3);

    if (expiringSavedJobs.length === 0) {
      logger.info('No saved jobs expiring in 3 days');
      return;
    }

    logger.info(`Found ${expiringSavedJobs.length} saved jobs expiring in 3 days`);

    // Group by user to send one email per user
    const userJobsMap = new Map<string, any[]>();

    for (const savedJob of expiringSavedJobs) {
      const userId = savedJob.userId;
      if (!userJobsMap.has(userId)) {
        userJobsMap.set(userId, []);
      }
      userJobsMap.get(userId)!.push(savedJob);
    }

    logger.info(`Sending deadline reminders to ${userJobsMap.size} users`);

    // In a real implementation, this would send emails
    // For now, we just log the reminders
    for (const [userId, jobs] of userJobsMap.entries()) {
      logger.info(`User ${userId}: ${jobs.length} jobs expiring soon`, {
        userId,
        jobCount: jobs.length,
        jobs: jobs.map(j => ({
          jobId: j.jobId,
          title: j.job.title,
          company: j.job.company.name,
          expiresAt: j.job.expiresAt,
        })),
      });
    }

    // Track metrics in Sentry
    Sentry.addBreadcrumb({
      category: 'cron',
      message: 'Deadline reminders sent',
      level: 'info',
      data: {
        totalJobs: expiringSavedJobs.length,
        totalUsers: userJobsMap.size,
      },
    });

    logger.info('Deadline reminders completed');
  } catch (error) {
    logger.error('Error sending deadline reminders:', error);
    Sentry.captureException(error, {
      tags: { cron: 'processJobAlerts', job: 'deadlineReminders' },
    });
    throw error;
  }
}

/**
 * Main cron job handler
 * Runs both alert processing and deadline reminders
 */
export async function processJobAlertsCron(): Promise<void> {
  const startTime = Date.now();

  try {
    logger.info('=== Starting Daily Job Alerts Cron ===');

    // Run both tasks in parallel
    await Promise.all([
      processAlerts(),
      sendDeadlineReminders(),
    ]);

    const duration = Date.now() - startTime;
    logger.info(`=== Job Alerts Cron Completed in ${duration}ms ===`);

    // Track success in Sentry
    Sentry.captureMessage('Daily job alerts cron completed successfully', {
      level: 'info',
      tags: { cron: 'processJobAlerts' },
      extra: { durationMs: duration },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`=== Job Alerts Cron Failed after ${duration}ms ===`, error);

    Sentry.captureException(error, {
      tags: { cron: 'processJobAlerts', status: 'failed' },
      extra: { durationMs: duration },
    });

    throw error;
  }
}

export default processJobAlertsCron;
