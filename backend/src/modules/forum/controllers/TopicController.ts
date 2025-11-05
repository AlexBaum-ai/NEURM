import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { ZodError } from 'zod';
import { BaseController } from '../../../utils/baseController';
import { TopicService } from '../services/topicService';
import {
  createTopicSchema,
  updateTopicSchema,
  listTopicsQuerySchema,
  topicIdParamSchema,
  pinTopicSchema,
  lockTopicSchema,
} from '../validators/topicValidators';

/**
 * TopicController
 *
 * Handles HTTP requests for forum topic management:
 * - CRUD operations for topics
 * - Topic filtering and pagination
 * - Pin/lock topics (moderator only)
 * - Draft management
 */
@injectable()
export class TopicController extends BaseController {
  constructor(
    @inject('TopicService')
    private topicService: TopicService
  ) {
    super();
  }

  /**
   * POST /api/forum/topics
   * Create a new topic
   */
  public createTopic = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const data = createTopicSchema.parse(req.body);
      const userId = req.user!.id;

      const topic = await this.topicService.createTopic(userId, data);

      return this.created(res, { topic }, 'Topic created successfully');
    } catch (error) {
      if (error instanceof ZodError) {
        return this.validationError(res, error);
      }
      return this.handleError(res, error);
    }
  });

  /**
   * GET /api/forum/topics
   * List topics with filters and pagination
   */
  public listTopics = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const query = listTopicsQuerySchema.parse(req.query);

      const filters = {
        categoryId: query.categoryId,
        type: query.type,
        status: query.status,
        authorId: query.authorId,
        tag: query.tag,
        search: query.search,
        isDraft: query.includeDrafts ? undefined : false,
      };

      const pagination = {
        page: query.page,
        limit: query.limit,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      };

      const result = await this.topicService.listTopics(filters, pagination, req.user);

      return this.success(res, result);
    } catch (error) {
      if (error instanceof ZodError) {
        return this.validationError(res, error);
      }
      return this.handleError(res, error);
    }
  });

  /**
   * GET /api/forum/topics/:id
   * Get single topic by ID with replies
   */
  public getTopicById = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = topicIdParamSchema.parse(req.params);
      const userId = req.user?.id;

      const topic = await this.topicService.getTopicById(id, userId);

      return this.success(res, { topic });
    } catch (error) {
      if (error instanceof ZodError) {
        return this.validationError(res, error);
      }
      if (error instanceof Error && error.message === 'Topic not found') {
        return this.notFound(res, 'Topic not found');
      }
      return this.handleError(res, error);
    }
  });

  /**
   * PUT /api/forum/topics/:id
   * Update topic (author or moderator)
   */
  public updateTopic = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = topicIdParamSchema.parse(req.params);
      const data = updateTopicSchema.parse(req.body);
      const userId = req.user!.id;

      const topic = await this.topicService.updateTopic(id, userId, data, req.user!);

      return this.success(res, { topic }, 'Topic updated successfully');
    } catch (error) {
      if (error instanceof ZodError) {
        return this.validationError(res, error);
      }
      if (error instanceof Error && error.message === 'Topic not found') {
        return this.notFound(res, 'Topic not found');
      }
      if (
        error instanceof Error &&
        error.message.includes('permission')
      ) {
        return this.forbidden(res, error.message);
      }
      return this.handleError(res, error);
    }
  });

  /**
   * DELETE /api/forum/topics/:id
   * Soft delete topic (author or moderator)
   */
  public deleteTopic = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = topicIdParamSchema.parse(req.params);
      const userId = req.user!.id;

      await this.topicService.deleteTopic(id, userId, req.user!);

      return this.success(res, null, 'Topic deleted successfully');
    } catch (error) {
      if (error instanceof ZodError) {
        return this.validationError(res, error);
      }
      if (error instanceof Error && error.message === 'Topic not found') {
        return this.notFound(res, 'Topic not found');
      }
      if (
        error instanceof Error &&
        error.message.includes('permission')
      ) {
        return this.forbidden(res, error.message);
      }
      return this.handleError(res, error);
    }
  });

  /**
   * POST /api/forum/topics/:id/pin
   * Pin or unpin topic (moderator only)
   */
  public pinTopic = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = topicIdParamSchema.parse(req.params);
      const { isPinned } = pinTopicSchema.parse(req.body);

      const topic = await this.topicService.pinTopic(id, isPinned, req.user!);

      return this.success(
        res,
        { topic },
        isPinned ? 'Topic pinned successfully' : 'Topic unpinned successfully'
      );
    } catch (error) {
      if (error instanceof ZodError) {
        return this.validationError(res, error);
      }
      if (
        error instanceof Error &&
        error.message.includes('moderators')
      ) {
        return this.forbidden(res, error.message);
      }
      return this.handleError(res, error);
    }
  });

  /**
   * POST /api/forum/topics/:id/lock
   * Lock or unlock topic (moderator only)
   */
  public lockTopic = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = topicIdParamSchema.parse(req.params);
      const { isLocked } = lockTopicSchema.parse(req.body);

      const topic = await this.topicService.lockTopic(id, isLocked, req.user!);

      return this.success(
        res,
        { topic },
        isLocked ? 'Topic locked successfully' : 'Topic unlocked successfully'
      );
    } catch (error) {
      if (error instanceof ZodError) {
        return this.validationError(res, error);
      }
      if (
        error instanceof Error &&
        error.message.includes('moderators')
      ) {
        return this.forbidden(res, error.message);
      }
      return this.handleError(res, error);
    }
  });
}
