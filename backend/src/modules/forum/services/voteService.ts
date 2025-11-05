import { injectable } from 'tsyringe';
import * as Sentry from '@sentry/node';
import { VoteRepository } from '../repositories/VoteRepository';
import { VoteResult, UserVoteItem } from '../validators/voteValidators';

/**
 * VoteService
 *
 * Business logic for forum voting system:
 * - Vote validation (no self-voting, reputation requirements)
 * - Daily vote limits (50 per user)
 * - Score calculation and auto-hiding
 * - Reputation updates for content authors
 *
 * Vote Rules:
 * - Upvote: +1 (anyone can upvote)
 * - Downvote: -1 (requires 50+ reputation)
 * - Remove: 0 (remove existing vote)
 * - Daily limit: 50 votes per user
 * - No self-voting allowed
 * - Posts with score <= -5 are auto-hidden
 */

interface User {
  id: string;
  role?: string;
}

@injectable()
export class VoteService {
  // Constants
  private readonly DAILY_VOTE_LIMIT = 50;
  private readonly MIN_REPUTATION_TO_DOWNVOTE = 50;
  private readonly AUTO_HIDE_THRESHOLD = -5;
  private readonly UPVOTE_REPUTATION_POINTS = 10;
  private readonly DOWNVOTE_REPUTATION_POINTS = -5;

  constructor(private voteRepository: VoteRepository) {}

