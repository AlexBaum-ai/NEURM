import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';
import { ZodError } from 'zod';
import modelService from './models.service';
import {
  listModelsQuerySchema,
  getModelBySlugParamsSchema,
  relatedContentQuerySchema,
  followModelParamsSchema,
  compareModelsQuerySchema,
  getModelBenchmarksParamsSchema,
  getModelVersionsParamsSchema,
  createModelVersionSchema,
  updateModelSchema,
  ListModelsQuery,
  RelatedContentQuery,
} from './models.validation';
import { BadRequestError, NotFoundError, ValidationError } from '@/utils/errors';
import logger from '@/utils/logger';

/**
 * ModelController
 * Handles HTTP requests for LLM model endpoints
 */
export class ModelController {
  /**
   * GET /api/v1/models
   * Get all LLM models with filtering and pagination
   */
  getAllModels = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate query parameters
      const validationResult = listModelsQuerySchema.safeParse(req.query);

      if (!validationResult.success) {
        const error = validationResult.error as ZodError;
        const errors = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        throw new ValidationError(
          `Validation failed: ${errors.map((e) => e.message).join(', ')}`
        );
      }

      const query: ListModelsQuery = validationResult.data;

      const result = await modelService.getAllModels(query);

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit),
        },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'ModelController', method: 'getAllModels' },
        extra: { query: req.query },
      });
      throw error;
    }
  };

  /**
   * GET /api/v1/models/:slug
   * Get model details by slug
   */
  getModelBySlug = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate params
      const validationResult = getModelBySlugParamsSchema.safeParse(req.params);

      if (!validationResult.success) {
        const error = validationResult.error as ZodError;
        throw new ValidationError(error.issues[0]?.message || 'Invalid slug');
      }

      const { slug } = validationResult.data;

      const model = await modelService.getModelBySlug(slug);

      if (!model) {
        throw new NotFoundError(`Model with slug '${slug}' not found`);
      }

      res.status(200).json({
        success: true,
        data: model,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'ModelController', method: 'getModelBySlug' },
        extra: { params: req.params },
      });
      throw error;
    }
  };

  /**
   * GET /api/v1/models/:slug/news
   * Get related articles for a model
   */
  getModelNews = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate params
      const paramsValidation = getModelBySlugParamsSchema.safeParse(req.params);
      if (!paramsValidation.success) {
        throw new ValidationError('Invalid slug');
      }

      // Validate query
      const queryValidation = relatedContentQuerySchema.safeParse(req.query);
      if (!queryValidation.success) {
        throw new ValidationError('Invalid query parameters');
      }

      const { slug } = paramsValidation.data;
      const { page, limit }: RelatedContentQuery = queryValidation.data;

      const result = await modelService.getRelatedArticles(slug, page, limit);

      if (!result) {
        throw new NotFoundError(`Model with slug '${slug}' not found`);
      }

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit),
        },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'ModelController', method: 'getModelNews' },
        extra: { params: req.params, query: req.query },
      });
      throw error;
    }
  };

  /**
   * GET /api/v1/models/:slug/discussions
   * Get related forum discussions for a model
   */
  getModelDiscussions = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate params
      const paramsValidation = getModelBySlugParamsSchema.safeParse(req.params);
      if (!paramsValidation.success) {
        throw new ValidationError('Invalid slug');
      }

      // Validate query
      const queryValidation = relatedContentQuerySchema.safeParse(req.query);
      if (!queryValidation.success) {
        throw new ValidationError('Invalid query parameters');
      }

      const { slug } = paramsValidation.data;
      const { page, limit }: RelatedContentQuery = queryValidation.data;

      const result = await modelService.getRelatedDiscussions(slug, page, limit);

      if (!result) {
        throw new NotFoundError(`Model with slug '${slug}' not found`);
      }

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit),
        },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'ModelController', method: 'getModelDiscussions' },
        extra: { params: req.params, query: req.query },
      });
      throw error;
    }
  };

  /**
   * GET /api/v1/models/:slug/jobs
   * Get related jobs for a model
   */
  getModelJobs = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate params
      const paramsValidation = getModelBySlugParamsSchema.safeParse(req.params);
      if (!paramsValidation.success) {
        throw new ValidationError('Invalid slug');
      }

      // Validate query
      const queryValidation = relatedContentQuerySchema.safeParse(req.query);
      if (!queryValidation.success) {
        throw new ValidationError('Invalid query parameters');
      }

      const { slug } = paramsValidation.data;
      const { page, limit }: RelatedContentQuery = queryValidation.data;

      const result = await modelService.getRelatedJobs(slug, page, limit);

      if (!result) {
        throw new NotFoundError(`Model with slug '${slug}' not found`);
      }

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit),
        },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'ModelController', method: 'getModelJobs' },
        extra: { params: req.params, query: req.query },
      });
      throw error;
    }
  };

  /**
   * POST /api/v1/models/:slug/follow
   * Follow or unfollow a model (toggle)
   */
  followModel = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      // Validate params
      const validationResult = followModelParamsSchema.safeParse(req.params);

      if (!validationResult.success) {
        const error = validationResult.error as ZodError;
        throw new ValidationError(error.issues[0]?.message || 'Invalid slug');
      }

      const { slug } = validationResult.data;

      const result = await modelService.followModel(userId, slug);

      if (!result.success) {
        throw new NotFoundError(result.error || 'Model not found');
      }

      res.status(200).json({
        success: true,
        data: {
          isFollowing: result.isFollowing,
        },
        message: result.message,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'ModelController', method: 'followModel' },
        extra: {
          userId: req.user?.id,
          params: req.params,
        },
      });
      throw error;
    }
  };

  /**
   * GET /api/v1/models/:slug/follow-status
   * Check if user is following a model
   */
  getFollowStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      // Validate params
      const validationResult = followModelParamsSchema.safeParse(req.params);

      if (!validationResult.success) {
        throw new ValidationError('Invalid slug');
      }

      const { slug } = validationResult.data;

      const result = await modelService.checkFollowStatus(userId, slug);

      if (!result) {
        throw new NotFoundError(`Model with slug '${slug}' not found`);
      }

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'ModelController', method: 'getFollowStatus' },
        extra: {
          userId: req.user?.id,
          params: req.params,
        },
      });
      throw error;
    }
  };

  /**
   * GET /api/v1/models/popular
   * Get popular models
   */
  getPopularModels = async (req: Request, res: Response): Promise<void> => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

      const models = await modelService.getPopularModels(limit);

      res.status(200).json({
        success: true,
        data: models,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'ModelController', method: 'getPopularModels' },
        extra: { query: req.query },
      });
      throw error;
    }
  };

  /**
   * GET /api/v1/users/me/models/following
   * Get user's followed models
   */
  getUserFollowedModels = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      const models = await modelService.getUserFollowedModels(userId);

      res.status(200).json({
        success: true,
        data: models,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'ModelController', method: 'getUserFollowedModels' },
        extra: { userId: req.user?.id },
      });
      throw error;
    }
  };

  /**
   * GET /api/v1/models/:slug/versions
   * Get version history for a model
   */
  getModelVersions = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate params
      const validationResult = getModelVersionsParamsSchema.safeParse(req.params);

      if (!validationResult.success) {
        throw new ValidationError('Invalid slug');
      }

      const { slug } = validationResult.data;

      const result = await modelService.getModelVersions(slug);

      if (!result) {
        throw new NotFoundError(`Model with slug '${slug}' not found`);
      }

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'ModelController', method: 'getModelVersions' },
        extra: { params: req.params },
      });
      throw error;
    }
  };

  /**
   * GET /api/v1/models/:slug/benchmarks
   * Get benchmark scores for a model
   */
  getModelBenchmarks = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate params
      const validationResult = getModelBenchmarksParamsSchema.safeParse(req.params);

      if (!validationResult.success) {
        throw new ValidationError('Invalid slug');
      }

      const { slug } = validationResult.data;

      const result = await modelService.getModelBenchmarks(slug);

      if (!result) {
        throw new NotFoundError(`Model with slug '${slug}' not found`);
      }

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'ModelController', method: 'getModelBenchmarks' },
        extra: { params: req.params },
      });
      throw error;
    }
  };

  /**
   * GET /api/v1/models/compare?ids=1,2,3
   * Compare multiple models side-by-side
   */
  compareModels = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate query
      const validationResult = compareModelsQuerySchema.safeParse(req.query);

      if (!validationResult.success) {
        const error = validationResult.error as ZodError;
        throw new ValidationError(
          error.issues[0]?.message || 'Invalid model IDs for comparison'
        );
      }

      const { ids } = validationResult.data;

      const result = await modelService.compareModels(ids);

      if (result.total === 0) {
        throw new NotFoundError('No models found with the provided IDs');
      }

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'ModelController', method: 'compareModels' },
        extra: { query: req.query },
      });
      throw error;
    }
  };

  /**
   * POST /api/v1/models/:slug/versions
   * Create a new version for a model (admin only)
   */
  createModelVersion = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate params
      const paramsValidation = getModelVersionsParamsSchema.safeParse(req.params);
      if (!paramsValidation.success) {
        throw new ValidationError('Invalid slug');
      }

      // Validate body
      const bodyValidation = createModelVersionSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        const error = bodyValidation.error as ZodError;
        const errors = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        throw new ValidationError(
          `Validation failed: ${errors.map((e) => e.message).join(', ')}`
        );
      }

      const { slug } = paramsValidation.data;
      const versionData = bodyValidation.data;

      const result = await modelService.createModelVersion(slug, versionData);

      if (!result.success) {
        throw new NotFoundError(result.error || 'Model not found');
      }

      res.status(201).json({
        success: true,
        data: result.version,
        message: 'Model version created successfully',
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'ModelController', method: 'createModelVersion' },
        extra: { params: req.params, body: req.body },
      });
      throw error;
    }
  };

  /**
   * PUT /api/v1/models/:slug
   * Update model information (admin only)
   */
  updateModel = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate params
      const paramsValidation = getModelBySlugParamsSchema.safeParse(req.params);
      if (!paramsValidation.success) {
        throw new ValidationError('Invalid slug');
      }

      // Validate body
      const bodyValidation = updateModelSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        const error = bodyValidation.error as ZodError;
        const errors = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        throw new ValidationError(
          `Validation failed: ${errors.map((e) => e.message).join(', ')}`
        );
      }

      const { slug } = paramsValidation.data;
      const updateData = bodyValidation.data;

      const result = await modelService.updateModel(slug, updateData);

      if (!result.success) {
        throw new NotFoundError(result.error || 'Model not found');
      }

      res.status(200).json({
        success: true,
        data: result.model,
        message: 'Model updated successfully',
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'ModelController', method: 'updateModel' },
        extra: { params: req.params, body: req.body },
      });
      throw error;
    }
  };
}

export default new ModelController();
