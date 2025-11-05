import * as Sentry from '@sentry/node';
import { JobApplication, ApplicationStatus, Prisma } from '@prisma/client';
import prisma from '@/config/database';
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
  BadRequestError,
} from '@/utils/errors';
import logger from '@/utils/logger';

/**
 * ATSService - Applicant Tracking System Service
 * Business logic for company-side application management
 */
export class ATSService {
  /**
   * Get all applications for company's jobs with advanced filtering
   */
  async getCompanyApplications(
    userId: string,
    filters?: {
      jobId?: string;
      status?: ApplicationStatus;
      dateFrom?: Date;
      dateTo?: Date;
      minMatchScore?: number;
      maxMatchScore?: number;
      minRating?: number;
      maxRating?: number;
      sortBy?: 'date_applied' | 'match_score' | 'rating';
      sortOrder?: 'asc' | 'desc';
      page?: number;
      limit?: number;
    }
  ) {
    const transaction = Sentry.startTransaction({
      op: 'ats.getApplications',
      name: 'Get Company Applications',
    });

    try {
      // 1. Get company owned by user
      const company = await prisma.company.findUnique({
        where: { ownerUserId: userId },
        select: { id: true },
      });

      if (!company) {
        throw new ForbiddenError('Only company owners can access applications');
      }

      // 2. Build filter conditions
      const where: Prisma.JobApplicationWhereInput = {
        job: {
          companyId: company.id,
        },
      };

      // Filter by specific job
      if (filters?.jobId) {
        where.jobId = filters.jobId;
      }

      // Filter by status
      if (filters?.status) {
        where.status = filters.status;
      }

      // Filter by date range
      if (filters?.dateFrom || filters?.dateTo) {
        where.appliedAt = {};
        if (filters.dateFrom) {
          where.appliedAt.gte = filters.dateFrom;
        }
        if (filters.dateTo) {
          where.appliedAt.lte = filters.dateTo;
        }
      }

      // 3. Get applications with pagination
      const page = filters?.page || 1;
      const limit = Math.min(filters?.limit || 20, 100); // Max 100 per page
      const skip = (page - 1) * limit;

      // Build orderBy
      let orderBy: Prisma.JobApplicationOrderByWithRelationInput = {
        appliedAt: 'desc', // Default
      };

      if (filters?.sortBy === 'match_score') {
        // For match score, we'll need to join with job_matches table
        // For now, we'll sort by application date
        orderBy = { appliedAt: filters.sortOrder || 'desc' };
      } else if (filters?.sortBy === 'rating') {
        // We'll fetch ratings separately and sort in memory
        orderBy = { appliedAt: filters.sortOrder || 'desc' };
      } else {
        orderBy = {
          appliedAt: filters?.sortOrder || 'desc',
        };
      }

      const [applications, total] = await Promise.all([
        prisma.jobApplication.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                profile: {
                  select: {
                    displayName: true,
                    avatarUrl: true,
                    location: true,
                  },
                },
                // Forum reputation
                reputation: {
                  select: {
                    totalScore: true,
                    level: true,
                  },
                },
                // Forum badges
                userBadges: {
                  select: {
                    badge: {
                      select: {
                        name: true,
                        type: true,
                        category: true,
                        icon: true,
                      },
                    },
                  },
                  take: 5,
                  orderBy: {
                    earnedAt: 'desc',
                  },
                },
              },
            },
            job: {
              select: {
                id: true,
                title: true,
                slug: true,
                location: true,
                jobType: true,
                experienceLevel: true,
              },
            },
            // Include match score if exists
            user: {
              select: {
                jobMatches: {
                  where: {
                    jobId: filters?.jobId,
                  },
                  select: {
                    matchScore: true,
                    matchReasons: true,
                  },
                  take: 1,
                },
              },
            },
            // Include average rating
            ratings: {
              select: {
                rating: true,
              },
            },
            // Include notes count
            notes: {
              select: {
                id: true,
              },
            },
          },
        }),
        prisma.jobApplication.count({ where }),
      ]);

      // 4. Post-process to add computed fields
      const processedApplications = applications.map((app: any) => {
        // Calculate average rating
        const avgRating =
          app.ratings.length > 0
            ? app.ratings.reduce((sum: number, r: any) => sum + r.rating, 0) /
              app.ratings.length
            : null;

        // Get match score
        const matchScore = app.user.jobMatches?.[0]?.matchScore || null;
        const matchReasons = app.user.jobMatches?.[0]?.matchReasons || null;

        // Forum reputation
        const forumReputation = app.user.reputation
          ? {
              score: app.user.reputation.totalScore,
              level: app.user.reputation.level,
            }
          : null;

        // Forum badges
        const forumBadges = app.user.userBadges.map((ub: any) => ub.badge);

        return {
          ...app,
          averageRating: avgRating,
          matchScore,
          matchReasons,
          notesCount: app.notes.length,
          forumReputation,
          forumBadges,
        };
      });

      // 5. Apply additional filters (match score, rating)
      let filteredApplications = processedApplications;

      if (filters?.minMatchScore !== undefined) {
        filteredApplications = filteredApplications.filter(
          (app) => app.matchScore && app.matchScore >= filters.minMatchScore!
        );
      }

      if (filters?.maxMatchScore !== undefined) {
        filteredApplications = filteredApplications.filter(
          (app) => app.matchScore && app.matchScore <= filters.maxMatchScore!
        );
      }

      if (filters?.minRating !== undefined) {
        filteredApplications = filteredApplications.filter(
          (app) => app.averageRating && app.averageRating >= filters.minRating!
        );
      }

      if (filters?.maxRating !== undefined) {
        filteredApplications = filteredApplications.filter(
          (app) => app.averageRating && app.averageRating <= filters.maxRating!
        );
      }

      // 6. Sort if needed
      if (filters?.sortBy === 'match_score') {
        filteredApplications.sort((a, b) => {
          const scoreA = a.matchScore || 0;
          const scoreB = b.matchScore || 0;
          return filters.sortOrder === 'asc'
            ? scoreA - scoreB
            : scoreB - scoreA;
        });
      } else if (filters?.sortBy === 'rating') {
        filteredApplications.sort((a, b) => {
          const ratingA = a.averageRating || 0;
          const ratingB = b.averageRating || 0;
          return filters.sortOrder === 'asc'
            ? ratingA - ratingB
            : ratingB - ratingA;
        });
      }

      logger.info('Fetched company applications', {
        companyId: company.id,
        total,
        page,
        limit,
      });

      transaction.finish();

      return {
        applications: filteredApplications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      transaction.finish();
      if (error instanceof ForbiddenError) {
        throw error;
      }
      Sentry.captureException(error);
      logger.error('Error fetching company applications:', error);
      throw new Error('Failed to fetch applications');
    }
  }

  /**
   * Get application detail with full candidate profile
   */
  async getApplicationDetail(applicationId: string, userId: string) {
    try {
      // 1. Get application with all related data
      const application = await prisma.jobApplication.findUnique({
        where: { id: applicationId },
        include: {
          job: {
            include: {
              company: {
                select: {
                  id: true,
                  name: true,
                  ownerUserId: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              profile: true,
              skills: {
                orderBy: {
                  proficiency: 'desc',
                },
              },
              workExperiences: {
                orderBy: {
                  startDate: 'desc',
                },
              },
              educations: {
                orderBy: {
                  startDate: 'desc',
                },
              },
              portfolioProjects: {
                where: { isFeatured: true },
                orderBy: { displayOrder: 'asc' },
              },
              reputation: {
                select: {
                  totalScore: true,
                  level: true,
                  answersCount: true,
                  questionsCount: true,
                  bestAnswersCount: true,
                },
              },
              userBadges: {
                include: {
                  badge: true,
                },
                orderBy: {
                  earnedAt: 'desc',
                },
              },
              jobMatches: {
                where: {
                  jobId: applicationId,
                },
                select: {
                  matchScore: true,
                  matchReasons: true,
                },
              },
            },
          },
          statusHistory: {
            orderBy: {
              createdAt: 'asc',
            },
          },
          notes: {
            include: {
              user: {
                select: {
                  username: true,
                  profile: {
                    select: {
                      displayName: true,
                      avatarUrl: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
          ratings: {
            include: {
              user: {
                select: {
                  username: true,
                  profile: {
                    select: {
                      displayName: true,
                    },
                  },
                },
              },
            },
          },
          shares: {
            include: {
              sharer: {
                select: {
                  username: true,
                  profile: {
                    select: {
                      displayName: true,
                    },
                  },
                },
              },
              recipient: {
                select: {
                  username: true,
                  profile: {
                    select: {
                      displayName: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      if (!application) {
        throw new NotFoundError('Application not found');
      }

      // 2. Verify access (company owner only)
      if (application.job.company.ownerUserId !== userId) {
        throw new ForbiddenError(
          'You do not have permission to view this application'
        );
      }

      // 3. Calculate average rating
      const avgRating =
        application.ratings.length > 0
          ? application.ratings.reduce((sum, r) => sum + r.rating, 0) /
            application.ratings.length
          : null;

      logger.info('Fetched application detail', {
        applicationId,
        userId,
      });

      return {
        ...application,
        averageRating: avgRating,
      };
    } catch (error) {
      if (
        error instanceof NotFoundError ||
        error instanceof ForbiddenError
      ) {
        throw error;
      }
      Sentry.captureException(error);
      logger.error('Error fetching application detail:', error);
      throw new Error('Failed to fetch application detail');
    }
  }

  /**
   * Update application status
   */
  async updateApplicationStatus(
    applicationId: string,
    status: ApplicationStatus,
    userId: string,
    notes?: string
  ) {
    const transaction = Sentry.startTransaction({
      op: 'ats.updateStatus',
      name: 'Update Application Status',
    });

    try {
      // 1. Get application
      const application = await prisma.jobApplication.findUnique({
        where: { id: applicationId },
        include: {
          job: {
            include: {
              company: {
                select: {
                  ownerUserId: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      });

      if (!application) {
        throw new NotFoundError('Application not found');
      }

      // 2. Verify access
      if (application.job.company.ownerUserId !== userId) {
        throw new ForbiddenError(
          'Only the company owner can update application status'
        );
      }

      // 3. Update status
      const updatedApplication = await prisma.jobApplication.update({
        where: { id: applicationId },
        data: {
          status,
          reviewedAt: status === 'viewed' ? new Date() : application.reviewedAt,
        },
        include: {
          job: {
            select: {
              title: true,
              slug: true,
            },
          },
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      });

      // 4. Track status change in history
      await prisma.applicationStatusHistory.create({
        data: {
          applicationId,
          fromStatus: application.status,
          toStatus: status,
          changedById: userId,
          notes: notes || `Status changed from ${application.status} to ${status}`,
        },
      });

      // 5. Send notification to candidate
      await this.notifyCandidateOfStatusChange(updatedApplication, status);

      logger.info('Application status updated', {
        applicationId,
        newStatus: status,
        updatedBy: userId,
      });

      transaction.finish();
      return updatedApplication;
    } catch (error) {
      transaction.finish();
      if (
        error instanceof NotFoundError ||
        error instanceof ForbiddenError
      ) {
        throw error;
      }
      Sentry.captureException(error);
      logger.error('Error updating application status:', error);
      throw new Error('Failed to update application status');
    }
  }

  /**
   * Add note to application
   */
  async addNote(
    applicationId: string,
    userId: string,
    note: string,
    isInternal: boolean = true
  ) {
    try {
      // 1. Verify access
      const application = await prisma.jobApplication.findUnique({
        where: { id: applicationId },
        include: {
          job: {
            include: {
              company: {
                select: {
                  ownerUserId: true,
                },
              },
            },
          },
        },
      });

      if (!application) {
        throw new NotFoundError('Application not found');
      }

      if (application.job.company.ownerUserId !== userId) {
        throw new ForbiddenError('You do not have permission to add notes');
      }

      // 2. Create note
      const applicationNote = await prisma.applicationNote.create({
        data: {
          applicationId,
          userId,
          note,
          isInternal,
        },
        include: {
          user: {
            select: {
              username: true,
              profile: {
                select: {
                  displayName: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      });

      // 3. Track in history
      await prisma.applicationStatusHistory.create({
        data: {
          applicationId,
          fromStatus: application.status,
          toStatus: application.status,
          changedById: userId,
          notes: 'Note added',
        },
      });

      logger.info('Note added to application', {
        applicationId,
        userId,
      });

      return applicationNote;
    } catch (error) {
      if (
        error instanceof NotFoundError ||
        error instanceof ForbiddenError
      ) {
        throw error;
      }
      Sentry.captureException(error);
      logger.error('Error adding note:', error);
      throw new Error('Failed to add note');
    }
  }

  /**
   * Rate application
   */
  async rateApplication(
    applicationId: string,
    userId: string,
    rating: number
  ) {
    try {
      // 1. Validate rating (1-5)
      if (rating < 1 || rating > 5) {
        throw new ValidationError('Rating must be between 1 and 5');
      }

      // 2. Verify access
      const application = await prisma.jobApplication.findUnique({
        where: { id: applicationId },
        include: {
          job: {
            include: {
              company: {
                select: {
                  ownerUserId: true,
                },
              },
            },
          },
        },
      });

      if (!application) {
        throw new NotFoundError('Application not found');
      }

      if (application.job.company.ownerUserId !== userId) {
        throw new ForbiddenError('You do not have permission to rate this application');
      }

      // 3. Upsert rating
      const applicationRating = await prisma.applicationRating.upsert({
        where: {
          applicationId_userId: {
            applicationId,
            userId,
          },
        },
        update: {
          rating,
        },
        create: {
          applicationId,
          userId,
          rating,
        },
        include: {
          user: {
            select: {
              username: true,
              profile: {
                select: {
                  displayName: true,
                },
              },
            },
          },
        },
      });

      // 4. Track in history
      await prisma.applicationStatusHistory.create({
        data: {
          applicationId,
          fromStatus: application.status,
          toStatus: application.status,
          changedById: userId,
          notes: `Rated ${rating} stars`,
        },
      });

      logger.info('Application rated', {
        applicationId,
        userId,
        rating,
      });

      return applicationRating;
    } catch (error) {
      if (
        error instanceof NotFoundError ||
        error instanceof ForbiddenError ||
        error instanceof ValidationError
      ) {
        throw error;
      }
      Sentry.captureException(error);
      logger.error('Error rating application:', error);
      throw new Error('Failed to rate application');
    }
  }

  /**
   * Share application with team member
   */
  async shareApplication(
    applicationId: string,
    userId: string,
    sharedWith: string,
    message?: string
  ) {
    try {
      // 1. Verify access
      const application = await prisma.jobApplication.findUnique({
        where: { id: applicationId },
        include: {
          job: {
            include: {
              company: {
                select: {
                  ownerUserId: true,
                },
              },
            },
          },
        },
      });

      if (!application) {
        throw new NotFoundError('Application not found');
      }

      if (application.job.company.ownerUserId !== userId) {
        throw new ForbiddenError('You do not have permission to share this application');
      }

      // 2. Verify recipient exists
      const recipient = await prisma.user.findUnique({
        where: { id: sharedWith },
        select: {
          id: true,
          username: true,
          email: true,
        },
      });

      if (!recipient) {
        throw new NotFoundError('Recipient user not found');
      }

      // 3. Create share (or update if already exists)
      const share = await prisma.applicationShare.upsert({
        where: {
          applicationId_sharedWith: {
            applicationId,
            sharedWith,
          },
        },
        update: {
          message,
        },
        create: {
          applicationId,
          sharedBy: userId,
          sharedWith,
          message,
        },
        include: {
          sharer: {
            select: {
              username: true,
              profile: {
                select: {
                  displayName: true,
                },
              },
            },
          },
          recipient: {
            select: {
              username: true,
              profile: {
                select: {
                  displayName: true,
                },
              },
            },
          },
        },
      });

      // 4. Send notification to recipient
      await prisma.notification.create({
        data: {
          userId: sharedWith,
          type: 'system',
          title: 'Application Shared With You',
          message: `${share.sharer.profile?.displayName || share.sharer.username} shared a job application with you`,
          actionUrl: `/company/applications/${applicationId}`,
          referenceId: applicationId,
        },
      });

      // 5. Track in history
      await prisma.applicationStatusHistory.create({
        data: {
          applicationId,
          fromStatus: application.status,
          toStatus: application.status,
          changedById: userId,
          notes: `Shared with ${recipient.username}`,
        },
      });

      logger.info('Application shared', {
        applicationId,
        sharedBy: userId,
        sharedWith,
      });

      return share;
    } catch (error) {
      if (
        error instanceof NotFoundError ||
        error instanceof ForbiddenError
      ) {
        throw error;
      }
      Sentry.captureException(error);
      logger.error('Error sharing application:', error);
      throw new Error('Failed to share application');
    }
  }

  /**
   * Get application activity log
   */
  async getApplicationActivity(applicationId: string, userId: string) {
    try {
      // 1. Verify access
      const application = await prisma.jobApplication.findUnique({
        where: { id: applicationId },
        include: {
          job: {
            include: {
              company: {
                select: {
                  ownerUserId: true,
                },
              },
            },
          },
        },
      });

      if (!application) {
        throw new NotFoundError('Application not found');
      }

      if (application.job.company.ownerUserId !== userId) {
        throw new ForbiddenError(
          'You do not have permission to view this activity log'
        );
      }

      // 2. Get all activity (status history)
      const activity = await prisma.applicationStatusHistory.findMany({
        where: { applicationId },
        orderBy: {
          createdAt: 'desc',
        },
      });

      logger.info('Fetched application activity', {
        applicationId,
        userId,
        activityCount: activity.length,
      });

      return activity;
    } catch (error) {
      if (
        error instanceof NotFoundError ||
        error instanceof ForbiddenError
      ) {
        throw error;
      }
      Sentry.captureException(error);
      logger.error('Error fetching application activity:', error);
      throw new Error('Failed to fetch application activity');
    }
  }

  /**
   * Bulk update application status
   */
  async bulkUpdateStatus(
    applicationIds: string[],
    status: ApplicationStatus,
    userId: string
  ) {
    const transaction = Sentry.startTransaction({
      op: 'ats.bulkUpdateStatus',
      name: 'Bulk Update Application Status',
    });

    try {
      // 1. Verify all applications belong to user's company
      const applications = await prisma.jobApplication.findMany({
        where: {
          id: { in: applicationIds },
        },
        include: {
          job: {
            include: {
              company: {
                select: {
                  ownerUserId: true,
                },
              },
            },
          },
        },
      });

      if (applications.length === 0) {
        throw new NotFoundError('No applications found');
      }

      // Verify all belong to user's company
      const invalidApplications = applications.filter(
        (app) => app.job.company.ownerUserId !== userId
      );

      if (invalidApplications.length > 0) {
        throw new ForbiddenError(
          'Some applications do not belong to your company'
        );
      }

      // 2. Update all applications
      const updateResult = await prisma.jobApplication.updateMany({
        where: {
          id: { in: applicationIds },
        },
        data: {
          status,
        },
      });

      // 3. Track history for each
      await Promise.all(
        applications.map((app) =>
          prisma.applicationStatusHistory.create({
            data: {
              applicationId: app.id,
              fromStatus: app.status,
              toStatus: status,
              changedById: userId,
              notes: `Bulk status update to ${status}`,
            },
          })
        )
      );

      logger.info('Bulk application status update', {
        count: updateResult.count,
        newStatus: status,
        userId,
      });

      transaction.finish();
      return {
        updated: updateResult.count,
        status,
      };
    } catch (error) {
      transaction.finish();
      if (
        error instanceof NotFoundError ||
        error instanceof ForbiddenError
      ) {
        throw error;
      }
      Sentry.captureException(error);
      logger.error('Error bulk updating application status:', error);
      throw new Error('Failed to bulk update application status');
    }
  }

  /**
   * Bulk archive applications
   */
  async bulkArchive(applicationIds: string[], userId: string) {
    return this.bulkUpdateStatus(applicationIds, 'rejected', userId);
  }

  /**
   * Send notification to candidate about status change
   */
  private async notifyCandidateOfStatusChange(
    application: any,
    status: ApplicationStatus
  ): Promise<void> {
    try {
      const statusMessages: Record<ApplicationStatus, string> = {
        submitted: 'Your application has been submitted',
        viewed: 'Your application has been viewed by the company',
        screening: 'Your application is under screening',
        interview: 'You have been invited for an interview',
        offer: 'Congratulations! You received a job offer',
        rejected: 'Your application was not selected',
        withdrawn: 'You withdrew your application',
      };

      await prisma.notification.create({
        data: {
          userId: application.user.id,
          type: 'system',
          title: 'Application Status Update',
          message: `${statusMessages[status]} - ${application.job.title}`,
          actionUrl: `/applications/${application.id}`,
          referenceId: application.id,
        },
      });
    } catch (error) {
      logger.error('Error sending status change notification:', error);
      // Don't throw - notification failure shouldn't fail the operation
    }
  }
}

export default new ATSService();
