import { PrismaClient, Job, JobSkill, Prisma } from '@prisma/client';
import * as Sentry from '@sentry/node';
import prisma from '@/config/database';
import { ListJobsQuery } from './jobs.validation';

/**
 * JobRepository
 * Data access layer for job operations
 */
export class JobRepository {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || prisma;
  }

  /**
   * Create a new job posting
   */
  async create(data: Prisma.JobCreateInput): Promise<Job> {
    try {
      return await this.prisma.job.create({
        data,
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
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'JobRepository', method: 'create' },
      });
      throw error;
    }
  }

  /**
   * Find job by ID
   */
  async findById(id: string): Promise<Job | null> {
    try {
      return await this.prisma.job.findUnique({
        where: { id },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              slug: true,
              logoUrl: true,
              website: true,
              location: true,
              companySize: true,
              verifiedCompany: true,
            },
          },
          skills: true,
          models: {
            include: {
              model: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  provider: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'JobRepository', method: 'findById' },
      });
      throw error;
    }
  }

  /**
   * Find job by slug
   */
  async findBySlug(slug: string): Promise<Job | null> {
    try {
      return await this.prisma.job.findUnique({
        where: { slug },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              slug: true,
              logoUrl: true,
              website: true,
              location: true,
              companySize: true,
              verifiedCompany: true,
            },
          },
          skills: true,
          models: {
            include: {
              model: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  provider: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'JobRepository', method: 'findBySlug' },
      });
      throw error;
    }
  }

  /**
   * List jobs with filters and pagination
   */
  async findMany(query: ListJobsQuery): Promise<{ jobs: Job[]; total: number }> {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        jobType,
        workLocation,
        experienceLevel,
        location,
        hasVisaSponsorship,
        salaryMin,
        salaryMax,
        primaryLlms,
        frameworks,
        modelStrategy,
        search,
        sortBy = 'publishedAt',
        sortOrder = 'desc',
      } = query;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: Prisma.JobWhereInput = {};

      if (status) {
        where.status = status;
      } else {
        // Default to active jobs if no status specified
        where.status = 'active';
      }

      if (jobType) {
        where.jobType = jobType;
      }

      if (workLocation) {
        where.workLocation = workLocation;
      }

      if (experienceLevel) {
        where.experienceLevel = experienceLevel;
      }

      if (location) {
        where.location = { contains: location, mode: 'insensitive' };
      }

      if (hasVisaSponsorship !== undefined) {
        where.hasVisaSponsorship = hasVisaSponsorship;
      }

      if (salaryMin !== undefined) {
        where.salaryMin = { gte: salaryMin };
      }

      if (salaryMax !== undefined) {
        where.salaryMax = { lte: salaryMax };
      }

      if (primaryLlms) {
        const llmsArray = primaryLlms.split(',').map((s) => s.trim());
        where.primaryLlms = { hasSome: llmsArray };
      }

      if (frameworks) {
        const frameworksArray = frameworks.split(',').map((s) => s.trim());
        where.frameworks = { hasSome: frameworksArray };
      }

      if (modelStrategy) {
        where.modelStrategy = modelStrategy;
      }

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { requirements: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Build order by
      const orderBy: Prisma.JobOrderByWithRelationInput = {};
      orderBy[sortBy] = sortOrder;

      // Execute queries in parallel
      const [jobs, total] = await Promise.all([
        this.prisma.job.findMany({
          where,
          skip,
          take: limit,
          orderBy,
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
            skills: {
              where: { isRequired: true },
              take: 5,
            },
          },
        }),
        this.prisma.job.count({ where }),
      ]);

      return { jobs, total };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'JobRepository', method: 'findMany' },
      });
      throw error;
    }
  }

  /**
   * Update job by ID
   */
  async update(id: string, data: Prisma.JobUpdateInput): Promise<Job> {
    try {
      return await this.prisma.job.update({
        where: { id },
        data,
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
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'JobRepository', method: 'update' },
      });
      throw error;
    }
  }

  /**
   * Soft delete job (set status to closed)
   */
  async softDelete(id: string): Promise<Job> {
    try {
      return await this.prisma.job.update({
        where: { id },
        data: { status: 'closed' },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'JobRepository', method: 'softDelete' },
      });
      throw error;
    }
  }

  /**
   * Increment view count
   */
  async incrementViewCount(id: string): Promise<void> {
    try {
      await this.prisma.job.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'JobRepository', method: 'incrementViewCount' },
      });
      // Don't throw error for view count increment failures
    }
  }

  /**
   * Find jobs by company ID
   */
  async findByCompanyId(companyId: string, includeInactive = false): Promise<Job[]> {
    try {
      const where: Prisma.JobWhereInput = { companyId };

      if (!includeInactive) {
        where.status = { in: ['draft', 'active'] };
      }

      return await this.prisma.job.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          skills: true,
        },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'JobRepository', method: 'findByCompanyId' },
      });
      throw error;
    }
  }

  /**
   * Create job skills
   */
  async createSkills(jobId: string, skills: Prisma.JobSkillCreateManyInput[]): Promise<void> {
    try {
      const skillsWithJobId = skills.map(skill => ({
        ...skill,
        jobId,
      }));

      await this.prisma.jobSkill.createMany({
        data: skillsWithJobId,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'JobRepository', method: 'createSkills' },
      });
      throw error;
    }
  }

  /**
   * Delete job skills
   */
  async deleteSkills(jobId: string): Promise<void> {
    try {
      await this.prisma.jobSkill.deleteMany({
        where: { jobId },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'JobRepository', method: 'deleteSkills' },
      });
      throw error;
    }
  }

  /**
   * Update job skills (delete existing and create new)
   */
  async updateSkills(jobId: string, skills: Prisma.JobSkillCreateManyInput[]): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        // Delete existing skills
        await tx.jobSkill.deleteMany({
          where: { jobId },
        });

        // Create new skills
        if (skills.length > 0) {
          const skillsWithJobId = skills.map(skill => ({
            ...skill,
            jobId,
          }));

          await tx.jobSkill.createMany({
            data: skillsWithJobId,
          });
        }
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'JobRepository', method: 'updateSkills' },
      });
      throw error;
    }
  }

  /**
   * Close expired jobs (scheduled task)
   */
  async closeExpiredJobs(): Promise<number> {
    try {
      const result = await this.prisma.job.updateMany({
        where: {
          status: 'active',
          expiresAt: {
            lte: new Date(),
          },
        },
        data: {
          status: 'closed',
        },
      });

      return result.count;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'JobRepository', method: 'closeExpiredJobs' },
      });
      throw error;
    }
  }
}

export default JobRepository;
