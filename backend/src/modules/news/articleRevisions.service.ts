import { Article, ArticleRevision } from '@prisma/client';
import * as Sentry from '@sentry/node';
import * as Diff from 'diff';
import ArticleRevisionRepository from './articleRevisions.repository';
import ArticleRepository from './articles.repository';
import logger from '@/utils/logger';
import { NotFoundError, ForbiddenError, BadRequestError } from '@/utils/errors';

/**
 * Article Revision Service
 * Handles business logic for article revisions including diff generation
 */
export class ArticleRevisionService {
  private revisionRepository: ArticleRevisionRepository;
  private articleRepository: ArticleRepository;

  constructor(
    revisionRepository?: ArticleRevisionRepository,
    articleRepository?: ArticleRepository
  ) {
    this.revisionRepository = revisionRepository || new ArticleRevisionRepository();
    this.articleRepository = articleRepository || new ArticleRepository();
  }

  /**
   * Create a revision snapshot when article is created or updated
   */
  async createRevisionSnapshot(
    articleId: string,
    data: {
      title: string;
      content: string;
      summary?: string;
    },
    changedById: string,
    changeSummary?: string
  ): Promise<ArticleRevision> {
    try {
      const revision = await this.revisionRepository.create({
        articleId,
        title: data.title,
        content: data.content,
        summary: data.summary,
        changedById,
        changeSummary,
      });

      logger.info(`Revision snapshot created for article ${articleId}`);

      return revision;
    } catch (error) {
      logger.error('Failed to create revision snapshot:', error);
      Sentry.captureException(error, {
        tags: { service: 'ArticleRevisionService', method: 'createRevisionSnapshot' },
        extra: { articleId, changedById },
      });
      throw error;
    }
  }

