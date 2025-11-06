import { LLMModel, ModelBenchmark, ModelFollow, Prisma } from '@prisma/client';
import * as Sentry from '@sentry/node';
import prisma from '@/config/database';
import logger from '@/utils/logger';
import { ListModelsQuery } from './models.validation';

/**
 * Model Repository
 * Handles all database operations for LLM models
 */
export class ModelRepository {
  /**
   * Find all models with optional filtering and pagination
   */
  async findAll(query: ListModelsQuery): Promise<{
    data: LLMModel[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const {
        page = 1,
        limit = 20,
        provider,
        category,
        status,
        search,
        sortBy = 'name',
        sortOrder = 'asc',
      } = query;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: Prisma.LLMModelWhereInput = {
        ...(provider && { provider }),
        ...(category && { category }),
        ...(status && { status }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { provider: { contains: search, mode: 'insensitive' } },
          ],
        }),
      };

      // Build orderBy
      const orderBy: Prisma.LLMModelOrderByWithRelationInput = {
        [sortBy]: sortOrder,
      };

      const [data, total] = await Promise.all([
        prisma.lLMModel.findMany({
          where,
          skip,
          take: limit,
          orderBy,
        }),
        prisma.lLMModel.count({ where }),
      ]);

      return {
        data,
        total,
        page,
        limit,
      };
    } catch (error) {
      logger.error('Failed to fetch models:', error);
      Sentry.captureException(error, {
        tags: { repository: 'ModelRepository', method: 'findAll' },
        extra: { query },
      });
      throw error;
    }
  }

  /**
   * Find model by ID
   */
  async findById(id: string): Promise<LLMModel | null> {
    try {
      return await prisma.lLMModel.findUnique({
        where: { id },
        include: {
          modelBenchmarks: true,
          _count: {
            select: {
              articles: true,
              jobs: true,
              modelFollows: true,
            },
          },
        },
      });
    } catch (error) {
      logger.error(`Failed to fetch model by ID: ${id}`, error);
      Sentry.captureException(error, {
        tags: { repository: 'ModelRepository', method: 'findById' },
        extra: { id },
      });
      throw error;
    }
  }

  /**
   * Find model by slug
   */
  async findBySlug(slug: string): Promise<LLMModel | null> {
    try {
      return await prisma.lLMModel.findUnique({
        where: { slug },
        include: {
          modelBenchmarks: {
            orderBy: {
              benchmarkName: 'asc',
            },
          },
          _count: {
            select: {
              articles: true,
              jobs: true,
              modelFollows: true,
            },
          },
        },
      });
    } catch (error) {
      logger.error(`Failed to fetch model by slug: ${slug}`, error);
      Sentry.captureException(error, {
        tags: { repository: 'ModelRepository', method: 'findBySlug' },
        extra: { slug },
      });
      throw error;
    }
  }

  /**
   * Get related articles for a model
   */
  async getRelatedArticles(
    modelId: string,
    limit: number = 10,
    page: number = 1
  ) {
    try {
      const skip = (page - 1) * limit;

      const [articles, total] = await Promise.all([
        prisma.article.findMany({
          where: {
            models: {
              some: {
                modelId,
              },
            },
            status: 'published',
          },
          include: {
            category: true,
            author: {
              select: {
                id: true,
                username: true,
              },
            },
            tags: {
              include: {
                tag: true,
              },
            },
          },
          orderBy: {
            publishedAt: 'desc',
          },
          skip,
          take: limit,
        }),
        prisma.article.count({
          where: {
            models: {
              some: {
                modelId,
              },
            },
            status: 'published',
          },
        }),
      ]);

      return {
        data: articles,
        total,
        page,
        limit,
      };
    } catch (error) {
      logger.error(`Failed to fetch related articles for model: ${modelId}`, error);
      Sentry.captureException(error, {
        tags: { repository: 'ModelRepository', method: 'getRelatedArticles' },
        extra: { modelId, limit, page },
      });
      throw error;
    }
  }

  /**
   * Get related forum discussions for a model
   */
  async getRelatedDiscussions(
    modelSlug: string,
    limit: number = 10,
    page: number = 1
  ) {
    try {
      const skip = (page - 1) * limit;

      // Search for topics mentioning the model in title or content
      const [topics, total] = await Promise.all([
        prisma.topic.findMany({
          where: {
            OR: [
              { title: { contains: modelSlug, mode: 'insensitive' } },
              { content: { contains: modelSlug, mode: 'insensitive' } },
            ],
            status: 'open',
          },
          include: {
            author: {
              select: {
                id: true,
                username: true,
              },
            },
            category: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: limit,
        }),
        prisma.topic.count({
          where: {
            OR: [
              { title: { contains: modelSlug, mode: 'insensitive' } },
              { content: { contains: modelSlug, mode: 'insensitive' } },
            ],
            status: 'open',
          },
        }),
      ]);

      return {
        data: topics,
        total,
        page,
        limit,
      };
    } catch (error) {
      logger.error(`Failed to fetch related discussions for model: ${modelSlug}`, error);
      Sentry.captureException(error, {
        tags: { repository: 'ModelRepository', method: 'getRelatedDiscussions' },
        extra: { modelSlug, limit, page },
      });
      throw error;
    }
  }

  /**
   * Get related jobs for a model
   */
  async getRelatedJobs(
    modelId: string,
    limit: number = 10,
    page: number = 1
  ) {
    try {
      const skip = (page - 1) * limit;

      const [jobs, total] = await Promise.all([
        prisma.job.findMany({
          where: {
            models: {
              some: {
                modelId,
              },
            },
            status: 'active',
          },
          include: {
            company: true,
          },
          orderBy: {
            publishedAt: 'desc',
          },
          skip,
          take: limit,
        }),
        prisma.job.count({
          where: {
            models: {
              some: {
                modelId,
              },
            },
            status: 'active',
          },
        }),
      ]);

      return {
        data: jobs,
        total,
        page,
        limit,
      };
    } catch (error) {
      logger.error(`Failed to fetch related jobs for model: ${modelId}`, error);
      Sentry.captureException(error, {
        tags: { repository: 'ModelRepository', method: 'getRelatedJobs' },
        extra: { modelId, limit, page },
      });
      throw error;
    }
  }

  /**
   * Check if user follows a model
   */
  async isFollowing(userId: string, modelId: string): Promise<boolean> {
    try {
      const follow = await prisma.modelFollow.findUnique({
        where: {
          modelId_userId: {
            modelId,
            userId,
          },
        },
      });
      return !!follow;
    } catch (error) {
      logger.error('Failed to check model follow status:', error);
      Sentry.captureException(error, {
        tags: { repository: 'ModelRepository', method: 'isFollowing' },
        extra: { userId, modelId },
      });
      throw error;
    }
  }

  /**
   * Follow a model
   */
  async follow(userId: string, modelId: string): Promise<ModelFollow> {
    try {
      const follow = await prisma.modelFollow.create({
        data: {
          userId,
          modelId,
        },
      });

      // Increment follow count
      await prisma.lLMModel.update({
        where: { id: modelId },
        data: {
          followCount: {
            increment: 1,
          },
        },
      });

      logger.info(`User ${userId} followed model ${modelId}`);
      return follow;
    } catch (error) {
      logger.error('Failed to follow model:', error);
      Sentry.captureException(error, {
        tags: { repository: 'ModelRepository', method: 'follow' },
        extra: { userId, modelId },
      });
      throw error;
    }
  }

  /**
   * Unfollow a model
   */
  async unfollow(userId: string, modelId: string): Promise<void> {
    try {
      await prisma.modelFollow.delete({
        where: {
          modelId_userId: {
            modelId,
            userId,
          },
        },
      });

      // Decrement follow count
      await prisma.lLMModel.update({
        where: { id: modelId },
        data: {
          followCount: {
            decrement: 1,
          },
        },
      });

      logger.info(`User ${userId} unfollowed model ${modelId}`);
    } catch (error) {
      logger.error('Failed to unfollow model:', error);
      Sentry.captureException(error, {
        tags: { repository: 'ModelRepository', method: 'unfollow' },
        extra: { userId, modelId },
      });
      throw error;
    }
  }

  /**
   * Increment view count for a model
   */
  async incrementViewCount(modelId: string): Promise<void> {
    try {
      await prisma.lLMModel.update({
        where: { id: modelId },
        data: {
          viewCount: {
            increment: 1,
          },
        },
      });
    } catch (error) {
      logger.error('Failed to increment model view count:', error);
      Sentry.captureException(error, {
        tags: { repository: 'ModelRepository', method: 'incrementViewCount' },
        extra: { modelId },
      });
      // Don't throw - view count is not critical
    }
  }

  /**
   * Get user's followed models
   */
  async getUserFollowedModels(userId: string): Promise<LLMModel[]> {
    try {
      const follows = await prisma.modelFollow.findMany({
        where: { userId },
        include: {
          model: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return follows.map((follow) => follow.model);
    } catch (error) {
      logger.error('Failed to fetch user followed models:', error);
      Sentry.captureException(error, {
        tags: { repository: 'ModelRepository', method: 'getUserFollowedModels' },
        extra: { userId },
      });
      throw error;
    }
  }

  /**
   * Get popular models (by view count + follow count)
   */
  async getPopularModels(limit: number = 10): Promise<LLMModel[]> {
    try {
      return await prisma.lLMModel.findMany({
        take: limit,
        orderBy: [
          { followCount: 'desc' },
          { viewCount: 'desc' },
        ],
      });
    } catch (error) {
      logger.error('Failed to fetch popular models:', error);
      Sentry.captureException(error, {
        tags: { repository: 'ModelRepository', method: 'getPopularModels' },
        extra: { limit },
      });
      throw error;
    }
  }

  /**
   * Get model versions by model ID
   */
  async getModelVersions(modelId: string) {
    try {
      return await prisma.modelVersion.findMany({
        where: { modelId },
        orderBy: {
          releasedAt: 'desc',
        },
      });
    } catch (error) {
      logger.error(`Failed to fetch model versions for model: ${modelId}`, error);
      Sentry.captureException(error, {
        tags: { repository: 'ModelRepository', method: 'getModelVersions' },
        extra: { modelId },
      });
      throw error;
    }
  }

  /**
   * Get model benchmarks by model ID
   */
  async getModelBenchmarks(modelId: string): Promise<ModelBenchmark[]> {
    try {
      return await prisma.modelBenchmark.findMany({
        where: { modelId },
        orderBy: {
          benchmarkName: 'asc',
        },
      });
    } catch (error) {
      logger.error(`Failed to fetch model benchmarks for model: ${modelId}`, error);
      Sentry.captureException(error, {
        tags: { repository: 'ModelRepository', method: 'getModelBenchmarks' },
        extra: { modelId },
      });
      throw error;
    }
  }

  /**
   * Compare multiple models by IDs
   */
  async compareModels(modelIds: string[]) {
    try {
      const models = await prisma.lLMModel.findMany({
        where: {
          id: {
            in: modelIds,
          },
        },
        include: {
          modelBenchmarks: {
            orderBy: {
              benchmarkName: 'asc',
            },
          },
          modelVersions: {
            where: {
              isLatest: true,
            },
            take: 1,
          },
        },
      });

      // Return models in the same order as requested
      return modelIds
        .map((id) => models.find((model) => model.id === id))
        .filter((model) => model !== undefined);
    } catch (error) {
      logger.error('Failed to compare models:', error);
      Sentry.captureException(error, {
        tags: { repository: 'ModelRepository', method: 'compareModels' },
        extra: { modelIds },
      });
      throw error;
    }
  }

  /**
   * Create a new model version (admin only)
   */
  async createModelVersion(modelId: string, versionData: any) {
    try {
      // If this version is marked as latest, unset other versions
      if (versionData.isLatest) {
        await prisma.modelVersion.updateMany({
          where: {
            modelId,
            isLatest: true,
          },
          data: {
            isLatest: false,
          },
        });
      }

      const version = await prisma.modelVersion.create({
        data: {
          ...versionData,
          modelId,
        },
      });

      logger.info(`Created new version ${version.version} for model ${modelId}`);
      return version;
    } catch (error) {
      logger.error('Failed to create model version:', error);
      Sentry.captureException(error, {
        tags: { repository: 'ModelRepository', method: 'createModelVersion' },
        extra: { modelId, versionData },
      });
      throw error;
    }
  }

  /**
   * Update model (admin only)
   */
  async updateModel(id: string, updateData: any) {
    try {
      const model = await prisma.lLMModel.update({
        where: { id },
        data: updateData,
      });

      logger.info(`Updated model ${id}`);
      return model;
    } catch (error) {
      logger.error('Failed to update model:', error);
      Sentry.captureException(error, {
        tags: { repository: 'ModelRepository', method: 'updateModel' },
        extra: { id, updateData },
      });
      throw error;
    }
  }
}

export default new ModelRepository();
