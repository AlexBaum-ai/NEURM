/**
 * Search Service
 *
 * Business logic for universal search functionality
 */

import * as Sentry from '@sentry/node';
import { SearchRepository } from './search.repository';
import {
  ContentType,
  SearchOptions,
  SearchResult,
  SearchResponse,
  AutocompleteResponse,
  SavedSearchInput,
  SearchHistoryEntry,
  PopularSearch,
  SearchResultMetadata,
  SortOption,
} from './types/search.types';
import logger from '../../utils/logger';

export class SearchService {
  constructor(private searchRepository: SearchRepository) {}

  /**
   * Perform universal search across all content types
   */
  async search(options: SearchOptions): Promise<SearchResponse> {
    const startTime = Date.now();

    try {
      const {
        query,
        contentTypes = [
          'articles',
          'forum_topics',
          'forum_replies',
          'jobs',
          'users',
          'companies',
        ],
        sortBy = 'relevance',
        page = 1,
        limit = 20,
        userId,
      } = options;

      // Validate inputs
      if (!query || query.trim().length === 0) {
        throw new Error('Search query is required');
      }

      if (query.length > 500) {
        throw new Error('Search query is too long (max 500 characters)');
      }

      const offset = (page - 1) * limit;
      const results: SearchResult[] = [];

      // Search each content type in parallel
      const searchPromises: Promise<any[]>[] = [];

      if (contentTypes.includes('articles')) {
        searchPromises.push(
          this.searchRepository.searchArticles(query, limit, offset)
        );
      }

      if (contentTypes.includes('forum_topics')) {
        searchPromises.push(
          this.searchRepository.searchForumTopics(query, limit, offset)
        );
      }

      if (contentTypes.includes('forum_replies')) {
        searchPromises.push(
          this.searchRepository.searchForumReplies(query, limit, offset)
        );
      }

      if (contentTypes.includes('jobs')) {
        searchPromises.push(
          this.searchRepository.searchJobs(query, limit, offset)
        );
      }

      if (contentTypes.includes('users')) {
        searchPromises.push(
          this.searchRepository.searchUsers(query, limit, offset)
        );
      }

      if (contentTypes.includes('companies')) {
        searchPromises.push(
          this.searchRepository.searchCompanies(query, limit, offset)
        );
      }

      const searchResults = await Promise.all(searchPromises);

      // Process and combine results
      let combinedResults: any[] = [];
      let contentTypeIndex = 0;

      if (contentTypes.includes('articles')) {
        const articles = searchResults[contentTypeIndex++];
        combinedResults = combinedResults.concat(
          articles.map((a) => this.mapArticleToSearchResult(a))
        );
      }

      if (contentTypes.includes('forum_topics')) {
        const topics = searchResults[contentTypeIndex++];
        combinedResults = combinedResults.concat(
          topics.map((t) => this.mapTopicToSearchResult(t))
        );
      }

      if (contentTypes.includes('forum_replies')) {
        const replies = searchResults[contentTypeIndex++];
        combinedResults = combinedResults.concat(
          replies.map((r) => this.mapReplyToSearchResult(r))
        );
      }

      if (contentTypes.includes('jobs')) {
        const jobs = searchResults[contentTypeIndex++];
        combinedResults = combinedResults.concat(
          jobs.map((j) => this.mapJobToSearchResult(j))
        );
      }

      if (contentTypes.includes('users')) {
        const users = searchResults[contentTypeIndex++];
        combinedResults = combinedResults.concat(
          users.map((u) => this.mapUserToSearchResult(u))
        );
      }

      if (contentTypes.includes('companies')) {
        const companies = searchResults[contentTypeIndex++];
        combinedResults = combinedResults.concat(
          companies.map((c) => this.mapCompanyToSearchResult(c))
        );
      }

      // Sort combined results
      combinedResults = this.sortResults(combinedResults, sortBy);

      // Paginate
      const paginatedResults = combinedResults.slice(0, limit);
      const totalCount = combinedResults.length;

      // Track search query
      if (userId) {
        await this.searchRepository.addToSearchHistory(
          userId,
          query,
          contentTypes,
          sortBy
        );
      }

      await this.searchRepository.trackSearchQuery(
        userId,
        query,
        contentTypes,
        totalCount,
        sortBy
      );

      const executionTime = Date.now() - startTime;

      logger.info('Search executed', {
        query,
        contentTypes,
        resultsCount: totalCount,
        executionTime,
        userId,
      });

      return {
        results: paginatedResults,
        totalCount,
        page,
        pageSize: limit,
        totalPages: Math.ceil(totalCount / limit),
        query,
        contentTypes,
        sortBy,
        executionTime,
      };
    } catch (error) {
      Sentry.captureException(error, {
        extra: {
          query: options.query,
          contentTypes: options.contentTypes,
          userId: options.userId,
        },
      });

      logger.error('Search failed', { error, options });
      throw error;
    }
  }

