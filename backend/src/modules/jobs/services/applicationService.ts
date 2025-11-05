import * as Sentry from '@sentry/node';
import { JobApplication, ApplicationStatus, Prisma } from '@prisma/client';
import prisma from '@/config/database';
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
  ValidationError,
} from '@/utils/errors';
import logger from '@/utils/logger';

/**
 * ApplicationService
 * Business logic for job application operations including Easy Apply
 */
export class ApplicationService {
  /**
   * Auto-fill application data from candidate profile
   */
  private async autoFillFromProfile(userId: string) {
    try {
      // Fetch user with all related profile data
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
          skills: {
            orderBy: { proficiency: 'desc' },
          },
          workExperiences: {
            orderBy: { startDate: 'desc' },
          },
          educations: {
            orderBy: { startDate: 'desc' },
          },
          portfolioProjects: {
            where: { isFeatured: true },
            orderBy: { displayOrder: 'asc' },
            take: 5,
          },
        },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Build auto-filled data
      return {
        name: user.profile?.displayName || user.username,
        email: user.email,
        phone: null, // Phone not in current schema
        workExperience: user.workExperiences.map((exp) => ({
          title: exp.title,
          company: exp.company,
          location: exp.location,
          employmentType: exp.employmentType,
          startDate: exp.startDate,
          endDate: exp.endDate,
          description: exp.description,
          techStack: exp.techStack,
        })),
        education: user.educations.map((edu) => ({
          institution: edu.institution,
          degree: edu.degree,
          fieldOfStudy: edu.fieldOfStudy,
          startDate: edu.startDate,
          endDate: edu.endDate,
          description: edu.description,
        })),
        skills: user.skills.map((skill) => ({
          name: skill.skillName,
          type: skill.skillType,
          proficiency: skill.proficiency,
        })),
        portfolio: user.portfolioProjects.map((project) => ({
          title: project.title,
          description: project.description,
          url: project.projectUrl,
          githubUrl: project.githubUrl,
          demoUrl: project.demoUrl,
        })),
        resumeUrl: null, // Resume URL not in current schema - would need to be added
      };
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Error auto-filling profile data:', error);
      throw error;
    }
  }

  /**
   * Create a job application (Easy Apply)
   */
  async applyToJob(input: {
    jobId: string;
    userId: string;
    coverLetter?: string;
    screeningAnswers?: Record<string, any>;
    source?: string;
  }): Promise<JobApplication> {
    const transaction = Sentry.startTransaction({
      op: 'job.apply',
      name: 'Create Job Application',
    });

    try {
      // 1. Check if job exists and is active
      const job = await prisma.job.findUnique({
        where: { id: input.jobId },
        include: {
          company: {
            select: {
              name: true,
              ownerUserId: true,
            },
          },
        },
      });

      if (!job) {
        throw new NotFoundError('Job not found');
      }

      if (job.status !== 'active') {
        throw new BadRequestError('This job is no longer accepting applications');
      }

      if (job.expiresAt && job.expiresAt < new Date()) {
        throw new BadRequestError('This job posting has expired');
      }

      // 2. Check for duplicate application
      const existingApplication = await prisma.jobApplication.findUnique({
        where: {
          jobId_userId: {
            jobId: input.jobId,
            userId: input.userId,
          },
        },
      });

      if (existingApplication) {
        throw new BadRequestError('You have already applied to this job');
      }

      // 3. Auto-fill profile data
      const profileData = await this.autoFillFromProfile(input.userId);

      // 4. Validate screening questions if job requires them
      if (job.screeningQuestions) {
        const questions = job.screeningQuestions as any[];
        if (questions && questions.length > 0) {
          if (!input.screeningAnswers) {
            throw new ValidationError('This job requires screening questions to be answered');
          }

          // Validate all required questions are answered
          const requiredQuestions = questions.filter((q) => q.required);
          for (const question of requiredQuestions) {
            if (!input.screeningAnswers[question.id]) {
              throw new ValidationError(`Question "${question.question}" is required`);
            }
          }
        }
      }

      // 5. Create application
      const application = await prisma.jobApplication.create({
        data: {
          jobId: input.jobId,
          userId: input.userId,
          coverLetter: input.coverLetter,
          resumeUrl: profileData.resumeUrl,
          screeningAnswers: input.screeningAnswers || null,
          source: input.source || 'easy_apply',
          status: 'submitted',
        },
        include: {
          job: {
            select: {
              title: true,
              slug: true,
              company: {
                select: {
                  name: true,
                  ownerUserId: true,
                },
              },
            },
          },
          user: {
            select: {
              username: true,
              email: true,
              profile: {
                select: {
                  displayName: true,
                },
              },
            },
          },
        },
      });

      // 6. Update job application count
      await prisma.job.update({
        where: { id: input.jobId },
        data: {
          applicationCount: {
            increment: 1,
          },
        },
      });

      // 7. Send notification to company owner
      await this.notifyCompanyOfNewApplication(application);

      // 8. Send confirmation notification to candidate
      await this.notifyCandidateOfSubmission(application);

      logger.info('Job application created', {
        applicationId: application.id,
        jobId: input.jobId,
        userId: input.userId,
      });

      transaction.finish();
      return application;
    } catch (error) {
      transaction.finish();
      Sentry.captureException(error);
      logger.error('Error creating job application:', error);
      throw error;
    }
  }

  /**
   * Get user's applications
   */
  async getUserApplications(
    userId: string,
    filters?: {
      status?: ApplicationStatus;
      sortBy?: 'date_applied' | 'status' | 'company';
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<JobApplication[]> {
    try {
      const where: Prisma.JobApplicationWhereInput = {
        userId,
      };

      if (filters?.status) {
        where.status = filters.status;
      }

      const orderBy: Prisma.JobApplicationOrderByWithRelationInput = {};
      if (filters?.sortBy === 'date_applied') {
        orderBy.appliedAt = filters.sortOrder || 'desc';
      } else if (filters?.sortBy === 'status') {
        orderBy.status = filters.sortOrder || 'asc';
      } else if (filters?.sortBy === 'company') {
        orderBy.job = {
          company: {
            name: filters.sortOrder || 'asc',
          },
        };
      } else {
        orderBy.appliedAt = 'desc';
      }

      const applications = await prisma.jobApplication.findMany({
        where,
        orderBy,
        include: {
          job: {
            select: {
              id: true,
              title: true,
              slug: true,
              jobType: true,
              workLocation: true,
              location: true,
              status: true,
              company: {
                select: {
                  name: true,
                  logoUrl: true,
                  slug: true,
                },
              },
            },
          },
        },
      });

      return applications;
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Error fetching user applications:', error);
      throw error;
    }
  }

  /**
   * Get application details by ID
   */
  async getApplicationById(
    applicationId: string,
    userId: string
  ): Promise<JobApplication> {
    try {
      const application = await prisma.jobApplication.findUnique({
        where: { id: applicationId },
        include: {
          job: {
            include: {
              company: true,
            },
          },
          user: {
            select: {
              username: true,
              email: true,
              profile: true,
            },
          },
        },
      });

      if (!application) {
        throw new NotFoundError('Application not found');
      }

      // Verify ownership (candidate or company owner can view)
      const isOwner = application.userId === userId;
      const isCompanyOwner = application.job.company.ownerUserId === userId;

      if (!isOwner && !isCompanyOwner) {
        throw new ForbiddenError('You do not have permission to view this application');
      }

      return application;
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Error fetching application details:', error);
      throw error;
    }
  }

  /**
   * Withdraw application
   */
  async withdrawApplication(
    applicationId: string,
    userId: string
  ): Promise<JobApplication> {
    const transaction = Sentry.startTransaction({
      op: 'job.withdraw',
      name: 'Withdraw Application',
    });

    try {
      // Get application
      const application = await prisma.jobApplication.findUnique({
        where: { id: applicationId },
        include: {
          job: {
            select: {
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

      // Verify ownership
      if (application.userId !== userId) {
        throw new ForbiddenError('You can only withdraw your own applications');
      }

      // Check if already withdrawn
      if (application.status === 'withdrawn') {
        throw new BadRequestError('Application is already withdrawn');
      }

      // Cannot withdraw if already offered or accepted
      if (application.status === 'offer') {
        throw new BadRequestError('Cannot withdraw application after receiving an offer');
      }

      // Update status to withdrawn
      const updatedApplication = await prisma.jobApplication.update({
        where: { id: applicationId },
        data: {
          status: 'withdrawn',
        },
        include: {
          job: {
            select: {
              title: true,
              company: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      // Notify company owner
      await this.notifyCompanyOfWithdrawal(updatedApplication);

      logger.info('Application withdrawn', {
        applicationId,
        userId,
      });

      transaction.finish();
      return updatedApplication;
    } catch (error) {
      transaction.finish();
      Sentry.captureException(error);
      logger.error('Error withdrawing application:', error);
      throw error;
    }
  }

  /**
   * Update application status (company side)
   */
  async updateApplicationStatus(
    applicationId: string,
    status: ApplicationStatus,
    userId: string
  ): Promise<JobApplication> {
    const transaction = Sentry.startTransaction({
      op: 'job.updateStatus',
      name: 'Update Application Status',
    });

    try {
      // Get application
      const application = await prisma.jobApplication.findUnique({
        where: { id: applicationId },
        include: {
          job: {
            include: {
              company: true,
            },
          },
        },
      });

      if (!application) {
        throw new NotFoundError('Application not found');
      }

      // Verify company ownership
      if (application.job.company.ownerUserId !== userId) {
        throw new ForbiddenError('Only the company owner can update application status');
      }

      // Update status
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

      // Notify candidate of status change
      await this.notifyCandidateOfStatusChange(updatedApplication);

      logger.info('Application status updated', {
        applicationId,
        newStatus: status,
        updatedBy: userId,
      });

      transaction.finish();
      return updatedApplication;
    } catch (error) {
      transaction.finish();
      Sentry.captureException(error);
      logger.error('Error updating application status:', error);
      throw error;
    }
  }

  /**
   * Get application statistics for user
   */
  async getUserApplicationStats(userId: string) {
    try {
      const [totalApplied, byStatus] = await Promise.all([
        prisma.jobApplication.count({
          where: { userId },
        }),
        prisma.jobApplication.groupBy({
          by: ['status'],
          where: { userId },
          _count: true,
        }),
      ]);

      const statusCounts = byStatus.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<string, number>);

      const viewed = statusCounts.viewed || 0;
      const interview = statusCounts.interview || 0;
      const offer = statusCounts.offer || 0;

      return {
        totalApplied,
        statusCounts,
        viewedRate: totalApplied > 0 ? (viewed / totalApplied) * 100 : 0,
        interviewRate: totalApplied > 0 ? (interview / totalApplied) * 100 : 0,
        offerRate: totalApplied > 0 ? (offer / totalApplied) * 100 : 0,
      };
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Error fetching application statistics:', error);
      throw error;
    }
  }

  /**
   * Send notification to company owner about new application
   */
  private async notifyCompanyOfNewApplication(application: any): Promise<void> {
    try {
      await prisma.notification.create({
        data: {
          userId: application.job.company.ownerUserId,
          type: 'system',
          title: 'New Job Application',
          message: `${application.user.profile?.displayName || application.user.username} applied for ${application.job.title}`,
          actionUrl: `/dashboard/applications/${application.id}`,
          referenceId: application.id,
        },
      });
    } catch (error) {
      logger.error('Error sending company notification:', error);
      // Don't throw - notification failure shouldn't fail the application
    }
  }

  /**
   * Send confirmation notification to candidate
   */
  private async notifyCandidateOfSubmission(application: any): Promise<void> {
    try {
      await prisma.notification.create({
        data: {
          userId: application.userId,
          type: 'system',
          title: 'Application Submitted',
          message: `Your application for ${application.job.title} at ${application.job.company.name} has been submitted successfully`,
          actionUrl: `/applications/${application.id}`,
          referenceId: application.id,
        },
      });
    } catch (error) {
      logger.error('Error sending candidate notification:', error);
    }
  }

  /**
   * Notify company of application withdrawal
   */
  private async notifyCompanyOfWithdrawal(application: any): Promise<void> {
    try {
      await prisma.notification.create({
        data: {
          userId: application.job.company.ownerUserId,
          type: 'system',
          title: 'Application Withdrawn',
          message: `A candidate withdrew their application for ${application.job.title}`,
          referenceId: application.id,
        },
      });
    } catch (error) {
      logger.error('Error sending withdrawal notification:', error);
    }
  }

  /**
   * Notify candidate of status change
   */
  private async notifyCandidateOfStatusChange(application: any): Promise<void> {
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
          message: `${statusMessages[application.status as ApplicationStatus]} - ${application.job.title}`,
          actionUrl: `/applications/${application.id}`,
          referenceId: application.id,
        },
      });
    } catch (error) {
      logger.error('Error sending status change notification:', error);
    }
  }
}

export default ApplicationService;
