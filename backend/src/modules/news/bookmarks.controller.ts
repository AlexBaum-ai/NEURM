import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';
import { ZodError } from 'zod';
import BookmarkService from './bookmarks.service';
import {
  createBookmarkSchema,
  updateBookmarkSchema,
  createBookmarkCollectionSchema,
  updateBookmarkCollectionSchema,
  listBookmarksQuerySchema,
  articleSlugParamSchema,
  bookmarkIdParamSchema,
  collectionIdParamSchema,
  CreateBookmarkInput,
  UpdateBookmarkInput,
  CreateBookmarkCollectionInput,
  UpdateBookmarkCollectionInput,
  ListBookmarksQuery,
} from './bookmarks.validation';
import { BadRequestError, ValidationError } from '@/utils/errors';
import logger from '@/utils/logger';

/**
 * BookmarkController
 * Handles HTTP requests for bookmark endpoints
 */
export class BookmarkController {
  private service: BookmarkService;

  constructor(service?: BookmarkService) {
    this.service = service || new BookmarkService();
  }

  // ============================================================================
  // BOOKMARK ENDPOINTS
  // ============================================================================

  /**
   * POST /api/v1/news/articles/:slug/bookmark
   * Create a bookmark for an article
   */
  createBookmark = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Validate slug parameter
      const paramValidation = articleSlugParamSchema.safeParse(req.params);

      if (!paramValidation.success) {
        const error = paramValidation.error as ZodError;
        throw new ValidationError(error.issues[0].message);
      }

      const { slug } = paramValidation.data;

      // Validate request body
      const bodyValidation = createBookmarkSchema.safeParse(req.body);

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

      const data: CreateBookmarkInput = bodyValidation.data;

      logger.info(`User ${userId} bookmarking article: ${slug}`);

      const bookmark = await this.service.createBookmark(slug, userId, data);

