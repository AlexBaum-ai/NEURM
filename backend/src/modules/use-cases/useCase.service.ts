import { UseCase, UseCaseStatus } from '@prisma/client';
import * as Sentry from '@sentry/node';
import { UseCaseRepository } from './useCase.repository';
import {
  CreateUseCaseInput,
  UpdateUseCaseInput,
  UseCaseFilters,
  ReviewUseCaseInput,
} from './useCase.validation';
import redisClient from '@/config/redisClient';
import logger from '@/utils/logger';
import { NotFoundError, BadRequestError, ConflictError, ForbiddenError } from '@/utils/errors';
import { slugify } from '@/utils/slugify';

/**
 * UseCase Service
 * Handles business logic for use cases including caching, permissions, and workflow
 */
export class UseCaseService {
  private repository: UseCaseRepository;
  private readonly CACHE_TTL = 600; // 10 minutes
  private readonly CACHE_PREFIX = 'use-case:';
  private readonly LIST_CACHE_PREFIX = 'use-cases:list:';
  private readonly FEATURED_CACHE_KEY = 'use-cases:featured';

  constructor(repository?: UseCaseRepository) {
    this.repository = repository || new UseCaseRepository();
  }

  /**
   * Submit a new use case
   */
  async submitUseCase(
    data: CreateUseCaseInput,
    authorId: string
  ): Promise<UseCase> {
    try {
      // Generate slug from title
      const baseSlug = slugify(data.title);
      let slug = baseSlug;
      let counter = 1;

      // Ensure slug is unique
      while (await this.repository.slugExists(slug)) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      // Create use case
      const useCase = await this.repository.create(data, authorId, slug);

      // Invalidate list cache
      await this.invalidateListCache();

      logger.info(`Use case submitted: ${useCase.id} by user ${authorId}`);

      return useCase;
    } catch (error) {
      logger.error('Failed to submit use case:', error);
      Sentry.captureException(error, {
        tags: { service: 'UseCaseService', method: 'submitUseCase' },
        extra: { data, authorId },
      });
      throw error;
    }
  }

  /**
   * Get use case by slug (public - with caching and view tracking)
   */
  async getUseCaseBySlug(slug: string): Promise<{
    useCase: UseCase;
    relatedUseCases: UseCase[];
  }> {
    try {
      const cacheKey = `${this.CACHE_PREFIX}slug:${slug}`;

      // Try to get from cache
      if (redisClient.isReady()) {
        const cached = await redisClient.getJSON<{
          useCase: UseCase;
          relatedUseCases: UseCase[];
        }>(cacheKey);

        if (cached) {
          logger.debug(`Use case cache hit: ${slug}`);

          // Increment view count asynchronously (don't wait)
          this.repository.incrementViewCount(cached.useCase.id).catch((error) => {
            logger.error(`Failed to increment view count: ${error}`);
          });

          return cached;
        }
      }

      logger.debug(`Use case cache miss: ${slug}`);

      // Get from database
      const useCase = await this.repository.findBySlug(slug);

      if (!useCase) {
        throw new NotFoundError(`Use case with slug "${slug}" not found`);
      }

      // Only show published use cases to public
      if (useCase.status !== UseCaseStatus.published) {
        throw new NotFoundError(`Use case with slug "${slug}" not found`);
      }

      // Get related use cases
      const relatedUseCases = await this.repository.getRelated(
        useCase.id,
        useCase.category,
        useCase.industry,
        5
      );

      const result = { useCase, relatedUseCases };

      // Cache the result
      if (redisClient.isReady()) {
        await redisClient.setJSON(cacheKey, result, this.CACHE_TTL);
      }

      // Increment view count
      await this.repository.incrementViewCount(useCase.id);

      return result;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Failed to get use case by slug:', error);
      Sentry.captureException(error, {
        tags: { service: 'UseCaseService', method: 'getUseCaseBySlug' },
        extra: { slug },
      });
      throw error;
    }
  }

