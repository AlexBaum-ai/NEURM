import { injectable, inject } from 'tsyringe';
import * as Sentry from '@sentry/node';
import { PollRepository, CreatePollData, PollWithOptions } from '../repositories/PollRepository';
import { PollType } from '@prisma/client';

export interface CreatePollInput {
  topicId?: string;
  question: string;
  pollType: PollType;
  isAnonymous?: boolean;
  deadline?: Date;
  options: string[];
}

export interface VotePollInput {
  pollId: string;
  userId: string;
  optionIds: string[];
}

export interface PollResultsOutput {
  id: string;
  question: string;
  pollType: PollType;
  isAnonymous: boolean;
  deadline: Date | null;
  totalVotes: number;
  options: Array<{
    id: string;
    optionText: string;
    voteCount: number;
    percentage: number;
  }>;
  userVote?: {
    optionIds: string[];
  };
  hasExpired: boolean;
  createdAt: Date;
}

/**
 * PollService
 *
 * Business logic for poll operations:
 * - Create polls with validation (min 2 options, max 10 options)
 * - Cast votes with constraints (prevent duplicates for single choice)
 * - Calculate results with percentages
 * - Handle deadline enforcement
 * - Support anonymous/non-anonymous voting
 */
@injectable()
export class PollService {
  constructor(
    @inject('PollRepository')
    private pollRepository: PollRepository
  ) {}

  /**
   * Create a new poll
   *
   * Validation:
   * - Must have 2-10 options
   * - All options must be non-empty
   * - Question must be provided
   */
  async createPoll(input: CreatePollInput): Promise<PollWithOptions> {
    try {
      // Validate options
      this.validatePollOptions(input.options);

      const pollData: CreatePollData = {
        topicId: input.topicId,
        question: input.question,
        pollType: input.pollType,
        isAnonymous: input.isAnonymous ?? true,
        deadline: input.deadline,
        options: input.options,
      };

      const poll = await this.pollRepository.createPoll(pollData);

      Sentry.addBreadcrumb({
        category: 'poll',
        message: 'Poll created',
        level: 'info',
        data: {
          pollId: poll.id,
          optionCount: poll.options.length,
          pollType: poll.pollType,
        },
      });

      return poll;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'pollService', method: 'createPoll' },
        extra: { input },
      });
      throw error;
    }
  }

  /**
   * Get poll by ID with results
   */
  async getPollById(pollId: string, userId?: string): Promise<PollResultsOutput | null> {
    try {
      const poll = await this.pollRepository.findById(pollId);
      if (!poll) return null;

      // Get user's vote if authenticated
      let userVote: { optionIds: string[] } | undefined;
      if (userId) {
        const votes = await this.pollRepository.findUserVote(pollId, userId);
        if (votes.length > 0) {
          userVote = {
            optionIds: votes.map((v) => v.optionId),
          };
        }
      }

      // Calculate percentages
      const stats = await this.pollRepository.getVoteStatistics(pollId);
      if (!stats) return null;

      return {
        id: poll.id,
        question: poll.question,
        pollType: poll.pollType,
        isAnonymous: poll.isAnonymous,
        deadline: poll.deadline,
        totalVotes: poll.totalVotes,
        options: stats.options,
        userVote,
        hasExpired: this.pollRepository.isPollExpired(poll),
        createdAt: poll.createdAt,
      };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'pollService', method: 'getPollById' },
        extra: { pollId, userId },
      });
      throw error;
    }
  }

  /**
   * Get poll by topic ID
   */
  async getPollByTopicId(topicId: string, userId?: string): Promise<PollResultsOutput | null> {
    try {
      const poll = await this.pollRepository.findByTopicId(topicId);
      if (!poll) return null;

      return this.getPollById(poll.id, userId);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'pollService', method: 'getPollByTopicId' },
        extra: { topicId, userId },
      });
      throw error;
    }
  }

  /**
   * Cast vote on a poll
   *
   * Constraints:
   * - User must be authenticated
   * - Poll must exist
   * - Poll must not be expired
   * - For single choice: only 1 option allowed, can't vote twice
   * - For multiple choice: 1+ options allowed, can vote multiple times
   * - All option IDs must belong to the poll
   */
  async castVote(input: VotePollInput): Promise<PollResultsOutput> {
    const { pollId, userId, optionIds } = input;

    try {
      // Get poll
      const poll = await this.pollRepository.findById(pollId);
      if (!poll) {
        throw new Error('Poll not found');
      }

      // Check if poll has expired
      if (this.pollRepository.isPollExpired(poll)) {
        throw new Error('Poll has expired and is closed for voting');
      }

      // Check if user has already voted (for single choice)
      if (poll.pollType === 'single') {
        const hasVoted = await this.pollRepository.hasUserVoted(pollId, userId);
        if (hasVoted) {
          throw new Error('You have already voted in this poll');
        }
      }

      // Validate option IDs
      await this.validateVoteOptions(poll, optionIds);

      // For single choice, ensure only 1 option
      if (poll.pollType === 'single' && optionIds.length !== 1) {
        throw new Error('Single choice polls allow only one option to be selected');
      }

      // For multiple choice, ensure at least 1 option
      if (poll.pollType === 'multiple' && optionIds.length === 0) {
        throw new Error('You must select at least one option');
      }

      // Cast the vote
      await this.pollRepository.castVote(pollId, userId, optionIds);

      Sentry.addBreadcrumb({
        category: 'poll',
        message: 'Vote cast',
        level: 'info',
        data: {
          pollId,
          userId,
          optionCount: optionIds.length,
        },
      });

      // Return updated results
      const results = await this.getPollById(pollId, userId);
      if (!results) {
        throw new Error('Failed to retrieve poll results after voting');
      }

      return results;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'pollService', method: 'castVote' },
        extra: { input },
      });
      throw error;
    }
  }

  /**
   * Get poll results
   */
  async getPollResults(pollId: string, userId?: string): Promise<PollResultsOutput | null> {
    return this.getPollById(pollId, userId);
  }

  /**
   * Delete a poll (admin/moderator only - permission check should be in controller)
   */
  async deletePoll(pollId: string): Promise<void> {
    try {
      await this.pollRepository.deletePoll(pollId);

      Sentry.addBreadcrumb({
        category: 'poll',
        message: 'Poll deleted',
        level: 'info',
        data: { pollId },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'pollService', method: 'deletePoll' },
        extra: { pollId },
      });
      throw error;
    }
  }

  /**
   * Validate poll options
   */
  private validatePollOptions(options: string[]): void {
    if (options.length < 2) {
      throw new Error('Poll must have at least 2 options');
    }

    if (options.length > 10) {
      throw new Error('Poll cannot have more than 10 options');
    }

    // Check for empty options
    const hasEmptyOption = options.some((opt) => !opt || opt.trim().length === 0);
    if (hasEmptyOption) {
      throw new Error('All poll options must be non-empty');
    }

    // Check for duplicate options
    const uniqueOptions = new Set(options.map((opt) => opt.trim().toLowerCase()));
    if (uniqueOptions.size !== options.length) {
      throw new Error('Poll options must be unique');
    }
  }

  /**
   * Validate vote option IDs belong to the poll
   */
  private async validateVoteOptions(
    poll: PollWithOptions,
    optionIds: string[]
  ): Promise<void> {
    const validOptionIds = new Set(poll.options.map((opt) => opt.id));

    for (const optionId of optionIds) {
      if (!validOptionIds.has(optionId)) {
        throw new Error(`Invalid option ID: ${optionId}`);
      }
    }
  }
}