      res.status(201).json({
        success: true,
        data: bookmark,
        message: 'Article bookmarked successfully',
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'BookmarkController', method: 'createBookmark' },
        extra: {
          userId: req.user?.id,
          slug: req.params.slug,
          body: req.body,
        },
      });
      throw error;
    }
  };

  /**
   * DELETE /api/v1/news/articles/:slug/bookmark
   * Remove a bookmark
   */
  deleteBookmark = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Validate slug parameter
      const paramValidation = articleSlugParamSchema.safeParse(req.params);

      if (!paramValidation.success) {
        const error = paramValidation.error as ZodError;
        throw new ValidationError(error.issues[0].message);
      }

      const { slug } = paramValidation.data;

      logger.info(`User ${userId} removing bookmark for article: ${slug}`);

      await this.service.deleteBookmark(slug, userId);

      res.status(200).json({
        success: true,
        message: 'Bookmark removed successfully',
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'BookmarkController', method: 'deleteBookmark' },
        extra: {
          userId: req.user?.id,
          slug: req.params.slug,
        },
      });
      throw error;
    }
  };

  /**
   * PATCH /api/v1/users/me/bookmarks/:id
   * Update a bookmark (collection or notes)
   */
  updateBookmark = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Validate ID parameter
      const paramValidation = bookmarkIdParamSchema.safeParse(req.params);

      if (!paramValidation.success) {
        const error = paramValidation.error as ZodError;
        throw new ValidationError(error.issues[0].message);
      }

      const { id } = paramValidation.data;

      // Validate request body
      const bodyValidation = updateBookmarkSchema.safeParse(req.body);

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

      const data: UpdateBookmarkInput = bodyValidation.data;

      logger.info(`User ${userId} updating bookmark ${id}`);

      const bookmark = await this.service.updateBookmark(id, userId, data);

      res.status(200).json({
        success: true,
        data: bookmark,
        message: 'Bookmark updated successfully',
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'BookmarkController', method: 'updateBookmark' },
        extra: {
          userId: req.user?.id,
          id: req.params.id,
          body: req.body,
        },
      });
      throw error;
    }
  };

  /**
   * GET /api/v1/users/me/bookmarks
   * List user's bookmarks with pagination
   */
  listUserBookmarks = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Validate query parameters
      const validationResult = listBookmarksQuerySchema.safeParse(req.query);

      if (!validationResult.success) {
        const error = validationResult.error as ZodError;
        throw new ValidationError(error.issues[0].message);
      }

      const query: ListBookmarksQuery = validationResult.data;

      const result = await this.service.listUserBookmarks(userId, query);

      res.status(200).json({
        success: true,
        data: result.bookmarks,
        pagination: result.pagination,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'BookmarkController', method: 'listUserBookmarks' },
        extra: {
          userId: req.user?.id,
          query: req.query,
        },
      });
      throw error;
    }
  };

  // ============================================================================
  // BOOKMARK COLLECTION ENDPOINTS
  // ============================================================================

  /**
   * POST /api/v1/users/me/bookmark-collections
   * Create a bookmark collection
   */
  createBookmarkCollection = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Validate request body
      const validationResult = createBookmarkCollectionSchema.safeParse(req.body);

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

      const data: CreateBookmarkCollectionInput = validationResult.data;

      logger.info(`User ${userId} creating bookmark collection: ${data.name}`);

      const collection = await this.service.createBookmarkCollection(userId, data);

      res.status(201).json({
        success: true,
        data: collection,
        message: 'Bookmark collection created successfully',
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'BookmarkController', method: 'createBookmarkCollection' },
        extra: {
          userId: req.user?.id,
          body: req.body,
        },
      });
      throw error;
    }
  };

  /**
   * GET /api/v1/users/me/bookmark-collections
   * List user's bookmark collections
   */
  listUserCollections = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      const collections = await this.service.listUserCollections(userId);

      res.status(200).json({
        success: true,
        data: collections,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'BookmarkController', method: 'listUserCollections' },
        extra: {
          userId: req.user?.id,
        },
      });
      throw error;
    }
  };

  /**
   * GET /api/v1/users/me/bookmark-collections/:id
   * Get collection by ID
   */
  getCollectionById = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Validate ID parameter
      const validationResult = collectionIdParamSchema.safeParse(req.params);

      if (!validationResult.success) {
        const error = validationResult.error as ZodError;
        throw new ValidationError(error.issues[0].message);
      }

      const { id } = validationResult.data;

      const collection = await this.service.getCollectionById(id, userId);

      res.status(200).json({
        success: true,
        data: collection,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'BookmarkController', method: 'getCollectionById' },
        extra: {
          userId: req.user?.id,
          id: req.params.id,
        },
      });
      throw error;
    }
  };

  /**
   * PATCH /api/v1/users/me/bookmark-collections/:id
   * Update bookmark collection
   */
  updateBookmarkCollection = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Validate ID parameter
      const paramValidation = collectionIdParamSchema.safeParse(req.params);

      if (!paramValidation.success) {
        const error = paramValidation.error as ZodError;
        throw new ValidationError(error.issues[0].message);
      }

      const { id } = paramValidation.data;

      // Validate request body
      const bodyValidation = updateBookmarkCollectionSchema.safeParse(req.body);

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

      const data: UpdateBookmarkCollectionInput = bodyValidation.data;

      logger.info(`User ${userId} updating bookmark collection ${id}`);

      const collection = await this.service.updateBookmarkCollection(id, userId, data);

      res.status(200).json({
        success: true,
        data: collection,
        message: 'Bookmark collection updated successfully',
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'BookmarkController', method: 'updateBookmarkCollection' },
        extra: {
          userId: req.user?.id,
          id: req.params.id,
          body: req.body,
        },
      });
      throw error;
    }
  };

  /**
   * DELETE /api/v1/users/me/bookmark-collections/:id
   * Delete bookmark collection
   */
  deleteBookmarkCollection = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Validate ID parameter
      const validationResult = collectionIdParamSchema.safeParse(req.params);

      if (!validationResult.success) {
        const error = validationResult.error as ZodError;
        throw new ValidationError(error.issues[0].message);
      }

      const { id } = validationResult.data;

      logger.info(`User ${userId} deleting bookmark collection ${id}`);

      await this.service.deleteBookmarkCollection(id, userId);

      res.status(200).json({
        success: true,
        message: 'Bookmark collection deleted successfully',
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'BookmarkController', method: 'deleteBookmarkCollection' },
        extra: {
          userId: req.user?.id,
          id: req.params.id,
        },
      });
      throw error;
    }
  };
}

export default BookmarkController;
