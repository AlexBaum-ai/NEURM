import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SearchService } from '../services/searchService';
import { SearchRepository } from '../repositories/SearchRepository';
import { SavedSearchRepository } from '../repositories/SavedSearchRepository';
import { SearchHistoryRepository } from '../repositories/SearchHistoryRepository';

// Mock repositories
const mockSearchRepository = {
  search: vi.fn(),
  getSuggestions: vi.fn(),
} as unknown as SearchRepository;

const mockSavedSearchRepository = {
  create: vi.fn(),
  findByUserId: vi.fn(),
  findById: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  countByUserId: vi.fn(),
  existsByName: vi.fn(),
} as unknown as SavedSearchRepository;

const mockSearchHistoryRepository = {
  create: vi.fn(),
  findByUserId: vi.fn(),
  getDistinctQueries: vi.fn(),
  delete: vi.fn(),
  clearAll: vi.fn(),
  getPopularQueries: vi.fn(),
} as unknown as SearchHistoryRepository;

describe('SearchService', () => {
  let searchService: SearchService;

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Create service instance with mocked repositories
    searchService = new SearchService(
      mockSearchRepository,
      mockSavedSearchRepository,
      mockSearchHistoryRepository
    );
  });

  describe('search', () => {
    it('should perform search and track history for authenticated user', async () => {
      // Arrange
      const searchOptions = {
        query: 'test query',
        userId: 'user-123',
        filters: {},
        page: 1,
        limit: 20,
      };

      const mockResults = {
        results: [
          {
            id: 'topic-1',
            type: 'topic' as const,
            title: 'Test Topic',
            content: 'Test content',
            excerpt: 'Test excerpt',
            highlights: [],
            author: {
              id: 'user-1',
              username: 'testuser',
              displayName: 'Test User',
              avatarUrl: null,
            },
            voteScore: 10,
            upvoteCount: 12,
            createdAt: new Date(),
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        hasMore: false,
      };

      vi.mocked(mockSearchRepository.search).mockResolvedValue(mockResults);
      vi.mocked(mockSearchHistoryRepository.create).mockResolvedValue({
        id: 'history-1',
        userId: 'user-123',
        query: 'test query',
        filters: {},
        resultCount: 1,
        createdAt: new Date(),
      });

      // Act
      const results = await searchService.search(searchOptions);

      // Assert
      expect(mockSearchRepository.search).toHaveBeenCalledWith(searchOptions);
      expect(mockSearchHistoryRepository.create).toHaveBeenCalledWith({
        userId: 'user-123',
        query: 'test query',
        filters: {},
        resultCount: 1,
      });
      expect(results).toEqual(mockResults);
    });

    it('should throw error for empty query', async () => {
      // Arrange
      const searchOptions = {
        query: '',
        page: 1,
        limit: 20,
      };

      // Act & Assert
      await expect(searchService.search(searchOptions)).rejects.toThrow(
        'Search query is required'
      );
    });

    it('should throw error for query exceeding max length', async () => {
      // Arrange
      const searchOptions = {
        query: 'a'.repeat(501),
        page: 1,
        limit: 20,
      };

      // Act & Assert
      await expect(searchService.search(searchOptions)).rejects.toThrow(
        'Search query is too long'
      );
    });
  });

  describe('getSuggestions', () => {
    it('should combine algorithmic and history suggestions', async () => {
      // Arrange
      const query = 'test';
      const userId = 'user-123';

      vi.mocked(mockSearchRepository.getSuggestions).mockResolvedValue([
        'testing',
        'test123',
        'test-driven',
      ]);
      vi.mocked(mockSearchHistoryRepository.getDistinctQueries).mockResolvedValue([
        'test query',
        'testing',
      ]);

      // Act
      const suggestions = await searchService.getSuggestions(query, userId);

      // Assert
      expect(suggestions).toContain('test query');
      expect(suggestions).toContain('testing');
      expect(suggestions).toContain('test-driven');
      // Check for deduplication
      expect(suggestions.filter((s) => s === 'testing').length).toBe(1);
    });
  });

  describe('saveSearch', () => {
    it('should save a valid search', async () => {
      // Arrange
      const data = {
        userId: 'user-123',
        name: 'My Search',
        query: 'test query',
        filters: { categoryId: 'cat-1' },
      };

      vi.mocked(mockSavedSearchRepository.existsByName).mockResolvedValue(false);
      vi.mocked(mockSavedSearchRepository.countByUserId).mockResolvedValue(5);
      vi.mocked(mockSavedSearchRepository.create).mockResolvedValue({
        id: 'saved-1',
        ...data,
        filters: data.filters,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const result = await searchService.saveSearch(data);

      // Assert
      expect(mockSavedSearchRepository.existsByName).toHaveBeenCalledWith(
        'user-123',
        'My Search'
      );
      expect(mockSavedSearchRepository.countByUserId).toHaveBeenCalledWith('user-123');
      expect(mockSavedSearchRepository.create).toHaveBeenCalledWith(data);
      expect(result.name).toBe('My Search');
    });

    it('should throw error if name already exists', async () => {
      // Arrange
      const data = {
        userId: 'user-123',
        name: 'Existing Search',
        query: 'test query',
      };

      vi.mocked(mockSavedSearchRepository.existsByName).mockResolvedValue(true);

      // Act & Assert
      await expect(searchService.saveSearch(data)).rejects.toThrow(
        'A saved search with this name already exists'
      );
    });

    it('should throw error if user has reached limit', async () => {
      // Arrange
      const data = {
        userId: 'user-123',
        name: 'New Search',
        query: 'test query',
      };

      vi.mocked(mockSavedSearchRepository.existsByName).mockResolvedValue(false);
      vi.mocked(mockSavedSearchRepository.countByUserId).mockResolvedValue(20);

      // Act & Assert
      await expect(searchService.saveSearch(data)).rejects.toThrow(
        'Maximum number of saved searches reached'
      );
    });

    it('should throw error for empty name', async () => {
      // Arrange
      const data = {
        userId: 'user-123',
        name: '',
        query: 'test query',
      };

      // Act & Assert
      await expect(searchService.saveSearch(data)).rejects.toThrow(
        'Search name is required'
      );
    });
  });

  describe('updateSavedSearch', () => {
    it('should update a saved search', async () => {
      // Arrange
      const id = 'saved-1';
      const userId = 'user-123';
      const data = {
        name: 'Updated Search',
        query: 'updated query',
      };

      vi.mocked(mockSavedSearchRepository.existsByName).mockResolvedValue(false);
      vi.mocked(mockSavedSearchRepository.update).mockResolvedValue({
        id,
        userId,
        name: 'Updated Search',
        query: 'updated query',
        filters: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const result = await searchService.updateSavedSearch(id, userId, data);

      // Assert
      expect(mockSavedSearchRepository.existsByName).toHaveBeenCalledWith(
        userId,
        'Updated Search',
        id
      );
      expect(mockSavedSearchRepository.update).toHaveBeenCalledWith(id, userId, data);
      expect(result.name).toBe('Updated Search');
    });
  });

  describe('getSearchHistory', () => {
    it('should retrieve search history for user', async () => {
      // Arrange
      const userId = 'user-123';
      const limit = 10;
      const mockHistory = [
        {
          id: 'history-1',
          userId,
          query: 'test query',
          filters: {},
          resultCount: 5,
          createdAt: new Date(),
        },
      ];

      vi.mocked(mockSearchHistoryRepository.findByUserId).mockResolvedValue(
        mockHistory
      );

      // Act
      const result = await searchService.getSearchHistory(userId, limit);

      // Assert
      expect(mockSearchHistoryRepository.findByUserId).toHaveBeenCalledWith(
        userId,
        limit
      );
      expect(result).toEqual(mockHistory);
    });
  });

  describe('clearSearchHistory', () => {
    it('should clear all search history for user', async () => {
      // Arrange
      const userId = 'user-123';
      vi.mocked(mockSearchHistoryRepository.clearAll).mockResolvedValue({ count: 5 });

      // Act
      const result = await searchService.clearSearchHistory(userId);

      // Assert
      expect(mockSearchHistoryRepository.clearAll).toHaveBeenCalledWith(userId);
      expect(result.count).toBe(5);
    });
  });

  describe('getPopularQueries', () => {
    it('should retrieve popular queries', async () => {
      // Arrange
      const limit = 10;
      const mockQueries = [
        { query: 'popular query', count: 100 },
        { query: 'another query', count: 50 },
      ];

      vi.mocked(mockSearchHistoryRepository.getPopularQueries).mockResolvedValue(
        mockQueries
      );

      // Act
      const result = await searchService.getPopularQueries(limit);

      // Assert
      expect(mockSearchHistoryRepository.getPopularQueries).toHaveBeenCalledWith(limit);
      expect(result).toEqual(mockQueries);
    });
  });
});
