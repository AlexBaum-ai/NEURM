import * as Sentry from '@sentry/node';
import prisma from '@/config/database';
import {
  CreateJobAlertInput,
  UpdateJobAlertInput,
  ListJobAlertsQuery,
  AlertCriteria,
} from '../jobAlerts.validation';
import {
  NotFoundError,
  BadRequestError,
} from '@/utils/errors';
import logger from '@/utils/logger';
import { Job, Prisma } from '@prisma/client';

/**
 * JobAlertsService
 * Business logic for job alerts operations
 */
export class JobAlertsService {
  /**
   * Create a new job alert
   */
  async createAlert(
    userId: string,
    input: CreateJobAlertInput
  ): Promise<any> {
    try {
      // Check alert limit (max 10 per user)
      const existingAlerts = await prisma.jobAlert.count({
        where: { userId },
      });

      if (existingAlerts >= 10) {
        throw new BadRequestError('Maximum of 10 job alerts allowed per user');
      }

      // Create alert
      const alert = await prisma.jobAlert.create({
        data: {
          userId,
          name: input.name,
          criteriaJson: input.criteria as any,
        },
      });

      logger.info(`User ${userId} created job alert: ${alert.name}`);

      return alert;
    } catch (error) {
      if (error instanceof BadRequestError) {
        throw error;
      }

      Sentry.captureException(error, {
        tags: { service: 'JobAlertsService', method: 'createAlert' },
        extra: { userId, input },
      });
      throw error;
    }
  }

