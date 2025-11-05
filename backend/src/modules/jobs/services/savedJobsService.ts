import * as Sentry from '@sentry/node';
import prisma from '@/config/database';
import {
  SaveJobInput,
  UpdateSavedJobInput,
  ListSavedJobsQuery,
} from '../savedJobs.validation';
import {
  NotFoundError,
  ConflictError,
} from '@/utils/errors';
import logger from '@/utils/logger';

/**
 * SavedJobsService
 * Business logic for saved jobs operations
 */
export class SavedJobsService {
  /**
   * Save a job (bookmark)
   */
  async saveJob(
    userId: string,
    jobId: string,
    input: SaveJobInput = {}
  ): Promise<any> {
    try {
      // Verify job exists and is active
      const job = await prisma.job.findUnique({
        where: { id: jobId },
        select: {
          id: true,
          status: true,
        },
      });

      if (!job) {
        throw new NotFoundError('Job not found');
      }

      // Check if already saved
      const existing = await prisma.savedJob.findUnique({
        where: {
          userId_jobId: {
            userId,
            jobId,
          },
        },
      });

      if (existing) {
        throw new ConflictError('Job is already saved');
      }

      // Create saved job
      const savedJob = await prisma.savedJob.create({
        data: {
          userId,
          jobId,
          notes: input.notes,
        },
        include: {
          job: {
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
          },
        },
      });

      logger.info(`User ${userId} saved job ${jobId}`);

      return savedJob;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ConflictError) {
        throw error;
      }

      Sentry.captureException(error, {
        tags: { service: 'SavedJobsService', method: 'saveJob' },
        extra: { userId, jobId, input },
      });
      throw error;
    }
  }

  /**
   * Remove saved job (unbookmark)
   */
  async unsaveJob(userId: string, jobId: string): Promise<void> {
    try {
      // Check if saved job exists
      const savedJob = await prisma.savedJob.findUnique({
        where: {
          userId_jobId: {
            userId,
            jobId,
          },
        },
      });

      if (!savedJob) {
        throw new NotFoundError('Saved job not found');
      }

      // Delete saved job
      await prisma.savedJob.delete({
        where: {
          id: savedJob.id,
        },
      });

      logger.info(`User ${userId} unsaved job ${jobId}`);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      Sentry.captureException(error, {
        tags: { service: 'SavedJobsService', method: 'unsaveJob' },
        extra: { userId, jobId },
      });
      throw error;
    }
  }

  /**
   * Update saved job notes
   */
  async updateSavedJob(
    userId: string,
    jobId: string,
    input: UpdateSavedJobInput
  ): Promise<any> {
    try {
      // Check if saved job exists
      const savedJob = await prisma.savedJob.findUnique({
        where: {
          userId_jobId: {
            userId,
            jobId,
          },
        },
      });

      if (!savedJob) {
        throw new NotFoundError('Saved job not found');
      }

      // Update saved job
      const updated = await prisma.savedJob.update({
        where: {
          id: savedJob.id,
        },
        data: {
          notes: input.notes,
        },
        include: {
          job: {
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
          },
        },
      });

      logger.info(`User ${userId} updated saved job ${jobId}`);

      return updated;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      Sentry.captureException(error, {
        tags: { service: 'SavedJobsService', method: 'updateSavedJob' },
        extra: { userId, jobId, input },
      });
      throw error;
    }
  }

  /**
   * Get user's saved jobs with pagination
   */
  async getSavedJobs(
    userId: string,
    query: ListSavedJobsQuery
  ): Promise<{
    savedJobs: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const { page = 1, limit = 20, sortBy = 'savedAt', sortOrder = 'desc' } = query;
      const skip = (page - 1) * limit;

      // Build order by clause
      const orderBy: any = {};
      if (sortBy === 'savedAt') {
        orderBy.savedAt = sortOrder;
      } else if (sortBy === 'expiresAt') {
        orderBy.job = { expiresAt: sortOrder };
      }

      // Get total count
      const total = await prisma.savedJob.count({
        where: { userId },
      });

      // Get saved jobs
      const savedJobs = await prisma.savedJob.findMany({
        where: { userId },
        include: {
          job: {
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
          },
        },
        orderBy,
        skip,
        take: limit,
      });

      // Check for jobs expiring soon (3 days)
      const now = new Date();
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

      const enrichedSavedJobs = savedJobs.map((savedJob) => ({
        ...savedJob,
        expiringsSoon:
          savedJob.job.expiresAt &&
          savedJob.job.expiresAt <= threeDaysFromNow &&
          savedJob.job.expiresAt > now,
        daysUntilExpiry: savedJob.job.expiresAt
          ? Math.ceil((savedJob.job.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : null,
      }));

      const totalPages = Math.ceil(total / limit);

      return {
        savedJobs: enrichedSavedJobs,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'SavedJobsService', method: 'getSavedJobs' },
        extra: { userId, query },
      });
      throw error;
    }
  }

  /**
   * Check if job is saved by user
   */
  async isJobSaved(userId: string, jobId: string): Promise<boolean> {
    try {
      const savedJob = await prisma.savedJob.findUnique({
        where: {
          userId_jobId: {
            userId,
            jobId,
          },
        },
      });

      return !!savedJob;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'SavedJobsService', method: 'isJobSaved' },
        extra: { userId, jobId },
      });
      throw error;
    }
  }

  /**
   * Get jobs expiring soon for deadline reminders
   * Used by cron job
   */
  async getJobsExpiringSoon(daysUntil = 3): Promise<any[]> {
    try {
      const now = new Date();
      const targetDate = new Date(now.getTime() + daysUntil * 24 * 60 * 60 * 1000);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

      // Get saved jobs expiring in exactly daysUntil days
      const expiringSavedJobs = await prisma.savedJob.findMany({
        where: {
          job: {
            expiresAt: {
              gte: startOfDay,
              lte: endOfDay,
            },
            status: 'active',
          },
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
          job: {
            include: {
              company: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  logoUrl: true,
                },
              },
            },
          },
        },
      });

      logger.info(`Found ${expiringSavedJobs.length} saved jobs expiring in ${daysUntil} days`);

      return expiringSavedJobs;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'SavedJobsService', method: 'getJobsExpiringSoon' },
        extra: { daysUntil },
      });
      throw error;
    }
  }
}

export default SavedJobsService;
