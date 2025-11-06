import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { ZodError } from 'zod';
import { BaseController } from '@/utils/baseController';
import { ContentModerationService } from '../services/contentModerationService';
import {
  listContentQuerySchema,
  listReportedContentQuerySchema,
  contentParamsSchema,
  approveContentSchema,
  rejectContentSchema,
  hideContentSchema,
  deleteContentSchema,
  bulkActionSchema,
} from '../validators/contentModerationValidators';

/**
 * ContentModerationController
 *
 * Handles HTTP requests for unified content moderation:
 * - List all content for review
 * - List reported content queue
 * - Approve/reject/hide/delete content
 * - Bulk operations
 */
@injectable()
export class ContentModerationController extends BaseController {
  constructor(
    @inject('ContentModerationService')
    private contentModerationService: ContentModerationService
  ) {
    super();
  }

  /**
   * GET /api/admin/content
   * List all content for moderation with filters
   */
  public listContent = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const query = listContentQuerySchema.parse(req.query);
      const user = req.user!;

      const result = await this.contentModerationService.listContent(query, user);

      return this.success(res, result);
    } catch (error) {
      if (error instanceof ZodError) {
        return this.validationError(res, error);
      }
      if (error instanceof Error) {
        if (error.message.includes('permission')) {
          return this.forbidden(res, error.message);
        }
      }
      return this.handleError(res, error);
    }
  });

  /**
   * GET /api/admin/content/reported
   * List reported content queue
   */
  public listReportedContent = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const query = listReportedContentQuerySchema.parse(req.query);
      const user = req.user!;

      const result = await this.contentModerationService.listReportedContent(query, user);

      return this.success(res, result);
    } catch (error) {
      if (error instanceof ZodError) {
        return this.validationError(res, error);
      }
      if (error instanceof Error) {
        if (error.message.includes('permission')) {
          return this.forbidden(res, error.message);
        }
      }
      return this.handleError(res, error);
    }
  });

  /**
   * PUT /api/admin/content/:type/:id/approve
   * Approve content
   */
  public approveContent = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const { type, id } = contentParamsSchema.parse(req.params);
      const data = approveContentSchema.parse(req.body);
      const user = req.user!;

      const result = await this.contentModerationService.approveContent(type, id, data, user);

      return this.success(res, result, result.message);
    } catch (error) {
      if (error instanceof ZodError) {
        return this.validationError(res, error);
      }
      if (error instanceof Error) {
        if (error.message.includes('permission')) {
          return this.forbidden(res, error.message);
        }
        if (error.message.includes('not found')) {
          return this.notFound(res, error.message);
        }
      }
      return this.handleError(res, error);
    }
  });

  /**
   * PUT /api/admin/content/:type/:id/reject
   * Reject content with reason
   */
  public rejectContent = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const { type, id } = contentParamsSchema.parse(req.params);
      const data = rejectContentSchema.parse(req.body);
      const user = req.user!;

      const result = await this.contentModerationService.rejectContent(type, id, data, user);

      return this.success(res, result, result.message);
    } catch (error) {
      if (error instanceof ZodError) {
        return this.validationError(res, error);
      }
      if (error instanceof Error) {
        if (error.message.includes('permission')) {
          return this.forbidden(res, error.message);
        }
        if (error.message.includes('not found')) {
          return this.notFound(res, error.message);
        }
      }
      return this.handleError(res, error);
    }
  });

  /**
   * PUT /api/admin/content/:type/:id/hide
   * Hide content from public view
   */
  public hideContent = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const { type, id } = contentParamsSchema.parse(req.params);
      const data = hideContentSchema.parse(req.body);
      const user = req.user!;

      const result = await this.contentModerationService.hideContent(type, id, data, user);

      return this.success(res, result, result.message);
    } catch (error) {
      if (error instanceof ZodError) {
        return this.validationError(res, error);
      }
      if (error instanceof Error) {
        if (error.message.includes('permission')) {
          return this.forbidden(res, error.message);
        }
        if (error.message.includes('not found')) {
          return this.notFound(res, error.message);
        }
      }
      return this.handleError(res, error);
    }
  });

  /**
   * DELETE /api/admin/content/:type/:id
   * Delete content (soft or hard delete)
   */
  public deleteContent = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const { type, id } = contentParamsSchema.parse(req.params);
      const data = deleteContentSchema.parse(req.body);
      const user = req.user!;

      const result = await this.contentModerationService.deleteContent(type, id, data, user);

      return this.success(res, result, result.message);
    } catch (error) {
      if (error instanceof ZodError) {
        return this.validationError(res, error);
      }
      if (error instanceof Error) {
        if (error.message.includes('permission')) {
          return this.forbidden(res, error.message);
        }
        if (error.message.includes('administrators')) {
          return this.forbidden(res, error.message);
        }
        if (error.message.includes('not found')) {
          return this.notFound(res, error.message);
        }
      }
      return this.handleError(res, error);
    }
  });

  /**
   * POST /api/admin/content/bulk
   * Perform bulk action on multiple content items
   */
  public bulkAction = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const data = bulkActionSchema.parse(req.body);
      const user = req.user!;

      const result = await this.contentModerationService.bulkAction(data, user);

      if (result.success) {
        return this.success(res, result, `Bulk ${data.action} completed successfully`);
      } else {
        return this.success(
          res,
          result,
          `Bulk ${data.action} completed with ${result.failed} failures`
        );
      }
    } catch (error) {
      if (error instanceof ZodError) {
        return this.validationError(res, error);
      }
      if (error instanceof Error) {
        if (error.message.includes('permission')) {
          return this.forbidden(res, error.message);
        }
      }
      return this.handleError(res, error);
    }
  });

  /**
   * Handle errors consistently
   */
  private handleError(res: Response, error: unknown): Response {
    this.captureException(error as Error);
    return this.error(res, 'An error occurred while processing your request', 500);
  }
}
