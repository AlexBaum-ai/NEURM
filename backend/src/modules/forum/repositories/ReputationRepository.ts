import { injectable } from 'tsyringe';
import { PrismaClient, ReputationEventType, ReputationLevel } from '@prisma/client';
import * as Sentry from '@sentry/node';

/**
 * ReputationRepository
 *
 * Handles database operations for the reputation system:
 * - User reputation CRUD operations
 * - Reputation history tracking
 * - Level calculations
 * - Reputation breakdown and statistics
 */

export interface ReputationBreakdown {
  topicsCreated: number;
  repliesCreated: number;
  upvotesReceived: number;
  downvotesReceived: number;
  bestAnswers: number;
  badgesEarned: number;
  penalties: number;
}

export interface ReputationData {
  totalReputation: number;
  level: ReputationLevel;
  breakdown: ReputationBreakdown;
  recentHistory: Array<{
    id: string;
    eventType: ReputationEventType;
    points: number;
    description: string;
    referenceId: string | null;
    createdAt: Date;
  }>;
}

@injectable()
export class ReputationRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Get or create user reputation record
   */
  async getUserReputation(userId: string) {
    try {
      let reputation = await this.prisma.userReputation.findUnique({
        where: { userId },
      });

      if (!reputation) {
        reputation = await this.prisma.userReputation.create({
          data: {
            userId,
            totalReputation: 0,
            level: 'newcomer',
          },
        });
      }

      return reputation;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', repository: 'ReputationRepository', operation: 'getUserReputation' },
        extra: { userId },
      });
      throw error;
    }
  }

  /**
   * Calculate total reputation from history
   */
  async calculateTotalReputation(userId: string): Promise<number> {
    try {
      const result = await this.prisma.reputationHistory.aggregate({
        where: { userId },
        _sum: {
          points: true,
        },
      });

      // Prevent negative reputation (floor at 0)
      const total = result._sum.points || 0;
      return Math.max(0, total);
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          module: 'forum',
          repository: 'ReputationRepository',
          operation: 'calculateTotalReputation',
        },
        extra: { userId },
      });
      throw error;
    }
  }

  /**
   * Calculate reputation level based on total reputation
   * Levels:
   * - Newcomer: 0-99
   * - Contributor: 100-499
   * - Expert: 500-999
   * - Master: 1000-2499
   * - Legend: 2500+
   */
  calculateLevel(totalReputation: number): ReputationLevel {
    if (totalReputation >= 2500) return 'legend';
    if (totalReputation >= 1000) return 'master';
    if (totalReputation >= 500) return 'expert';
    if (totalReputation >= 100) return 'contributor';
    return 'newcomer';
  }

  /**
   * Update user reputation and level
   */
  async updateUserReputation(userId: string): Promise<void> {
    try {
      const totalReputation = await this.calculateTotalReputation(userId);
      const level = this.calculateLevel(totalReputation);

      await this.prisma.userReputation.upsert({
        where: { userId },
        update: {
          totalReputation,
          level,
        },
        create: {
          userId,
          totalReputation,
          level,
        },
      });

      Sentry.addBreadcrumb({
        category: 'forum',
        message: 'User reputation updated',
        level: 'info',
        data: {
          userId,
          totalReputation,
          level,
        },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          module: 'forum',
          repository: 'ReputationRepository',
          operation: 'updateUserReputation',
        },
        extra: { userId },
      });
      throw error;
    }
  }

  /**
   * Get reputation breakdown by event type
   */
  async getReputationBreakdown(userId: string): Promise<ReputationBreakdown> {
    try {
      const history = await this.prisma.reputationHistory.findMany({
        where: { userId },
        select: {
          eventType: true,
          points: true,
        },
      });

      const breakdown: ReputationBreakdown = {
        topicsCreated: 0,
        repliesCreated: 0,
        upvotesReceived: 0,
        downvotesReceived: 0,
        bestAnswers: 0,
        badgesEarned: 0,
        penalties: 0,
      };

      history.forEach((entry) => {
        switch (entry.eventType) {
          case 'topic_created':
            breakdown.topicsCreated += entry.points;
            break;
          case 'reply_created':
            breakdown.repliesCreated += entry.points;
            break;
          case 'upvote_received':
            breakdown.upvotesReceived += entry.points;
            break;
          case 'downvote_received':
            breakdown.downvotesReceived += entry.points;
            break;
          case 'best_answer':
            breakdown.bestAnswers += entry.points;
            break;
          case 'badge_earned':
            breakdown.badgesEarned += entry.points;
            break;
          case 'penalty':
            breakdown.penalties += entry.points;
            break;
        }
      });

      return breakdown;
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          module: 'forum',
          repository: 'ReputationRepository',
          operation: 'getReputationBreakdown',
        },
        extra: { userId },
      });
      throw error;
    }
  }

  /**
   * Get recent reputation history
   */
  async getRecentHistory(userId: string, limit: number = 10) {
    try {
      return await this.prisma.reputationHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          eventType: true,
          points: true,
          description: true,
          referenceId: true,
          createdAt: true,
        },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          module: 'forum',
          repository: 'ReputationRepository',
          operation: 'getRecentHistory',
        },
        extra: { userId, limit },
      });
      throw error;
    }
  }

  /**
   * Get complete reputation data
   */
  async getReputationData(userId: string): Promise<ReputationData> {
    try {
      const [userReputation, breakdown, recentHistory] = await Promise.all([
        this.getUserReputation(userId),
        this.getReputationBreakdown(userId),
        this.getRecentHistory(userId),
      ]);

      return {
        totalReputation: userReputation.totalReputation,
        level: userReputation.level,
        breakdown,
        recentHistory,
      };
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          module: 'forum',
          repository: 'ReputationRepository',
          operation: 'getReputationData',
        },
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
    eventType: ReputationEventType;
    points: number;
    description: string;
    referenceId?: string;
  }) {
    try {
      const history = await this.prisma.reputationHistory.create({
        data: {
          userId: data.userId,
          eventType: data.eventType,
          points: data.points,
          description: data.description,
          referenceId: data.referenceId || null,
        },
      });

      // Update user reputation after creating history
      await this.updateUserReputation(data.userId);

      return history;
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          module: 'forum',
          repository: 'ReputationRepository',
          operation: 'createReputationHistory',
        },
        extra: { data },
      });
      throw error;
    }
  }

  /**
   * Award reputation for topic creation
   */
  async awardTopicCreation(userId: string, topicId: string) {
    try {
      return await this.createReputationHistory({
        userId,
        eventType: 'topic_created',
        points: 5,
        description: 'Created a new topic',
        referenceId: topicId,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          module: 'forum',
          repository: 'ReputationRepository',
          operation: 'awardTopicCreation',
        },
        extra: { userId, topicId },
      });
      throw error;
    }
  }

  /**
   * Award reputation for reply creation
   */
  async awardReplyCreation(userId: string, replyId: string) {
    try {
      return await this.createReputationHistory({
        userId,
        eventType: 'reply_created',
        points: 2,
        description: 'Posted a reply',
        referenceId: replyId,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          module: 'forum',
          repository: 'ReputationRepository',
          operation: 'awardReplyCreation',
        },
        extra: { userId, replyId },
      });
      throw error;
    }
  }

  /**
   * Award reputation for best answer
   */
  async awardBestAnswer(userId: string, replyId: string) {
    try {
      return await this.createReputationHistory({
        userId,
        eventType: 'best_answer',
        points: 25,
        description: 'Reply marked as best answer',
        referenceId: replyId,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          module: 'forum',
          repository: 'ReputationRepository',
          operation: 'awardBestAnswer',
        },
        extra: { userId, replyId },
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