  /**
   * Get use case by ID (with permissions check)
   */
  async getUseCaseById(
    id: string,
    userId?: string,
    userRole?: string
  ): Promise<UseCase> {
    try {
      const useCase = await this.repository.findById(id);

      if (!useCase) {
        throw new NotFoundError(`Use case with ID "${id}" not found`);
      }

      // Check permissions
      const isAdmin = userRole === 'admin' || userRole === 'moderator';
      const isAuthor = userId && useCase.authorId === userId;
      const isPublished = useCase.status === UseCaseStatus.published;

      if (!isPublished && !isAdmin && !isAuthor) {
        throw new ForbiddenError(
          'You do not have permission to view this use case'
        );
      }

      return useCase;
    } catch (error) {
      if (
        error instanceof NotFoundError ||
        error instanceof ForbiddenError
      ) {
        throw error;
      }
      logger.error('Failed to get use case by ID:', error);
      Sentry.captureException(error, {
        tags: { service: 'UseCaseService', method: 'getUseCaseById' },
        extra: { id, userId },
      });
      throw error;
    }
  }

  /**
   * List use cases with filters and pagination
   */
  async listUseCases(filters: UseCaseFilters): Promise<{
    useCases: UseCase[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const cacheKey = `${this.LIST_CACHE_PREFIX}${JSON.stringify(filters)}`;

      // Try to get from cache
      if (redisClient.isReady()) {
        const cached = await redisClient.getJSON<{
          useCases: UseCase[];
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        }>(cacheKey);

        if (cached) {
          logger.debug('Use cases list cache hit');
          return cached;
        }
      }

      logger.debug('Use cases list cache miss');

      // Ensure only published use cases are shown to public
      const adjustedFilters = {
        ...filters,
        status: filters.status || UseCaseStatus.published,
      };

      const { useCases, total } = await this.repository.list(adjustedFilters);

      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const totalPages = Math.ceil(total / limit);

      const result = {
        useCases,
        total,
        page,
        limit,
        totalPages,
      };

      // Cache the result
      if (redisClient.isReady()) {
        await redisClient.setJSON(cacheKey, result, this.CACHE_TTL);
      }

      return result;
    } catch (error) {
      logger.error('Failed to list use cases:', error);
      Sentry.captureException(error, {
        tags: { service: 'UseCaseService', method: 'listUseCases' },
        extra: { filters },
      });
      throw error;
    }
  }

  /**
   * Get featured use cases
   */
  async getFeaturedUseCases(limit: number = 5): Promise<UseCase[]> {
    try {
      // Try to get from cache
      if (redisClient.isReady()) {
        const cached = await redisClient.getJSON<UseCase[]>(
          this.FEATURED_CACHE_KEY
        );

        if (cached) {
          logger.debug('Featured use cases cache hit');
          return cached;
        }
      }

      logger.debug('Featured use cases cache miss');

      const useCases = await this.repository.getFeatured(limit);

      // Cache the result
      if (redisClient.isReady()) {
        await redisClient.setJSON(
          this.FEATURED_CACHE_KEY,
          useCases,
          this.CACHE_TTL
        );
      }

      return useCases;
    } catch (error) {
      logger.error('Failed to get featured use cases:', error);
      Sentry.captureException(error, {
        tags: { service: 'UseCaseService', method: 'getFeaturedUseCases' },
        extra: { limit },
      });
      throw error;
    }
  }

  /**
   * Update use case (author or admin)
   */
  async updateUseCase(
    id: string,
    data: UpdateUseCaseInput,
    userId: string,
    userRole: string
  ): Promise<UseCase> {
    try {
      const useCase = await this.repository.findById(id);

      if (!useCase) {
        throw new NotFoundError(`Use case with ID "${id}" not found`);
      }

      // Check permissions
      const isAdmin = userRole === 'admin' || userRole === 'moderator';
      const isAuthor = useCase.authorId === userId;

      if (!isAdmin && !isAuthor) {
        throw new ForbiddenError(
          'You do not have permission to update this use case'
        );
      }

      // Authors can only update pending or rejected use cases
      if (!isAdmin && useCase.status !== UseCaseStatus.pending && useCase.status !== UseCaseStatus.rejected) {
        throw new BadRequestError(
          'You can only update use cases that are pending or rejected'
        );
      }

      // Update use case
      const updatedUseCase = await this.repository.update(id, data);

      // Invalidate caches
      await this.invalidateUseCaseCache(useCase.slug);
      await this.invalidateListCache();

      logger.info(`Use case updated: ${id} by user ${userId}`);

      return updatedUseCase;
    } catch (error) {
      if (
        error instanceof NotFoundError ||
        error instanceof ForbiddenError ||
        error instanceof BadRequestError
      ) {
        throw error;
      }
      logger.error('Failed to update use case:', error);
      Sentry.captureException(error, {
        tags: { service: 'UseCaseService', method: 'updateUseCase' },
        extra: { id, data, userId },
      });
      throw error;
    }
  }

