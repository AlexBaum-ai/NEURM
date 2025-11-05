import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';
import { ZodError } from 'zod';
import CategoryService from './categories.service';
import {
  getCategoriesQuerySchema,
  categorySlugParamSchema,
  GetCategoriesQuery,
  CategorySlugParam,
} from './categories.validation';
import { ValidationError } from '@/utils/errors';
import logger from '@/utils/logger';

/**
 * CategoryController
 * Handles HTTP requests for news categories endpoints
 */
export class CategoryController {
  private categoryService: CategoryService;

  constructor(categoryService?: CategoryService) {
    this.categoryService = categoryService || new CategoryService();
  }

  /**
   * GET /api/v1/news/categories
   * Get all categories as hierarchical tree
   */
  getAllCategories = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate query parameters
      const validationResult = getCategoriesQuerySchema.safeParse(req.query);

      if (!validationResult.success) {
        const error = validationResult.error as ZodError;
        throw new ValidationError(error.issues[0].message);
      }

      const { includeInactive }: GetCategoriesQuery = validationResult.data;

      logger.debug('Fetching categories', { includeInactive });

      const categories = await this.categoryService.getAllCategories(includeInactive);

      res.status(200).json({
        success: true,
        data: categories,
        meta: {
          total: categories.length,
          includeInactive,
        },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'CategoryController', method: 'getAllCategories' },
        extra: {
          query: req.query,
        },
      });
      throw error;
    }
  };

  /**
   * GET /api/v1/news/categories/:slug
   * Get category by slug with hierarchy and children
   */
  getCategoryBySlug = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate slug parameter
      const validationResult = categorySlugParamSchema.safeParse(req.params);

      if (!validationResult.success) {
        const error = validationResult.error as ZodError;
        throw new ValidationError(error.issues[0].message);
      }

      const { slug }: CategorySlugParam = validationResult.data;

      logger.debug(`Fetching category by slug: ${slug}`);

      const category = await this.categoryService.getCategoryBySlug(slug);

      res.status(200).json({
        success: true,
        data: category,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'CategoryController', method: 'getCategoryBySlug' },
        extra: {
          params: req.params,
        },
      });
      throw error;
    }
  };

  /**
   * GET /api/v1/news/categories/with-counts
   * Get all categories with article counts (flat list)
   */
  getCategoriesWithCounts = async (_req: Request, res: Response): Promise<void> => {
    try {
      logger.debug('Fetching categories with article counts');

      const categories = await this.categoryService.getCategoriesWithCounts();

      res.status(200).json({
        success: true,
        data: categories,
        meta: {
          total: categories.length,
        },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'CategoryController', method: 'getCategoriesWithCounts' },
      });
      throw error;
    }
  };
}

export default CategoryController;
