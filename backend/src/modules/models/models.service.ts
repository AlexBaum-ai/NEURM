import { LLMModel } from '@prisma/client';
import * as Sentry from '@sentry/node';
import logger from '@/utils/logger';
import modelRepository from './models.repository';
import { ListModelsQuery } from './models.validation';

/**
 * Model Service
 * Business logic for LLM models
 */
export class ModelService {
  /**
   * Get all models with filtering and pagination
   */
  async getAllModels(query: ListModelsQuery) {
    try {
      return await modelRepository.findAll(query);
    } catch (error) {
      logger.error('Failed to get all models:', error);
      Sentry.captureException(error, {
        tags: { service: 'ModelService', method: 'getAllModels' },
        extra: { query },
      });
      throw new Error('Failed to fetch models');
    }
  }

  /**
   * Get model by slug with related counts
   */
  async getModelBySlug(slug: string) {
    try {
      const model = await modelRepository.findBySlug(slug);

      if (!model) {
        return null;
      }

      // Increment view count asynchronously (non-blocking)
      modelRepository.incrementViewCount(model.id).catch((error) => {
        logger.warn(`Failed to increment view count for model ${model.id}:`, error);
      });

      return model;
    } catch (error) {
      logger.error(`Failed to get model by slug: ${slug}`, error);
      Sentry.captureException(error, {
        tags: { service: 'ModelService', method: 'getModelBySlug' },
        extra: { slug },
      });
      throw new Error('Failed to fetch model details');
    }
  }

  /**
   * Get related articles for a model
   */
  async getRelatedArticles(slug: string, page: number = 1, limit: number = 10) {
    try {
      const model = await modelRepository.findBySlug(slug);

      if (!model) {
        return null;
      }

      return await modelRepository.getRelatedArticles(model.id, limit, page);
    } catch (error) {
      logger.error(`Failed to get related articles for model: ${slug}`, error);
      Sentry.captureException(error, {
        tags: { service: 'ModelService', method: 'getRelatedArticles' },
        extra: { slug, page, limit },
      });
      throw new Error('Failed to fetch related articles');
    }
  }

  /**
   * Get related discussions for a model
   */
  async getRelatedDiscussions(slug: string, page: number = 1, limit: number = 10) {
    try {
      // Check if model exists
      const model = await modelRepository.findBySlug(slug);

      if (!model) {
        return null;
      }

      return await modelRepository.getRelatedDiscussions(slug, limit, page);
    } catch (error) {
      logger.error(`Failed to get related discussions for model: ${slug}`, error);
      Sentry.captureException(error, {
        tags: { service: 'ModelService', method: 'getRelatedDiscussions' },
        extra: { slug, page, limit },
      });
      throw new Error('Failed to fetch related discussions');
    }
  }

  /**
   * Get related jobs for a model
   */
  async getRelatedJobs(slug: string, page: number = 1, limit: number = 10) {
    try {
      const model = await modelRepository.findBySlug(slug);

      if (!model) {
        return null;
      }

      return await modelRepository.getRelatedJobs(model.id, limit, page);
    } catch (error) {
      logger.error(`Failed to get related jobs for model: ${slug}`, error);
      Sentry.captureException(error, {
        tags: { service: 'ModelService', method: 'getRelatedJobs' },
        extra: { slug, page, limit },
      });
      throw new Error('Failed to fetch related jobs');
    }
  }

  /**
   * Follow a model
   */
  async followModel(userId: string, slug: string) {
    try {
      const model = await modelRepository.findBySlug(slug);

      if (!model) {
        return { success: false, error: 'Model not found' };
      }

      // Check if already following
      const isFollowing = await modelRepository.isFollowing(userId, model.id);

      if (isFollowing) {
        // Unfollow if already following
        await modelRepository.unfollow(userId, model.id);
        return {
          success: true,
          isFollowing: false,
          message: 'Model unfollowed successfully',
        };
      } else {
        // Follow if not following
        await modelRepository.follow(userId, model.id);
        return {
          success: true,
          isFollowing: true,
          message: 'Model followed successfully',
        };
      }
    } catch (error) {
      logger.error(`Failed to follow/unfollow model: ${slug}`, error);
      Sentry.captureException(error, {
        tags: { service: 'ModelService', method: 'followModel' },
        extra: { userId, slug },
      });
      throw new Error('Failed to follow/unfollow model');
    }
  }

  /**
   * Check if user is following a model
   */
  async checkFollowStatus(userId: string, slug: string) {
    try {
      const model = await modelRepository.findBySlug(slug);

      if (!model) {
        return null;
      }

      const isFollowing = await modelRepository.isFollowing(userId, model.id);

      return {
        modelId: model.id,
        modelSlug: model.slug,
        isFollowing,
      };
    } catch (error) {
      logger.error(`Failed to check follow status for model: ${slug}`, error);
      Sentry.captureException(error, {
        tags: { service: 'ModelService', method: 'checkFollowStatus' },
        extra: { userId, slug },
      });
      throw new Error('Failed to check follow status');
    }
  }

  /**
   * Get user's followed models
   */
  async getUserFollowedModels(userId: string) {
    try {
      return await modelRepository.getUserFollowedModels(userId);
    } catch (error) {
      logger.error(`Failed to get user followed models for user: ${userId}`, error);
      Sentry.captureException(error, {
        tags: { service: 'ModelService', method: 'getUserFollowedModels' },
        extra: { userId },
      });
      throw new Error('Failed to fetch followed models');
    }
  }

  /**
   * Get popular models
   */
  async getPopularModels(limit: number = 10) {
    try {
      return await modelRepository.getPopularModels(limit);
    } catch (error) {
      logger.error('Failed to get popular models:', error);
      Sentry.captureException(error, {
        tags: { service: 'ModelService', method: 'getPopularModels' },
        extra: { limit },
      });
      throw new Error('Failed to fetch popular models');
    }
  }
}

export default new ModelService();
