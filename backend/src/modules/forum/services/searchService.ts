import { injectable, inject } from 'tsyringe';
import {
  SearchRepository,
  SearchOptions,
  SearchResponse,
} from '../repositories/SearchRepository';
import {
  SavedSearchRepository,
  CreateSavedSearchData,
  UpdateSavedSearchData,
} from '../repositories/SavedSearchRepository';
import {
  SearchHistoryRepository,
  CreateSearchHistoryData,
} from '../repositories/SearchHistoryRepository';
import { SavedSearch, SearchHistory } from '@prisma/client';
import * as Sentry from '@sentry/node';

@injectable()
export class SearchService {
  constructor(
    @inject('SearchRepository') private searchRepository: SearchRepository,
    @inject('SavedSearchRepository') private savedSearchRepository: SavedSearchRepository,
    @inject('SearchHistoryRepository')
    private searchHistoryRepository: SearchHistoryRepository
  ) {}

  /**
   * Perform a search with all features
   */
  async search(options: SearchOptions): Promise<SearchResponse> {
    try {
      const startTime = Date.now();

      // Validate query
      if (!options.query || options.query.trim().length === 0) {
        throw new Error('Search query is required');
      }

      if (options.query.length > 500) {
        throw new Error('Search query is too long (max 500 characters)');
      }

      // Perform search
      const results = await this.searchRepository.search(options);

      // Track search history if user is logged in
      if (options.userId) {
        await this.trackSearchHistory({
          userId: options.userId,
          query: options.query,
          filters: options.filters || {},
          resultCount: results.total,
        }).catch((err) => {
          // Don't fail the search if history tracking fails
          Sentry.captureException(err, {
            tags: { context: 'search_history_tracking' },
          });
        });
      }

      const duration = Date.now() - startTime;

      // Log performance warning if search is slow
      if (duration > 500) {
        Sentry.captureMessage('Slow search query', {
          level: 'warning',
          extra: {
            query: options.query,
            duration,
            resultCount: results.total,
          },
        });
      }

      return results;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { context: 'forum_search' },
        extra: { options },
      });
      throw error;
    }
  }

  /**
   * Get autocomplete suggestions
   */
  async getSuggestions(query: string, userId?: string): Promise<string[]> {
    try {
      // Get both algorithmic suggestions and user history
      const [algorithmicSuggestions, historySuggestions] = await Promise.all([
        this.searchRepository.getSuggestions(query, 7),
        userId
          ? this.searchHistoryRepository.getDistinctQueries(userId, 3)
          : Promise.resolve([]),
      ]);

      // Combine and deduplicate
      const allSuggestions = [...historySuggestions, ...algorithmicSuggestions];
      const uniqueSuggestions = Array.from(new Set(allSuggestions));

      // Filter suggestions that match the query
      const filtered = uniqueSuggestions.filter((s) =>
        s.toLowerCase().includes(query.toLowerCase())
      );

      return filtered.slice(0, 10);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { context: 'search_suggestions' },
      });
      throw error;
    }
  }

  /**
   * Track search in history
   */
  async trackSearchHistory(data: CreateSearchHistoryData): Promise<SearchHistory> {
    return this.searchHistoryRepository.create(data);
  }

  /**
   * Get user's search history
   */
  async getSearchHistory(userId: string, limit: number = 10): Promise<SearchHistory[]> {
    return this.searchHistoryRepository.findByUserId(userId, limit);
  }

  /**
   * Clear user's search history
   */
  async clearSearchHistory(userId: string): Promise<{ count: number }> {
    return this.searchHistoryRepository.clearAll(userId);
  }

  /**
   * Delete a specific search history entry
   */
  async deleteSearchHistoryEntry(id: string, userId: string): Promise<SearchHistory> {
    return this.searchHistoryRepository.delete(id, userId);
  }

  /**
   * Save a search for quick access
   */
  async saveSearch(data: CreateSavedSearchData): Promise<SavedSearch> {
    // Validate name
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Search name is required');
    }

    if (data.name.length > 100) {
      throw new Error('Search name is too long (max 100 characters)');
    }

    // Check if name already exists
    const exists = await this.savedSearchRepository.existsByName(data.userId, data.name);
    if (exists) {
      throw new Error('A saved search with this name already exists');
    }

    // Check saved search limit (max 20 per user)
    const count = await this.savedSearchRepository.countByUserId(data.userId);
    if (count >= 20) {
      throw new Error('Maximum number of saved searches reached (20)');
    }

    return this.savedSearchRepository.create(data);
  }

  /**
   * Get user's saved searches
   */
  async getSavedSearches(userId: string): Promise<SavedSearch[]> {
    return this.savedSearchRepository.findByUserId(userId);
  }

  /**
   * Get a specific saved search
   */
  async getSavedSearch(id: string, userId: string): Promise<SavedSearch | null> {
    return this.savedSearchRepository.findById(id, userId);
  }

  /**
   * Update a saved search
   */
  async updateSavedSearch(
    id: string,
    userId: string,
    data: UpdateSavedSearchData
  ): Promise<SavedSearch> {
    // Validate if updating name
    if (data.name !== undefined) {
      if (data.name.trim().length === 0) {
        throw new Error('Search name is required');
      }

      if (data.name.length > 100) {
        throw new Error('Search name is too long (max 100 characters)');
      }

      // Check if new name already exists (excluding current search)
      const exists = await this.savedSearchRepository.existsByName(
        userId,
        data.name,
        id
      );
      if (exists) {
        throw new Error('A saved search with this name already exists');
      }
    }

    return this.savedSearchRepository.update(id, userId, data);
  }

  /**
   * Delete a saved search
   */
  async deleteSavedSearch(id: string, userId: string): Promise<SavedSearch> {
    return this.savedSearchRepository.delete(id, userId);
  }

  /**
   * Get popular search queries
   */
  async getPopularQueries(limit: number = 10): Promise<{ query: string; count: number }[]> {
    return this.searchHistoryRepository.getPopularQueries(limit);
  }
}
