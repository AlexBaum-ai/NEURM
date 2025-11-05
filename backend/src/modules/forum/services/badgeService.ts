import { injectable } from 'tsyringe';
import { Badge, BadgeCategory, BadgeType, PrismaClient } from '@prisma/client';
import * as Sentry from '@sentry/node';
import {
  BadgeRepository,
  BadgeWithProgress,
  UserBadgeWithDetails,
  BadgeProgress,
} from '../repositories/BadgeRepository';

/**
 * BadgeService
 *
 * Business logic for badge system:
 * - Badge retrieval and filtering
 * - Badge awarding logic
 * - Badge criteria evaluation
 * - Progress tracking
 * - Badge notifications
 */

export interface BadgeCriteria {
  type:
    | 'reply_count'
    | 'topic_count'
    | 'upvote_count'
    | 'reputation'
    | 'best_answer_count'
    | 'streak_days'
    | 'vote_count'
    | 'accepted_answer_count';
  threshold: number;
  timeframe?: 'all_time' | '30_days' | '7_days';
}

export interface BadgeEvaluationResult {
  badgeId: string;
  isEarned: boolean;
  currentProgress: number;
  threshold: number;
  percentage: number;
}

@injectable()
export class BadgeService {
  private prisma: PrismaClient;

  constructor(private badgeRepository: BadgeRepository) {
    this.prisma = new PrismaClient();
  }

