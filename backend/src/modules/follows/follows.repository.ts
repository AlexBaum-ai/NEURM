import { PrismaClient, FollowableType, Prisma } from '@prisma/client';

export class FollowsRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a follow relationship
   */
  async create(data: {
    followerId: string;
    followableType: FollowableType;
    followableId: string;
  }) {
    return this.prisma.polymorphicFollow.create({
      data,
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Delete a follow relationship
   */
  async delete(id: string, followerId: string) {
    return this.prisma.polymorphicFollow.delete({
      where: {
        id,
        followerId, // Ensure user can only delete their own follows
      },
    });
  }

  /**
   * Delete by unique constraint
   */
  async deleteByConstraint(data: {
    followerId: string;
    followableType: FollowableType;
    followableId: string;
  }) {
    return this.prisma.polymorphicFollow.delete({
      where: {
        followerId_followableType_followableId: data,
      },
    });
  }

  /**
   * Find a follow by unique constraint
   */
  async findByConstraint(data: {
    followerId: string;
    followableType: FollowableType;
    followableId: string;
  }) {
    return this.prisma.polymorphicFollow.findUnique({
      where: {
        followerId_followableType_followableId: data,
      },
    });
  }

  /**
   * Find a follow by ID
   */
  async findById(id: string) {
    return this.prisma.polymorphicFollow.findUnique({
      where: { id },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Get all entities a user is following
   */
  async getFollowing(
    userId: string,
    options?: {
      type?: FollowableType;
      limit?: number;
      offset?: number;
    }
  ) {
    const where: Prisma.PolymorphicFollowWhereInput = {
      followerId: userId,
    };

    if (options?.type) {
      where.followableType = options.type;
    }

    return this.prisma.polymorphicFollow.findMany({
      where,
      take: options?.limit,
      skip: options?.offset,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get all users following an entity
   */
  async getFollowers(
    followableType: FollowableType,
    followableId: string,
    options?: {
      limit?: number;
      offset?: number;
    }
  ) {
    return this.prisma.polymorphicFollow.findMany({
      where: {
        followableType,
        followableId,
      },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                avatarUrl: true,
                bio: true,
              },
            },
          },
        },
      },
      take: options?.limit,
      skip: options?.offset,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Count followers for an entity
   */
  async countFollowers(followableType: FollowableType, followableId: string) {
    return this.prisma.polymorphicFollow.count({
      where: {
        followableType,
        followableId,
      },
    });
  }

  /**
   * Count following for a user
   */
  async countFollowing(userId: string, type?: FollowableType) {
    const where: Prisma.PolymorphicFollowWhereInput = {
      followerId: userId,
    };

    if (type) {
      where.followableType = type;
    }

    return this.prisma.polymorphicFollow.count({
      where,
    });
  }

  /**
   * Check if user is following an entity
   */
  async isFollowing(
    userId: string,
    followableType: FollowableType,
    followableId: string
  ): Promise<boolean> {
    const follow = await this.prisma.polymorphicFollow.findUnique({
      where: {
        followerId_followableType_followableId: {
          followerId: userId,
          followableType,
          followableId,
        },
      },
    });

    return !!follow;
  }

  /**
   * Get follower IDs for an entity (for feed generation)
   */
  async getFollowerIds(
    followableType: FollowableType,
    followableId: string
  ): Promise<string[]> {
    const follows = await this.prisma.polymorphicFollow.findMany({
      where: {
        followableType,
        followableId,
      },
      select: {
        followerId: true,
      },
    });

    return follows.map((f) => f.followerId);
  }

  /**
   * Get followed entity IDs by type
   */
  async getFollowedEntityIds(
    userId: string,
    followableType: FollowableType
  ): Promise<string[]> {
    const follows = await this.prisma.polymorphicFollow.findMany({
      where: {
        followerId: userId,
        followableType,
      },
      select: {
        followableId: true,
      },
    });

    return follows.map((f) => f.followableId);
  }

  /**
   * Batch check if user is following multiple entities
   */
  async batchIsFollowing(
    userId: string,
    entities: Array<{ type: FollowableType; id: string }>
  ): Promise<Map<string, boolean>> {
    const follows = await this.prisma.polymorphicFollow.findMany({
      where: {
        followerId: userId,
        OR: entities.map((e) => ({
          followableType: e.type,
          followableId: e.id,
        })),
      },
      select: {
        followableType: true,
        followableId: true,
      },
    });

    const followMap = new Map<string, boolean>();
    entities.forEach((e) => {
      const key = `${e.type}:${e.id}`;
      followMap.set(key, false);
    });

    follows.forEach((f) => {
      const key = `${f.followableType}:${f.followableId}`;
      followMap.set(key, true);
    });

    return followMap;
  }
}
