import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';
import { ZodError } from 'zod';
import TagService from './tags.service';
import {
  getTagsQuerySchema,
  tagSlugParamSchema,
  GetTagsQuery,
  TagSlugParam,
} from './tags.validation';
import { ValidationError } from '@/utils/errors';
import logger from '@/utils/logger';

/**
 * TagController
 * Handles HTTP requests for news tags endpoints
 */
export class TagController {
  private tagService: TagService;

  constructor(tagService?: TagService) {
    this.tagService = tagService || new TagService();
  }

  /**
   * GET /api/v1/news/tags
   * Get all tags with usage counts and optional search
   */
  getAllTags = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate query parameters
      const validationResult = getTagsQuerySchema.safeParse(req.query);

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

      const { search, limit, sortBy, sortOrder }: GetTagsQuery = validationResult.data;

      logger.debug('Fetching tags', { search, limit, sortBy, sortOrder });

      const tags = await this.tagService.getAllTags({
        search,
        limit,
        sortBy,
        sortOrder,
      });

      res.status(200).json({
        success: true,
        data: tags,
        meta: {
          total: tags.length,
          search,
          limit,
          sortBy,
          sortOrder,
        },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'TagController', method: 'getAllTags' },
        extra: {
          query: req.query,
        },
      });
      throw error;
    }
  };

  /**
   * GET /api/v1/news/tags/search
   * Search tags for autocomplete (limit 10)
   * Query param: ?query=text
   */
  searchTags = async (req: Request, res: Response): Promise<void> => {
    try {
      const query = req.query.query as string;

      if (!query || query.trim().length === 0) {
        res.status(200).json({
          success: true,
          data: [],
          meta: {
            query: '',
            limit: 10,
          },
        });
        return;
      }

      logger.debug(`Searching tags for: ${query}`);

      const tags = await this.tagService.searchTags(query);

      res.status(200).json({
        success: true,
        data: tags,
        meta: {
          query,
          limit: 10,
          total: tags.length,
        },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'TagController', method: 'searchTags' },
        extra: {
          query: req.query.query,
        },
      });
      throw error;
    }
  };

  /**
   * GET /api/v1/news/tags/:slug
   * Get tag by slug with usage count
   */
  getTagBySlug = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate slug parameter
      const validationResult = tagSlugParamSchema.safeParse(req.params);

      if (!validationResult.success) {
        const error = validationResult.error as ZodError;
        throw new ValidationError(error.issues[0].message);
      }

      const { slug }: TagSlugParam = validationResult.data;

      logger.debug(`Fetching tag by slug: ${slug}`);

      const tag = await this.tagService.getTagBySlug(slug);

      res.status(200).json({
        success: true,
        data: tag,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'TagController', method: 'getTagBySlug' },
        extra: {
          params: req.params,
        },
      });
      throw error;
    }
  };

  /**
   * GET /api/v1/news/tags/popular
   * Get popular tags by usage count
   */
  getPopularTags = async (req: Request, res: Response): Promise<void> => {
    try {
      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : 20;

      if (limit < 1 || limit > 100) {
        throw new ValidationError('Limit must be between 1 and 100');
      }

      logger.debug(`Fetching popular tags, limit: ${limit}`);

      const tags = await this.tagService.getPopularTags(limit);

      res.status(200).json({
        success: true,
        data: tags,
        meta: {
          limit,
          total: tags.length,
        },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'TagController', method: 'getPopularTags' },
        extra: {
          query: req.query,
        },
      });
      throw error;
    }
  };
}

export default TagController;
