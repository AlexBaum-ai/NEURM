import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';
import { ZodError } from 'zod';
import ArticleService from './articles.service';
import {
  createArticleSchema,
  updateArticleSchema,
  listArticlesQuerySchema,
  articleSlugParamSchema,
  articleIdParamSchema,
  CreateArticleInput,
  UpdateArticleInput,
  ListArticlesQuery,
} from './articles.validation';
import { BadRequestError, ValidationError } from '@/utils/errors';
import logger from '@/utils/logger';

/**
 * ArticleController
 * Handles HTTP requests for article endpoints
 */
export class ArticleController {
  private service: ArticleService;

  constructor(service?: ArticleService) {
    this.service = service || new ArticleService();
  }

  /**
   * POST /api/v1/admin/articles
   * Create a new article (admin only)
   */
  createArticle = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Validate request body
      const validationResult = createArticleSchema.safeParse(req.body);

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

      const data: CreateArticleInput = validationResult.data;

      logger.info(`User ${userId} creating article: ${data.title}`);

      const article = await this.service.createArticle(data, userId);

      res.status(201).json({
        success: true,
        data: article,
        message: 'Article created successfully',
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'ArticleController', method: 'createArticle' },
        extra: {
          userId: req.user?.id,
          body: req.body,
        },
      });
      throw error;
    }
  };

  /**
   * GET /api/v1/news/articles
   * List published articles with filters and pagination
   */
  listArticles = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate query parameters
      const validationResult = listArticlesQuerySchema.safeParse(req.query);

      if (!validationResult.success) {
        const error = validationResult.error as ZodError;
        throw new ValidationError(error.issues[0].message);
      }

      const query: ListArticlesQuery = validationResult.data;

      const result = await this.service.listArticles(query);

      res.status(200).json({
        success: true,
        data: result.articles,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'ArticleController', method: 'listArticles' },
        extra: {
          query: req.query,
        },
      });
      throw error;
    }
  };

  /**
   * GET /api/v1/news/articles/:slug
   * Get article detail by slug (public)
   */
  getArticleBySlug = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate slug parameter
      const validationResult = articleSlugParamSchema.safeParse(req.params);

      if (!validationResult.success) {
        const error = validationResult.error as ZodError;
        throw new ValidationError(error.issues[0].message);
      }

      const { slug } = validationResult.data;
      const userId = req.user?.id; // Optional auth

      const result = await this.service.getArticleBySlug(slug, userId);

      res.status(200).json({
        success: true,
        data: {
          article: result.article,
          relatedArticles: result.relatedArticles,
          isBookmarked: result.isBookmarked,
        },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'ArticleController', method: 'getArticleBySlug' },
        extra: {
          slug: req.params.slug,
          userId: req.user?.id,
        },
      });
      throw error;
    }
  };

  /**
   * GET /api/v1/admin/articles/:id
   * Get article by ID (admin only - includes all statuses)
   */
  getArticleById = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate ID parameter
      const validationResult = articleIdParamSchema.safeParse(req.params);

      if (!validationResult.success) {
        const error = validationResult.error as ZodError;
        throw new ValidationError(error.issues[0].message);
      }

      const { id } = validationResult.data;

      const article = await this.service.getArticleById(id);

      res.status(200).json({
        success: true,
        data: article,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'ArticleController', method: 'getArticleById' },
        extra: {
          id: req.params.id,
          userId: req.user?.id,
        },
      });
      throw error;
    }
  };

  /**
   * PATCH /api/v1/admin/articles/:id
   * Update article (admin only)
   */
  updateArticle = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Validate ID parameter
      const paramValidation = articleIdParamSchema.safeParse(req.params);

      if (!paramValidation.success) {
        const error = paramValidation.error as ZodError;
        throw new ValidationError(error.issues[0].message);
      }

      const { id } = paramValidation.data;

      // Validate request body
      const bodyValidation = updateArticleSchema.safeParse(req.body);

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

      const data: UpdateArticleInput = bodyValidation.data;

      logger.info(`User ${userId} updating article ${id}`);

      const article = await this.service.updateArticle(id, data, userId);

      res.status(200).json({
        success: true,
        data: article,
        message: 'Article updated successfully',
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'ArticleController', method: 'updateArticle' },
        extra: {
          id: req.params.id,
          userId: req.user?.id,
          body: req.body,
        },
      });
      throw error;
    }
  };

  /**
   * DELETE /api/v1/admin/articles/:id
   * Delete article (admin only)
   */
  deleteArticle = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Validate ID parameter
      const validationResult = articleIdParamSchema.safeParse(req.params);

      if (!validationResult.success) {
        const error = validationResult.error as ZodError;
        throw new ValidationError(error.issues[0].message);
      }

      const { id } = validationResult.data;

      logger.info(`User ${userId} deleting article ${id}`);

      await this.service.deleteArticle(id);

      res.status(200).json({
        success: true,
        message: 'Article deleted successfully',
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'ArticleController', method: 'deleteArticle' },
        extra: {
          id: req.params.id,
          userId: req.user?.id,
        },
      });
      throw error;
    }
  };
}

export default ArticleController;
