import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BookmarkService } from '../bookmarks.service';
import { BookmarkRepository } from '../bookmarks.repository';
import { ArticleRepository } from '../articles.repository';
import { PrismaClient } from '@prisma/client';
import { NotFoundError, ConflictError, BadRequestError } from '@/utils/errors';

// Mock dependencies
vi.mock('../bookmarks.repository');
vi.mock('../articles.repository');
vi.mock('@prisma/client');

describe('BookmarkService', () => {
  let service: BookmarkService;
  let mockBookmarkRepo: vi.Mocked<BookmarkRepository>;
  let mockArticleRepo: vi.Mocked<ArticleRepository>;
  let mockPrisma: vi.Mocked<PrismaClient>;

  beforeEach(() => {
    mockBookmarkRepo = {
      findBookmarkByUserAndArticle: vi.fn(),
      countBookmarksByUser: vi.fn(),
      findDefaultCollection: vi.fn(),
      createBookmarkCollection: vi.fn(),
      findCollectionById: vi.fn(),
      createBookmark: vi.fn(),
    } as any;

    mockArticleRepo = {
      findBySlug: vi.fn(),
    } as any;

    mockPrisma = {
      $transaction: vi.fn(),
    } as any;

    service = new BookmarkService(mockBookmarkRepo, mockArticleRepo, mockPrisma);
  });

  describe('createBookmark', () => {
    it('should throw NotFoundError if article does not exist', async () => {
      mockArticleRepo.findBySlug.mockResolvedValue(null);

      await expect(
        service.createBookmark('non-existent', 'user-id', {})
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw BadRequestError if article is not published', async () => {
      mockArticleRepo.findBySlug.mockResolvedValue({
        id: 'article-id',
        status: 'draft',
      } as any);

      await expect(
        service.createBookmark('draft-article', 'user-id', {})
      ).rejects.toThrow(BadRequestError);
    });

    it('should throw ConflictError if bookmark already exists', async () => {
      mockArticleRepo.findBySlug.mockResolvedValue({
        id: 'article-id',
        status: 'published',
      } as any);

      mockBookmarkRepo.findBookmarkByUserAndArticle.mockResolvedValue({
        id: 'existing-bookmark',
      } as any);

      await expect(
        service.createBookmark('article-slug', 'user-id', {})
      ).rejects.toThrow(ConflictError);
    });

    it('should throw BadRequestError if user has reached max bookmarks', async () => {
      mockArticleRepo.findBySlug.mockResolvedValue({
        id: 'article-id',
        status: 'published',
      } as any);

      mockBookmarkRepo.findBookmarkByUserAndArticle.mockResolvedValue(null);
      mockBookmarkRepo.countBookmarksByUser.mockResolvedValue(500);

      await expect(
        service.createBookmark('article-slug', 'user-id', {})
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('deleteBookmark', () => {
    it('should throw NotFoundError if article does not exist', async () => {
      mockArticleRepo.findBySlug.mockResolvedValue(null);

      await expect(
        service.deleteBookmark('non-existent', 'user-id')
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError if bookmark does not exist', async () => {
      mockArticleRepo.findBySlug.mockResolvedValue({
        id: 'article-id',
        status: 'published',
      } as any);

      mockBookmarkRepo.findBookmarkByUserAndArticle.mockResolvedValue(null);

      await expect(
        service.deleteBookmark('article-slug', 'user-id')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('listUserBookmarks', () => {
    it('should return paginated bookmarks', async () => {
      const mockBookmarks = [
        { id: '1', userId: 'user-id', articleId: 'article-1' },
        { id: '2', userId: 'user-id', articleId: 'article-2' },
      ];

      mockBookmarkRepo.findUserBookmarks = vi.fn().mockResolvedValue({
        bookmarks: mockBookmarks,
        total: 2,
      });

      const result = await service.listUserBookmarks('user-id', {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(result.bookmarks).toEqual(mockBookmarks);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      });
    });
  });
});
