import { PrismaClient, ActivityType, PrivacyVisibility, Prisma } from '@prisma/client';

export class ActivitiesRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new activity
   */
  async create(data: {
    userId: string;
    activityType: ActivityType;
    targetType: string;
    targetId: string;
    privacy: PrivacyVisibility;
    metadata?: any;
  }) {
    return this.prisma.userActivity.create({
      data: {
        userId: data.userId,
        activityType: data.activityType,
        targetType: data.targetType as any,
        targetId: data.targetId,
        privacy: data.privacy,
        metadata: data.metadata || null,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Get activities for a specific user
   */
  async getActivitiesByUserId(
    userId: string,
    options?: {
      type?: ActivityType;
      limit?: number;
      offset?: number;
      viewerId?: string;
    }
  ) {
    const where: Prisma.UserActivityWhereInput = {
      userId,
    };

    if (options?.type) {
      where.activityType = options.type;
    }

    // Apply privacy filtering
    if (options?.viewerId) {
      if (options.viewerId !== userId) {
        // Check if viewer follows the user
        const isFollowing = await this.prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: options.viewerId,
              followingId: userId,
            },
          },
        });

        // Filter by privacy: public for everyone, community for followers
        if (isFollowing) {
          where.privacy = {
            in: ['public' as PrivacyVisibility, 'community' as PrivacyVisibility],
          };
        } else {
          where.privacy = 'public' as PrivacyVisibility;
        }
      }
      // If viewer is the owner, show all activities
    } else {
      // No viewer, only show public activities
      where.privacy = 'public' as PrivacyVisibility;
    }

    return this.prisma.userActivity.findMany({
      where,
      take: options?.limit,
      skip: options?.offset,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Get activity feed from followed users
   */
  async getFollowingFeed(
    userId: string,
    options?: {
      type?: ActivityType;
      limit?: number;
      offset?: number;
    }
  ) {
    // Get list of users being followed
    const following = await this.prisma.follow.findMany({
      where: {
        followerId: userId,
      },
      select: {
        followingId: true,
      },
    });

    const followingIds = following.map((f) => f.followingId);

    if (followingIds.length === 0) {
      return [];
    }

    const where: Prisma.UserActivityWhereInput = {
      userId: {
        in: followingIds,
      },
      // Show public and community activities from followed users
      privacy: {
        in: ['public' as PrivacyVisibility, 'community' as PrivacyVisibility],
      },
    };

    if (options?.type) {
      where.activityType = options.type;
    }

    return this.prisma.userActivity.findMany({
      where,
      take: options?.limit,
      skip: options?.offset,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Count activities for a user
   */
  async countUserActivities(
    userId: string,
    options?: {
      type?: ActivityType;
      viewerId?: string;
    }
  ): Promise<number> {
    const where: Prisma.UserActivityWhereInput = {
      userId,
    };

    if (options?.type) {
      where.activityType = options.type;
    }

    // Apply privacy filtering
    if (options?.viewerId && options.viewerId !== userId) {
      const isFollowing = await this.prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: options.viewerId,
            followingId: userId,
          },
        },
      });

      if (isFollowing) {
        where.privacy = {
          in: ['public' as PrivacyVisibility, 'community' as PrivacyVisibility],
        };
      } else {
        where.privacy = 'public' as PrivacyVisibility;
      }
    } else if (!options?.viewerId) {
      where.privacy = 'public' as PrivacyVisibility;
    }

    return this.prisma.userActivity.count({ where });
  }

  /**
   * Delete activities older than a certain date
   */
  async deleteOldActivities(beforeDate: Date) {
    return this.prisma.userActivity.deleteMany({
      where: {
        createdAt: {
          lt: beforeDate,
        },
      },
    });
  }

  /**
   * Delete activities by target (when target is deleted)
   */
  async deleteByTarget(targetType: string, targetId: string) {
    return this.prisma.userActivity.deleteMany({
      where: {
        targetType: targetType as any,
        targetId,
      },
    });
  }
}