  /**
   * Update job alert
   */
  async updateAlert(
    userId: string,
    alertId: string,
    input: UpdateJobAlertInput
  ): Promise<any> {
    try {
      // Check if alert exists and belongs to user
      const alert = await prisma.jobAlert.findUnique({
        where: { id: alertId },
      });

      if (!alert) {
        throw new NotFoundError('Job alert not found');
      }

      if (alert.userId !== userId) {
        throw new NotFoundError('Job alert not found');
      }

      // Update alert
      const updateData: any = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.criteria !== undefined) updateData.criteriaJson = input.criteria;
      if (input.active !== undefined) updateData.active = input.active;

      const updated = await prisma.jobAlert.update({
        where: { id: alertId },
        data: updateData,
      });

      logger.info(`User ${userId} updated job alert ${alertId}`);

      return updated;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      Sentry.captureException(error, {
        tags: { service: 'JobAlertsService', method: 'updateAlert' },
        extra: { userId, alertId, input },
      });
      throw error;
    }
  }

  /**
   * Delete job alert
   */
  async deleteAlert(userId: string, alertId: string): Promise<void> {
    try {
      // Check if alert exists and belongs to user
      const alert = await prisma.jobAlert.findUnique({
        where: { id: alertId },
      });

      if (!alert) {
        throw new NotFoundError('Job alert not found');
      }

      if (alert.userId !== userId) {
        throw new NotFoundError('Job alert not found');
      }

      // Delete alert
      await prisma.jobAlert.delete({
        where: { id: alertId },
      });

      logger.info(`User ${userId} deleted job alert ${alertId}`);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      Sentry.captureException(error, {
        tags: { service: 'JobAlertsService', method: 'deleteAlert' },
        extra: { userId, alertId },
      });
      throw error;
    }
  }

  /**
   * Get user's job alerts
   */
  async getUserAlerts(
    userId: string,
    query: ListJobAlertsQuery
  ): Promise<any[]> {
    try {
      const where: any = { userId };

      if (query.active !== undefined) {
        where.active = query.active;
      }

      const alerts = await prisma.jobAlert.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
      });

      return alerts;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'JobAlertsService', method: 'getUserAlerts' },
        extra: { userId, query },
      });
      throw error;
    }
  }

  /**
   * Get alert by ID
   */
  async getAlertById(userId: string, alertId: string): Promise<any> {
    try {
      const alert = await prisma.jobAlert.findUnique({
        where: { id: alertId },
      });

      if (!alert) {
        throw new NotFoundError('Job alert not found');
      }

      if (alert.userId !== userId) {
        throw new NotFoundError('Job alert not found');
      }

      return alert;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      Sentry.captureException(error, {
        tags: { service: 'JobAlertsService', method: 'getAlertById' },
        extra: { userId, alertId },
      });
      throw error;
    }
  }

  /**
   * Find jobs matching alert criteria
   */
  async findMatchingJobs(criteria: AlertCriteria, since?: Date): Promise<Job[]> {
    try {
      const where: Prisma.JobWhereInput = {
        status: 'active',
        publishedAt: since ? { gte: since } : undefined,
      };

      // Apply criteria filters
      if (criteria.keywords && criteria.keywords.length > 0) {
        where.OR = criteria.keywords.map((keyword) => ({
          OR: [
            { title: { contains: keyword, mode: 'insensitive' } },
            { description: { contains: keyword, mode: 'insensitive' } },
            { requirements: { contains: keyword, mode: 'insensitive' } },
          ],
        }));
      }

      if (criteria.location) {
        where.location = { contains: criteria.location, mode: 'insensitive' };
      }

      if (criteria.remote !== undefined) {
        if (criteria.remote) {
          where.workLocation = { in: ['remote', 'hybrid'] };
        } else {
          where.workLocation = 'onsite';
        }
      }

      if (criteria.jobTypes && criteria.jobTypes.length > 0) {
        where.jobType = { in: criteria.jobTypes as any };
      }

      if (criteria.experienceLevels && criteria.experienceLevels.length > 0) {
        where.experienceLevel = { in: criteria.experienceLevels as any };
      }

      if (criteria.salaryMin !== undefined) {
        where.salaryMin = { gte: criteria.salaryMin };
      }

      if (criteria.models && criteria.models.length > 0) {
        where.primaryLlms = {
          hasSome: criteria.models,
        };
      }

      // Execute query
      const jobs = await prisma.job.findMany({
        where,
        include: {
          company: {
            select: {
              id: true,
              name: true,
              slug: true,
              logoUrl: true,
              verifiedCompany: true,
            },
          },
        },
        orderBy: {
          publishedAt: 'desc',
        },
        take: 20, // Max 20 jobs per alert
      });

      return jobs;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'JobAlertsService', method: 'findMatchingJobs' },
        extra: { criteria, since },
      });
      throw error;
    }
  }

  /**
   * Process all active alerts and find matching jobs
   * Used by cron job
   */
  async processAlerts(): Promise<{
    processed: number;
    sent: number;
    errors: number;
  }> {
    try {
      // Get all active alerts that haven't been sent today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const alerts = await prisma.jobAlert.findMany({
        where: {
          active: true,
          OR: [
            { lastSentAt: null },
            { lastSentAt: { lt: today } },
          ],
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              locale: true,
            },
          },
        },
      });

      logger.info(`Processing ${alerts.length} job alerts`);

      let processed = 0;
      let sent = 0;
      let errors = 0;

      // Process each alert
      for (const alert of alerts) {
        try {
          processed++;

          // Get jobs published in last 24 hours
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);

          const criteria = alert.criteriaJson as AlertCriteria;
          const matchingJobs = await this.findMatchingJobs(criteria, yesterday);

          if (matchingJobs.length > 0) {
            // Update alert stats
            await prisma.jobAlert.update({
              where: { id: alert.id },
              data: {
                lastSentAt: new Date(),
                jobsSentCount: {
                  increment: matchingJobs.length,
                },
              },
            });

            logger.info(`Alert ${alert.id}: Found ${matchingJobs.length} matching jobs for user ${alert.userId}`);
            sent++;

            // Note: Email sending will be handled by a separate service
            // For now, we just log the matches
          }
        } catch (error) {
          errors++;
          logger.error(`Error processing alert ${alert.id}:`, error);
          Sentry.captureException(error, {
            tags: { service: 'JobAlertsService', method: 'processAlerts' },
            extra: { alertId: alert.id },
          });
        }
      }

      logger.info(`Alert processing complete: ${processed} processed, ${sent} sent, ${errors} errors`);

      return { processed, sent, errors };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'JobAlertsService', method: 'processAlerts' },
      });
      throw error;
    }
  }

  /**
   * Track when user clicks on a job from alert email
   */
  async trackAlertClick(alertId: string, jobId: string): Promise<void> {
    try {
      // Verify alert exists
      const alert = await prisma.jobAlert.findUnique({
        where: { id: alertId },
      });

      if (!alert) {
        throw new NotFoundError('Job alert not found');
      }

      // Increment click count
      await prisma.jobAlert.update({
        where: { id: alertId },
        data: {
          jobsClickedCount: {
            increment: 1,
          },
        },
      });

      logger.info(`Alert ${alertId}: Job ${jobId} clicked`);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      Sentry.captureException(error, {
        tags: { service: 'JobAlertsService', method: 'trackAlertClick' },
        extra: { alertId, jobId },
      });
      throw error;
    }
  }

  /**
   * Send test alert email to user
   */
  async sendTestAlert(
    userId: string,
    alertId: string
  ): Promise<{ jobsMatched: number; message: string }> {
    try {
      // Verify alert exists and belongs to user
      const alert = await prisma.jobAlert.findUnique({
        where: { id: alertId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
            },
          },
        },
      });

      if (!alert) {
        throw new NotFoundError('Job alert not found');
      }

      if (alert.userId !== userId) {
        throw new BadRequestError('You do not have permission to test this alert');
      }

      // Find matching jobs (up to 3 for test)
      const criteria = alert.criteriaJson as AlertCriteria;
      const matchingJobs = await this.findMatchingJobs(criteria);
      const testJobs = matchingJobs.slice(0, 3);

      if (testJobs.length === 0) {
        return {
          jobsMatched: 0,
          message: 'No matching jobs found for your alert criteria',
        };
      }

      // Import email utility
      const { sendEmail } = await import('@/utils/email');

      // Build email HTML
      const jobsHtml = testJobs
        .map(
          (job) => `
        <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
          <h3 style="margin: 0 0 10px 0;">${job.title}</h3>
          <p style="margin: 5px 0;"><strong>Company:</strong> ${job.company.name}</p>
          <p style="margin: 5px 0;"><strong>Location:</strong> ${job.location || 'Remote'}</p>
          ${job.salaryMin && job.salaryMax ? `<p style="margin: 5px 0;"><strong>Salary:</strong> $${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}</p>` : ''}
          <p style="margin: 10px 0 0 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/jobs/${job.slug}" style="color: #0066cc; text-decoration: none;">View Job →</a>
          </p>
        </div>
      `
        )
        .join('');

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Test Alert: ${alert.name}</h2>
          <p style="color: #666;">This is a test of your job alert. Here are ${testJobs.length} matching jobs:</p>
          ${jobsHtml}
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;" />
          <p style="color: #999; font-size: 12px;">
            This is a test email. Your actual job alerts will be sent when new matching jobs are posted.
            <br />
            To manage your alerts, visit your <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/alerts">dashboard</a>.
          </p>
        </div>
      `;

      // Send test email
      await sendEmail({
        to: alert.user.email,
        subject: `Test Alert: ${alert.name}`,
        html: emailHtml,
        text: `Test Alert: ${alert.name}\n\nFound ${testJobs.length} matching jobs.`,
      });

      logger.info(`Test alert sent for alert ${alertId} to user ${userId}`);

      return {
        jobsMatched: testJobs.length,
        message: `Test email sent successfully with ${testJobs.length} matching job(s)`,
      };
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error;
      }

      Sentry.captureException(error, {
        tags: { service: 'JobAlertsService', method: 'sendTestAlert' },
        extra: { userId, alertId },
      });
      throw error;
    }
  }
}

export default JobAlertsService;
