import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { ZodError } from 'zod';
import { BaseController } from '../../../utils/baseController';
import { PollService } from '../services/pollService';
import {
  createPollSchema,
  votePollSchema,
  pollIdParamSchema,
  topicIdParamSchema,
} from '../validators/pollValidators';

/**
 * PollController
 *
 * Handles HTTP requests for polls system:
 * - Create poll (POST /api/forum/polls)
 * - Get poll results (GET /api/forum/polls/:id)
 * - Get poll by topic (GET /api/forum/polls/topic/:topicId)
 * - Cast vote (POST /api/forum/polls/:id/vote)
 * - Delete poll (DELETE /api/forum/polls/:id) - admin only
 *
 * Features:
 * - Poll types: single_choice, multiple_choice
 * - Optional deadline for automatic closing
 * - Anonymous voting support
 * - Vote count and percentage calculation
 * - Prevents duplicate votes for single choice
 * - Validates min 2 options, max 10 options
 */
@injectable()
export class PollController extends BaseController {
  constructor(
    @inject('PollService')
    private pollService: PollService
  ) {
    super();
  }

  /**
   * POST /api/forum/polls
   * Create a new poll
   *
   * Body:
   * - topicId?: string (optional - can be standalone or attached to topic)
   * - question: string (5-255 chars)
   * - pollType: 'single' | 'multiple'
   * - isAnonymous?: boolean (default true)
   * - deadline?: string (ISO datetime)
   * - options: string[] (2-10 options)
   *
   * Returns:
   * - id: string
   * - question: string
   * - pollType: string
   * - isAnonymous: boolean
   * - deadline: string | null
   * - totalVotes: number
   * - options: array of options with IDs
   * - createdAt: string
   */
  public createPoll = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const validatedData = createPollSchema.parse(req.body);

      const poll = await this.pollService.createPoll(validatedData);

      return this.success(
        res,
        {
          id: poll.id,
          topicId: poll.topicId,
          question: poll.question,
          pollType: poll.pollType,
          isAnonymous: poll.isAnonymous,
          deadline: poll.deadline,
          totalVotes: poll.totalVotes,
          options: poll.options.map((opt) => ({
            id: opt.id,
            optionText: opt.optionText,
            displayOrder: opt.displayOrder,
          })),
          createdAt: poll.createdAt,
        },
        201
      );
    } catch (error) {
      if (error instanceof ZodError) {
        return this.validationError(res, error);
      }

      if (error instanceof Error) {
        // Handle specific validation errors
        if (error.message.includes('at least 2 options')) {
          return this.badRequest(res, error.message);
        }
        if (error.message.includes('more than 10 options')) {
          return this.badRequest(res, error.message);
        }
        if (error.message.includes('non-empty')) {
          return this.badRequest(res, error.message);
        }
        if (error.message.includes('unique')) {
          return this.badRequest(res, error.message);
        }
      }

      this.captureException(error as Error);
      return this.error(res, 'Failed to create poll', 500);
    }
  });

  /**
   * GET /api/forum/polls/:id
   * Get poll results by poll ID
   *
   * Returns:
   * - Poll details with vote counts and percentages
   * - User's vote if authenticated
   * - hasExpired flag
   */
  public getPollById = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = pollIdParamSchema.parse(req.params);
      const userId = req.user?.id;

      const poll = await this.pollService.getPollById(id, userId);

      if (!poll) {
        return this.notFound(res, 'Poll not found');
      }

      return this.success(res, poll);
    } catch (error) {
      if (error instanceof ZodError) {
        return this.validationError(res, error);
      }

      this.captureException(error as Error);
      return this.error(res, 'Failed to retrieve poll', 500);
    }
  });

  /**
   * GET /api/forum/polls/topic/:topicId
   * Get poll by topic ID
   *
   * Returns:
   * - Poll details if topic has a poll
   * - 404 if no poll found for topic
   */
  public getPollByTopicId = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const { topicId } = topicIdParamSchema.parse(req.params);
      const userId = req.user?.id;

      const poll = await this.pollService.getPollByTopicId(topicId, userId);

      if (!poll) {
        return this.notFound(res, 'No poll found for this topic');
      }

      return this.success(res, poll);
    } catch (error) {
      if (error instanceof ZodError) {
        return this.validationError(res, error);
      }

      this.captureException(error as Error);
      return this.error(res, 'Failed to retrieve poll', 500);
    }
  });

  /**
   * POST /api/forum/polls/:id/vote
   * Cast vote on a poll
   *
   * Body:
   * - optionIds: string[] (1 for single choice, 1+ for multiple choice)
   *
   * Returns:
   * - Updated poll results with percentages
   * - User's vote included
   */
  public castVote = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const { id: pollId } = pollIdParamSchema.parse(req.params);
      const { optionIds } = votePollSchema.parse(req.body);
      const userId = req.user!.id;

      const results = await this.pollService.castVote({
        pollId,
        userId,
        optionIds,
      });

      return this.success(res, results);
    } catch (error) {
      if (error instanceof ZodError) {
        return this.validationError(res, error);
      }

      if (error instanceof Error) {
        // Handle specific voting errors
        if (error.message === 'Poll not found') {
          return this.notFound(res, 'Poll not found');
        }
        if (error.message.includes('expired')) {
          return this.forbidden(res, error.message);
        }
        if (error.message.includes('already voted')) {
          return this.forbidden(res, error.message);
        }
        if (error.message.includes('Single choice polls')) {
          return this.badRequest(res, error.message);
        }
        if (error.message.includes('at least one option')) {
          return this.badRequest(res, error.message);
        }
        if (error.message.includes('Invalid option ID')) {
          return this.badRequest(res, error.message);
        }
      }

      this.captureException(error as Error);
      return this.error(res, 'Failed to cast vote', 500);
    }
  });

  /**
   * GET /api/forum/polls/:id/results
   * Get poll results (alias for getPollById)
   *
   * Returns:
   * - Poll results with vote counts and percentages
   */
  public getPollResults = this.asyncHandler(async (req: Request, res: Response) => {
    return this.getPollById(req, res);
  });

  /**
   * DELETE /api/forum/polls/:id
   * Delete a poll (admin/moderator only - auth checked in route)
   *
   * Returns:
   * - Success message
   */
  public deletePoll = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = pollIdParamSchema.parse(req.params);

      await this.pollService.deletePoll(id);

      return this.success(res, { message: 'Poll deleted successfully' });
    } catch (error) {
      if (error instanceof ZodError) {
        return this.validationError(res, error);
      }

      if (error instanceof Error) {
        if (error.message === 'Poll not found') {
          return this.notFound(res, 'Poll not found');
        }
      }

      this.captureException(error as Error);
      return this.error(res, 'Failed to delete poll', 500);
    }
  });
}
