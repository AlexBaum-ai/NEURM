import { PrismaClient, ActivityType, PrivacyVisibility } from '@prisma/client';
import { Redis } from 'ioredis';
import * as Sentry from '@sentry/node';
import { ActivitiesRepository } from './activities.repository';
import {
  CreateActivityInput,
  GetUserActivityInput,
  GetFollowingFeedInput,
} from './activities.validation';

interface ActivityWithUser {
  id: string;
  userId: string;
  activityType: ActivityType;
  targetType: string;
  targetId: string;
  privacy: PrivacyVisibility;
  metadata: any;
  createdAt: Date;
  user: {
    id: string;
    username: string;
    profile: {
      firstName: string | null;
      lastName: string | null;
      avatarUrl: string | null;
    } | null;
  };
}

interface GroupedActivities {
  today: ActivityWithUser[];
  thisWeek: ActivityWithUser[];
  earlier: ActivityWithUser[];
}

export class ActivitiesService {
  private repository: ActivitiesRepository;

  constructor(
    private prisma: PrismaClient,
    private redis: Redis
  ) {
    this.repository = new ActivitiesRepository(prisma);
  }

  /**
   * Create a new activity
   */
  async createActivity(userId: string, input: CreateActivityInput) {
    try {
      const activity = await this.repository.create({
        userId,
        activityType: input.activityType as ActivityType,
        targetType: input.targetType,
        targetId: input.targetId,
        privacy: (input.privacy as PrivacyVisibility) || 'public',
        metadata: input.metadata,
      });

      // Invalidate cache for user's activity feed
      await this.invalidateActivityCache(userId);

      return activity;
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Get activities for a specific user with time grouping
   */
  async getUserActivities(
    input: GetUserActivityInput,
    viewerId?: string
  ) {
    try {
      // Find user by username
      const user = await this.prisma.user.findUnique({
        where: { username: input.username },
        select: { id: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Check cache
      const cacheKey = `activities:user:${user.id}:${input.type || 'all'}:${viewerId || 'public'}:${input.offset || 0}`;
      const cached = await this.redis.get(cacheKey);

      if (cached) {
        return JSON.parse(cached);
      }

      // Fetch activities
      const activities = await this.repository.getActivitiesByUserId(user.id, {
        type: input.type as ActivityType | undefined,
        limit: input.limit,
        offset: input.offset,
        viewerId,
      });

      // Get total count
      const total = await this.repository.countUserActivities(user.id, {
        type: input.type as ActivityType | undefined,
        viewerId,
      });

      // Group activities by time
      const grouped = this.groupActivitiesByTime(activities);

      const result = {
        activities: grouped,
        pagination: {
          total,
          limit: input.limit || 20,
          offset: input.offset || 0,
          hasMore: (input.offset || 0) + activities.length < total,
        },
      };

      // Cache for 2 minutes
      await this.redis.setex(cacheKey, 120, JSON.stringify(result));

      return result;
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Get activity feed from followed users
   */
  async getFollowingFeed(userId: string, input: GetFollowingFeedInput) {
    try {
      // Check cache
      const cacheKey = `activities:feed:${userId}:${input.type || 'all'}:${input.offset || 0}`;
      const cached = await this.redis.get(cacheKey);

      if (cached) {
        return JSON.parse(cached);
      }

      // Fetch activities from followed users
      const activities = await this.repository.getFollowingFeed(userId, {
        type: input.type as ActivityType | undefined,
        limit: input.limit,
        offset: input.offset,
      });

      // Group activities by time
      const grouped = this.groupActivitiesByTime(activities);

      const result = {
        activities: grouped,
        pagination: {
          limit: input.limit || 20,
          offset: input.offset || 0,
          hasMore: activities.length === (input.limit || 20),
        },
      };

      // Cache for 1 minute (fresher feed)
      await this.redis.setex(cacheKey, 60, JSON.stringify(result));

      return result;
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Group activities by time periods: Today, This Week, Earlier
   */
  private groupActivitiesByTime(activities: ActivityWithUser[]): GroupedActivities {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Calculate start of this week (Monday)
    const dayOfWeek = now.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(todayStart);
    weekStart.setDate(todayStart.getDate() - daysToMonday);

    const grouped: GroupedActivities = {
      today: [],
      thisWeek: [],
      earlier: [],
    };

    for (const activity of activities) {
      const activityDate = new Date(activity.createdAt);

      if (activityDate >= todayStart) {
        grouped.today.push(activity);
      } else if (activityDate >= weekStart) {
        grouped.thisWeek.push(activity);
      } else {
        grouped.earlier.push(activity);
      }
    }

    return grouped;
  }

  /**
   * Invalidate cache for user's activity feed
   */
  private async invalidateActivityCache(userId: string) {
    try {
      // Delete all cache keys related to this user's activities
      const pattern = `activities:user:${userId}:*`;
      const keys = await this.redis.keys(pattern);

      if (keys.length > 0) {
        await this.redis.del(...keys);
      }

      // Also invalidate feed cache for followers
      const followers = await this.prisma.follow.findMany({
        where: { followingId: userId },
        select: { followerId: true },
      });

      for (const follower of followers) {
        const feedPattern = `activities:feed:${follower.followerId}:*`;
        const feedKeys = await this.redis.keys(feedPattern);
        if (feedKeys.length > 0) {
          await this.redis.del(...feedKeys);
        }
      }
    } catch (error) {
      // Log but don't throw - cache invalidation failure shouldn't break the request
      Sentry.captureException(error);
    }
  }

  /**
   * Track activity (helper method to be called from other modules)
   */
  async trackActivity(
    userId: string,
    activityType: ActivityType,
    targetType: string,
    targetId: string,
    privacy: PrivacyVisibility = 'public',
    metadata?: any
  ) {
    return this.createActivity(userId, {
      activityType: activityType as any,
      targetType: targetType as any,
      targetId,
      privacy: privacy as any,
      metadata,
    });
  }

  /**
   * Clean up old activities (to be called by a cron job)
   */
  async cleanUpOldActivities(daysOld: number = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.repository.deleteOldActivities(cutoffDate);
    return { deletedCount: result.count };
  }
}
