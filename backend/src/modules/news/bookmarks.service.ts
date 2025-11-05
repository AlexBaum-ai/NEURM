import { Bookmark, BookmarkCollection, PrismaClient } from '@prisma/client';
import * as Sentry from '@sentry/node';
import BookmarkRepository from './bookmarks.repository';
import ArticleRepository from './articles.repository';
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
} from '@/utils/errors';
import logger from '@/utils/logger';
import {
  CreateBookmarkInput,
  UpdateBookmarkInput,
  CreateBookmarkCollectionInput,
  UpdateBookmarkCollectionInput,
  ListBookmarksQuery,
} from './bookmarks.validation';

/**
 * BookmarkService
 * Business logic for bookmarks and collections
 */
export class BookmarkService {
  private bookmarkRepo: BookmarkRepository;
  private articleRepo: ArticleRepository;
  private prisma: PrismaClient;

  // Constants
  private readonly MAX_BOOKMARKS_PER_USER = 500;
  private readonly DEFAULT_COLLECTION_NAME = 'Read Later';

  constructor(
    bookmarkRepo?: BookmarkRepository,
    articleRepo?: ArticleRepository,
    prisma?: PrismaClient
  ) {
    this.prisma = prisma || new PrismaClient();
    this.bookmarkRepo = bookmarkRepo || new BookmarkRepository(this.prisma);
    this.articleRepo = articleRepo || new ArticleRepository();
  }

  // ============================================================================
  // BOOKMARK OPERATIONS
  // ============================================================================