  /**
   * Get all revisions for an article
   */
  async getArticleRevisions(
    articleId: string,
    userId: string,
    userRole: string,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<{
    revisions: ArticleRevision[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      // Check if article exists
      const article = await this.articleRepository.findById(articleId);

      if (!article) {
        throw new NotFoundError(`Article with ID "${articleId}" not found`);
      }

      // Check permissions (admin can view all, authors can view their own)
      await this.checkReadPermission(article, userId, userRole);

      const [revisions, total] = await Promise.all([
        this.revisionRepository.findByArticleId(articleId, options),
        this.revisionRepository.countByArticleId(articleId),
      ]);

      const { limit = 20, offset = 0 } = options || {};
      const hasMore = offset + revisions.length < total;

      return {
        revisions,
        total,
        hasMore,
      };
    } catch (error) {
      logger.error(`Failed to get revisions for article ${articleId}:`, error);
      Sentry.captureException(error, {
        tags: { service: 'ArticleRevisionService', method: 'getArticleRevisions' },
        extra: { articleId, userId, options },
      });
      throw error;
    }
  }

  /**
   * Get a specific revision by ID
   */
  async getRevisionById(
    revisionId: string,
    userId: string,
    userRole: string
  ): Promise<ArticleRevision> {
    try {
      const revision = await this.revisionRepository.findById(revisionId);

      if (!revision) {
        throw new NotFoundError(`Revision with ID "${revisionId}" not found`);
      }

      // Check permissions
      await this.checkReadPermission(
        revision.article as any,
        userId,
        userRole
      );

      return revision;
    } catch (error) {
      logger.error(`Failed to get revision ${revisionId}:`, error);
      Sentry.captureException(error, {
        tags: { service: 'ArticleRevisionService', method: 'getRevisionById' },
        extra: { revisionId, userId },
      });
      throw error;
    }
  }

  /**
   * Compare two revisions and generate diff
   */
  async compareRevisions(
    articleId: string,
    fromRevisionNumber: number,
    toRevisionNumber: number,
    userId: string,
    userRole: string
  ): Promise<{
    from: ArticleRevision;
    to: ArticleRevision;
    diff: {
      title: Diff.Change[];
      content: Diff.Change[];
      summary: Diff.Change[];
    };
  }> {
    try {
      // Validate revision order
      if (fromRevisionNumber >= toRevisionNumber) {
        throw new BadRequestError(
          'From revision must be earlier than to revision'
        );
      }

      // Check if article exists and user has permission
      const article = await this.articleRepository.findById(articleId);
      if (!article) {
        throw new NotFoundError(`Article with ID "${articleId}" not found`);
      }

      await this.checkReadPermission(article, userId, userRole);

      // Get the two revisions
      const { from, to } = await this.revisionRepository.findTwoConsecutiveRevisions(
        articleId,
        fromRevisionNumber,
        toRevisionNumber
      );

      if (!from) {
        throw new NotFoundError(
          `Revision #${fromRevisionNumber} not found for article ${articleId}`
        );
      }

      if (!to) {
        throw new NotFoundError(
          `Revision #${toRevisionNumber} not found for article ${articleId}`
        );
      }

      // Generate diffs
      const diff = {
        title: Diff.diffWords(from.title, to.title),
        content: Diff.diffSentences(from.content, to.content),
        summary: Diff.diffWords(from.summary || '', to.summary || ''),
      };

      return {
        from,
        to,
        diff,
      };
    } catch (error) {
      logger.error(
        `Failed to compare revisions for article ${articleId}:`,
        error
      );
      Sentry.captureException(error, {
        tags: { service: 'ArticleRevisionService', method: 'compareRevisions' },
        extra: { articleId, fromRevisionNumber, toRevisionNumber, userId },
      });
      throw error;
    }
  }

  /**
   * Restore an article to a specific revision
   */
  async restoreRevision(
    articleId: string,
    revisionId: string,
    userId: string,
    userRole: string,
    changeSummary?: string
  ): Promise<Article> {
    try {
      // Get the article
      const article = await this.articleRepository.findById(articleId);

      if (!article) {
        throw new NotFoundError(`Article with ID "${articleId}" not found`);
      }

      // Check write permission (only admin or article author)
      await this.checkWritePermission(article, userId, userRole);

      // Get the revision to restore
      const revision = await this.revisionRepository.findById(revisionId);

      if (!revision) {
        throw new NotFoundError(`Revision with ID "${revisionId}" not found`);
      }

      if (revision.articleId !== articleId) {
        throw new BadRequestError(
          'Revision does not belong to the specified article'
        );
      }

      // Update the article with revision data
      const updatedArticle = await this.articleRepository.update(
        articleId,
        {
          title: revision.title,
          content: revision.content,
          summary: revision.summary || undefined,
        },
        userId
      );

      // Create a new revision to track the restore action
      await this.createRevisionSnapshot(
        articleId,
        {
          title: revision.title,
          content: revision.content,
          summary: revision.summary || undefined,
        },
        userId,
        changeSummary || `Restored to revision #${revision.revisionNumber}`
      );

      logger.info(
        `Article ${articleId} restored to revision ${revisionId} by user ${userId}`
      );

      return updatedArticle;
    } catch (error) {
      logger.error(
        `Failed to restore article ${articleId} to revision ${revisionId}:`,
        error
      );
      Sentry.captureException(error, {
        tags: { service: 'ArticleRevisionService', method: 'restoreRevision' },
        extra: { articleId, revisionId, userId },
      });
      throw error;
    }
  }

  /**
   * Get the latest revision for an article
   */
  async getLatestRevision(articleId: string): Promise<ArticleRevision | null> {
    try {
      return await this.revisionRepository.findLatestByArticleId(articleId);
    } catch (error) {
      logger.error(`Failed to get latest revision for article ${articleId}:`, error);
      Sentry.captureException(error, {
        tags: { service: 'ArticleRevisionService', method: 'getLatestRevision' },
        extra: { articleId },
      });
      throw error;
    }
  }

  /**
   * Check if user has permission to read revisions
   */
  private async checkReadPermission(
    article: Pick<Article, 'id' | 'authorId'>,
    userId: string,
    userRole: string
  ): Promise<void> {
    // Admin can view all revisions
    if (userRole === 'admin' || userRole === 'moderator') {
      return;
    }

    // Authors can view their own article revisions
    if (article.authorId === userId) {
      return;
    }

    throw new ForbiddenError(
      'You do not have permission to view revisions for this article'
    );
  }

  /**
   * Check if user has permission to restore revisions
   */
  private async checkWritePermission(
    article: Pick<Article, 'id' | 'authorId'>,
    userId: string,
    userRole: string
  ): Promise<void> {
    // Admin can restore any article
    if (userRole === 'admin') {
      return;
    }

    // Authors can restore their own articles
    if (article.authorId === userId) {
      return;
    }

    throw new ForbiddenError(
      'You do not have permission to restore revisions for this article'
    );
  }
}

export default ArticleRevisionService;
