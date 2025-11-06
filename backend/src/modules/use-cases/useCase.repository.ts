import { UseCase, UseCaseStatus, Prisma } from '@prisma/client';
import * as Sentry from '@sentry/node';
import prisma from '@/config/database';
import logger from '@/utils/logger';
import {
  CreateUseCaseInput,
  UpdateUseCaseInput,
  UseCaseFilters,
  ReviewUseCaseInput,
} from './useCase.validation';

/**
 * UseCase Repository
 * Handles all database operations for use cases
 */
export class UseCaseRepository {
  /**
   * Include clause for use case queries
   */
  private readonly defaultInclude = {
    author: {
      select: {
        id: true,
        username: true,
        email: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    },
    company: {
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        companySize: true,
      },
    },
  };

  /**
   * Create a new use case
   */
  async create(
    data: CreateUseCaseInput,
    authorId: string,
    slug: string
  ): Promise<UseCase> {
    try {
      const { content, modelIds, ...useCaseData } = data;

      const useCase = await prisma.useCase.create({
        data: {
          ...useCaseData,
          slug,
          contentJson: content as Prisma.InputJsonValue,
          authorId,
          modelIds: modelIds || [],
          status: UseCaseStatus.pending,
          hasCode: content.codeSnippets && content.codeSnippets.length > 0,
          hasRoiData: content.metrics && content.metrics.length > 0,
        },
        include: this.defaultInclude,
      });

      logger.info(`Use case created: ${useCase.id} (${useCase.slug})`);

      return useCase;
    } catch (error) {
      logger.error('Failed to create use case:', error);
      Sentry.captureException(error, {
        tags: { repository: 'UseCaseRepository', method: 'create' },
        extra: { data, authorId },
      });
      throw error;
    }
  }

  /**
   * Find use case by ID
   */
  async findById(id: string): Promise<UseCase | null> {
    try {
      return await prisma.useCase.findUnique({
        where: { id },
        include: this.defaultInclude,
      });
    } catch (error) {
      logger.error('Failed to find use case by ID:', error);
      Sentry.captureException(error, {
        tags: { repository: 'UseCaseRepository', method: 'findById' },
        extra: { id },
      });
      throw error;
    }
  }

  /**
   * Find use case by slug
   */
  async findBySlug(slug: string): Promise<UseCase | null> {
    try {
      return await prisma.useCase.findUnique({
        where: { slug },
        include: this.defaultInclude,
      });
    } catch (error) {
      logger.error('Failed to find use case by slug:', error);
      Sentry.captureException(error, {
        tags: { repository: 'UseCaseRepository', method: 'findBySlug' },
        extra: { slug },
      });
      throw error;
    }
  }

  /**
   * List use cases with filters and pagination
   */
  async list(
    filters: UseCaseFilters
  ): Promise<{ useCases: UseCase[]; total: number }> {
    try {
      const {
        status,
        category,
        industry,
        implementationType,
        companySize,
        featured,
        hasCode,
        hasRoiData,
        authorId,
        companyId,
        modelId,
        techStack,
        search,
        sort,
        page = 1,
        limit = 20,
      } = filters;

      // Build where clause
      const where: Prisma.UseCaseWhereInput = {
        ...(status && { status }),
        ...(category && { category }),
        ...(industry && { industry }),
        ...(implementationType && { implementationType }),
        ...(companySize && { companySize }),
        ...(featured !== undefined && { featured }),
        ...(hasCode !== undefined && { hasCode }),
        ...(hasRoiData !== undefined && { hasRoiData }),
        ...(authorId && { authorId }),
        ...(companyId && { companyId }),
        ...(modelId && { modelIds: { has: modelId } }),
        ...(techStack && {
          techStack: { hasSome: techStack.split(',').map((t) => t.trim()) },
        }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { summary: { contains: search, mode: 'insensitive' } },
          ],
        }),
      };

      // Build orderBy clause
      let orderBy: Prisma.UseCaseOrderByWithRelationInput = {};
      switch (sort) {
        case 'popular':
        case 'views':
          orderBy = { viewCount: 'desc' };
          break;
        case 'most_discussed':
          orderBy = { commentCount: 'desc' };
          break;
        case 'recent':
        default:
          orderBy = { publishedAt: 'desc' };
          break;
      }

      // Execute queries
      const [useCases, total] = await Promise.all([
        prisma.useCase.findMany({
          where,
          include: this.defaultInclude,
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.useCase.count({ where }),
      ]);

      return { useCases, total };
    } catch (error) {
      logger.error('Failed to list use cases:', error);
      Sentry.captureException(error, {
        tags: { repository: 'UseCaseRepository', method: 'list' },
        extra: { filters },
      });
      throw error;
    }
  }

