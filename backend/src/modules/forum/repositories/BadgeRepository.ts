import { injectable } from 'tsyringe';
import { PrismaClient, Badge, BadgeType, BadgeCategory, UserBadge } from '@prisma/client';
import * as Sentry from '@sentry/node';

/**
 * BadgeRepository
 *
 * Handles database operations for the badge system:
 * - Badge CRUD operations
 * - User badge tracking
 * - Badge progress tracking
 * - Badge awarding logic
 */

export interface BadgeWithProgress extends Badge {
  userProgress?: number;
  isEarned?: boolean;
}

export interface UserBadgeWithDetails extends UserBadge {
  badge: Badge;
}

export interface BadgeProgress {
  badgeId: string;
  badgeName: string;
  current: number;
  threshold: number;
  percentage: number;
  isEarned: boolean;
}

@injectable()
export class BadgeRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Get all badges
   */
  async getAllBadges(): Promise<Badge[]> {
    try {
      return await this.prisma.badge.findMany({
        orderBy: [{ badgeType: 'asc' }, { name: 'asc' }],
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', repository: 'BadgeRepository', operation: 'getAllBadges' },
      });
      throw error;
    }
  }

  /**
   * Get badges by category
   */
  async getBadgesByCategory(category: BadgeCategory): Promise<Badge[]> {
    try {
      return await this.prisma.badge.findMany({
        where: { category },
        orderBy: [{ badgeType: 'asc' }, { name: 'asc' }],
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', repository: 'BadgeRepository', operation: 'getBadgesByCategory' },
        extra: { category },
      });
      throw error;
    }
  }

  /**
   * Get badge by ID
   */
  async getBadgeById(badgeId: string): Promise<Badge | null> {
    try {
      return await this.prisma.badge.findUnique({
        where: { id: badgeId },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', repository: 'BadgeRepository', operation: 'getBadgeById' },
        extra: { badgeId },
      });
      throw error;
    }
  }

  /**
   * Get badge by slug
   */
  async getBadgeBySlug(slug: string): Promise<Badge | null> {
    try {
      return await this.prisma.badge.findUnique({
        where: { slug },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', repository: 'BadgeRepository', operation: 'getBadgeBySlug' },
        extra: { slug },
      });
      throw error;
    }
  }

  /**
   * Get user's earned badges
   */
  async getUserBadges(userId: string): Promise<UserBadgeWithDetails[]> {
    try {
      return await this.prisma.userBadge.findMany({
        where: { userId },
        include: {
          badge: true,
        },
        orderBy: { earnedAt: 'desc' },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', repository: 'BadgeRepository', operation: 'getUserBadges' },
        extra: { userId },
      });
      throw error;
    }
  }

  /**
   * Check if user has earned a specific badge
   */
  async hasUserEarnedBadge(userId: string, badgeId: string): Promise<boolean> {
    try {
      const userBadge = await this.prisma.userBadge.findUnique({
        where: {
          userId_badgeId: {
            userId,
            badgeId,
          },
        },
      });
      return userBadge !== null;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', repository: 'BadgeRepository', operation: 'hasUserEarnedBadge' },
        extra: { userId, badgeId },
      });
      throw error;
    }
  }

  /**
   * Award badge to user
   */
  async awardBadge(userId: string, badgeId: string, progress: number = 0): Promise<UserBadge> {
    try {
      // Check if already earned
      const existing = await this.prisma.userBadge.findUnique({
        where: {
          userId_badgeId: {
            userId,
            badgeId,
          },
        },
      });

      if (existing) {
        throw new Error('Badge already earned by user');
      }

      const userBadge = await this.prisma.userBadge.create({
        data: {
          userId,
          badgeId,
          progress,
        },
      });

      Sentry.addBreadcrumb({
        category: 'forum',
        message: 'Badge awarded to user',
        level: 'info',
        data: {
          userId,
          badgeId,
        },
      });

      return userBadge;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', repository: 'BadgeRepository', operation: 'awardBadge' },
        extra: { userId, badgeId, progress },
      });
      throw error;
    }
  }

  /**
   * Update badge progress for user
   */
  async updateBadgeProgress(
    userId: string,
    badgeId: string,
    progress: number
  ): Promise<UserBadge | null> {
    try {
      // Check if badge already earned
      const existing = await this.prisma.userBadge.findUnique({
        where: {
          userId_badgeId: {
            userId,
            badgeId,
          },
        },
      });

      if (existing) {
        // Badge already earned, don't update progress
        return existing;
      }

      // Create or update progress tracking
      const userBadge = await this.prisma.userBadge.upsert({
        where: {
          userId_badgeId: {
            userId,
            badgeId,
          },
        },
        update: {
          progress,
        },
        create: {
          userId,
          badgeId,
          progress,
        },
      });

      return userBadge;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', repository: 'BadgeRepository', operation: 'updateBadgeProgress' },
        extra: { userId, badgeId, progress },
      });
      throw error;
    }
  }

  /**
   * Get badge progress for user
   */
  async getBadgeProgress(userId: string, badgeId: string): Promise<number> {
    try {
      const userBadge = await this.prisma.userBadge.findUnique({
        where: {
          userId_badgeId: {
            userId,
            badgeId,
          },
        },
      });

      return userBadge?.progress || 0;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', repository: 'BadgeRepository', operation: 'getBadgeProgress' },
        extra: { userId, badgeId },
      });
      throw error;
    }
  }

  /**
   * Get all badges with user's progress and earned status
   */
  async getAllBadgesWithUserProgress(userId: string): Promise<BadgeWithProgress[]> {
    try {
      const badges = await this.prisma.badge.findMany({
        orderBy: [{ badgeType: 'asc' }, { name: 'asc' }],
      });

      const userBadges = await this.prisma.userBadge.findMany({
        where: { userId },
      });

      // Map user badge data to badges
      const badgesWithProgress: BadgeWithProgress[] = badges.map((badge) => {
        const userBadge = userBadges.find((ub) => ub.badgeId === badge.id);
        return {
          ...badge,
          userProgress: userBadge?.progress || 0,
          isEarned: userBadge !== undefined,
        };
      });

      return badgesWithProgress;
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          module: 'forum',
          repository: 'BadgeRepository',
          operation: 'getAllBadgesWithUserProgress',
        },
        extra: { userId },
      });
      throw error;
    }
  }

  /**
   * Get count of badges earned by user
   */
  async getUserBadgeCount(userId: string): Promise<number> {
    try {
      return await this.prisma.userBadge.count({
        where: { userId },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', repository: 'BadgeRepository', operation: 'getUserBadgeCount' },
        extra: { userId },
      });
      throw error;
    }
  }

  /**
   * Create a new badge (admin operation)
   */
  async createBadge(data: {
    name: string;
    slug: string;
    description: string;
    iconUrl: string;
    badgeType: BadgeType;
    category: BadgeCategory;
    criteria: any;
  }): Promise<Badge> {
    try {
      return await this.prisma.badge.create({
        data,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', repository: 'BadgeRepository', operation: 'createBadge' },
        extra: { data },
      });
      throw error;
    }
  }

  /**
   * Get users who have earned a specific badge
   */
  async getBadgeHolders(badgeId: string, limit: number = 50): Promise<UserBadgeWithDetails[]> {
    try {
      return await this.prisma.userBadge.findMany({
        where: { badgeId },
        include: {
          badge: true,
          user: {
            select: {
              id: true,
              username: true,
              profile: {
                select: {
                  displayName: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
        orderBy: { earnedAt: 'desc' },
        take: limit,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', repository: 'BadgeRepository', operation: 'getBadgeHolders' },
        extra: { badgeId, limit },
      });
      throw error;
    }
  }
}
