import { Company, Prisma } from '@prisma/client';
import * as Sentry from '@sentry/node';
import companyRepository, { CompanyRepository } from './company.repository';
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from '@/utils/errors';
import { logger } from '@/utils/logger';

export class CompanyService {
  private repository: CompanyRepository;

  constructor(repository: CompanyRepository) {
    this.repository = repository;
  }

  /**
   * Get company public profile by ID or slug
   */
  async getCompanyProfile(identifier: string, userId?: string) {
    try {
      // Try to fetch by ID first, then by slug
      let company = await this.repository.findById(identifier, true);

      if (!company) {
        company = await this.repository.findBySlug(identifier, true);
      }

      if (!company) {
        throw new NotFoundError('Company not found');
      }

      // Check if user follows this company
      let isFollowing = false;
      if (userId) {
        isFollowing = await this.repository.isUserFollowing(
          company.id,
          userId
        );
      }

      // Increment view count (don't await to avoid blocking)
      this.repository.incrementViewCount(company.id).catch((err) => {
        logger.error('Failed to increment company view count', {
          companyId: company?.id,
          error: err,
        });
        Sentry.captureException(err, {
          tags: { operation: 'increment_company_view_count' },
          extra: { companyId: company?.id },
        });
      });

      return {
        ...company,
        isFollowing,
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      logger.error('Error fetching company profile', {
        identifier,
        error,
      });
      Sentry.captureException(error, {
        tags: { operation: 'get_company_profile' },
        extra: { identifier },
      });

      throw new Error('Failed to fetch company profile');
    }
  }

  /**
   * Update company profile
   */
  async updateCompanyProfile(
    companyId: string,
    userId: string,
    updateData: Partial<{
      name: string;
      description: string;
      website: string;
      logoUrl: string;
      headerImageUrl: string;
      industry: string;
      companySize: string;
      location: string;
      locations: string[];
      foundedYear: number;
      mission: string;
      benefits: string[];
      cultureDescription: string;
      techStack: any;
      linkedinUrl: string;
      twitterUrl: string;
      githubUrl: string;
    }>
  ): Promise<Company> {
    try {
      // Verify company exists
      const company = await this.repository.findById(companyId);

      if (!company) {
        throw new NotFoundError('Company not found');
      }

      // Verify user is the company owner
      if (company.ownerUserId !== userId) {
        throw new ForbiddenError(
          'You do not have permission to update this company profile'
        );
      }

      // Update company
      const updatedCompany = await this.repository.update(
        companyId,
        updateData as Prisma.CompanyUpdateInput
      );

      logger.info('Company profile updated', {
        companyId,
        userId,
        fields: Object.keys(updateData),
      });

      return updatedCompany;
    } catch (error) {
      if (
        error instanceof NotFoundError ||
        error instanceof ForbiddenError
      ) {
        throw error;
      }

      logger.error('Error updating company profile', {
        companyId,
        userId,
        error,
      });
      Sentry.captureException(error, {
        tags: { operation: 'update_company_profile' },
        extra: { companyId, userId },
      });

      throw new Error('Failed to update company profile');
    }
  }

  /**
   * Get company's active jobs
   */
  async getCompanyJobs(companyId: string, includeDetails = false) {
    try {
      // Verify company exists
      const company = await this.repository.findById(companyId);

      if (!company) {
        throw new NotFoundError('Company not found');
      }

      const jobs = await this.repository.getCompanyJobs(
        companyId,
        includeDetails
      );

      return jobs;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      logger.error('Error fetching company jobs', {
        companyId,
        error,
      });
      Sentry.captureException(error, {
        tags: { operation: 'get_company_jobs' },
        extra: { companyId },
      });

      throw new Error('Failed to fetch company jobs');
    }
  }

  /**
   * Follow company
   */
  async followCompany(companyId: string, userId: string): Promise<void> {
    try {
      // Verify company exists
      const company = await this.repository.findById(companyId);

      if (!company) {
        throw new NotFoundError('Company not found');
      }

      // Check if already following
      const isFollowing = await this.repository.isUserFollowing(
        companyId,
        userId
      );

      if (isFollowing) {
        throw new ConflictError('You are already following this company');
      }

      await this.repository.followCompany(companyId, userId);

      logger.info('User followed company', {
        companyId,
        userId,
      });
    } catch (error) {
      if (
        error instanceof NotFoundError ||
        error instanceof ConflictError
      ) {
        throw error;
      }

      logger.error('Error following company', {
        companyId,
        userId,
        error,
      });
      Sentry.captureException(error, {
        tags: { operation: 'follow_company' },
        extra: { companyId, userId },
      });

      throw new Error('Failed to follow company');
    }
  }

  /**
   * Unfollow company
   */
  async unfollowCompany(companyId: string, userId: string): Promise<void> {
    try {
      // Verify company exists
      const company = await this.repository.findById(companyId);

      if (!company) {
        throw new NotFoundError('Company not found');
      }

      // Check if actually following
      const isFollowing = await this.repository.isUserFollowing(
        companyId,
        userId
      );

      if (!isFollowing) {
        throw new ConflictError('You are not following this company');
      }

      await this.repository.unfollowCompany(companyId, userId);

      logger.info('User unfollowed company', {
        companyId,
        userId,
      });
    } catch (error) {
      if (
        error instanceof NotFoundError ||
        error instanceof ConflictError
      ) {
        throw error;
      }

      logger.error('Error unfollowing company', {
        companyId,
        userId,
        error,
      });
      Sentry.captureException(error, {
        tags: { operation: 'unfollow_company' },
        extra: { companyId, userId },
      });

      throw new Error('Failed to unfollow company');
    }
  }

  /**
   * Create company (typically called during company account registration)
   */
  async createCompany(
    ownerUserId: string,
    data: {
      name: string;
      website?: string;
      description?: string;
      industry?: string;
      companySize?: string;
      location?: string;
    }
  ): Promise<Company> {
    try {
      // Check if user already has a company
      const existingCompany =
        await this.repository.findByOwnerId(ownerUserId);

      if (existingCompany) {
        throw new ConflictError('User already has a company profile');
      }

      const company = await this.repository.create({
        name: data.name,
        website: data.website,
        description: data.description,
        industry: data.industry,
        companySize: data.companySize,
        location: data.location,
        owner: {
          connect: { id: ownerUserId },
        },
      });

      logger.info('Company created', {
        companyId: company.id,
        ownerUserId,
      });

      return company;
    } catch (error) {
      if (error instanceof ConflictError) {
        throw error;
      }

      logger.error('Error creating company', {
        ownerUserId,
        error,
      });
      Sentry.captureException(error, {
        tags: { operation: 'create_company' },
        extra: { ownerUserId },
      });

      throw new Error('Failed to create company');
    }
  }

  /**
   * List companies with pagination and filters
   */
  async listCompanies(params: {
    page?: number;
    limit?: number;
    search?: string;
    industry?: string;
    companySize?: string;
    verified?: boolean;
  }) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        industry,
        companySize,
        verified,
      } = params;

      const where: Prisma.CompanyWhereInput = {};

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (industry) {
        where.industry = industry;
      }

      if (companySize) {
        where.companySize = companySize;
      }

      if (verified !== undefined) {
        where.verifiedCompany = verified;
      }

      const result = await this.repository.list({
        skip: (page - 1) * limit,
        take: limit,
        where,
        orderBy: { createdAt: 'desc' },
      });

      return result;
    } catch (error) {
      logger.error('Error listing companies', {
        params,
        error,
      });
      Sentry.captureException(error, {
        tags: { operation: 'list_companies' },
        extra: { params },
      });

      throw new Error('Failed to list companies');
    }
  }
}

export default new CompanyService(companyRepository);
