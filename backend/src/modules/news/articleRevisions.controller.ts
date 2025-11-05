import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';
import { ZodError } from 'zod';
import ArticleRevisionService from './articleRevisions.service';
import {
  listRevisionsQuerySchema,
  articleIdParamSchema,
  revisionIdParamSchema,
  compareRevisionsParamsSchema,
  restoreRevisionBodySchema,
  ListRevisionsQuery,
  RestoreRevisionBody,
} from './articleRevisions.validation';
import { BadRequestError, ValidationError } from '@/utils/errors';
import logger from '@/utils/logger';

/**
 * Article Revision Controller
 * Handles HTTP requests for article revision endpoints
 */
export class ArticleRevisionController {
  private service: ArticleRevisionService;

  constructor(service?: ArticleRevisionService) {
    this.service = service || new ArticleRevisionService();
  }

  /**
   * GET /api/v1/articles/:id/revisions
   * Get all revisions for an article
   */
  listRevisions = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role || 'visitor';

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Validate path parameter
      const paramValidation = articleIdParamSchema.safeParse(req.params);

      if (!paramValidation.success) {
        const error = paramValidation.error as ZodError;
        throw new ValidationError(error.issues[0].message);
      }

      const { id: articleId } = paramValidation.data;

      // Validate query parameters
      const queryValidation = listRevisionsQuerySchema.safeParse(req.query);

      if (!queryValidation.success) {
        const error = queryValidation.error as ZodError;
        throw new ValidationError(error.issues[0].message);
      }

      const query: ListRevisionsQuery = queryValidation.data;

      const result = await this.service.getArticleRevisions(
        articleId,
        userId,
        userRole,
        query
      );

      res.status(200).json({
        success: true,
        data: {
          revisions: result.revisions,
          total: result.total,
          hasMore: result.hasMore,
        },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'ArticleRevisionController', method: 'listRevisions' },
        extra: {
          userId: req.user?.id,
          params: req.params,
          query: req.query,
        },
      });
      throw error;
    }
  };

  /**
   * GET /api/v1/articles/:id/revisions/:revisionId
   * Get a specific revision by ID
   */
  getRevision = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role || 'visitor';

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Validate parameters
      const articleIdValidation = articleIdParamSchema.safeParse({
        id: req.params.id,
      });

      if (!articleIdValidation.success) {
        const error = articleIdValidation.error as ZodError;
        throw new ValidationError(error.issues[0].message);
      }

      const revisionIdValidation = revisionIdParamSchema.safeParse({
        revisionId: req.params.revisionId,
      });

      if (!revisionIdValidation.success) {
        const error = revisionIdValidation.error as ZodError;
        throw new ValidationError(error.issues[0].message);
      }

      const { revisionId } = revisionIdValidation.data;

      const revision = await this.service.getRevisionById(
        revisionId,
        userId,
        userRole
      );

      res.status(200).json({
        success: true,
        data: revision,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'ArticleRevisionController', method: 'getRevision' },
        extra: {
          userId: req.user?.id,
          params: req.params,
        },
      });
      throw error;
    }
  };

  /**
   * GET /api/v1/articles/:id/revisions/compare/:fromRevision/:toRevision
   * Compare two revisions and show differences
   */
  compareRevisions = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role || 'visitor';

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Validate parameters
      const paramValidation = compareRevisionsParamsSchema.safeParse(req.params);

      if (!paramValidation.success) {
        const error = paramValidation.error as ZodError;
        throw new ValidationError(error.issues[0].message);
      }

      const { id: articleId, fromRevision, toRevision } = paramValidation.data;

      const result = await this.service.compareRevisions(
        articleId,
        fromRevision,
        toRevision,
        userId,
        userRole
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'ArticleRevisionController', method: 'compareRevisions' },
        extra: {
          userId: req.user?.id,
          params: req.params,
        },
      });
      throw error;
    }
  };

  /**
   * POST /api/v1/articles/:id/revisions/:revisionId/restore
   * Restore an article to a specific revision
   */
  restoreRevision = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role || 'visitor';

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Validate path parameters
      const articleIdValidation = articleIdParamSchema.safeParse({
        id: req.params.id,
      });

      if (!articleIdValidation.success) {
        const error = articleIdValidation.error as ZodError;
        throw new ValidationError(error.issues[0].message);
      }

      const revisionIdValidation = revisionIdParamSchema.safeParse({
        revisionId: req.params.revisionId,
      });

      if (!revisionIdValidation.success) {
        const error = revisionIdValidation.error as ZodError;
        throw new ValidationError(error.issues[0].message);
      }

      const { id: articleId } = articleIdValidation.data;
      const { revisionId } = revisionIdValidation.data;

      // Validate body
      const bodyValidation = restoreRevisionBodySchema.safeParse(req.body);

      if (!bodyValidation.success) {
        const error = bodyValidation.error as ZodError;
        throw new ValidationError(error.issues[0].message);
      }

      const data: RestoreRevisionBody = bodyValidation.data;

      logger.info(
        `User ${userId} restoring article ${articleId} to revision ${revisionId}`
      );

      const article = await this.service.restoreRevision(
        articleId,
        revisionId,
        userId,
        userRole,
        data.changeSummary
      );

      res.status(200).json({
        success: true,
        data: article,
        message: 'Article restored successfully',
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'ArticleRevisionController', method: 'restoreRevision' },
        extra: {
          userId: req.user?.id,
          params: req.params,
          body: req.body,
        },
      });
      throw error;
    }
  };
}

export default ArticleRevisionController;