  /**
   * Get autocomplete suggestions
   */
  async autocomplete(query: string): Promise<AutocompleteResponse> {
    try {
      if (!query || query.trim().length < 2) {
        return { suggestions: [], query };
      }

      const suggestions = await this.searchRepository.getAutocompleteSuggestions(
        query.trim(),
        10
      );

      return { suggestions, query };
    } catch (error) {
      Sentry.captureException(error, { extra: { query } });
      logger.error('Autocomplete failed', { error, query });
      throw error;
    }
  }

  /**
   * Get search history
   */
  async getSearchHistory(userId: string): Promise<SearchHistoryEntry[]> {
    try {
      return await this.searchRepository.getSearchHistory(userId);
    } catch (error) {
      Sentry.captureException(error, { extra: { userId } });
      logger.error('Get search history failed', { error, userId });
      throw error;
    }
  }

  /**
   * Save search
   */
  async saveSearch(userId: string, input: SavedSearchInput): Promise<any> {
    try {
      return await this.searchRepository.saveSearch(userId, input);
    } catch (error) {
      Sentry.captureException(error, { extra: { userId, input } });
      logger.error('Save search failed', { error, userId, input });
      throw error;
    }
  }

  /**
   * Get saved searches
   */
  async getSavedSearches(userId: string): Promise<any[]> {
    try {
      return await this.searchRepository.getSavedSearches(userId);
    } catch (error) {
      Sentry.captureException(error, { extra: { userId } });
      logger.error('Get saved searches failed', { error, userId });
      throw error;
    }
  }

  /**
   * Delete saved search
   */
  async deleteSavedSearch(userId: string, searchId: string): Promise<void> {
    try {
      await this.searchRepository.deleteSavedSearch(userId, searchId);
    } catch (error) {
      Sentry.captureException(error, { extra: { userId, searchId } });
      logger.error('Delete saved search failed', { error, userId, searchId });
      throw error;
    }
  }