  /**
   * Vote on a topic
   */
  async voteOnTopic(topicId: string, userId: string, voteValue: number): Promise<VoteResult> {
    try {
      // Validate topic exists
      const topic = await this.voteRepository.getTopicById(topicId);
      if (!topic) {
        throw new Error('Topic not found');
      }

      // Prevent self-voting
      if (topic.authorId === userId) {
        throw new Error('You cannot vote on your own topic');
      }

      // Check if topic is locked
      if (topic.isLocked) {
        throw new Error('Cannot vote on locked topic');
      }

      // Get previous vote
      const previousVote = await this.voteRepository.getTopicVote(topicId, userId);

      // Validate vote permissions
      await this.validateVotePermissions(userId, voteValue, previousVote?.value);

      // Check daily vote limit
      await this.checkDailyVoteLimit(userId);

      // Upsert vote
      await this.voteRepository.upsertTopicVote(topicId, {
        userId,
        value: voteValue,
      });

      // Update vote counts
      await this.voteRepository.updateTopicVoteCounts(topicId);

      // Update author reputation
      if (voteValue !== 0) {
        await this.updateAuthorReputation(
          topic.authorId,
          voteValue,
          'topic',
          topicId,
          previousVote?.value
        );
      }

      // Get updated counts
      const counts = await this.voteRepository.getTopicVoteCounts(topicId);

      // Check if post should be hidden
      const hidden = counts.voteScore <= this.AUTO_HIDE_THRESHOLD;

      Sentry.addBreadcrumb({
        category: 'forum',
        message: 'Topic vote recorded',
        level: 'info',
        data: {
          topicId,
          userId,
          voteValue,
          newScore: counts.voteScore,
          hidden,
        },
      });

      return {
        success: true,
        voteScore: counts.voteScore,
        upvoteCount: counts.upvoteCount,
        downvoteCount: counts.downvoteCount,
        userVote: voteValue,
        hidden,
      };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', operation: 'voteOnTopic' },
        extra: { topicId, userId, voteValue },
      });
      throw error;
    }
  }

  /**
   * Vote on a reply
   */
  async voteOnReply(replyId: string, userId: string, voteValue: number): Promise<VoteResult> {
    try {
      // Validate reply exists
      const reply = await this.voteRepository.getReplyById(replyId);
      if (!reply) {
        throw new Error('Reply not found');
      }

      // Check if reply is deleted
      if (reply.isDeleted) {
        throw new Error('Cannot vote on deleted reply');
      }

      // Prevent self-voting
      if (reply.authorId === userId) {
        throw new Error('You cannot vote on your own reply');
      }

      // Check if topic is locked
      if (reply.topic.isLocked) {
        throw new Error('Cannot vote on reply in locked topic');
      }

      // Get previous vote
      const previousVote = await this.voteRepository.getReplyVote(replyId, userId);

      // Validate vote permissions
      await this.validateVotePermissions(userId, voteValue, previousVote?.value);

      // Check daily vote limit
      await this.checkDailyVoteLimit(userId);

      // Upsert vote
      await this.voteRepository.upsertReplyVote(replyId, {
        userId,
        value: voteValue,
      });

      // Update vote counts
      await this.voteRepository.updateReplyVoteCounts(replyId);

      // Update author reputation
      if (voteValue !== 0) {
        await this.updateAuthorReputation(
          reply.authorId,
          voteValue,
          'reply',
          replyId,
          previousVote?.value
        );
      }

      // Get updated counts
      const counts = await this.voteRepository.getReplyVoteCounts(replyId);

      // Check if post should be hidden
      const hidden = counts.voteScore <= this.AUTO_HIDE_THRESHOLD;

      Sentry.addBreadcrumb({
        category: 'forum',
        message: 'Reply vote recorded',
        level: 'info',
        data: {
          replyId,
          userId,
          voteValue,
          newScore: counts.voteScore,
          hidden,
        },
      });

      return {
        success: true,
        voteScore: counts.voteScore,
        upvoteCount: counts.upvoteCount,
        downvoteCount: counts.downvoteCount,
        userVote: voteValue,
        hidden,
      };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', operation: 'voteOnReply' },
        extra: { replyId, userId, voteValue },
      });
      throw error;
    }
  }

  /**
   * Get user's vote history
   */
  async getUserVotes(
    userId: string,
    filters: { type?: 'topic' | 'reply' },
    pagination: { page: number; limit: number }
  ) {
    try {
      const result = await this.voteRepository.getUserVotes(userId, filters, pagination);

      const formattedVotes: UserVoteItem[] = result.votes.map((vote) => ({
        id: vote.id,
        type: vote.type,
        targetId: vote.targetId,
        targetTitle: vote.targetTitle,
        value: vote.value,
        votedAt: vote.votedAt,
      }));

      return {
        votes: formattedVotes,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / pagination.limit),
        },
      };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', operation: 'getUserVotes' },
        extra: { userId, filters, pagination },
      });
      throw error;
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Validate vote permissions
   * - Downvote requires 50+ reputation
   * - Changing vote doesn't count toward daily limit
   */
  private async validateVotePermissions(
    userId: string,
    voteValue: number,
    previousVoteValue?: number
  ): Promise<void> {
    // If removing vote or upvoting, no special permission needed
    if (voteValue === 0 || voteValue === 1) {
      return;
    }

    // For downvote, check reputation requirement
    if (voteValue === -1) {
      const reputation = await this.voteRepository.getUserReputation(userId);

      if (reputation < this.MIN_REPUTATION_TO_DOWNVOTE) {
        throw new Error(
          `You need at least ${this.MIN_REPUTATION_TO_DOWNVOTE} reputation points to downvote. Your current reputation: ${reputation}`
        );
      }
    }
  }

  /**
   * Check if user has exceeded daily vote limit
   * Note: Changing an existing vote doesn't count toward the limit
   */
  private async checkDailyVoteLimit(userId: string): Promise<void> {
    const dailyVoteCount = await this.voteRepository.getUserDailyVoteCount(userId);

    if (dailyVoteCount >= this.DAILY_VOTE_LIMIT) {
      throw new Error(
        `You have reached your daily vote limit of ${this.DAILY_VOTE_LIMIT} votes. Try again tomorrow.`
      );
    }
  }

  /**
   * Update author's reputation based on vote
   *
   * Reputation changes:
   * - Upvote received: +10 points
   * - Downvote received: -5 points
   * - Vote removed: reverse the points
   * - Vote changed: apply both changes
   */
  private async updateAuthorReputation(
    authorId: string,
    newVoteValue: number,
    contentType: 'topic' | 'reply',
    contentId: string,
    previousVoteValue?: number
  ): Promise<void> {
    try {
      let pointsToAdd = 0;
      let description = '';

      // Calculate reputation change based on vote transition
      if (previousVoteValue === undefined || previousVoteValue === 0) {
        // New vote
        if (newVoteValue === 1) {
          pointsToAdd = this.UPVOTE_REPUTATION_POINTS;
          description = `Received upvote on ${contentType}`;
        } else if (newVoteValue === -1) {
          pointsToAdd = this.DOWNVOTE_REPUTATION_POINTS;
          description = `Received downvote on ${contentType}`;
        }
      } else if (newVoteValue === 0) {
        // Vote removed
        if (previousVoteValue === 1) {
          pointsToAdd = -this.UPVOTE_REPUTATION_POINTS;
          description = `Upvote removed from ${contentType}`;
        } else if (previousVoteValue === -1) {
          pointsToAdd = -this.DOWNVOTE_REPUTATION_POINTS;
          description = `Downvote removed from ${contentType}`;
        }
      } else {
        // Vote changed (e.g., upvote to downvote or vice versa)
        if (previousVoteValue === 1 && newVoteValue === -1) {
          // Upvote changed to downvote
          pointsToAdd = this.DOWNVOTE_REPUTATION_POINTS - this.UPVOTE_REPUTATION_POINTS;
          description = `Vote changed from upvote to downvote on ${contentType}`;
        } else if (previousVoteValue === -1 && newVoteValue === 1) {
          // Downvote changed to upvote
          pointsToAdd = this.UPVOTE_REPUTATION_POINTS - this.DOWNVOTE_REPUTATION_POINTS;
          description = `Vote changed from downvote to upvote on ${contentType}`;
        }
      }

      // Only create reputation history if points changed
      if (pointsToAdd !== 0) {
        const eventType = pointsToAdd > 0 ? 'upvote_received' : 'downvote_received';

        await this.voteRepository.createReputationHistory({
          userId: authorId,
          eventType,
          points: pointsToAdd,
          description,
          referenceId: contentId,
        });

        Sentry.addBreadcrumb({
          category: 'forum',
          message: 'Reputation updated from vote',
          level: 'info',
          data: {
            authorId,
            contentType,
            contentId,
            pointsToAdd,
            previousVoteValue,
            newVoteValue,
          },
        });
      }
    } catch (error) {
      // Log error but don't fail the vote operation
      Sentry.captureException(error, {
        tags: { module: 'forum', operation: 'updateAuthorReputation' },
        extra: { authorId, contentType, contentId, newVoteValue, previousVoteValue },
      });
    }
  }
}