  /**
   * Update use case
   */
  async update(
    id: string,
    data: UpdateUseCaseInput
  ): Promise<UseCase> {
    try {
      const { content, modelIds, ...updateData } = data;

      const useCase = await prisma.useCase.update({
        where: { id },
        data: {
          ...updateData,
          ...(content && { contentJson: content as Prisma.InputJsonValue }),
          ...(modelIds && { modelIds }),
          ...(content && {
            hasCode: content.codeSnippets && content.codeSnippets.length > 0,
            hasRoiData: content.metrics && content.metrics.length > 0,
          }),
        },
        include: this.defaultInclude,
      });

      logger.info(`Use case updated: ${useCase.id} (${useCase.slug})`);

      return useCase;
    } catch (error) {
      logger.error('Failed to update use case:', error);
      Sentry.captureException(error, {
        tags: { repository: 'UseCaseRepository', method: 'update' },
        extra: { id, data },
      });
      throw error;
    }
  }

  /**
   * Review use case (admin action)
   */
  async review(
    id: string,
    reviewData: ReviewUseCaseInput
  ): Promise<UseCase> {
    try {
      const { status, rejectionReason, featured } = reviewData;

      const updateData: Prisma.UseCaseUpdateInput = {
        status,
        ...(featured !== undefined && { featured }),
        ...(status === UseCaseStatus.published && {
          publishedAt: new Date(),
        }),
        ...(status === UseCaseStatus.rejected && {
          rejectedAt: new Date(),
          rejectionReason,
        }),
      };

      const useCase = await prisma.useCase.update({
        where: { id },
        data: updateData,
        include: this.defaultInclude,
      });

      logger.info(
        `Use case reviewed: ${useCase.id} - Status: ${status}`
      );

      return useCase;
    } catch (error) {
      logger.error('Failed to review use case:', error);
      Sentry.captureException(error, {
        tags: { repository: 'UseCaseRepository', method: 'review' },
        extra: { id, reviewData },
      });
      throw error;
    }
  }

  /**
   * Delete use case
   */
  async delete(id: string): Promise<void> {
    try {
      await prisma.useCase.delete({
        where: { id },
      });

      logger.info(`Use case deleted: ${id}`);
    } catch (error) {
      logger.error('Failed to delete use case:', error);
      Sentry.captureException(error, {
        tags: { repository: 'UseCaseRepository', method: 'delete' },
        extra: { id },
      });
      throw error;
    }
  }

  /**
   * Increment view count
   */
  async incrementViewCount(id: string): Promise<void> {
    try {
      await prisma.useCase.update({
        where: { id },
        data: {
          viewCount: {
            increment: 1,
          },
        },
      });
    } catch (error) {
      logger.error('Failed to increment view count:', error);
      Sentry.captureException(error, {
        tags: { repository: 'UseCaseRepository', method: 'incrementViewCount' },
        extra: { id },
      });
      // Don't throw - view count increment is non-critical
    }
  }

  /**
   * Get featured use cases
   */
  async getFeatured(limit: number = 5): Promise<UseCase[]> {
    try {
      return await prisma.useCase.findMany({
        where: {
          status: UseCaseStatus.published,
          featured: true,
        },
        include: this.defaultInclude,
        orderBy: {
          publishedAt: 'desc',
        },
        take: limit,
      });
    } catch (error) {
      logger.error('Failed to get featured use cases:', error);
      Sentry.captureException(error, {
        tags: { repository: 'UseCaseRepository', method: 'getFeatured' },
        extra: { limit },
      });
      throw error;
    }
  }

  /**
   * Get related use cases (by category and industry)
   */
  async getRelated(
    useCaseId: string,
    category: string,
    industry: string,
    limit: number = 5
  ): Promise<UseCase[]> {
    try {
      return await prisma.useCase.findMany({
        where: {
          id: { not: useCaseId },
          status: UseCaseStatus.published,
          OR: [{ category }, { industry }],
        },
        include: this.defaultInclude,
        orderBy: {
          viewCount: 'desc',
        },
        take: limit,
      });
    } catch (error) {
      logger.error('Failed to get related use cases:', error);
      Sentry.captureException(error, {
        tags: { repository: 'UseCaseRepository', method: 'getRelated' },
        extra: { useCaseId, category, industry, limit },
      });
      throw error;
    }
  }

  /**
   * Check if slug exists
   */
  async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    try {
      const useCase = await prisma.useCase.findUnique({
        where: { slug },
        select: { id: true },
      });

      if (!useCase) {
        return false;
      }

      if (excludeId && useCase.id === excludeId) {
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Failed to check slug existence:', error);
      Sentry.captureException(error, {
        tags: { repository: 'UseCaseRepository', method: 'slugExists' },
        extra: { slug, excludeId },
      });
      throw error;
    }
  }
}

export default new UseCaseRepository();
