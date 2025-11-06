/**
 * Search Controller
 *
 * Handles HTTP requests for universal search functionality
 */

import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { BaseController } from '../../utils/baseController';
import { SearchService } from './search.service';
import {
  searchRequestSchema,
  autocompleteRequestSchema,
  saveSearchSchema,
  deleteSavedSearchSchema,
  SearchRequest,
  AutocompleteRequest,
  SaveSearchRequest,
  DeleteSavedSearchParams,
} from './search.validator';
import logger from '../../utils/logger';
import * as Sentry from '@sentry/node';

export class SearchController extends BaseController {
  constructor(private searchService: SearchService) {
    super();
  }

  /**
   * Universal search
   * GET /api/search
   */
  search = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      // Validate request
      const validatedQuery = searchRequestSchema.parse(req.query);

      // Get user ID from authenticated user (optional)
      const userId = (req as any).user?.id;

      // Perform search
      const result = await this.searchService.search({
        query: validatedQuery.q,
        contentTypes: validatedQuery.type,
        sortBy: validatedQuery.sort,
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        userId,
      });

      // Check performance target
      if (result.executionTime > 500) {
        logger.warn('Search performance target exceeded', {
          query: validatedQuery.q,
          executionTime: result.executionTime,
          resultsCount: result.totalCount,
        });
      }

      return this.success(res, result);
    } catch (error) {
      if (error instanceof ZodError) {
        return this.handleZodError(res, error);
      }

      this.captureException(error as Error, {
        query: req.query,
        userId: (req as any).user?.id,
      });

      if ((error as Error).message === 'Search query is required') {
        return this.badRequest(res, (error as Error).message);
      }

      if ((error as Error).message?.includes('too long')) {
        return this.badRequest(res, (error as Error).message);
      }

      return this.error(
        res,
        'An error occurred while searching',
        500
      );
    }
  });

  /**
   * Autocomplete suggestions
   * GET /api/search/suggest
   */
  suggest = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      // Validate request
      const validatedQuery = autocompleteRequestSchema.parse(req.query);

      // Get suggestions
      const result = await this.searchService.autocomplete(validatedQuery.q);

      return this.success(res, result);
    } catch (error) {
      if (error instanceof ZodError) {
        return this.handleZodError(res, error);
      }

      this.captureException(error as Error, {
        query: req.query,
      });

      return this.error(
        res,
        'An error occurred while fetching suggestions',
        500
      );
    }
  });

  /**
   * Get search history
   * GET /api/search/history
   */
  getHistory = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return this.unauthorized(res, 'Authentication required');
      }

      const history = await this.searchService.getSearchHistory(userId);

      return this.success(res, { history });
    } catch (error) {
      this.captureException(error as Error, {
        userId: (req as any).user?.id,
      });

      return this.error(
        res,
        'An error occurred while fetching search history',
        500
      );
    }
  });

  /**
   * Save search
   * POST /api/search/saved
   */
  saveSearch = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return this.unauthorized(res, 'Authentication required');
      }

      // Validate request
      const validatedBody = saveSearchSchema.parse(req.body);

      // Save search
      const savedSearch = await this.searchService.saveSearch(
        userId,
        validatedBody
      );

      return this.created(res, savedSearch);
    } catch (error) {
      if (error instanceof ZodError) {
        return this.handleZodError(res, error);
      }

      this.captureException(error as Error, {
        userId: (req as any).user?.id,
        body: req.body,
      });

      // Handle unique constraint violation
      if ((error as any).code === 'P2002') {
        return this.badRequest(res, 'A saved search with this name already exists');
      }

      return this.error(
        res,
        'An error occurred while saving the search',
        500
      );
    }
  });

  /**
   * Get saved searches
   * GET /api/search/saved
   */
  getSavedSearches = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return this.unauthorized(res, 'Authentication required');
      }

      const savedSearches = await this.searchService.getSavedSearches(userId);

      return this.success(res, { savedSearches });
    } catch (error) {
      this.captureException(error as Error, {
        userId: (req as any).user?.id,
      });

      return this.error(
        res,
        'An error occurred while fetching saved searches',
        500
      );
    }
  });

  /**
   * Delete saved search
   * DELETE /api/search/saved/:searchId
   */
  deleteSavedSearch = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return this.unauthorized(res, 'Authentication required');
      }

      // Validate params
      const validatedParams = deleteSavedSearchSchema.parse(req.params);

      // Delete search
      await this.searchService.deleteSavedSearch(
        userId,
        validatedParams.searchId
      );

      return this.noContent(res);
    } catch (error) {
      if (error instanceof ZodError) {
        return this.handleZodError(res, error);
      }

      this.captureException(error as Error, {
        userId: (req as any).user?.id,
        searchId: req.params.searchId,
      });

      // Handle not found
      if ((error as any).code === 'P2025') {
        return this.notFound(res, 'Saved search not found');
      }

      return this.error(
        res,
        'An error occurred while deleting the saved search',
        500
      );
    }
  });

  /**
   * Get popular searches
   * GET /api/search/popular
   */
  getPopularSearches = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const popularSearches = await this.searchService.getPopularSearches();

      return this.success(res, { popularSearches });
    } catch (error) {
      this.captureException(error as Error);

      return this.error(
        res,
        'An error occurred while fetching popular searches',
        500
      );
    }
  });
}
