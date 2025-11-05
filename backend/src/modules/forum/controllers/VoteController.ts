import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { ZodError } from 'zod';
import { BaseController } from '../../../utils/baseController';
import { VoteService } from '../services/voteService';
import {
  voteActionSchema,
  topicIdParamSchema,
  replyIdParamSchema,
  getUserVotesQuerySchema,
} from '../validators/voteValidators';

/**
 * VoteController
 *
 * Handles HTTP requests for forum voting system:
 * - Vote on topics (POST /api/forum/topics/:id/vote)
 * - Vote on replies (POST /api/forum/replies/:id/vote)
 * - Get user's votes (GET /api/forum/votes/me)
 *
 * Features:
 * - Upvote (+1), downvote (-1), or remove vote (0)
 * - One vote per user per item (upsert behavior)
 * - Daily vote limit: 50 per user
 * - Minimum reputation 50 to downvote
 * - Prevents self-voting
 * - Auto-hides posts with score <= -5
 * - Updates author reputation (+10 upvote, -5 downvote)
 */
@injectable()
export class VoteController extends BaseController {
  constructor(
    @inject('VoteService')
    private voteService: VoteService
  ) {
    super();
  }

  /**
   * POST /api/forum/topics/:id/vote
   * Vote on a topic
   *
   * Body:
   * - vote: 1 (upvote), -1 (downvote), 0 (remove)
   *
   * Returns:
   * - success: boolean
   * - voteScore: number (upvotes - downvotes)
   * - upvoteCount: number
   * - downvoteCount: number
   * - userVote: number (current user's vote)
   * - hidden: boolean (if score <= -5)
   */
  public voteOnTopic = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = topicIdParamSchema.parse(req.params);
      const { vote } = voteActionSchema.parse(req.body);
      const userId = req.user!.id;

      const result = await this.voteService.voteOnTopic(id, userId, vote);

      return this.success(res, result, 200);
    } catch (error) {
      if (error instanceof ZodError) {
        return this.validationError(res, error);
      }

      if (error instanceof Error) {
        // Handle specific error messages
        if (error.message === 'Topic not found') {
          return this.notFound(res, 'Topic not found');
        }
        if (error.message.includes('cannot vote on your own')) {
          return this.forbidden(res, error.message);
        }
        if (error.message.includes('reputation')) {
          return this.forbidden(res, error.message);
        }
        if (error.message.includes('daily vote limit')) {
          return this.forbidden(res, error.message);
        }
        if (error.message.includes('locked')) {
          return this.forbidden(res, error.message);
        }
      }

      this.captureException(error as Error);
      return this.error(res, 'Failed to vote on topic', 500);
    }
  });

  /**
   * POST /api/forum/replies/:id/vote
   * Vote on a reply
   *
   * Body:
   * - vote: 1 (upvote), -1 (downvote), 0 (remove)
   *
   * Returns:
   * - success: boolean
   * - voteScore: number (upvotes - downvotes)
   * - upvoteCount: number
   * - downvoteCount: number
   * - userVote: number (current user's vote)
   * - hidden: boolean (if score <= -5)
   */
  public voteOnReply = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = replyIdParamSchema.parse(req.params);
      const { vote } = voteActionSchema.parse(req.body);
      const userId = req.user!.id;

      const result = await this.voteService.voteOnReply(id, userId, vote);

      return this.success(res, result, 200);
    } catch (error) {
      if (error instanceof ZodError) {
        return this.validationError(res, error);
      }

      if (error instanceof Error) {
        // Handle specific error messages
        if (error.message === 'Reply not found') {
          return this.notFound(res, 'Reply not found');
        }
        if (error.message.includes('cannot vote on your own')) {
          return this.forbidden(res, error.message);
        }
        if (error.message.includes('reputation')) {
          return this.forbidden(res, error.message);
        }
        if (error.message.includes('daily vote limit')) {
          return this.forbidden(res, error.message);
        }
        if (error.message.includes('locked') || error.message.includes('deleted')) {
          return this.forbidden(res, error.message);
        }
      }

      this.captureException(error as Error);
      return this.error(res, 'Failed to vote on reply', 500);
    }
  });

  /**
   * GET /api/forum/votes/me
   * Get current user's vote history
   *
   * Query parameters:
   * - page: number (default: 1)
   * - limit: number (default: 20, max: 100)
   * - type: 'topic' | 'reply' (optional filter)
   *
   * Returns:
   * - votes: array of vote items
   * - pagination: { page, limit, total, totalPages }
   */
  public getUserVotes = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const query = getUserVotesQuerySchema.parse(req.query);
      const userId = req.user!.id;

      const filters = {
        type: query.type,
      };

      const pagination = {
        page: query.page,
        limit: query.limit,
      };

      const result = await this.voteService.getUserVotes(userId, filters, pagination);

      return this.success(res, result);
    } catch (error) {
      if (error instanceof ZodError) {
        return this.validationError(res, error);
      }

      this.captureException(error as Error);
      return this.error(res, 'Failed to get vote history', 500);
    }
  });
}
