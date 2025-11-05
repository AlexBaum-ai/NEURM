import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { ZodError } from 'zod';
import { BaseController } from '@/utils/baseController';
import { ModerationService } from '../services/moderationService';
import {
  topicIdParamSchema,
  userIdParamSchema,
  pinTopicSchema,
  lockTopicSchema,
  moveTopicSchema,
  mergeTopicsSchema,
  deleteTopicSchema,
  warnUserSchema,
  suspendUserSchema,
  banUserSchema,
  moderationLogsQuerySchema,
} from '../validators/moderationValidators';

/**
 * ModerationController
 *
 * Handles HTTP requests for moderation operations:
 * - Topic moderation (pin, lock, move, merge, delete)
 * - User moderation (warn, suspend, ban)
 * - Moderation logs
 */
@injectable()
export class ModerationController extends BaseController {
  constructor(
    @inject('ModerationService')
    private moderationService: ModerationService
  ) {
    super();
  }

  /**
   * POST /api/forum/topics/:id/pin
   * Pin or unpin a topic
   */
  public pinTopic = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = topicIdParamSchema.parse(req.params);
      const data = pinTopicSchema.parse(req.body);

      const topic = await this.moderationService.pinTopic(id, data, req.user!);

      return this.success(
        res,
        { topic },
        data.isPinned ? 'Topic pinned successfully' : 'Topic unpinned successfully'
      );
    } catch (error) {
      if (error instanceof ZodError) {
        return this.validationError(res, error);
      }
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return this.notFound(res, error.message);
        }
        if (error.message.includes('permission')) {
          return this.forbidden(res, error.message);
        }
      }
      return this.handleError(res, error);
    }
  });

  /**
   * POST /api/forum/topics/:id/lock
   * Lock or unlock a topic
   */
  public lockTopic = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = topicIdParamSchema.parse(req.params);
      const data = lockTopicSchema.parse(req.body);

      const topic = await this.moderationService.lockTopic(id, data, req.user!);

      return this.success(
        res,
        { topic },
        data.isLocked ? 'Topic locked successfully' : 'Topic unlocked successfully'
      );
    } catch (error) {
      if (error instanceof ZodError) {
        return this.validationError(res, error);
      }
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return this.notFound(res, error.message);
        }
        if (error.message.includes('permission')) {
          return this.forbidden(res, error.message);
        }
      }
      return this.handleError(res, error);
    }
  });

  /**
   * PUT /api/forum/topics/:id/move
   * Move topic to different category
   */
  public moveTopic = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = topicIdParamSchema.parse(req.params);
      const data = moveTopicSchema.parse(req.body);

      const topic = await this.moderationService.moveTopic(id, data, req.user!);

      return this.success(res, { topic }, 'Topic moved successfully');
    } catch (error) {
      if (error instanceof ZodError) {
        return this.validationError(res, error);
      }
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return this.notFound(res, error.message);
        }
        if (error.message.includes('permission')) {
          return this.forbidden(res, error.message);
        }
      }
      return this.handleError(res, error);
    }
  });

  /**
   * POST /api/forum/topics/:id/merge
   * Merge duplicate topics
   */
  public mergeTopics = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = topicIdParamSchema.parse(req.params);
      const data = mergeTopicsSchema.parse(req.body);

      const result = await this.moderationService.mergeTopics(id, data, req.user!);

      return this.success(res, result, 'Topics merged successfully');
    } catch (error) {
      if (error instanceof ZodError) {
        return this.validationError(res, error);
      }
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return this.notFound(res, error.message);
        }
        if (error.message.includes('permission')) {
          return this.forbidden(res, error.message);
        }
        if (error.message.includes('Cannot merge')) {
          return this.badRequest(res, error.message);
        }
      }
      return this.handleError(res, error);
    }
  });

  /**
   * DELETE /api/forum/topics/:id
   * Hard delete topic (admin only)
   */
  public hardDeleteTopic = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = topicIdParamSchema.parse(req.params);
      const { reason } = deleteTopicSchema.parse(req.body);

      const result = await this.moderationService.hardDeleteTopic(id, reason, req.user!);

      return this.success(res, result, 'Topic deleted permanently');
    } catch (error) {
      if (error instanceof ZodError) {
        return this.validationError(res, error);
      }
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return this.notFound(res, error.message);
        }
        if (error.message.includes('administrators')) {
          return this.forbidden(res, error.message);
        }
      }
      return this.handleError(res, error);
    }
  });

  /**
   * POST /api/forum/users/:id/warn
   * Issue warning to user
   */
  public warnUser = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = userIdParamSchema.parse(req.params);
      const data = warnUserSchema.parse(req.body);

      const result = await this.moderationService.warnUser(id, data, req.user!);

      return this.success(res, result, 'Warning issued successfully');
    } catch (error) {
      if (error instanceof ZodError) {
        return this.validationError(res, error);
      }
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return this.notFound(res, error.message);
        }
        if (error.message.includes('cannot') || error.message.includes('Cannot')) {
          return this.forbidden(res, error.message);
        }
        if (error.message.includes('moderators')) {
          return this.forbidden(res, error.message);
        }
      }
      return this.handleError(res, error);
    }
  });

  /**
   * POST /api/forum/users/:id/suspend
   * Suspend user temporarily
   */
  public suspendUser = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = userIdParamSchema.parse(req.params);
      const data = suspendUserSchema.parse(req.body);

      const result = await this.moderationService.suspendUser(id, data, req.user!);

      return this.success(res, result, 'User suspended successfully');
    } catch (error) {
      if (error instanceof ZodError) {
        return this.validationError(res, error);
      }
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return this.notFound(res, error.message);
        }
        if (error.message.includes('cannot') || error.message.includes('Cannot')) {
          return this.forbidden(res, error.message);
        }
        if (error.message.includes('moderators')) {
          return this.forbidden(res, error.message);
        }
      }
      return this.handleError(res, error);
    }
  });

  /**
   * POST /api/forum/users/:id/ban
   * Ban user permanently
   */
  public banUser = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = userIdParamSchema.parse(req.params);
      const data = banUserSchema.parse(req.body);

      const result = await this.moderationService.banUser(id, data, req.user!);

      return this.success(res, result, 'User banned successfully');
    } catch (error) {
      if (error instanceof ZodError) {
        return this.validationError(res, error);
      }
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return this.notFound(res, error.message);
        }
        if (error.message.includes('administrators')) {
          return this.forbidden(res, error.message);
        }
        if (error.message.includes('cannot') || error.message.includes('Cannot')) {
          return this.forbidden(res, error.message);
        }
      }
      return this.handleError(res, error);
    }
  });

  /**
   * GET /api/forum/moderation/logs
   * Get moderation logs with filters
   */
  public getModerationLogs = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const query = moderationLogsQuerySchema.parse(req.query);

      const filters = {
        moderatorId: query.moderatorId,
        action: query.action,
        targetType: query.targetType,
        targetId: query.targetId,
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
      };

      const pagination = {
        page: query.page,
        limit: query.limit,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      };

      const result = await this.moderationService.getModerationLogs(
        filters,
        pagination,
        req.user!
      );

      return this.success(res, result);
    } catch (error) {
      if (error instanceof ZodError) {
        return this.validationError(res, error);
      }
      if (error instanceof Error) {
        if (error.message.includes('moderators')) {
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
