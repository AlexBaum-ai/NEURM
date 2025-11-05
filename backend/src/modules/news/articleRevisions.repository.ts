import { ArticleRevision, Prisma } from '@prisma/client';
import * as Sentry from '@sentry/node';
import prisma from '@/config/database';
import logger from '@/utils/logger';

/**
 * Article Revision Repository
 * Handles all database operations for article revisions
 */
export class ArticleRevisionRepository {
  private readonly MAX_REVISIONS_PER_ARTICLE = 20;

  /**
   * Create a new revision for an article
   */
  async create(data: {
    articleId: string;
    title: string;
    content: string;
    summary?: string;
    changedById: string;
    changeSummary?: string;
  }): Promise<ArticleRevision> {
    try {
      // Get the next revision number
      const latestRevision = await prisma.articleRevision.findFirst({
        where: { articleId: data.articleId },
        orderBy: { revisionNumber: 'desc' },
        select: { revisionNumber: true },
      });

      const nextRevisionNumber = (latestRevision?.revisionNumber || 0) + 1;

      // Create the new revision
      const revision = await prisma.articleRevision.create({
        data: {
          articleId: data.articleId,
          revisionNumber: nextRevisionNumber,
          title: data.title,
          content: data.content,
          summary: data.summary || null,
          changedById: data.changedById,
          changeSummary: data.changeSummary || null,
        },
        include: {
          changedBy: {
            select: {
              id: true,
              username: true,
              email: true,
              profile: {
                select: {
                  displayName: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      });

      // Clean up old revisions (keep only last MAX_REVISIONS_PER_ARTICLE)
      await this.cleanupOldRevisions(data.articleId);

      logger.info(
        `Article revision created: ${revision.id} for article ${data.articleId} (revision #${nextRevisionNumber})`
      );

      return revision;
    } catch (error) {
      logger.error('Failed to create article revision:', error);
      Sentry.captureException(error, {
        tags: { repository: 'ArticleRevisionRepository', method: 'create' },
        extra: { data },
      });
      throw error;
    }
  }

  /**
   * Find all revisions for an article
   */
  async findByArticleId(
    articleId: string,
    options?: {
      limit?: number;
      offset?: number;
      includeChangedBy?: boolean;
    }
  ): Promise<ArticleRevision[]> {
    try {
      const { limit = this.MAX_REVISIONS_PER_ARTICLE, offset = 0, includeChangedBy = true } = options || {};

      return await prisma.articleRevision.findMany({
        where: { articleId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: includeChangedBy
          ? {
              changedBy: {
                select: {
                  id: true,
                  username: true,
                  email: true,
                  profile: {
                    select: {
                      displayName: true,
                      avatarUrl: true,
                    },
                  },
                },
              },
            }
          : undefined,
      });
    } catch (error) {
      logger.error(`Failed to find revisions for article ${articleId}:`, error);
      Sentry.captureException(error, {
        tags: { repository: 'ArticleRevisionRepository', method: 'findByArticleId' },
        extra: { articleId, options },
      });
      throw error;
    }
  }

  /**
   * Find a specific revision by ID
   */
  async findById(id: string): Promise<ArticleRevision | null> {
    try {
      return await prisma.articleRevision.findUnique({
        where: { id },
        include: {
          article: {
            select: {
              id: true,
              slug: true,
              title: true,
              authorId: true,
            },
          },
          changedBy: {
            select: {
              id: true,
              username: true,
              email: true,
              profile: {
                select: {
                  displayName: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      logger.error(`Failed to find revision ${id}:`, error);
      Sentry.captureException(error, {
        tags: { repository: 'ArticleRevisionRepository', method: 'findById' },
        extra: { id },
      });
      throw error;
    }
  }

  /**
   * Find a specific revision by article ID and revision number
   */
  async findByArticleIdAndRevisionNumber(
    articleId: string,
    revisionNumber: number
  ): Promise<ArticleRevision | null> {
    try {
      return await prisma.articleRevision.findUnique({
        where: {
          articleId_revisionNumber: {
            articleId,
            revisionNumber,
          },
        },
        include: {
          changedBy: {
            select: {
              id: true,
              username: true,
              email: true,
              profile: {
                select: {
                  displayName: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      logger.error(
        `Failed to find revision ${revisionNumber} for article ${articleId}:`,
        error
      );
      Sentry.captureException(error, {
        tags: { repository: 'ArticleRevisionRepository', method: 'findByArticleIdAndRevisionNumber' },
        extra: { articleId, revisionNumber },
      });
      throw error;
    }
  }

  /**
   * Count revisions for an article
   */
  async countByArticleId(articleId: string): Promise<number> {
    try {
      return await prisma.articleRevision.count({
        where: { articleId },
      });
    } catch (error) {
      logger.error(`Failed to count revisions for article ${articleId}:`, error);
      Sentry.captureException(error, {
        tags: { repository: 'ArticleRevisionRepository', method: 'countByArticleId' },
        extra: { articleId },
      });
      throw error;
    }
  }

  /**
   * Delete old revisions beyond the maximum limit
   */
  private async cleanupOldRevisions(articleId: string): Promise<void> {
    try {
      // Get all revisions for this article, ordered by revision number descending
      const revisions = await prisma.articleRevision.findMany({
        where: { articleId },
        orderBy: { revisionNumber: 'desc' },
        select: { id: true, revisionNumber: true },
      });

      // If we have more than MAX_REVISIONS_PER_ARTICLE, delete the oldest ones
      if (revisions.length > this.MAX_REVISIONS_PER_ARTICLE) {
        const revisionsToDelete = revisions.slice(this.MAX_REVISIONS_PER_ARTICLE);
        const idsToDelete = revisionsToDelete.map((r) => r.id);

        await prisma.articleRevision.deleteMany({
          where: {
            id: { in: idsToDelete },
          },
        });

        logger.info(
          `Cleaned up ${idsToDelete.length} old revisions for article ${articleId}`
        );
      }
    } catch (error) {
      logger.error(`Failed to cleanup old revisions for article ${articleId}:`, error);
      // Don't throw - cleanup is not critical
      Sentry.captureException(error, {
        tags: { repository: 'ArticleRevisionRepository', method: 'cleanupOldRevisions' },
        extra: { articleId },
      });
    }
  }

  /**
   * Get the latest revision for an article
   */
  async findLatestByArticleId(articleId: string): Promise<ArticleRevision | null> {
    try {
      return await prisma.articleRevision.findFirst({
        where: { articleId },
        orderBy: { revisionNumber: 'desc' },
        include: {
          changedBy: {
            select: {
              id: true,
              username: true,
              profile: {
                select: {
                  displayName: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      logger.error(`Failed to find latest revision for article ${articleId}:`, error);
      Sentry.captureException(error, {
        tags: { repository: 'ArticleRevisionRepository', method: 'findLatestByArticleId' },
        extra: { articleId },
      });
      throw error;
    }
  }

  /**
   * Get two consecutive revisions for comparison
   */
  async findTwoConsecutiveRevisions(
    articleId: string,
    fromRevisionNumber: number,
    toRevisionNumber: number
  ): Promise<{ from: ArticleRevision | null; to: ArticleRevision | null }> {
    try {
      const [from, to] = await Promise.all([
        this.findByArticleIdAndRevisionNumber(articleId, fromRevisionNumber),
        this.findByArticleIdAndRevisionNumber(articleId, toRevisionNumber),
      ]);

      return { from, to };
    } catch (error) {
      logger.error(
        `Failed to find consecutive revisions for article ${articleId}:`,
        error
      );
      Sentry.captureException(error, {
        tags: { repository: 'ArticleRevisionRepository', method: 'findTwoConsecutiveRevisions' },
        extra: { articleId, fromRevisionNumber, toRevisionNumber },
      });
      throw error;
    }
  }
}

export default ArticleRevisionRepository;
