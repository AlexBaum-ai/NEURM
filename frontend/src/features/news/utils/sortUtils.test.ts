import { describe, it, expect } from 'vitest';
import { parseSortOption, toSortOption } from './sortUtils';
import type { SortOption } from '../types';

describe('sortUtils', () => {
  describe('parseSortOption', () => {
    it('should parse publishedAt-desc correctly', () => {
      const result = parseSortOption('publishedAt-desc');
      expect(result).toEqual({
        sortBy: 'publishedAt',
        sortOrder: 'desc',
      });
    });

    it('should parse publishedAt-asc correctly', () => {
      const result = parseSortOption('publishedAt-asc');
      expect(result).toEqual({
        sortBy: 'publishedAt',
        sortOrder: 'asc',
      });
    });

    it('should parse viewCount-desc correctly', () => {
      const result = parseSortOption('viewCount-desc');
      expect(result).toEqual({
        sortBy: 'viewCount',
        sortOrder: 'desc',
      });
    });

    it('should parse bookmarkCount-desc correctly', () => {
      const result = parseSortOption('bookmarkCount-desc');
      expect(result).toEqual({
        sortBy: 'bookmarkCount',
        sortOrder: 'desc',
      });
    });

    it('should handle relevance without order', () => {
      const result = parseSortOption('relevance');
      expect(result).toEqual({
        sortBy: 'relevance',
      });
    });
  });

  describe('toSortOption', () => {
    it('should convert backend params to frontend format', () => {
      expect(toSortOption('publishedAt', 'desc')).toBe('publishedAt-desc');
      expect(toSortOption('publishedAt', 'asc')).toBe('publishedAt-asc');
      expect(toSortOption('viewCount', 'desc')).toBe('viewCount-desc');
      expect(toSortOption('bookmarkCount', 'desc')).toBe('bookmarkCount-desc');
    });

    it('should default to desc when order is missing', () => {
      expect(toSortOption('publishedAt')).toBe('publishedAt-desc');
      expect(toSortOption('viewCount')).toBe('viewCount-desc');
    });

    it('should handle relevance', () => {
      expect(toSortOption('relevance')).toBe('relevance');
    });

    it('should return default when sortBy is missing', () => {
      expect(toSortOption()).toBe('publishedAt-desc');
      expect(toSortOption('')).toBe('publishedAt-desc');
    });
  });

  describe('round-trip conversion', () => {
    it('should convert frontend to backend and back', () => {
      const sortOptions: SortOption[] = [
        'publishedAt-desc',
        'publishedAt-asc',
        'viewCount-desc',
        'bookmarkCount-desc',
        'relevance',
      ];

      sortOptions.forEach((option) => {
        const parsed = parseSortOption(option);
        const converted = toSortOption(parsed.sortBy, parsed.sortOrder);
        expect(converted).toBe(option);
      });
    });
  });
});