  /**
   * Get all badges
   */
  async getAllBadges(): Promise<Badge[]> {
    try {
      return await this.badgeRepository.getAllBadges();
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', service: 'badgeService', operation: 'getAllBadges' },
      });
      throw error;
    }
  }

  /**
   * Get badges by category
   */
  async getBadgesByCategory(category: BadgeCategory): Promise<Badge[]> {
    try {
      return await this.badgeRepository.getBadgesByCategory(category);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', service: 'badgeService', operation: 'getBadgesByCategory' },
        extra: { category },
      });
      throw error;
    }
  }

  /**
   * Get user's earned badges
   */
  async getUserBadges(userId: string): Promise<UserBadgeWithDetails[]> {
    try {
      // Verify user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      return await this.badgeRepository.getUserBadges(userId);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', service: 'badgeService', operation: 'getUserBadges' },
        extra: { userId },
      });
      throw error;
    }
  }

  /**
   * Get all badges with user's progress
   */
  async getAllBadgesWithUserProgress(userId: string): Promise<BadgeWithProgress[]> {
    try {
      return await this.badgeRepository.getAllBadgesWithUserProgress(userId);
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          module: 'forum',
          service: 'badgeService',
          operation: 'getAllBadgesWithUserProgress',
        },
        extra: { userId },
      });
      throw error;
    }
  }

  /**
   * Evaluate badge criteria for a user
   */
  async evaluateBadgeCriteria(
    userId: string,
    badgeId: string
  ): Promise<BadgeEvaluationResult> {
    try {
      const badge = await this.badgeRepository.getBadgeById(badgeId);

      if (!badge) {
        throw new Error('Badge not found');
      }

      const criteria = badge.criteria as BadgeCriteria;
      const currentProgress = await this.calculateProgress(userId, criteria);
      const threshold = criteria.threshold;
      const percentage = Math.min(100, Math.round((currentProgress / threshold) * 100));
      const isEarned = currentProgress >= threshold;

      return {
        badgeId,
        isEarned,
        currentProgress,
        threshold,
        percentage,
      };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', service: 'badgeService', operation: 'evaluateBadgeCriteria' },
        extra: { userId, badgeId },
      });
      throw error;
    }
  }

  /**
   * Calculate progress for badge criteria
   */
  private async calculateProgress(userId: string, criteria: BadgeCriteria): Promise<number> {
    try {
      const timeFilter = this.getTimeFilter(criteria.timeframe);

      switch (criteria.type) {
        case 'reply_count':
          return await this.prisma.reply.count({
            where: {
              authorId: userId,
              isDeleted: false,
              ...timeFilter,
            },
          });

        case 'topic_count':
          return await this.prisma.topic.count({
            where: {
              authorId: userId,
              isDraft: false,
              ...timeFilter,
            },
          });

        case 'upvote_count':
          const topicUpvotes = await this.prisma.topicVote.count({
            where: {
              topic: { authorId: userId },
              value: 1,
              ...timeFilter,
            },
          });
          const replyUpvotes = await this.prisma.replyVote.count({
            where: {
              reply: { authorId: userId },
              value: 1,
              ...timeFilter,
            },
          });
          return topicUpvotes + replyUpvotes;

        case 'reputation':
          const reputation = await this.prisma.userReputation.findUnique({
            where: { userId },
            select: { totalReputation: true },
          });
          return reputation?.totalReputation || 0;

        case 'best_answer_count':
        case 'accepted_answer_count':
          return await this.prisma.reply.count({
            where: {
              authorId: userId,
              isAccepted: true,
              ...timeFilter,
            },
          });

        case 'streak_days':
          // Calculate consecutive days of activity
          return await this.calculateActivityStreak(userId);

        case 'vote_count':
          // Total votes cast by user
          const topicVotes = await this.prisma.topicVote.count({
            where: {
              userId,
              ...timeFilter,
            },
          });
          const replyVotes = await this.prisma.replyVote.count({
            where: {
              userId,
              ...timeFilter,
            },
          });
          return topicVotes + replyVotes;

        default:
          return 0;
      }
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', service: 'badgeService', operation: 'calculateProgress' },
        extra: { userId, criteria },
      });
      throw error;
    }
  }

  /**
   * Get time filter for timeframe
   */
  private getTimeFilter(timeframe?: string) {
    if (!timeframe || timeframe === 'all_time') {
      return {};
    }

    const now = new Date();
    const daysAgo = timeframe === '30_days' ? 30 : 7;
    const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    return {
      createdAt: {
        gte: startDate,
      },
    };
  }

  /**
   * Calculate user's activity streak in days
   */
  private async calculateActivityStreak(userId: string): Promise<number> {
    try {
      // Get user's activity dates (topics and replies)
      const activities = await this.prisma.$queryRaw<Array<{ date: Date }>>`
        SELECT DISTINCT DATE(created_at) as date
        FROM (
          SELECT created_at FROM topics WHERE author_id = ${userId}
          UNION ALL
          SELECT created_at FROM replies WHERE author_id = ${userId} AND is_deleted = false
        ) as activities
        ORDER BY date DESC
        LIMIT 365
      `;

      if (activities.length === 0) {
        return 0;
      }

      let streak = 1;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if most recent activity is today or yesterday
      const mostRecent = new Date(activities[0].date);
      mostRecent.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor((today.getTime() - mostRecent.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff > 1) {
        // Streak broken
        return 0;
      }

      // Count consecutive days
      for (let i = 1; i < activities.length; i++) {
        const currentDate = new Date(activities[i - 1].date);
        const previousDate = new Date(activities[i].date);
        currentDate.setHours(0, 0, 0, 0);
        previousDate.setHours(0, 0, 0, 0);

        const diff = Math.floor(
          (currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diff === 1) {
          streak++;
        } else {
          break;
        }
      }

      return streak;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', service: 'badgeService', operation: 'calculateActivityStreak' },
        extra: { userId },
      });
      return 0;
    }
  }

  /**
   * Check and award badges for user
   * This is called by background job or after significant user actions
   */
  async checkAndAwardBadges(userId: string): Promise<string[]> {
    try {
      const allBadges = await this.badgeRepository.getAllBadges();
      const awardedBadgeIds: string[] = [];

      for (const badge of allBadges) {
        // Check if user already has badge
        const hasEarned = await this.badgeRepository.hasUserEarnedBadge(userId, badge.id);

        if (hasEarned) {
          continue;
        }

        // Evaluate badge criteria
        const evaluation = await this.evaluateBadgeCriteria(userId, badge.id);

        // Update progress
        await this.badgeRepository.updateBadgeProgress(
          userId,
          badge.id,
          evaluation.currentProgress
        );

        // Award badge if criteria met
        if (evaluation.isEarned) {
          await this.badgeRepository.awardBadge(userId, badge.id, evaluation.currentProgress);
          awardedBadgeIds.push(badge.id);

          // Create notification (will be implemented in notification service)
          await this.createBadgeNotification(userId, badge);

          Sentry.addBreadcrumb({
            category: 'forum',
            message: 'Badge awarded',
            level: 'info',
            data: {
              userId,
              badgeId: badge.id,
              badgeName: badge.name,
            },
          });
        }
      }

      return awardedBadgeIds;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', service: 'badgeService', operation: 'checkAndAwardBadges' },
        extra: { userId },
      });
      throw error;
    }
  }

  /**
   * Create notification for badge earned
   */
  private async createBadgeNotification(userId: string, badge: Badge): Promise<void> {
    try {
      await this.prisma.notification.create({
        data: {
          userId,
          type: 'badge',
          title: 'Badge Earned!',
          message: `Congratulations! You've earned the "${badge.name}" badge.`,
          actionUrl: `/profile?tab=badges`,
          referenceId: badge.id,
        },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', service: 'badgeService', operation: 'createBadgeNotification' },
        extra: { userId, badgeId: badge.id },
      });
      // Don't throw - notification failure shouldn't break badge awarding
    }
  }

  /**
   * Get badge progress for all badges for a user
   */
  async getBadgeProgressForUser(userId: string): Promise<BadgeProgress[]> {
    try {
      const badges = await this.badgeRepository.getAllBadges();
      const progress: BadgeProgress[] = [];

      for (const badge of badges) {
        const evaluation = await this.evaluateBadgeCriteria(userId, badge.id);
        const hasEarned = await this.badgeRepository.hasUserEarnedBadge(userId, badge.id);

        progress.push({
          badgeId: badge.id,
          badgeName: badge.name,
          current: evaluation.currentProgress,
          threshold: evaluation.threshold,
          percentage: evaluation.percentage,
          isEarned: hasEarned,
        });
      }

      return progress;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', service: 'badgeService', operation: 'getBadgeProgressForUser' },
        extra: { userId },
      });
      throw error;
    }
  }

  /**
   * Get badge by ID
   */
  async getBadgeById(badgeId: string): Promise<Badge> {
    try {
      const badge = await this.badgeRepository.getBadgeById(badgeId);

      if (!badge) {
        throw new Error('Badge not found');
      }

      return badge;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', service: 'badgeService', operation: 'getBadgeById' },
        extra: { badgeId },
      });
      throw error;
    }
  }

  /**
   * Get users who have earned a specific badge
   */
  async getBadgeHolders(badgeId: string, limit: number = 50) {
    try {
      const badge = await this.badgeRepository.getBadgeById(badgeId);

      if (!badge) {
        throw new Error('Badge not found');
      }

      return await this.badgeRepository.getBadgeHolders(badgeId, limit);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', service: 'badgeService', operation: 'getBadgeHolders' },
        extra: { badgeId, limit },
      });
      throw error;
    }
  }
}
