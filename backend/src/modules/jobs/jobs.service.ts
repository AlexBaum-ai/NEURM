import * as Sentry from '@sentry/node';
import { Job, JobStatus } from '@prisma/client';
import JobRepository from './jobs.repository';
import MatchingService from './services/matchingService';
import {
  CreateJobInput,
  UpdateJobInput,
  ListJobsQuery,
} from './jobs.validation';
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
  ValidationError,
} from '@/utils/errors';
import logger from '@/utils/logger';
import prisma from '@/config/database';

/**
 * JobService
 * Business logic for job operations
 */
export class JobService {
  private repository: JobRepository;
  private matchingService: MatchingService;

  constructor(repository?: JobRepository, matchingService?: MatchingService) {
    this.repository = repository || new JobRepository();
    this.matchingService = matchingService || new MatchingService();
  }

  /**
   * Generate URL-friendly slug from job title and company name
   */
  private generateSlug(title: string, companySlug: string): string {
    const titleSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const timestamp = Date.now().toString(36);
    return `${companySlug}-${titleSlug}-${timestamp}`;
  }

  /**
   * Verify company ownership and verification
   */
  private async verifyCompanyAccess(companyId: string, userId: string): Promise<void> {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        ownerUserId: true,
        verifiedCompany: true,
      },
    });

    if (!company) {
      throw new NotFoundError('Company not found');
    }

    if (company.ownerUserId !== userId) {
      throw new ForbiddenError('You do not have permission to post jobs for this company');
    }

    if (!company.verifiedCompany) {
      throw new ForbiddenError('Company must be verified before posting jobs');
    }
  }

  /**
   * Create a new job posting
   */
  async createJob(
    companyId: string,
    userId: string,
    input: CreateJobInput
  ): Promise<Job> {
    try {
      // Verify company access and verification
      await this.verifyCompanyAccess(companyId, userId);

      // Get company for slug generation
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { slug: true },
      });

      if (!company) {
        throw new NotFoundError('Company not found');
      }

      // Generate slug
      const slug = this.generateSlug(input.title, company.slug);

      // Prepare job data
      const { skills, ...jobData } = input;

      // Set published date if status is active
      const publishedAt = input.status === 'active' ? new Date() : null;

      // Create job with skills in a transaction
      const job = await prisma.$transaction(async (tx) => {
        // Create job
        const createdJob = await tx.job.create({
          data: {
            ...jobData,
            slug,
            companyId,
            publishedAt,
          },
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
        });

        // Create skills if provided
        if (skills && skills.length > 0) {
          await tx.jobSkill.createMany({
            data: skills.map(skill => ({
              ...skill,
              jobId: createdJob.id,
            })),
          });
        }

        return createdJob;
      });

      logger.info(`Job created: ${job.id} - ${job.title}`);

      return job;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'JobService', method: 'createJob' },
        extra: { companyId, userId, input },
      });
      throw error;
    }
  }

  /**
   * Get job by ID
   */
  async getJobById(id: string, incrementView = false): Promise<Job> {
    try {
      const job = await this.repository.findById(id);

      if (!job) {
        throw new NotFoundError('Job not found');
      }

      // Increment view count asynchronously (don't wait)
      if (incrementView && job.status === 'active') {
        this.repository.incrementViewCount(id).catch((error) => {
          logger.error('Failed to increment job view count', { error, jobId: id });
        });
      }

      return job;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      Sentry.captureException(error, {
        tags: { service: 'JobService', method: 'getJobById' },
        extra: { id },
      });
      throw error;
    }
  }

  /**
   * Get job by slug
   */
  async getJobBySlug(slug: string, incrementView = false): Promise<Job> {
    try {
      const job = await this.repository.findBySlug(slug);

      if (!job) {
        throw new NotFoundError('Job not found');
      }

      // Increment view count asynchronously (don't wait)
      if (incrementView && job.status === 'active') {
        this.repository.incrementViewCount(job.id).catch((error) => {
          logger.error('Failed to increment job view count', { error, jobId: job.id });
        });
      }

      return job;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      Sentry.captureException(error, {
        tags: { service: 'JobService', method: 'getJobBySlug' },
        extra: { slug },
      });
      throw error;
    }
  }

  /**
   * List jobs with filters and pagination
   */
  async listJobs(query: ListJobsQuery, userId?: string): Promise<{
    jobs: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const { jobs, total } = await this.repository.findMany(query);

      const page = query.page || 1;
      const limit = query.limit || 20;
      const totalPages = Math.ceil(total / limit);

      let jobsWithMatch = jobs;

      // If match scoring is requested and user is authenticated
      if (query.match && userId) {
        const jobIds = jobs.map(job => job.id);
        const matchScores = await this.matchingService.getMatchScoresForJobs(jobIds, userId);

        // Attach match scores to jobs
        jobsWithMatch = jobs.map(job => ({
          ...job,
          matchScore: matchScores.get(job.id) || null,
        }));

        // Filter by minimum match score if specified
        if (query.minMatchScore) {
          jobsWithMatch = jobsWithMatch.filter(
            job => job.matchScore && job.matchScore.score >= query.minMatchScore!
          );
        }

        // Sort by match score if requested
        if (query.sortBy === 'matchScore') {
          jobsWithMatch.sort((a, b) => {
            const scoreA = a.matchScore?.score || 0;
            const scoreB = b.matchScore?.score || 0;
            return query.sortOrder === 'desc' ? scoreB - scoreA : scoreA - scoreB;
          });
        }
      }

      return {
        jobs: jobsWithMatch,
        pagination: {
          page,
          limit,
          total: jobsWithMatch.length,
          totalPages: Math.ceil(jobsWithMatch.length / limit),
        },
      };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'JobService', method: 'listJobs' },
        extra: { query },
      });
      throw error;
    }
  }

  /**
   * Get match score for a specific job
   */
  async getJobMatch(jobId: string, userId: string): Promise<any> {
    try {
      // Verify job exists
      const job = await this.repository.findById(jobId);

      if (!job) {
        throw new NotFoundError('Job not found');
      }

      // Calculate match score
      const matchScore = await this.matchingService.calculateMatchScore(jobId, userId);

      return {
        job: {
          id: job.id,
          title: job.title,
          slug: job.slug,
          company: job.company,
        },
        match: matchScore,
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      Sentry.captureException(error, {
        tags: { service: 'JobService', method: 'getJobMatch' },
        extra: { jobId, userId },
      });
      throw error;
    }
  }

  /**
   * Update job
   */
  async updateJob(
    id: string,
    userId: string,
    input: UpdateJobInput
  ): Promise<Job> {
    try {
      // Get existing job
      const existingJob = await this.repository.findById(id);

      if (!existingJob) {
        throw new NotFoundError('Job not found');
      }

      // Verify company access
      await this.verifyCompanyAccess(existingJob.companyId, userId);

      // Prepare update data
      const { skills, ...updateData } = input;

      // Set published date if changing status to active
      if (input.status === 'active' && existingJob.status !== 'active') {
        updateData.publishedAt = new Date();
      }

      // Update job and skills in a transaction
      const job = await prisma.$transaction(async (tx) => {
        // Update job
        const updatedJob = await tx.job.update({
          where: { id },
          data: updateData,
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
            skills: true,
          },
        });

        // Update skills if provided
        if (skills !== undefined) {
          // Delete existing skills
          await tx.jobSkill.deleteMany({
            where: { jobId: id },
          });

          // Create new skills
          if (skills.length > 0) {
            await tx.jobSkill.createMany({
              data: skills.map(skill => ({
                ...skill,
                jobId: id,
              })),
            });
          }
        }

        return updatedJob;
      });

      logger.info(`Job updated: ${job.id} - ${job.title}`);

      return job;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ForbiddenError) {
        throw error;
      }

      Sentry.captureException(error, {
        tags: { service: 'JobService', method: 'updateJob' },
        extra: { id, userId, input },
      });
      throw error;
    }
  }

  /**
   * Delete job (soft delete)
   */
  async deleteJob(id: string, userId: string): Promise<void> {
    try {
      // Get existing job
      const existingJob = await this.repository.findById(id);

      if (!existingJob) {
        throw new NotFoundError('Job not found');
      }

      // Verify company access
      await this.verifyCompanyAccess(existingJob.companyId, userId);

      // Soft delete (set status to closed)
      await this.repository.softDelete(id);

      logger.info(`Job deleted (soft): ${id}`);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ForbiddenError) {
        throw error;
      }

      Sentry.captureException(error, {
        tags: { service: 'JobService', method: 'deleteJob' },
        extra: { id, userId },
      });
      throw error;
    }
  }

  /**
   * Get company jobs
   */
  async getCompanyJobs(
    companyId: string,
    userId?: string,
    includeInactive = false
  ): Promise<Job[]> {
    try {
      // Verify company exists
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { id: true, ownerUserId: true },
      });

      if (!company) {
        throw new NotFoundError('Company not found');
      }

      // Only company owner can see inactive jobs
      const canSeeInactive = userId === company.ownerUserId;
      const showInactive = includeInactive && canSeeInactive;

      return await this.repository.findByCompanyId(companyId, showInactive);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      Sentry.captureException(error, {
        tags: { service: 'JobService', method: 'getCompanyJobs' },
        extra: { companyId, userId, includeInactive },
      });
      throw error;
    }
  }

  /**
   * Close expired jobs (scheduled task)
   */
  async closeExpiredJobs(): Promise<number> {
    try {
      const count = await this.repository.closeExpiredJobs();

      if (count > 0) {
        logger.info(`Closed ${count} expired jobs`);
      }

      return count;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'JobService', method: 'closeExpiredJobs' },
      });
      throw error;
    }
  }
}

export default JobService;