  /**
   * Review use case (admin only)
   */
  async reviewUseCase(
    id: string,
    reviewData: ReviewUseCaseInput,
    reviewerId: string
  ): Promise<UseCase> {
    try {
      const useCase = await this.repository.findById(id);

      if (!useCase) {
        throw new NotFoundError(`Use case with ID "${id}" not found`);
      }

      // Validate rejection reason is provided for rejected status
      if (
        reviewData.status === UseCaseStatus.rejected &&
        !reviewData.rejectionReason
      ) {
        throw new BadRequestError(
          'Rejection reason is required when rejecting a use case'
        );
      }

      // Review use case
      const reviewedUseCase = await this.repository.review(id, reviewData);

      // Invalidate caches
      await this.invalidateUseCaseCache(useCase.slug);
      await this.invalidateListCache();
      await this.invalidateFeaturedCache();

      logger.info(
        `Use case reviewed: ${id} - Status: ${reviewData.status} by ${reviewerId}`
      );

      return reviewedUseCase;
    } catch (error) {
      if (
        error instanceof NotFoundError ||
        error instanceof BadRequestError
      ) {
        throw error;
      }
      logger.error('Failed to review use case:', error);
      Sentry.captureException(error, {
        tags: { service: 'UseCaseService', method: 'reviewUseCase' },
        extra: { id, reviewData, reviewerId },
      });
      throw error;
    }
  }

  /**
   * Delete use case (author or admin)
   */
  async deleteUseCase(
    id: string,
    userId: string,
    userRole: string
  ): Promise<void> {
    try {
      const useCase = await this.repository.findById(id);

      if (!useCase) {
        throw new NotFoundError(`Use case with ID "${id}" not found`);
      }

      // Check permissions
      const isAdmin = userRole === 'admin' || userRole === 'moderator';
      const isAuthor = useCase.authorId === userId;

      if (!isAdmin && !isAuthor) {
        throw new ForbiddenError(
          'You do not have permission to delete this use case'
        );
      }

      // Delete use case
      await this.repository.delete(id);

      // Invalidate caches
      await this.invalidateUseCaseCache(useCase.slug);
      await this.invalidateListCache();
      await this.invalidateFeaturedCache();

      logger.info(`Use case deleted: ${id} by user ${userId}`);
    } catch (error) {
      if (
        error instanceof NotFoundError ||
        error instanceof ForbiddenError
      ) {
        throw error;
      }
      logger.error('Failed to delete use case:', error);
      Sentry.captureException(error, {
        tags: { service: 'UseCaseService', method: 'deleteUseCase' },
        extra: { id, userId },
      });
      throw error;
    }
  }

  /**
   * Cache invalidation helpers
   */
  private async invalidateUseCaseCache(slug: string): Promise<void> {
    if (redisClient.isReady()) {
      const cacheKey = `${this.CACHE_PREFIX}slug:${slug}`;
      await redisClient.del(cacheKey).catch((error) => {
        logger.error(`Failed to invalidate use case cache: ${error}`);
      });
    }
  }

  private async invalidateListCache(): Promise<void> {
    if (redisClient.isReady()) {
      const keys = await redisClient.keys(`${this.LIST_CACHE_PREFIX}*`);
      if (keys.length > 0) {
        await redisClient.del(...keys).catch((error) => {
          logger.error(`Failed to invalidate list cache: ${error}`);
        });
      }
    }
  }

  private async invalidateFeaturedCache(): Promise<void> {
    if (redisClient.isReady()) {
      await redisClient.del(this.FEATURED_CACHE_KEY).catch((error) => {
        logger.error(`Failed to invalidate featured cache: ${error}`);
      });
    }
  }
}

export default new UseCaseService();
