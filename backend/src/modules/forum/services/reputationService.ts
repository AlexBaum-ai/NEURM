import { injectable } from 'tsyringe';
import * as Sentry from '@sentry/node';
import { ReputationRepository } from '../repositories/ReputationRepository';
import { ReputationLevel } from '@prisma/client';

/**
 * ReputationService
 *
 * Business logic for the reputation system:
 * - Reputation calculation and tracking
 * - Level progression
 * - Reputation-based permissions
 * - Activity rewards
 *
 * Reputation Points:
 * - Topic created: +5 points
 * - Reply created: +2 points
 * - Upvote received: +10 points (handled by VoteService)
 * - Downvote received: -5 points (handled by VoteService)
 * - Best answer: +25 points
 *
 * Reputation Levels:
 * - Newcomer: 0-99 points
 * - Contributor: 100-499 points
 * - Expert: 500-999 points
 * - Master: 1000-2499 points
 * - Legend: 2500+ points
 */

export interface ReputationResponse {
  userId: string;
  totalReputation: number;
  level: ReputationLevel;
  levelProgress: {
    current: number;
    nextLevelThreshold: number | null;
    percentage: number;
  };
  breakdown: {
    topicsCreated: number;
    repliesCreated: number;
    upvotesReceived: number;
    downvotesReceived: number;
    bestAnswers: number;
    badgesEarned: number;
    penalties: number;
  };
  recentActivity: Array<{
    id: string;
    eventType: string;
    points: number;
    description: string;
    referenceId: string | null;
    createdAt: Date;
  }>;
  permissions: {
    canDownvote: boolean;
    canEditOthersContent: boolean;
    canModerate: boolean;
  };
}

@injectable()
export class ReputationService {
  // Reputation thresholds for levels
  private readonly LEVEL_THRESHOLDS = {
    newcomer: 0,
    contributor: 100,
    expert: 500,
    master: 1000,
    legend: 2500,
  };

  // Permission thresholds
  private readonly MIN_REPUTATION_TO_DOWNVOTE = 50;
  private readonly MIN_REPUTATION_TO_EDIT = 500;
  private readonly MIN_REPUTATION_TO_MODERATE = 1000;

  constructor(private reputationRepository: ReputationRepository) {}

  /**
   * Get user reputation with complete details
   */
  async getUserReputation(userId: string): Promise<ReputationResponse> {
    try {
      const reputationData = await this.reputationRepository.getReputationData(userId);

      const levelProgress = this.calculateLevelProgress(
        reputationData.totalReputation,
        reputationData.level
      );

      const permissions = this.calculatePermissions(reputationData.totalReputation);

      return {
        userId,
        totalReputation: reputationData.totalReputation,
        level: reputationData.level,
        levelProgress,
        breakdown: reputationData.breakdown,
        recentActivity: reputationData.recentHistory,
        permissions,
      };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', service: 'ReputationService', operation: 'getUserReputation' },
        extra: { userId },
      });
      throw error;
    }
  }

  /**
   * Award reputation for creating a topic
   */
  async awardTopicCreation(userId: string, topicId: string): Promise<void> {
    try {
      await this.reputationRepository.awardTopicCreation(userId, topicId);

      Sentry.addBreadcrumb({
        category: 'forum',
        message: 'Reputation awarded for topic creation',
        level: 'info',
        data: {
          userId,
          topicId,
          points: 5,
        },
      });
    } catch (error) {
      // Log error but don't fail the topic creation
      Sentry.captureException(error, {
        tags: { module: 'forum', service: 'ReputationService', operation: 'awardTopicCreation' },
        extra: { userId, topicId },
      });
    }
  }

  /**
   * Award reputation for creating a reply
   */
  async awardReplyCreation(userId: string, replyId: string): Promise<void> {
    try {
      await this.reputationRepository.awardReplyCreation(userId, replyId);

      Sentry.addBreadcrumb({
        category: 'forum',
        message: 'Reputation awarded for reply creation',
        level: 'info',
        data: {
          userId,
          replyId,
          points: 2,
        },
      });
    } catch (error) {
      // Log error but don't fail the reply creation
      Sentry.captureException(error, {
        tags: { module: 'forum', service: 'ReputationService', operation: 'awardReplyCreation' },
        extra: { userId, replyId },
      });
    }
  }

  /**
   * Award reputation for best answer
   */
  async awardBestAnswer(userId: string, replyId: string): Promise<void> {
    try {
      await this.reputationRepository.awardBestAnswer(userId, replyId);

      Sentry.addBreadcrumb({
        category: 'forum',
        message: 'Reputation awarded for best answer',
        level: 'info',
        data: {
          userId,
          replyId,
          points: 25,
        },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', service: 'ReputationService', operation: 'awardBestAnswer' },
        extra: { userId, replyId },
      });
      throw error;
    }
  }

  /**
   * Check if user has permission to downvote
   */
  async canUserDownvote(userId: string): Promise<boolean> {
    try {
      const reputation = await this.reputationRepository.getUserReputation(userId);
      return reputation.totalReputation >= this.MIN_REPUTATION_TO_DOWNVOTE;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', service: 'ReputationService', operation: 'canUserDownvote' },
        extra: { userId },
      });
      return false;
    }
  }

  /**
   * Recalculate and update user reputation
   * Used when reputation history is modified
   */
  async recalculateReputation(userId: string): Promise<void> {
    try {
      await this.reputationRepository.updateUserReputation(userId);

      Sentry.addBreadcrumb({
        category: 'forum',
        message: 'User reputation recalculated',
        level: 'info',
        data: { userId },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', service: 'ReputationService', operation: 'recalculateReputation' },
        extra: { userId },
      });
      throw error;
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Calculate level progress towards next level
   */
  private calculateLevelProgress(
    totalReputation: number,
    currentLevel: ReputationLevel
  ): {
    current: number;
    nextLevelThreshold: number | null;
    percentage: number;
  } {
    const levels: ReputationLevel[] = ['newcomer', 'contributor', 'expert', 'master', 'legend'];
    const currentIndex = levels.indexOf(currentLevel);
    const nextLevel = currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;

    if (!nextLevel) {
      // Already at max level
      return {
        current: totalReputation,
        nextLevelThreshold: null,
        percentage: 100,
      };
    }

    const currentThreshold = this.LEVEL_THRESHOLDS[currentLevel];
    const nextThreshold = this.LEVEL_THRESHOLDS[nextLevel];
    const progress = totalReputation - currentThreshold;
    const requiredForNext = nextThreshold - currentThreshold;
    const percentage = Math.min(100, Math.round((progress / requiredForNext) * 100));

    return {
      current: totalReputation,
      nextLevelThreshold: nextThreshold,
      percentage,
    };
  }

  /**
   * Calculate user permissions based on reputation
   */
  private calculatePermissions(totalReputation: number): {
    canDownvote: boolean;
    canEditOthersContent: boolean;
    canModerate: boolean;
  } {
    return {
      canDownvote: totalReputation >= this.MIN_REPUTATION_TO_DOWNVOTE,
      canEditOthersContent: totalReputation >= this.MIN_REPUTATION_TO_EDIT,
      canModerate: totalReputation >= this.MIN_REPUTATION_TO_MODERATE,
    };
  }
}
