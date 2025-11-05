import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { ZodError } from 'zod';
import { BaseController } from '../../../utils/baseController';
import { ReplyService } from '../services/replyService';
import {
  createReplySchema,
  updateReplySchema,
  listRepliesQuerySchema,
  uuidParamSchema,
  topicIdParamSchema,
  acceptAnswerSchema,
} from '../validators/replyValidators';

/**
 * ReplyController
 *
 * Handles HTTP requests for forum reply management:
 * - CRUD operations for replies
 * - Threaded replies (max 3 levels)
 * - Quote functionality
 * - @mention support
 * - Accept answer (question topics)
 * - Edit history (moderators)
 */
@injectable()
export class ReplyController extends BaseController {
  constructor(
    @inject('ReplyService')
    private replyService: ReplyService
  ) {
    super();
  }

  /**
   * POST /api/forum/topics/:topicId/replies
   * Create a new reply
   */
  public createReply = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const { topicId } = topicIdParamSchema.parse(req.params);
      const data = createReplySchema.parse(req.body);
      const userId = req.user!.id;

      const reply = await this.replyService.createReply({
        topicId,
        userId,
        ...data,
      });

      return this.created(res, { reply }, 'Reply created successfully');
    } catch (error) {
      if (error instanceof ZodError) {
        return this.validationError(res, error);
      }
      return this.handleError(res, error);
    }
  });

  /**
   * GET /api/forum/topics/:topicId/replies
   * Get all replies for a topic (nested structure)
   */
  public getRepliesByTopic = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const { topicId } = topicIdParamSchema.parse(req.params);
      const query = listRepliesQuerySchema.parse(req.query);
      const userId = req.user?.id;

      const replies = await this.replyService.getRepliesByTopic(
        topicId,
        { sort: query.sort },
        userId
      );

      const count = replies.length;

      return this.ok(res, { replies, count }, 'Replies retrieved successfully');
    } catch (error) {
      if (error instanceof ZodError) {
        return this.validationError(res, error);
      }
      return this.handleError(res, error);
    }
  });

  /**
   * GET /api/forum/replies/:id
   * Get a single reply by ID
   */
  public getReplyById = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = uuidParamSchema.parse(req.params);
      const userId = req.user?.id;

      const reply = await this.replyService.getReplyById(id, userId);

      return this.ok(res, { reply }, 'Reply retrieved successfully');
    } catch (error) {
      if (error instanceof ZodError) {
        return this.validationError(res, error);
      }
      return this.handleError(res, error);
    }
  });

  /**
   * PUT /api/forum/replies/:id
   * Update a reply (author only, within 15 min or moderator)
   */
  public updateReply = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = uuidParamSchema.parse(req.params);
      const data = updateReplySchema.parse(req.body);
      const userId = req.user!.id;

      const reply = await this.replyService.updateReply(id, userId, data);

      return this.ok(res, { reply }, 'Reply updated successfully');
    } catch (error) {
      if (error instanceof ZodError) {
        return this.validationError(res, error);
      }
      return this.handleError(res, error);
    }
  });

  /**
   * DELETE /api/forum/replies/:id
   * Soft delete a reply (author or moderator)
   */
  public deleteReply = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = uuidParamSchema.parse(req.params);
      const userId = req.user!.id;

      await this.replyService.deleteReply(id, userId);

      return this.ok(res, {}, 'Reply deleted successfully');
    } catch (error) {
      if (error instanceof ZodError) {
        return this.validationError(res, error);
      }
      return this.handleError(res, error);
    }
  });

  /**
   * POST /api/forum/topics/:topicId/accept-answer
   * Mark a reply as accepted answer (topic author only, for questions)
   */
  public acceptAnswer = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const { topicId } = topicIdParamSchema.parse(req.params);
      const { replyId } = acceptAnswerSchema.parse(req.body);
      const userId = req.user!.id;

      await this.replyService.markAsAcceptedAnswer(topicId, replyId, userId);

      return this.ok(res, {}, 'Answer accepted successfully');
    } catch (error) {
      if (error instanceof ZodError) {
        return this.validationError(res, error);
      }
      return this.handleError(res, error);
    }
  });

  /**
   * DELETE /api/forum/topics/:topicId/accept-answer
   * Remove accepted answer mark
   */
  public removeAcceptedAnswer = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const { topicId } = topicIdParamSchema.parse(req.params);
      const userId = req.user!.id;

      await this.replyService.removeAcceptedAnswer(topicId, userId);

      return this.ok(res, {}, 'Accepted answer removed successfully');
    } catch (error) {
      if (error instanceof ZodError) {
        return this.validationError(res, error);
      }
      return this.handleError(res, error);
    }
  });

  /**
   * GET /api/forum/replies/:id/edit-history
   * Get edit history for a reply (moderators only)
   */
  public getEditHistory = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = uuidParamSchema.parse(req.params);
      const userId = req.user!.id;

      const history = await this.replyService.getEditHistory(id, userId);

      return this.ok(res, { history, count: history.length }, 'Edit history retrieved successfully');
    } catch (error) {
      if (error instanceof ZodError) {
        return this.validationError(res, error);
      }
      return this.handleError(res, error);
    }
  });
}
