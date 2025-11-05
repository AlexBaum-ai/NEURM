import { injectable } from 'tsyringe';
import { PrismaClient, TopicVote, ReplyVote, Prisma } from '@prisma/client';
import * as Sentry from '@sentry/node';

/**
 * VoteRepository
 *
 * Handles database operations for forum voting system:
 * - Topic and reply vote CRUD operations
 * - Vote count calculations
 * - User vote history retrieval
 *
 * Note: Uses separate tables (TopicVote, ReplyVote) for better performance
 * and type safety compared to a polymorphic votes table.
 */

export interface VoteData {
  userId: string;
  value: number; // 1 (upvote), -1 (downvote), 0 (remove)
}

export interface VoteCount {
  upvoteCount: number;
  downvoteCount: number;
  voteScore: number;
}

export interface UserVoteHistoryItem {
  id: string;
  type: 'topic' | 'reply';
  targetId: string;
  targetTitle: string;
  value: number;
  votedAt: Date;
  authorName?: string;
}

@injectable()
export class VoteRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  // ============================================================================
  // TOPIC VOTES
  // ============================================================================

  /**
   * Upsert a vote on a topic
   * If vote value is 0, delete the vote
   */
  async upsertTopicVote(topicId: string, voteData: VoteData): Promise<TopicVote | null> {
    try {
      // If vote is 0, delete the vote
      if (voteData.value === 0) {
        await this.prisma.topicVote.deleteMany({
          where: {
            topicId,
            userId: voteData.userId,
          },
        });
        return null;
      }

      // Otherwise, upsert the vote
      const vote = await this.prisma.topicVote.upsert({
        where: {
          topicId_userId: {
            topicId,
            userId: voteData.userId,
          },
        },
        update: {
          value: voteData.value,
        },
        create: {
          topicId,
          userId: voteData.userId,
          value: voteData.value,
        },
      });

      return vote;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', repository: 'VoteRepository', operation: 'upsertTopicVote' },
        extra: { topicId, voteData },
      });
      throw error;
    }
  }

  /**
   * Get a user's vote on a topic
   */
  async getTopicVote(topicId: string, userId: string): Promise<TopicVote | null> {
    try {
      return await this.prisma.topicVote.findUnique({
        where: {
          topicId_userId: {
            topicId,
            userId,
          },
        },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', repository: 'VoteRepository', operation: 'getTopicVote' },
        extra: { topicId, userId },
      });
      throw error;
    }
  }

  /**
   * Calculate vote counts for a topic
   */
  async getTopicVoteCounts(topicId: string): Promise<VoteCount> {
    try {
      const [upvotes, downvotes] = await Promise.all([
        this.prisma.topicVote.count({
          where: { topicId, value: 1 },
        }),
        this.prisma.topicVote.count({
          where: { topicId, value: -1 },
        }),
      ]);

      return {
        upvoteCount: upvotes,
        downvoteCount: downvotes,
        voteScore: upvotes - downvotes,
      };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', repository: 'VoteRepository', operation: 'getTopicVoteCounts' },
        extra: { topicId },
      });
      throw error;
    }
  }

  /**
   * Update topic vote counts in the topics table
   */
  async updateTopicVoteCounts(topicId: string): Promise<void> {
    try {
      const counts = await this.getTopicVoteCounts(topicId);

      await this.prisma.topic.update({
        where: { id: topicId },
        data: {
          upvoteCount: counts.upvoteCount,
          downvoteCount: counts.downvoteCount,
          voteScore: counts.voteScore,
        },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', repository: 'VoteRepository', operation: 'updateTopicVoteCounts' },
        extra: { topicId },
      });
      throw error;
    }
  }

  // ============================================================================
  // REPLY VOTES
  // ============================================================================

  /**
   * Upsert a vote on a reply
   * If vote value is 0, delete the vote
   */
  async upsertReplyVote(replyId: string, voteData: VoteData): Promise<ReplyVote | null> {
    try {
      // If vote is 0, delete the vote
      if (voteData.value === 0) {
        await this.prisma.replyVote.deleteMany({
          where: {
            replyId,
            userId: voteData.userId,
          },
        });
        return null;
      }

      // Otherwise, upsert the vote
      const vote = await this.prisma.replyVote.upsert({
        where: {
          replyId_userId: {
            replyId,
            userId: voteData.userId,
          },
        },
        update: {
          value: voteData.value,
        },
        create: {
          replyId,
          userId: voteData.userId,
          value: voteData.value,
        },
      });

      return vote;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', repository: 'VoteRepository', operation: 'upsertReplyVote' },
        extra: { replyId, voteData },
      });
      throw error;
    }
  }

  /**
   * Get a user's vote on a reply
   */
  async getReplyVote(replyId: string, userId: string): Promise<ReplyVote | null> {
    try {
      return await this.prisma.replyVote.findUnique({
        where: {
          replyId_userId: {
            replyId,
            userId,
          },
        },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', repository: 'VoteRepository', operation: 'getReplyVote' },
        extra: { replyId, userId },
      });
      throw error;
    }
  }

  /**
   * Calculate vote counts for a reply
   */
  async getReplyVoteCounts(replyId: string): Promise<VoteCount> {
    try {
      const [upvotes, downvotes] = await Promise.all([
        this.prisma.replyVote.count({
          where: { replyId, value: 1 },
        }),
        this.prisma.replyVote.count({
          where: { replyId, value: -1 },
        }),
      ]);

      return {
        upvoteCount: upvotes,
        downvoteCount: downvotes,
        voteScore: upvotes - downvotes,
      };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', repository: 'VoteRepository', operation: 'getReplyVoteCounts' },
        extra: { replyId },
      });
      throw error;
    }
  }

  /**
   * Update reply vote counts in the replies table
   */
  async updateReplyVoteCounts(replyId: string): Promise<void> {
    try {
      const counts = await this.getReplyVoteCounts(replyId);

      await this.prisma.reply.update({
        where: { id: replyId },
        data: {
          upvoteCount: counts.upvoteCount,
          downvoteCount: counts.downvoteCount,
          voteScore: counts.voteScore,
        },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', repository: 'VoteRepository', operation: 'updateReplyVoteCounts' },
        extra: { replyId },
      });
      throw error;
    }
  }

  // ============================================================================
  // USER VOTE HISTORY
  // ============================================================================

  /**
   * Get user's vote history with pagination
   */
  async getUserVotes(
    userId: string,
    filters: { type?: 'topic' | 'reply' },
    pagination: { page: number; limit: number }
  ): Promise<{ votes: UserVoteHistoryItem[]; total: number }> {
    try {
      const { page, limit } = pagination;
      const skip = (page - 1) * limit;

      // Get topic votes
      const topicVotes =
        !filters.type || filters.type === 'topic'
          ? await this.prisma.topicVote.findMany({
              where: { userId },
              include: {
                topic: {
                  select: {
                    id: true,
                    title: true,
                    author: {
                      select: {
                        username: true,
                      },
                    },
                  },
                },
              },
              orderBy: { createdAt: 'desc' },
            })
          : [];

      // Get reply votes
      const replyVotes =
        !filters.type || filters.type === 'reply'
          ? await this.prisma.replyVote.findMany({
              where: { userId },
              include: {
                reply: {
                  select: {
                    id: true,
                    content: true,
                    author: {
                      select: {
                        username: true,
                      },
                    },
                    topic: {
                      select: {
                        title: true,
                      },
                    },
                  },
                },
              },
              orderBy: { createdAt: 'desc' },
            })
          : [];

      // Combine and format votes
      const combinedVotes: UserVoteHistoryItem[] = [
        ...topicVotes.map((v) => ({
          id: v.topicId,
          type: 'topic' as const,
          targetId: v.topicId,
          targetTitle: v.topic.title,
          value: v.value,
          votedAt: v.createdAt,
          authorName: v.topic.author.username,
        })),
        ...replyVotes.map((v) => ({
          id: v.replyId,
          type: 'reply' as const,
          targetId: v.replyId,
          targetTitle: `Reply in: ${v.reply.topic.title}`,
          value: v.value,
          votedAt: v.createdAt,
          authorName: v.reply.author.username,
        })),
      ];

      // Sort by date
      combinedVotes.sort((a, b) => b.votedAt.getTime() - a.votedAt.getTime());

      // Paginate
      const paginatedVotes = combinedVotes.slice(skip, skip + limit);

      return {
        votes: paginatedVotes,
        total: combinedVotes.length,
      };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', repository: 'VoteRepository', operation: 'getUserVotes' },
        extra: { userId, filters, pagination },
      });
      throw error;
    }
  }

  /**
   * Get user's daily vote count (for rate limiting)
   */
  async getUserDailyVoteCount(userId: string): Promise<number> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [topicVoteCount, replyVoteCount] = await Promise.all([
        this.prisma.topicVote.count({
          where: {
            userId,
            createdAt: {
              gte: today,
            },
          },
        }),
        this.prisma.replyVote.count({
          where: {
            userId,
            createdAt: {
              gte: today,
            },
          },
        }),
      ]);

      return topicVoteCount + replyVoteCount;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', repository: 'VoteRepository', operation: 'getUserDailyVoteCount' },
        extra: { userId },
      });
      throw error;
    }
  }

  // ============================================================================
  // TOPIC & REPLY RETRIEVAL (for validation)
  // ============================================================================

  /**
   * Get topic by ID (for validation and author check)
   */
  async getTopicById(topicId: string) {
    try {
      return await this.prisma.topic.findUnique({
        where: { id: topicId },
        select: {
          id: true,
          authorId: true,
          voteScore: true,
          upvoteCount: true,
          downvoteCount: true,
          isLocked: true,
        },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', repository: 'VoteRepository', operation: 'getTopicById' },
        extra: { topicId },
      });
      throw error;
    }
  }

  /**
   * Get reply by ID (for validation and author check)
   */
  async getReplyById(replyId: string) {
    try {
      return await this.prisma.reply.findUnique({
        where: { id: replyId },
        select: {
          id: true,
          authorId: true,
          voteScore: true,
          upvoteCount: true,
          downvoteCount: true,
          isDeleted: true,
          topic: {
            select: {
              isLocked: true,
            },
          },
        },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', repository: 'VoteRepository', operation: 'getReplyById' },
        extra: { replyId },
      });
      throw error;
    }
  }

  /**
   * Get user's profile with reputation (for downvote permission check)
   */
  async getUserProfile(userId: string) {
    try {
      return await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          profile: {
            select: {
              id: true,
            },
          },
          // Calculate reputation from reputation history
          reputationHistory: {
            select: {
              points: true,
            },
          },
        },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', repository: 'VoteRepository', operation: 'getUserProfile' },
        extra: { userId },
      });
      throw error;
    }
  }

  /**
   * Calculate user's total reputation
   */
  async getUserReputation(userId: string): Promise<number> {
    try {
      const result = await this.prisma.reputationHistory.aggregate({
        where: { userId },
        _sum: {
          points: true,
        },
      });

      return result._sum.points || 0;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', repository: 'VoteRepository', operation: 'getUserReputation' },
        extra: { userId },
      });
      throw error;
    }
  }

  /**
   * Create reputation history entry
   */
  async createReputationHistory(data: {
    userId: string;
    eventType: 'upvote_received' | 'downvote_received';
    points: number;
    description: string;
    referenceId: string;
  }) {
    try {
      return await this.prisma.reputationHistory.create({
        data,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          module: 'forum',
          repository: 'VoteRepository',
          operation: 'createReputationHistory',
        },
        extra: { data },
      });
      throw error;
    }
  }

  /**
   * Clean up (disconnect Prisma client)
   */
  async disconnect() {
    await this.prisma.$disconnect();
  }
}
