import { PrismaClient, Bookmark, BookmarkCollection, Prisma } from '@prisma/client';
import * as Sentry from '@sentry/node';

/**
 * BookmarkRepository
 * Data access layer for bookmarks and bookmark collections
 */
export class BookmarkRepository {
  private prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
  }

  // ============================================================================
  // BOOKMARK OPERATIONS
  // ============================================================================

  /**
   * Create a bookmark
   */
  async createBookmark(data: {
    userId: string;
    articleId: string;
    collectionId?: string;
    notes?: string;
  }): Promise<Bookmark> {
    try {
      return await this.prisma.bookmark.create({
        data,
        include: {
          article: {
            select: {
              id: true,
              slug: true,
              title: true,
              featuredImageUrl: true,
            },
          },
          collection: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'BookmarkRepository', method: 'createBookmark' },
        extra: { data },
      });
      throw error;
    }
  }

  /**
   * Find bookmark by user and article
   */
  async findBookmarkByUserAndArticle(
    userId: string,
    articleId: string
  ): Promise<Bookmark | null> {
    try {
      return await this.prisma.bookmark.findUnique({
        where: {
          userId_articleId: {
            userId,
            articleId,
          },
        },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'BookmarkRepository', method: 'findBookmarkByUserAndArticle' },
        extra: { userId, articleId },
      });
      throw error;
    }
  }

  /**
   * Delete bookmark by user and article
   */
  async deleteBookmarkByUserAndArticle(
    userId: string,
    articleId: string
  ): Promise<Bookmark> {
    try {
      return await this.prisma.bookmark.delete({
        where: {
          userId_articleId: {
            userId,
            articleId,
          },
        },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'BookmarkRepository', method: 'deleteBookmarkByUserAndArticle' },
        extra: { userId, articleId },
      });
      throw error;
    }
  }

  /**
   * Update bookmark
   */
  async updateBookmark(
    id: string,
    data: {
      collectionId?: string | null;
      notes?: string | null;
    }
  ): Promise<Bookmark> {
    try {
      return await this.prisma.bookmark.update({
        where: { id },
        data,
        include: {
          article: {
            select: {
              id: true,
              slug: true,
              title: true,
              featuredImageUrl: true,
            },
          },
          collection: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'BookmarkRepository', method: 'updateBookmark' },
        extra: { id, data },
      });
      throw error;
    }
  }

  /**
   * Find bookmark by ID
   */
  async findBookmarkById(id: string): Promise<Bookmark | null> {
    try {
      return await this.prisma.bookmark.findUnique({
        where: { id },
        include: {
          article: {
            select: {
              id: true,
              slug: true,
              title: true,
              summary: true,
              featuredImageUrl: true,
              publishedAt: true,
            },
          },
          collection: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'BookmarkRepository', method: 'findBookmarkById' },
        extra: { id },
      });
      throw error;
    }
  }

  /**
   * Count bookmarks by user
   */
  async countBookmarksByUser(userId: string): Promise<number> {
    try {
      return await this.prisma.bookmark.count({
        where: { userId },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'BookmarkRepository', method: 'countBookmarksByUser' },
        extra: { userId },
      });
      throw error;
    }
  }

  /**
   * List user bookmarks with pagination
   */
  async findUserBookmarks(params: {
    userId: string;
    collectionId?: string;
    page: number;
    limit: number;
    sortBy: 'createdAt' | 'title';
    sortOrder: 'asc' | 'desc';
    search?: string;
  }): Promise<{ bookmarks: Bookmark[]; total: number }> {
    try {
      const { userId, collectionId, page, limit, sortBy, sortOrder, search } = params;

      const where: Prisma.BookmarkWhereInput = {
        userId,
        ...(collectionId && { collectionId }),
        ...(search && {
          article: {
            title: {
              contains: search,
              mode: 'insensitive',
            },
          },
        }),
      };

      const orderBy: Prisma.BookmarkOrderByWithRelationInput =
        sortBy === 'title'
          ? { article: { title: sortOrder } }
          : { [sortBy]: sortOrder };

      const [bookmarks, total] = await Promise.all([
        this.prisma.bookmark.findMany({
          where,
          include: {
            article: {
              select: {
                id: true,
                slug: true,
                title: true,
                summary: true,
                featuredImageUrl: true,
                publishedAt: true,
                readingTimeMinutes: true,
                viewCount: true,
                bookmarkCount: true,
                category: {
                  select: {
                    name: true,
                    slug: true,
                  },
                },
              },
            },
            collection: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.prisma.bookmark.count({ where }),
      ]);

      return { bookmarks, total };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'BookmarkRepository', method: 'findUserBookmarks' },
        extra: { params },
      });
      throw error;
    }
  }

  // ============================================================================
  // BOOKMARK COLLECTION OPERATIONS
  // ============================================================================

  /**
   * Create bookmark collection
   */
  async createBookmarkCollection(data: {
    userId: string;
    name: string;
    description?: string;
    isDefault?: boolean;
  }): Promise<BookmarkCollection> {
    try {
      return await this.prisma.bookmarkCollection.create({
        data,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'BookmarkRepository', method: 'createBookmarkCollection' },
        extra: { data },
      });
      throw error;
    }
  }

  /**
   * Find collection by user and name
   */
  async findCollectionByUserAndName(
    userId: string,
    name: string
  ): Promise<BookmarkCollection | null> {
    try {
      return await this.prisma.bookmarkCollection.findFirst({
        where: {
          userId,
          name: {
            equals: name,
            mode: 'insensitive',
          },
        },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'BookmarkRepository', method: 'findCollectionByUserAndName' },
        extra: { userId, name },
      });
      throw error;
    }
  }

  /**
   * Find default collection for user
   */
  async findDefaultCollection(userId: string): Promise<BookmarkCollection | null> {
    try {
      return await this.prisma.bookmarkCollection.findFirst({
        where: {
          userId,
          isDefault: true,
        },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'BookmarkRepository', method: 'findDefaultCollection' },
        extra: { userId },
      });
      throw error;
    }
  }

  /**
   * Find collection by ID
   */
  async findCollectionById(id: string): Promise<BookmarkCollection | null> {
    try {
      return await this.prisma.bookmarkCollection.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              bookmarks: true,
            },
          },
        },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'BookmarkRepository', method: 'findCollectionById' },
        extra: { id },
      });
      throw error;
    }
  }

  /**
   * List user collections with bookmark counts
   */
  async findUserCollections(userId: string): Promise<BookmarkCollection[]> {
    try {
      return await this.prisma.bookmarkCollection.findMany({
        where: { userId },
        include: {
          _count: {
            select: {
              bookmarks: true,
            },
          },
        },
        orderBy: [
          { isDefault: 'desc' }, // Default collection first
          { createdAt: 'desc' },
        ],
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'BookmarkRepository', method: 'findUserCollections' },
        extra: { userId },
      });
      throw error;
    }
  }

  /**
   * Update bookmark collection
   */
  async updateBookmarkCollection(
    id: string,
    data: {
      name?: string;
      description?: string | null;
    }
  ): Promise<BookmarkCollection> {
    try {
      return await this.prisma.bookmarkCollection.update({
        where: { id },
        data,
        include: {
          _count: {
            select: {
              bookmarks: true,
            },
          },
        },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'BookmarkRepository', method: 'updateBookmarkCollection' },
        extra: { id, data },
      });
      throw error;
    }
  }

  /**
   * Delete bookmark collection
   */
  async deleteBookmarkCollection(id: string): Promise<BookmarkCollection> {
    try {
      return await this.prisma.bookmarkCollection.delete({
        where: { id },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'BookmarkRepository', method: 'deleteBookmarkCollection' },
        extra: { id },
      });
      throw error;
    }
  }

  /**
   * Count collections by user
   */
  async countCollectionsByUser(userId: string): Promise<number> {
    try {
      return await this.prisma.bookmarkCollection.count({
        where: { userId },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { repository: 'BookmarkRepository', method: 'countCollectionsByUser' },
        extra: { userId },
      });
      throw error;
    }
  }
}

export default BookmarkRepository;
