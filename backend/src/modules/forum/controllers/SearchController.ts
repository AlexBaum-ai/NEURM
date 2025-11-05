import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { ZodError } from 'zod';
import { BaseController } from '../../../utils/baseController';
import { SearchService } from '../services/searchService';
import {
  searchQuerySchema,
  suggestionsQuerySchema,
  createSavedSearchSchema,
  updateSavedSearchSchema,
  searchHistoryQuerySchema,
  popularQueriesSchema,
} from '../validators/searchValidators';

/**
 * SearchController
 *
 * Handles HTTP requests for forum search functionality:
 * - Full-text search for topics and replies
 * - Autocomplete suggestions
 * - Search history management
 * - Saved searches CRUD
 */
@injectable()
export class SearchController extends BaseController {
  constructor(
    @inject('SearchService')
    private searchService: SearchService
  ) {
    super();
  }

  /**
   * GET /api/forum/search
   * Search topics and replies with filters
   */
  public search = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const query = searchQuerySchema.parse(req.query);

      const searchOptions = {
        query: query.query,
        filters: {
          categoryId: query.categoryId,
          type: query.type,
          status: query.status,
          dateFrom: query.dateFrom,
          dateTo: query.dateTo,
          hasCode: query.hasCode,
          minUpvotes: query.minUpvotes,
          authorId: query.authorId,
        },
        sort: {
          by: query.sortBy,
          order: query.sortOrder,
        },
        page: query.page,
        limit: query.limit,
        userId: req.user?.id, // Optional, for search history tracking
      };

      const results = await this.searchService.search(searchOptions);

      return this.success(res, {
        results: results.results,
        pagination: {
          total: results.total,
          page: results.page,
          limit: results.limit,
          hasMore: results.hasMore,
          totalPages: Math.ceil(results.total / results.limit),
        },
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return this.validationError(res, error);
      }
      return this.handleError(res, error);
    }
  });

  /**
   * GET /api/forum/search/suggest
   * Get autocomplete suggestions for search query
   */
  public getSuggestions = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const query = suggestionsQuerySchema.parse(req.query);

      const suggestions = await this.searchService.getSuggestions(
        query.query,
        req.user?.id
      );

      return this.success(res, { suggestions });
    } catch (error) {
      if (error instanceof ZodError) {
        return this.validationError(res, error);
      }
      return this.handleError(res, error);
    }
  });

  /**
   * GET /api/forum/search/popular
   * Get popular search queries
   */
  public getPopularQueries = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const query = popularQueriesSchema.parse(req.query);

      const queries = await this.searchService.getPopularQueries(query.limit);

      return this.success(res, { queries });
    } catch (error) {
      if (error instanceof ZodError) {
        return this.validationError(res, error);
      }
      return this.handleError(res, error);
    }
  });

  // ===================================================================
  // SEARCH HISTORY ENDPOINTS
  // ===================================================================

  /**
   * GET /api/forum/search/history
   * Get user's search history
   */
  public getSearchHistory = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const query = searchHistoryQuerySchema.parse(req.query);
      const userId = req.user!.id;

      const history = await this.searchService.getSearchHistory(userId, query.limit);

      return this.success(res, { history });
    } catch (error) {
      if (error instanceof ZodError) {
        return this.validationError(res, error);
      }
      return this.handleError(res, error);
    }
  });

  /**
   * DELETE /api/forum/search/history/:id
   * Delete a search history entry
   */
  public deleteSearchHistoryEntry = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      await this.searchService.deleteSearchHistoryEntry(id, userId);

      return this.success(res, null, 'Search history entry deleted successfully');
    } catch (error) {
      return this.handleError(res, error);
    }
  });

  /**
   * DELETE /api/forum/search/history
   * Clear all search history for user
   */
  public clearSearchHistory = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;

      const result = await this.searchService.clearSearchHistory(userId);

      return this.success(
        res,
        { deletedCount: result.count },
        'Search history cleared successfully'
      );
    } catch (error) {
      return this.handleError(res, error);
    }
  });

  // ===================================================================
  // SAVED SEARCHES ENDPOINTS
  // ===================================================================

  /**
   * POST /api/forum/search/saved
   * Save a search for quick access
   */
  public createSavedSearch = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const data = createSavedSearchSchema.parse(req.body);
      const userId = req.user!.id;

      const savedSearch = await this.searchService.saveSearch({
        userId,
        name: data.name,
        query: data.query,
        filters: data.filters || {},
      });

      return this.created(res, { savedSearch }, 'Search saved successfully');
    } catch (error) {
      if (error instanceof ZodError) {
        return this.validationError(res, error);
      }
      return this.handleError(res, error);
    }
  });

  /**
   * GET /api/forum/search/saved
   * Get all saved searches for user
   */
  public getSavedSearches = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;

      const savedSearches = await this.searchService.getSavedSearches(userId);

      return this.success(res, { savedSearches });
    } catch (error) {
      return this.handleError(res, error);
    }
  });

  /**
   * GET /api/forum/search/saved/:id
   * Get a specific saved search
   */
  public getSavedSearch = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const savedSearch = await this.searchService.getSavedSearch(id, userId);

      if (!savedSearch) {
        return this.notFound(res, 'Saved search not found');
      }

      return this.success(res, { savedSearch });
    } catch (error) {
      return this.handleError(res, error);
    }
  });

  /**
   * PATCH /api/forum/search/saved/:id
   * Update a saved search
   */
  public updateSavedSearch = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data = updateSavedSearchSchema.parse(req.body);
      const userId = req.user!.id;

      const savedSearch = await this.searchService.updateSavedSearch(id, userId, data);

      return this.success(res, { savedSearch }, 'Saved search updated successfully');
    } catch (error) {
      if (error instanceof ZodError) {
        return this.validationError(res, error);
      }
      return this.handleError(res, error);
    }
  });

  /**
   * DELETE /api/forum/search/saved/:id
   * Delete a saved search
   */
  public deleteSavedSearch = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      await this.searchService.deleteSavedSearch(id, userId);

      return this.success(res, null, 'Saved search deleted successfully');
    } catch (error) {
      return this.handleError(res, error);
    }
  });
}
