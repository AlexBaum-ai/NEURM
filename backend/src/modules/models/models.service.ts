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

  /**
   * Get model versions
   */
  async getModelVersions(slug: string) {
    try {
      const model = await modelRepository.findBySlug(slug);

      if (!model) {
        return null;
      }

      const versions = await modelRepository.getModelVersions(model.id);

      return {
        model: {
          id: model.id,
          name: model.name,
          slug: model.slug,
          provider: model.provider,
        },
        versions,
        total: versions.length,
      };
    } catch (error) {
      logger.error(`Failed to get model versions: ${slug}`, error);
      Sentry.captureException(error, {
        tags: { service: 'ModelService', method: 'getModelVersions' },
        extra: { slug },
      });
      throw new Error('Failed to fetch model versions');
    }
  }

  /**
   * Get model benchmarks
   */
  async getModelBenchmarks(slug: string) {
    try {
      const model = await modelRepository.findBySlug(slug);

      if (!model) {
        return null;
      }

      const benchmarks = await modelRepository.getModelBenchmarks(model.id);

      // Group benchmarks by category for better organization
      const benchmarksByCategory = benchmarks.reduce((acc: any, benchmark) => {
        const category = this.getBenchmarkCategory(benchmark.benchmarkName);
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push({
          name: benchmark.benchmarkName,
          score: benchmark.score,
          maxScore: benchmark.maxScore,
          metric: benchmark.metric,
          testDate: benchmark.testDate,
          sourceUrl: benchmark.sourceUrl,
        });
        return acc;
      }, {});

      return {
        model: {
          id: model.id,
          name: model.name,
          slug: model.slug,
          provider: model.provider,
        },
        benchmarks: benchmarksByCategory,
        total: benchmarks.length,
      };
    } catch (error) {
      logger.error(`Failed to get model benchmarks: ${slug}`, error);
      Sentry.captureException(error, {
        tags: { service: 'ModelService', method: 'getModelBenchmarks' },
        extra: { slug },
      });
      throw new Error('Failed to fetch model benchmarks');
    }
  }

  /**
   * Compare multiple models
   */
  async compareModels(ids: string[]) {
    try {
      const models = await modelRepository.compareModels(ids);

      if (models.length === 0) {
        return { models: [], total: 0 };
      }

      // Format the comparison data
      const comparison = models.map((model: any) => ({
        id: model.id,
        name: model.name,
        slug: model.slug,
        provider: model.provider,
        category: model.category,
        description: model.description,
        contextWindow: model.contextWindow,
        modelSize: model.modelSize,
        modalities: model.modalities,
        releaseDate: model.releaseDate,
        latestVersion:
          model.modelVersions && model.modelVersions.length > 0
            ? model.modelVersions[0].version
            : model.latestVersion,
        status: model.status,
        pricingInput: model.pricingInput,
        pricingOutput: model.pricingOutput,
        officialUrl: model.officialUrl,
        apiDocsUrl: model.apiDocsUrl,
        bestFor: model.bestFor,
        notIdealFor: model.notIdealFor,
        apiQuickstart: model.apiQuickstart,
        benchmarks: this.formatBenchmarksForComparison(model.modelBenchmarks),
        followCount: model.followCount,
        viewCount: model.viewCount,
      }));

      return {
        models: comparison,
        total: comparison.length,
      };
    } catch (error) {
      logger.error('Failed to compare models:', error);
      Sentry.captureException(error, {
        tags: { service: 'ModelService', method: 'compareModels' },
        extra: { ids },
      });
      throw new Error('Failed to compare models');
    }
  }

  /**
   * Create model version (admin only)
   */
  async createModelVersion(slug: string, versionData: any) {
    try {
      const model = await modelRepository.findBySlug(slug);

      if (!model) {
        return { success: false, error: 'Model not found' };
      }

      const version = await modelRepository.createModelVersion(model.id, versionData);

      // Update model's latestVersion field if this is the latest
      if (versionData.isLatest) {
        await modelRepository.updateModel(model.id, {
          latestVersion: versionData.version,
        });
      }

      return {
        success: true,
        version,
      };
    } catch (error) {
      logger.error(`Failed to create model version: ${slug}`, error);
      Sentry.captureException(error, {
        tags: { service: 'ModelService', method: 'createModelVersion' },
        extra: { slug, versionData },
      });
      throw new Error('Failed to create model version');
    }
  }

  /**
   * Update model (admin only)
   */
  async updateModel(slug: string, updateData: any) {
    try {
      const model = await modelRepository.findBySlug(slug);

      if (!model) {
        return { success: false, error: 'Model not found' };
      }

      const updatedModel = await modelRepository.updateModel(model.id, updateData);

      return {
        success: true,
        model: updatedModel,
      };
    } catch (error) {
      logger.error(`Failed to update model: ${slug}`, error);
      Sentry.captureException(error, {
        tags: { service: 'ModelService', method: 'updateModel' },
        extra: { slug, updateData },
      });
      throw new Error('Failed to update model');
    }
  }

  /**
   * Helper: Get benchmark category
   */
  private getBenchmarkCategory(benchmarkName: string): string {
    const categories: { [key: string]: string[] } = {
      'General Knowledge': ['MMLU', 'HellaSwag', 'ARC', 'TruthfulQA'],
      'Coding': ['HumanEval', 'MBPP', 'CodeXGLUE'],
      'Math': ['GSM8K', 'MATH', 'SVAMP'],
      'Reasoning': ['BBH', 'AGIEval', 'WinoGrande'],
      'Language Understanding': ['GLUE', 'SuperGLUE', 'SQuAD'],
    };

    for (const [category, benchmarks] of Object.entries(categories)) {
      if (benchmarks.some((b) => benchmarkName.includes(b))) {
        return category;
      }
    }

    return 'Other';
  }

  /**
   * Helper: Format benchmarks for comparison
   */
  private formatBenchmarksForComparison(benchmarks: any[]) {
    return benchmarks.reduce((acc: any, benchmark) => {
      acc[benchmark.benchmarkName] = {
        score: benchmark.score,
        maxScore: benchmark.maxScore,
        metric: benchmark.metric,
      };
      return acc;
    }, {});
  }
}

export default new ModelService();
