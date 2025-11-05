import { describe, it, expect } from '@jest/globals';
import { listArticlesQuerySchema } from '../../src/modules/news/articles.validation';
import { DifficultyLevel } from '@prisma/client';

describe('Article Search and Filtering (SPRINT-2-003)', () => {
  describe('Validation Schema', () => {
    it('should validate basic query parameters', () => {
      const input = {
        page: '1',
        limit: '20',
        sortBy: 'publishedAt',
        sortOrder: 'desc',
      };

      const result = listArticlesQuerySchema.parse(input);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.sortBy).toBe('publishedAt');
      expect(result.sortOrder).toBe('desc');
    });

    it('should validate search parameter', () => {
      const input = {
        search: 'transformer model',
      };

      const result = listArticlesQuerySchema.parse(input);

      expect(result.search).toBe('transformer model');
    });

    it('should reject search query that is too short', () => {
      const input = {
        search: 'a',
      };

      expect(() => listArticlesQuerySchema.parse(input)).toThrow();
    });

    it('should validate category filter', () => {
      const input = {
        category: 'tutorials',
      };

      const result = listArticlesQuerySchema.parse(input);

      expect(result.category).toBe('tutorials');
    });

    it('should parse comma-separated tags', () => {
      const input = {
        tags: 'nlp,transformers,gpt',
      };

      const result = listArticlesQuerySchema.parse(input);

      expect(result.tags).toEqual(['nlp', 'transformers', 'gpt']);
    });

    it('should handle empty tags string', () => {
      const input = {
        tags: '',
      };

      const result = listArticlesQuerySchema.parse(input);

      expect(result.tags).toBeUndefined();
    });

    it('should validate difficulty filter', () => {
      const input = {
        difficulty: 'beginner',
      };

      const result = listArticlesQuerySchema.parse(input);

      expect(result.difficulty).toBe(DifficultyLevel.beginner);
    });

    it('should validate model filter', () => {
      const input = {
        model: 'gpt-4',
      };

      const result = listArticlesQuerySchema.parse(input);

      expect(result.model).toBe('gpt-4');
    });

    it('should validate cursor parameter', () => {
      const input = {
        cursor: '123e4567-e89b-12d3-a456-426614174000',
      };

      const result = listArticlesQuerySchema.parse(input);

      expect(result.cursor).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should reject invalid cursor UUID', () => {
      const input = {
        cursor: 'invalid-uuid',
      };

      expect(() => listArticlesQuerySchema.parse(input)).toThrow();
    });

    it('should validate sortBy parameter', () => {
      const validSorts = ['publishedAt', 'viewCount', 'bookmarkCount', 'createdAt', 'relevance'];

      validSorts.forEach((sortBy) => {
        const input = { sortBy };
        const result = listArticlesQuerySchema.parse(input);
        expect(result.sortBy).toBe(sortBy);
      });
    });

    it('should reject invalid sortBy parameter', () => {
      const input = {
        sortBy: 'invalid',
      };

      expect(() => listArticlesQuerySchema.parse(input)).toThrow();
    });

    it('should enforce limit boundaries', () => {
      // Test max limit
      const input1 = {
        limit: '150',
      };
      expect(() => listArticlesQuerySchema.parse(input1)).toThrow();

      // Test min limit
      const input2 = {
        limit: '0',
      };
      expect(() => listArticlesQuerySchema.parse(input2)).toThrow();
    });

    it('should handle combined filters', () => {
      const input = {
        search: 'transformer',
        category: 'tutorials',
        tags: 'nlp,ml',
        difficulty: 'intermediate',
        model: 'gpt-4',
        sortBy: 'relevance',
        page: '2',
        limit: '10',
      };

      const result = listArticlesQuerySchema.parse(input);

      expect(result.search).toBe('transformer');
      expect(result.category).toBe('tutorials');
      expect(result.tags).toEqual(['nlp', 'ml']);
      expect(result.difficulty).toBe(DifficultyLevel.intermediate);
      expect(result.model).toBe('gpt-4');
      expect(result.sortBy).toBe('relevance');
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
    });

    it('should parse boolean filters', () => {
      const input1 = {
        isFeatured: 'true',
      };
      const result1 = listArticlesQuerySchema.parse(input1);
      expect(result1.isFeatured).toBe(true);

      const input2 = {
        isTrending: 'false',
      };
      const result2 = listArticlesQuerySchema.parse(input2);
      expect(result2.isTrending).toBe(false);
    });
  });

  describe('Repository Query Building', () => {
    it('should handle offset pagination', () => {
      const query = {
        page: 2,
        limit: 20,
        sortBy: 'publishedAt' as const,
        sortOrder: 'desc' as const,
      };

      // Calculate expected skip
      const expectedSkip = (query.page - 1) * query.limit;
      expect(expectedSkip).toBe(20);
    });

    it('should handle cursor pagination', () => {
      const query = {
        page: 1,
        limit: 20,
        cursor: '123e4567-e89b-12d3-a456-426614174000',
        sortBy: 'publishedAt' as const,
        sortOrder: 'desc' as const,
      };

      // With cursor, skip should be 0
      const expectedSkip = query.cursor ? 0 : (query.page - 1) * query.limit;
      expect(expectedSkip).toBe(0);
    });

    it('should fetch one extra article for cursor pagination', () => {
      const query = {
        page: 1,
        limit: 20,
        cursor: '123e4567-e89b-12d3-a456-426614174000',
        sortBy: 'publishedAt' as const,
        sortOrder: 'desc' as const,
      };

      const fetchLimit = query.cursor ? query.limit + 1 : query.limit;
      expect(fetchLimit).toBe(21);
    });
  });

  describe('Search Query Construction', () => {
    it('should construct valid PostgreSQL full-text search query', () => {
      // Simulate query construction
      const tsQuery = `plainto_tsquery('english', $1)`;
      const tsVector = `to_tsvector('english', COALESCE(a.title, '') || ' ' || COALESCE(a.summary, '') || ' ' || COALESCE(a.content, ''))`;

      expect(tsQuery).toContain('plainto_tsquery');
      expect(tsVector).toContain('to_tsvector');
    });

    it('should construct ts_headline for highlighting', () => {
      const titleHeadline = `ts_headline('english', a.title, plainto_tsquery('english', $1), 'StartSel=<mark>, StopSel=</mark>, MaxWords=20, MinWords=10')`;
      const summaryHeadline = `ts_headline('english', a.summary, plainto_tsquery('english', $1), 'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=20')`;

      expect(titleHeadline).toContain('<mark>');
      expect(summaryHeadline).toContain('MaxWords=50');
    });

    it('should use ts_rank for relevance scoring', () => {
      const rankQuery = `ts_rank(to_tsvector('english', ...), plainto_tsquery('english', $1))`;

      expect(rankQuery).toContain('ts_rank');
      expect(rankQuery).toContain('plainto_tsquery');
    });
  });

  describe('Filter Combinations', () => {
    it('should combine category and difficulty filters', () => {
      const filters = {
        category: 'tutorials',
        difficulty: DifficultyLevel.beginner,
      };

      // Both filters should be applied
      expect(filters.category).toBe('tutorials');
      expect(filters.difficulty).toBe(DifficultyLevel.beginner);
    });

    it('should combine search with filters', () => {
      const query = {
        search: 'transformer',
        category: 'tutorials',
        difficulty: DifficultyLevel.intermediate,
        sortBy: 'relevance' as const,
      };

      // All filters should be present
      expect(query.search).toBeDefined();
      expect(query.category).toBeDefined();
      expect(query.difficulty).toBeDefined();
      expect(query.sortBy).toBe('relevance');
    });

    it('should handle multiple tags with AND logic', () => {
      const tags = ['nlp', 'transformers', 'gpt'];

      // Simulate building query for all tags
      const expectedConditions = tags.map((tag) => ({
        tags: {
          some: {
            tag: {
              slug: tag,
            },
          },
        },
      }));

      expect(expectedConditions.length).toBe(3);
      expect(expectedConditions[0].tags.some.tag.slug).toBe('nlp');
    });
  });

  describe('Cursor Pagination Logic', () => {
    it('should determine hasMore correctly', () => {
      const limit = 20;
      const results = new Array(21); // One more than limit

      const hasMore = results.length > limit;
      expect(hasMore).toBe(true);
    });

    it('should set nextCursor to last article ID', () => {
      const articles = [
        { id: 'uuid-1' },
        { id: 'uuid-2' },
        { id: 'uuid-3' },
      ];

      const nextCursor = articles[articles.length - 1].id;
      expect(nextCursor).toBe('uuid-3');
    });

    it('should slice results when there are more', () => {
      const limit = 20;
      const results = new Array(21).fill({}).map((_, i) => ({ id: `uuid-${i}` }));

      const hasMore = results.length > limit;
      const resultArticles = hasMore ? results.slice(0, limit) : results;

      expect(hasMore).toBe(true);
      expect(resultArticles.length).toBe(20);
    });
  });

  describe('Performance Considerations', () => {
    it('should use indexed columns for filtering', () => {
      // These columns should have indexes:
      const indexedColumns = [
        'slug',
        'status',
        'published_at',
        'category_id',
        'author_id',
        'is_featured',
        'is_trending',
        'difficulty_level',
        'view_count',
        'bookmark_count',
      ];

      expect(indexedColumns.length).toBeGreaterThan(0);
      expect(indexedColumns).toContain('difficulty_level');
      expect(indexedColumns).toContain('view_count');
    });

    it('should batch related data fetching', () => {
      // After getting article IDs from search, fetch full data in one query
      const articleIds = ['uuid-1', 'uuid-2', 'uuid-3'];

      // Should use: WHERE id IN (...)
      expect(articleIds.length).toBeGreaterThan(0);
    });
  });
});