  /**
   * Get popular searches
   */
  async getPopularSearches(): Promise<PopularSearch[]> {
    try {
      return await this.searchRepository.getPopularSearches(10);
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Get popular searches failed', { error });
      throw error;
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private mapArticleToSearchResult(article: any): SearchResult {
    return {
      id: article.id,
      type: 'articles',
      title: article.title,
      excerpt: article.excerpt,
      highlights: this.extractHighlights(
        article.title_highlight,
        article.excerpt_highlight
      ),
      url: `/news/${article.slug}`,
      metadata: {
        authorName: article.authorName,
        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
        viewCount: article.viewCount,
        categoryName: article.categoryName,
      },
      relevanceScore: Number(article.relevance_score),
    };
  }

  private mapTopicToSearchResult(topic: any): SearchResult {
    return {
      id: topic.id,
      type: 'forum_topics',
      title: topic.title,
      excerpt: topic.excerpt,
      highlights: this.extractHighlights(
        topic.title_highlight,
        topic.content_highlight
      ),
      url: `/forum/${topic.slug}`,
      metadata: {
        authorUsername: topic.authorUsername,
        authorId: topic.authorId,
        createdAt: topic.createdAt,
        updatedAt: topic.updatedAt,
        viewCount: topic.viewCount,
        replyCount: topic.replyCount,
        upvoteCount: topic.upvoteCount,
        categoryName: topic.categoryName,
        status: topic.status,
      },
      relevanceScore: Number(topic.relevance_score),
    };
  }

  private mapReplyToSearchResult(reply: any): SearchResult {
    return {
      id: reply.id,
      type: 'forum_replies',
      title: `Reply to: ${reply.topicTitle}`,
      excerpt: reply.excerpt,
      highlights: this.extractHighlights(reply.content_highlight),
      url: `/forum/${reply.topicSlug}#reply-${reply.id}`,
      metadata: {
        authorUsername: reply.authorUsername,
        authorId: reply.authorId,
        createdAt: reply.createdAt,
        updatedAt: reply.updatedAt,
        upvoteCount: reply.upvoteCount,
      },
      relevanceScore: Number(reply.relevance_score),
    };
  }

  private mapJobToSearchResult(job: any): SearchResult {
    return {
      id: job.id,
      type: 'jobs',
      title: job.title,
      excerpt: job.excerpt,
      highlights: this.extractHighlights(
        job.title_highlight,
        job.description_highlight
      ),
      url: `/jobs/${job.slug}`,
      metadata: {
        companyName: job.companyName,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        viewCount: job.viewCount,
        location: job.location,
        salary: {
          min: job.salaryMin ? Number(job.salaryMin) : undefined,
          max: job.salaryMax ? Number(job.salaryMax) : undefined,
          currency: job.salaryCurrency,
        },
      },
      relevanceScore: Number(job.relevance_score),
    };
  }

  private mapUserToSearchResult(user: any): SearchResult {
    return {
      id: user.id,
      type: 'users',
      title: user.displayName || user.username,
      excerpt: user.headline || user.bio || '',
      highlights: [],
      url: `/u/${user.username}`,
      metadata: {
        authorUsername: user.username,
        authorId: user.id,
        createdAt: user.createdAt,
        location: user.location,
      },
      relevanceScore: Number(user.relevance_score),
    };
  }

  private mapCompanyToSearchResult(company: any): SearchResult {
    return {
      id: company.id,
      type: 'companies',
      title: company.name,
      excerpt: company.excerpt || '',
      highlights: this.extractHighlights(company.description_highlight),
      url: `/companies/${company.slug}`,
      metadata: {
        companyName: company.name,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
        viewCount: company.viewCount,
        location: company.location,
      },
      relevanceScore: Number(company.relevance_score),
    };
  }

  private extractHighlights(...highlightedTexts: string[]): string[] {
    const highlights: string[] = [];

    for (const text of highlightedTexts) {
      if (!text) continue;

      // Extract highlighted portions (text between <b> tags in ts_headline output)
      const matches = text.match(/<b>(.*?)<\/b>/g);
      if (matches) {
        highlights.push(...matches.map((m) => m.replace(/<\/?b>/g, '')));
      }
    }

    return Array.from(new Set(highlights)); // Remove duplicates
  }

  private sortResults(
    results: SearchResult[],
    sortBy: SortOption
  ): SearchResult[] {
    switch (sortBy) {
      case 'date':
        return results.sort(
          (a, b) =>
            new Date(b.metadata.createdAt).getTime() -
            new Date(a.metadata.createdAt).getTime()
        );

      case 'popularity':
        return results.sort(
          (a, b) =>
            (b.metadata.viewCount || 0) +
            (b.metadata.upvoteCount || 0) -
            ((a.metadata.viewCount || 0) + (a.metadata.upvoteCount || 0))
        );

      case 'relevance':
      default:
        return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }
  }
}
