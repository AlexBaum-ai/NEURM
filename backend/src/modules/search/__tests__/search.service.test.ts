/**
 * Search Service Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SearchService } from '../search.service';
import { SearchRepository } from '../search.repository';

// Mock the repository
vi.mock('../search.repository');

describe('SearchService', () => {
  let searchService: SearchService;
  let mockSearchRepository: SearchRepository;

  beforeEach(() => {
    mockSearchRepository = {
      searchArticles: vi.fn(),
      searchForumTopics: vi.fn(),
      searchForumReplies: vi.fn(),
      searchJobs: vi.fn(),
      searchUsers: vi.fn(),
      searchCompanies: vi.fn(),
      getAutocompleteSuggestions: vi.fn(),
      trackSearchQuery: vi.fn(),
      addToSearchHistory: vi.fn(),
      getSearchHistory: vi.fn(),
      saveSearch: vi.fn(),
      getSavedSearches: vi.fn(),
      deleteSavedSearch: vi.fn(),
      getPopularSearches: vi.fn(),
      trackClickedResult: vi.fn(),
    } as any;

    searchService = new SearchService(mockSearchRepository);
  });

  describe('search', () => {
    it('should search across all content types by default', async () => {
      // Arrange
      const mockArticles = [
        {
          id: '1',
          title: 'GPT-4 Guide',
          excerpt: 'Learn about GPT-4',
          relevance_score: 0.9,
          createdAt: new Date(),
        },
      ];

      vi.spyOn(mockSearchRepository, 'searchArticles').mockResolvedValue(mockArticles);
      vi.spyOn(mockSearchRepository, 'searchForumTopics').mockResolvedValue([]);
      vi.spyOn(mockSearchRepository, 'searchForumReplies').mockResolvedValue([]);
      vi.spyOn(mockSearchRepository, 'searchJobs').mockResolvedValue([]);
      vi.spyOn(mockSearchRepository, 'searchUsers').mockResolvedValue([]);
      vi.spyOn(mockSearchRepository, 'searchCompanies').mockResolvedValue([]);
      vi.spyOn(mockSearchRepository, 'trackSearchQuery').mockResolvedValue();
      vi.spyOn(mockSearchRepository, 'addToSearchHistory').mockResolvedValue();

      // Act
      const result = await searchService.search({
        query: 'GPT-4',
        page: 1,
        limit: 20,
        userId: 'user-1',
      });

      // Assert
      expect(result.results).toHaveLength(1);
      expect(result.results[0].type).toBe('articles');
      expect(result.totalCount).toBe(1);
      expect(result.query).toBe('GPT-4');
      expect(mockSearchRepository.searchArticles).toHaveBeenCalled();
      expect(mockSearchRepository.trackSearchQuery).toHaveBeenCalled();
      expect(mockSearchRepository.addToSearchHistory).toHaveBeenCalled();
    });

    it('should only search specified content types', async () => {
      // Arrange
      vi.spyOn(mockSearchRepository, 'searchArticles').mockResolvedValue([]);
      vi.spyOn(mockSearchRepository, 'searchJobs').mockResolvedValue([]);
      vi.spyOn(mockSearchRepository, 'trackSearchQuery').mockResolvedValue();
      vi.spyOn(mockSearchRepository, 'addToSearchHistory').mockResolvedValue();

      // Act
      await searchService.search({
        query: 'GPT-4',
        contentTypes: ['articles', 'jobs'],
        userId: 'user-1',
      });

      // Assert
      expect(mockSearchRepository.searchArticles).toHaveBeenCalled();
      expect(mockSearchRepository.searchJobs).toHaveBeenCalled();
      expect(mockSearchRepository.searchForumTopics).not.toHaveBeenCalled();
      expect(mockSearchRepository.searchUsers).not.toHaveBeenCalled();
    });

    it('should throw error for empty query', async () => {
      // Act & Assert
      await expect(
        searchService.search({ query: '' })
      ).rejects.toThrow('Search query is required');
    });

    it('should throw error for query too long', async () => {
      // Arrange
      const longQuery = 'a'.repeat(501);

      // Act & Assert
      await expect(
        searchService.search({ query: longQuery })
      ).rejects.toThrow('Search query is too long');
    });

    it('should paginate results correctly', async () => {
      // Arrange
      const mockResults = Array.from({ length: 50 }, (_, i) => ({
        id: `${i}`,
        title: `Article ${i}`,
        excerpt: `Excerpt ${i}`,
        relevance_score: 0.9 - i * 0.01,
        createdAt: new Date(),
      }));

      vi.spyOn(mockSearchRepository, 'searchArticles').mockResolvedValue(mockResults);
      vi.spyOn(mockSearchRepository, 'searchForumTopics').mockResolvedValue([]);
      vi.spyOn(mockSearchRepository, 'searchForumReplies').mockResolvedValue([]);
      vi.spyOn(mockSearchRepository, 'searchJobs').mockResolvedValue([]);
      vi.spyOn(mockSearchRepository, 'searchUsers').mockResolvedValue([]);
      vi.spyOn(mockSearchRepository, 'searchCompanies').mockResolvedValue([]);
      vi.spyOn(mockSearchRepository, 'trackSearchQuery').mockResolvedValue();

      // Act
      const result = await searchService.search({
        query: 'test',
        page: 1,
        limit: 20,
      });

      // Assert
      expect(result.results).toHaveLength(20);
      expect(result.totalCount).toBe(50);
      expect(result.totalPages).toBe(3);
    });

    it('should sort results by date when specified', async () => {
      // Arrange
      const mockResults = [
        {
          id: '1',
          title: 'Old article',
          excerpt: 'Old',
          relevance_score: 0.9,
          createdAt: new Date('2024-01-01'),
        },
        {
          id: '2',
          title: 'New article',
          excerpt: 'New',
          relevance_score: 0.8,
          createdAt: new Date('2024-12-01'),
        },
      ];

      vi.spyOn(mockSearchRepository, 'searchArticles').mockResolvedValue(mockResults);
      vi.spyOn(mockSearchRepository, 'searchForumTopics').mockResolvedValue([]);
      vi.spyOn(mockSearchRepository, 'searchForumReplies').mockResolvedValue([]);
      vi.spyOn(mockSearchRepository, 'searchJobs').mockResolvedValue([]);
      vi.spyOn(mockSearchRepository, 'searchUsers').mockResolvedValue([]);
      vi.spyOn(mockSearchRepository, 'searchCompanies').mockResolvedValue([]);
      vi.spyOn(mockSearchRepository, 'trackSearchQuery').mockResolvedValue();

      // Act
      const result = await searchService.search({
        query: 'test',
        sortBy: 'date',
      });

      // Assert
      expect(result.results[0].id).toBe('2'); // Newer article first
      expect(result.results[1].id).toBe('1');
    });
  });

  describe('autocomplete', () => {
    it('should return suggestions for valid query', async () => {
      // Arrange
      const mockSuggestions = [
        { suggestion: 'GPT-4', type: 'articles' as const, count: 10 },
        { suggestion: 'GPT-3', type: 'articles' as const, count: 5 },
      ];

      vi.spyOn(mockSearchRepository, 'getAutocompleteSuggestions').mockResolvedValue(
        mockSuggestions
      );

      // Act
      const result = await searchService.autocomplete('GPT');

      // Assert
      expect(result.suggestions).toHaveLength(2);
      expect(result.query).toBe('GPT');
      expect(mockSearchRepository.getAutocompleteSuggestions).toHaveBeenCalledWith('GPT', 10);
    });

    it('should return empty suggestions for short query', async () => {
      // Act
      const result = await searchService.autocomplete('G');

      // Assert
      expect(result.suggestions).toHaveLength(0);
      expect(mockSearchRepository.getAutocompleteSuggestions).not.toHaveBeenCalled();
    });
  });

  describe('saveSearch', () => {
    it('should save search successfully', async () => {
      // Arrange
      const userId = 'user-1';
      const input = {
        name: 'My Search',
        query: 'GPT-4',
        contentTypes: ['articles' as const, 'jobs' as const],
        notificationEnabled: true,
      };

      const mockSavedSearch = {
        id: 'search-1',
        userId,
        ...input,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(mockSearchRepository, 'saveSearch').mockResolvedValue(mockSavedSearch);

      // Act
      const result = await searchService.saveSearch(userId, input);

      // Assert
      expect(result).toEqual(mockSavedSearch);
      expect(mockSearchRepository.saveSearch).toHaveBeenCalledWith(userId, input);
    });
  });

  describe('getSearchHistory', () => {
    it('should return search history for user', async () => {
      // Arrange
      const userId = 'user-1';
      const mockHistory = [
        {
          id: '1',
          query: 'GPT-4',
          contentTypes: ['articles' as const],
          createdAt: new Date(),
        },
        {
          id: '2',
          query: 'LLaMA',
          contentTypes: ['forum_topics' as const],
          createdAt: new Date(),
        },
      ];

      vi.spyOn(mockSearchRepository, 'getSearchHistory').mockResolvedValue(mockHistory);

      // Act
      const result = await searchService.getSearchHistory(userId);

      // Assert
      expect(result).toHaveLength(2);
      expect(mockSearchRepository.getSearchHistory).toHaveBeenCalledWith(userId);
    });
  });

  describe('getPopularSearches', () => {
    it('should return popular searches', async () => {
      // Arrange
      const mockPopularSearches = [
        { query: 'GPT-4', count: 100, lastSearched: new Date() },
        { query: 'Claude', count: 50, lastSearched: new Date() },
      ];

      vi.spyOn(mockSearchRepository, 'getPopularSearches').mockResolvedValue(
        mockPopularSearches
      );

      // Act
      const result = await searchService.getPopularSearches();

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].query).toBe('GPT-4');
      expect(mockSearchRepository.getPopularSearches).toHaveBeenCalledWith(10);
    });
  });
});