  /**
   * Create a bookmark for an article
   * Enforces max 500 bookmarks per user
   * Automatically creates "Read Later" collection on first bookmark
   */
  async createBookmark(
    slug: string,
    userId: string,
    data: CreateBookmarkInput
  ): Promise<Bookmark> {
    try {
      // Find article by slug
      const article = await this.articleRepo.findBySlug(slug);

      if (!article) {
        throw new NotFoundError('Article not found');
      }

      // Check if article is published
      if (article.status !== 'published') {
        throw new BadRequestError('Cannot bookmark unpublished articles');
      }

      // Check if bookmark already exists
      const existingBookmark = await this.bookmarkRepo.findBookmarkByUserAndArticle(
        userId,
        article.id
      );

      if (existingBookmark) {
        throw new ConflictError('Article is already bookmarked');
      }

      // Check bookmark limit
      const bookmarkCount = await this.bookmarkRepo.countBookmarksByUser(userId);

      if (bookmarkCount >= this.MAX_BOOKMARKS_PER_USER) {
        throw new BadRequestError(
          `Maximum ${this.MAX_BOOKMARKS_PER_USER} bookmarks per user reached`
        );
      }

      // Get or create default collection if no collection specified
      let collectionId = data.collectionId;

      if (!collectionId) {
        const defaultCollection = await this.getOrCreateDefaultCollection(userId);
        collectionId = defaultCollection.id;
      } else {
        // Verify collection belongs to user
        const collection = await this.bookmarkRepo.findCollectionById(collectionId);

        if (!collection) {
          throw new NotFoundError('Bookmark collection not found');
        }

        if (collection.userId !== userId) {
          throw new ForbiddenError('Collection does not belong to user');
        }
      }

      // Create bookmark in transaction to update bookmark count
      const bookmark = await this.prisma.$transaction(async (tx) => {
        // Create bookmark
        const newBookmark = await tx.bookmark.create({
          data: {
            userId,
            articleId: article.id,
            collectionId,
            notes: data.notes,
          },
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

        // Increment bookmark count on article
        await tx.article.update({
          where: { id: article.id },
          data: {
            bookmarkCount: {
              increment: 1,
            },
          },
        });

        return newBookmark;
      });

      logger.info(`User ${userId} bookmarked article ${article.id}`);

      return bookmark;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'BookmarkService', method: 'createBookmark' },
        extra: { slug, userId, data },
      });
      throw error;
    }
  }

  /**
   * Remove a bookmark
   */
  async deleteBookmark(slug: string, userId: string): Promise<void> {
    try {
      // Find article by slug
      const article = await this.articleRepo.findBySlug(slug);

      if (!article) {
        throw new NotFoundError('Article not found');
      }

      // Check if bookmark exists
      const bookmark = await this.bookmarkRepo.findBookmarkByUserAndArticle(
        userId,
        article.id
      );

      if (!bookmark) {
        throw new NotFoundError('Bookmark not found');
      }

      // Delete bookmark in transaction to update bookmark count
      await this.prisma.$transaction(async (tx) => {
        // Delete bookmark
        await tx.bookmark.delete({
          where: {
            userId_articleId: {
              userId,
              articleId: article.id,
            },
          },
        });

        // Decrement bookmark count on article (prevent negative)
        await tx.article.update({
          where: { id: article.id },
          data: {
            bookmarkCount: {
              decrement: 1,
            },
          },
        });
      });

      logger.info(`User ${userId} removed bookmark for article ${article.id}`);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'BookmarkService', method: 'deleteBookmark' },
        extra: { slug, userId },
      });
      throw error;
    }
  }

  /**
   * Update bookmark (collection or notes)
   */
  async updateBookmark(
    id: string,
    userId: string,
    data: UpdateBookmarkInput
  ): Promise<Bookmark> {
    try {
      // Find bookmark
      const bookmark = await this.bookmarkRepo.findBookmarkById(id);

      if (!bookmark) {
        throw new NotFoundError('Bookmark not found');
      }

      // Check ownership
      if (bookmark.userId !== userId) {
        throw new ForbiddenError('Bookmark does not belong to user');
      }

      // If changing collection, verify it exists and belongs to user
      if (data.collectionId !== undefined && data.collectionId !== null) {
        const collection = await this.bookmarkRepo.findCollectionById(data.collectionId);

        if (!collection) {
          throw new NotFoundError('Bookmark collection not found');
        }

        if (collection.userId !== userId) {
          throw new ForbiddenError('Collection does not belong to user');
        }
      }

      // Update bookmark
      const updatedBookmark = await this.bookmarkRepo.updateBookmark(id, data);

      logger.info(`User ${userId} updated bookmark ${id}`);

      return updatedBookmark;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'BookmarkService', method: 'updateBookmark' },
        extra: { id, userId, data },
      });
      throw error;
    }
  }

  /**
   * List user bookmarks with pagination
   */
  async listUserBookmarks(userId: string, query: ListBookmarksQuery) {
    try {
      // If collection ID provided, verify it belongs to user
      if (query.collectionId) {
        const collection = await this.bookmarkRepo.findCollectionById(query.collectionId);

        if (!collection) {
          throw new NotFoundError('Bookmark collection not found');
        }

        if (collection.userId !== userId) {
          throw new ForbiddenError('Collection does not belong to user');
        }
      }

      const { bookmarks, total } = await this.bookmarkRepo.findUserBookmarks({
        userId,
        collectionId: query.collectionId,
        page: query.page,
        limit: query.limit,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        search: query.search,
      });

      const totalPages = Math.ceil(total / query.limit);

      return {
        bookmarks,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'BookmarkService', method: 'listUserBookmarks' },
        extra: { userId, query },
      });
      throw error;
    }
  }

  // ============================================================================
  // BOOKMARK COLLECTION OPERATIONS
  // ============================================================================

  /**
   * Create a bookmark collection
   */
  async createBookmarkCollection(
    userId: string,
    data: CreateBookmarkCollectionInput
  ): Promise<BookmarkCollection> {
    try {
      // Check for duplicate collection name (case-insensitive)
      const existing = await this.bookmarkRepo.findCollectionByUserAndName(
        userId,
        data.name
      );

      if (existing) {
        throw new ConflictError('A collection with this name already exists');
      }

      // Create collection
      const collection = await this.bookmarkRepo.createBookmarkCollection({
        userId,
        name: data.name,
        description: data.description,
        isDefault: false,
      });

      logger.info(`User ${userId} created bookmark collection: ${data.name}`);

      return collection;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'BookmarkService', method: 'createBookmarkCollection' },
        extra: { userId, data },
      });
      throw error;
    }
  }

  /**
   * List user's bookmark collections with counts
   */
  async listUserCollections(userId: string): Promise<BookmarkCollection[]> {
    try {
      // Ensure default collection exists
      await this.getOrCreateDefaultCollection(userId);

      const collections = await this.bookmarkRepo.findUserCollections(userId);

      return collections;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'BookmarkService', method: 'listUserCollections' },
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
    userId: string,
    data: UpdateBookmarkCollectionInput
  ): Promise<BookmarkCollection> {
    try {
      // Find collection
      const collection = await this.bookmarkRepo.findCollectionById(id);

      if (!collection) {
        throw new NotFoundError('Bookmark collection not found');
      }

      // Check ownership
      if (collection.userId !== userId) {
        throw new ForbiddenError('Collection does not belong to user');
      }

      // Cannot rename default collection
      if (collection.isDefault && data.name) {
        throw new BadRequestError('Cannot rename the default "Read Later" collection');
      }

      // Check for duplicate name if renaming
      if (data.name && data.name !== collection.name) {
        const existing = await this.bookmarkRepo.findCollectionByUserAndName(
          userId,
          data.name
        );

        if (existing) {
          throw new ConflictError('A collection with this name already exists');
        }
      }

      // Update collection
      const updatedCollection = await this.bookmarkRepo.updateBookmarkCollection(id, data);

      logger.info(`User ${userId} updated bookmark collection ${id}`);

      return updatedCollection;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'BookmarkService', method: 'updateBookmarkCollection' },
        extra: { id, userId, data },
      });
      throw error;
    }
  }

  /**
   * Delete bookmark collection
   * Cannot delete default collection
   * Bookmarks in collection are moved to "uncategorized" (collectionId = null)
   */
  async deleteBookmarkCollection(id: string, userId: string): Promise<void> {
    try {
      // Find collection
      const collection = await this.bookmarkRepo.findCollectionById(id);

      if (!collection) {
        throw new NotFoundError('Bookmark collection not found');
      }

      // Check ownership
      if (collection.userId !== userId) {
        throw new ForbiddenError('Collection does not belong to user');
      }

      // Cannot delete default collection
      if (collection.isDefault) {
        throw new BadRequestError('Cannot delete the default "Read Later" collection');
      }

      // Delete collection (bookmarks will have collectionId set to null via onDelete: SetNull)
      await this.bookmarkRepo.deleteBookmarkCollection(id);

      logger.info(`User ${userId} deleted bookmark collection ${id}`);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'BookmarkService', method: 'deleteBookmarkCollection' },
        extra: { id, userId },
      });
      throw error;
    }
  }

  /**
   * Get collection by ID (with ownership check)
   */
  async getCollectionById(id: string, userId: string): Promise<BookmarkCollection> {
    try {
      const collection = await this.bookmarkRepo.findCollectionById(id);

      if (!collection) {
        throw new NotFoundError('Bookmark collection not found');
      }

      if (collection.userId !== userId) {
        throw new ForbiddenError('Collection does not belong to user');
      }

      return collection;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'BookmarkService', method: 'getCollectionById' },
        extra: { id, userId },
      });
      throw error;
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Get or create default "Read Later" collection for user
   */
  private async getOrCreateDefaultCollection(
    userId: string
  ): Promise<BookmarkCollection> {
    try {
      // Try to find existing default collection
      let defaultCollection = await this.bookmarkRepo.findDefaultCollection(userId);

      if (!defaultCollection) {
        // Create default collection
        defaultCollection = await this.bookmarkRepo.createBookmarkCollection({
          userId,
          name: this.DEFAULT_COLLECTION_NAME,
          description: 'Default collection for bookmarked articles',
          isDefault: true,
        });

        logger.info(`Created default bookmark collection for user ${userId}`);
      }

      return defaultCollection;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'BookmarkService', method: 'getOrCreateDefaultCollection' },
        extra: { userId },
      });
      throw error;
    }
  }
}

export default BookmarkService;
