import { PrismaClient, FollowableType, NotificationType } from '@prisma/client';
import { Redis } from 'ioredis';
import * as Sentry from '@sentry/node';
import { FollowsRepository } from './follows.repository';
import {
  CreateFollowInput,
  GetFollowingInput,
  GetFollowersInput,
  GetFeedInput,
} from './follows.validation';

export class FollowsService {
  private followsRepo: FollowsRepository;
  private readonly FEED_CACHE_TTL = 15 * 60; // 15 minutes
  private readonly FEED_CACHE_PREFIX = 'following_feed:';

  constructor(
    private prisma: PrismaClient,
    private redis: Redis
  ) {
    this.followsRepo = new FollowsRepository(prisma);
  }

  /**
   * Create a follow relationship
   */
  async createFollow(userId: string, data: CreateFollowInput) {
    const transaction = Sentry.startTransaction({
      op: 'service',
      name: 'FollowsService.createFollow',
    });

    try {
      // Prevent self-following for users
      if (data.followableType === 'user' && data.followableId === userId) {
        throw new Error('Cannot follow yourself');
      }

      // Check if entity exists and is valid
      await this.validateFollowableEntity(
        data.followableType,
        data.followableId
      );

      // Check if already following
      const existingFollow = await this.followsRepo.findByConstraint({
        followerId: userId,
        followableType: data.followableType,
        followableId: data.followableId,
      });

      if (existingFollow) {
        throw new Error('Already following this entity');
      }

      // Create the follow
      const follow = await this.followsRepo.create({
        followerId: userId,
        followableType: data.followableType,
        followableId: data.followableId,
      });

      // Send notification if following a user
      if (data.followableType === 'user') {
        await this.sendFollowNotification(userId, data.followableId);
      }

      // Invalidate feed cache
      await this.invalidateFeedCache(userId);

      transaction.finish();
      return follow;
    } catch (error) {
      transaction.finish();
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Unfollow an entity
   */
  async unfollow(userId: string, followId: string) {
    const transaction = Sentry.startTransaction({
      op: 'service',
      name: 'FollowsService.unfollow',
    });

    try {
      // Verify follow exists and belongs to user
      const follow = await this.followsRepo.findById(followId);
      if (!follow) {
        throw new Error('Follow relationship not found');
      }

      if (follow.followerId !== userId) {
        throw new Error('Unauthorized to unfollow this entity');
      }

      // Delete the follow
      await this.followsRepo.delete(followId, userId);

      // Invalidate feed cache
      await this.invalidateFeedCache(userId);

      transaction.finish();
      return { success: true, message: 'Unfollowed successfully' };
    } catch (error) {
      transaction.finish();
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Get entities a user is following
   */
  async getFollowing(params: GetFollowingInput) {
    const transaction = Sentry.startTransaction({
      op: 'service',
      name: 'FollowsService.getFollowing',
    });

    try {
      // Check privacy settings
      const user = await this.prisma.user.findUnique({
        where: { id: params.userId },
        include: {
          privacySettings: true,
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Get following list
      const following = await this.followsRepo.getFollowing(params.userId, {
        type: params.type,
        limit: params.limit,
        offset: params.offset,
      });

      // Enrich with entity details
      const enrichedFollowing = await this.enrichFollowingList(following);

      const total = await this.followsRepo.countFollowing(
        params.userId,
        params.type
      );

      transaction.finish();
      return {
        data: enrichedFollowing,
        total,
        limit: params.limit || 20,
        offset: params.offset || 0,
      };
    } catch (error) {
      transaction.finish();
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Get followers of an entity
   */
  async getFollowers(params: GetFollowersInput) {
    const transaction = Sentry.startTransaction({
      op: 'service',
      name: 'FollowsService.getFollowers',
    });

    try {
      // Validate entity exists
      await this.validateFollowableEntity(
        params.followableType,
        params.followableId
      );

      // Get followers
      const followers = await this.followsRepo.getFollowers(
        params.followableType,
        params.followableId,
        {
          limit: params.limit,
          offset: params.offset,
        }
      );

      const total = await this.followsRepo.countFollowers(
        params.followableType,
        params.followableId
      );

      transaction.finish();
      return {
        data: followers,
        total,
        limit: params.limit || 20,
        offset: params.offset || 0,
      };
    } catch (error) {
      transaction.finish();
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Get activity feed from followed entities
   */
  async getFollowingFeed(userId: string, params: GetFeedInput) {
    const transaction = Sentry.startTransaction({
      op: 'service',
      name: 'FollowsService.getFollowingFeed',
    });

    try {
      // Try to get from cache
      const cacheKey = `${this.FEED_CACHE_PREFIX}${userId}:${params.type}:${params.limit}:${params.offset}`;
      const cached = await this.redis.get(cacheKey);

      if (cached) {
        transaction.finish();
        return JSON.parse(cached);
      }

      // Get followed entities by type
      const followedUsers = await this.followsRepo.getFollowedEntityIds(
        userId,
        'user'
      );
      const followedCompanies = await this.followsRepo.getFollowedEntityIds(
        userId,
        'company'
      );
      const followedCategories = await this.followsRepo.getFollowedEntityIds(
        userId,
        'category'
      );
      const followedTags = await this.followsRepo.getFollowedEntityIds(
        userId,
        'tag'
      );

      // Build feed based on type filter
      const feed: any[] = [];

      // Get articles from followed categories and users
      if (params.type === 'all' || params.type === 'articles') {
        const articles = await this.getArticlesForFeed(
          followedUsers,
          followedCategories
        );
        feed.push(...articles);
      }

      // Get topics from followed tags and users
      if (params.type === 'all' || params.type === 'topics') {
        const topics = await this.getTopicsForFeed(followedUsers, followedTags);
        feed.push(...topics);
      }

      // Get jobs from followed companies
      if (params.type === 'all' || params.type === 'jobs') {
        const jobs = await this.getJobsForFeed(followedCompanies);
        feed.push(...jobs);
      }

      // Sort by recency
      feed.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // Apply pagination
      const paginatedFeed = feed.slice(
        params.offset || 0,
        (params.offset || 0) + (params.limit || 20)
      );

      const result = {
        data: paginatedFeed,
        total: feed.length,
        limit: params.limit || 20,
        offset: params.offset || 0,
      };

      // Cache the result
      await this.redis.setex(
        cacheKey,
        this.FEED_CACHE_TTL,
        JSON.stringify(result)
      );

      transaction.finish();
      return result;
    } catch (error) {
      transaction.finish();
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Check if user is following an entity
   */
  async isFollowing(
    userId: string,
    followableType: FollowableType,
    followableId: string
  ): Promise<boolean> {
    return this.followsRepo.isFollowing(userId, followableType, followableId);
  }

  /**
   * Validate that a followable entity exists
   */
  private async validateFollowableEntity(
    type: FollowableType,
    id: string
  ): Promise<void> {
    let exists = false;

    switch (type) {
      case 'user':
        exists = !!(await this.prisma.user.findUnique({ where: { id } }));
        break;
      case 'company':
        exists = !!(await this.prisma.company.findUnique({ where: { id } }));
        break;
      case 'tag':
        const newsTag = await this.prisma.newsTag.findUnique({
          where: { id },
        });
        const forumTag = await this.prisma.forumTag.findUnique({
          where: { id },
        });
        exists = !!(newsTag || forumTag);
        break;
      case 'category':
        const newsCategory = await this.prisma.newsCategory.findUnique({
          where: { id },
        });
        const forumCategory = await this.prisma.forumCategory.findUnique({
          where: { id },
        });
        exists = !!(newsCategory || forumCategory);
        break;
      case 'model':
        exists = !!(await this.prisma.lLMModel.findUnique({ where: { id } }));
        break;
    }

    if (!exists) {
      throw new Error(`${type} not found`);
    }
  }

  /**
   * Send notification when someone follows a user
   */
  private async sendFollowNotification(
    followerId: string,
    followedUserId: string
  ): Promise<void> {
    try {
      const follower = await this.prisma.user.findUnique({
        where: { id: followerId },
        select: { username: true },
      });

      if (!follower) return;

      await this.prisma.notification.create({
        data: {
          userId: followedUserId,
          type: 'follow' as NotificationType,
          title: 'New Follower',
          message: `${follower.username} started following you`,
          actionUrl: `/u/${follower.username}`,
          referenceId: followerId,
        },
      });
    } catch (error) {
      Sentry.captureException(error);
      // Don't throw - notification failure shouldn't break follow
    }
  }

  /**
   * Invalidate feed cache
   */
  private async invalidateFeedCache(userId: string): Promise<void> {
    try {
      const pattern = `${this.FEED_CACHE_PREFIX}${userId}:*`;
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      Sentry.captureException(error);
      // Don't throw - cache invalidation failure shouldn't break operation
    }
  }

  /**
   * Enrich following list with entity details
   */
  private async enrichFollowingList(following: any[]): Promise<any[]> {
    const enriched = await Promise.all(
      following.map(async (follow) => {
        let entity = null;

        switch (follow.followableType) {
          case 'user':
            entity = await this.prisma.user.findUnique({
              where: { id: follow.followableId },
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
            });
            break;
          case 'company':
            entity = await this.prisma.company.findUnique({
              where: { id: follow.followableId },
              select: {
                id: true,
                name: true,
                slug: true,
                logoUrl: true,
                description: true,
                followerCount: true,
              },
            });
            break;
          case 'tag':
            const newsTag = await this.prisma.newsTag.findUnique({
              where: { id: follow.followableId },
            });
            const forumTag = await this.prisma.forumTag.findUnique({
              where: { id: follow.followableId },
            });
            entity = newsTag || forumTag;
            break;
          case 'category':
            const newsCategory = await this.prisma.newsCategory.findUnique({
              where: { id: follow.followableId },
            });
            const forumCategory = await this.prisma.forumCategory.findUnique({
              where: { id: follow.followableId },
            });
            entity = newsCategory || forumCategory;
            break;
          case 'model':
            entity = await this.prisma.lLMModel.findUnique({
              where: { id: follow.followableId },
              select: {
                id: true,
                name: true,
                slug: true,
                provider: true,
                logoUrl: true,
                description: true,
                followerCount: true,
              },
            });
            break;
        }

        return {
          ...follow,
          entity,
        };
      })
    );

    return enriched.filter((e) => e.entity !== null);
  }

  /**
   * Get articles for feed
   */
  private async getArticlesForFeed(
    userIds: string[],
    categoryIds: string[]
  ): Promise<any[]> {
    if (userIds.length === 0 && categoryIds.length === 0) return [];

    const articles = await this.prisma.article.findMany({
      where: {
        OR: [
          { authorId: { in: userIds } },
          { categoryId: { in: categoryIds } },
        ],
        status: 'published',
      },
      select: {
        id: true,
        title: true,
        excerpt: true,
        slug: true,
        coverImageUrl: true,
        viewCount: true,
        createdAt: true,
        author: {
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
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      take: 50,
      orderBy: { createdAt: 'desc' },
    });

    return articles.map((a) => ({
      ...a,
      type: 'article',
    }));
  }

  /**
   * Get topics for feed
   */
  private async getTopicsForFeed(
    userIds: string[],
    tagIds: string[]
  ): Promise<any[]> {
    if (userIds.length === 0 && tagIds.length === 0) return [];

    const topics = await this.prisma.topic.findMany({
      where: {
        OR: [
          { authorId: { in: userIds } },
          {
            tags: {
              some: {
                tagId: { in: tagIds },
              },
            },
          },
        ],
        status: { not: 'archived' },
      },
      select: {
        id: true,
        title: true,
        content: true,
        slug: true,
        type: true,
        viewCount: true,
        replyCount: true,
        createdAt: true,
        author: {
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
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      take: 50,
      orderBy: { createdAt: 'desc' },
    });

    return topics.map((t) => ({
      ...t,
      type: 'topic',
    }));
  }

  /**
   * Get jobs for feed
   */
  private async getJobsForFeed(companyIds: string[]): Promise<any[]> {
    if (companyIds.length === 0) return [];

    const jobs = await this.prisma.job.findMany({
      where: {
        companyId: { in: companyIds },
        status: 'active',
      },
      select: {
        id: true,
        title: true,
        description: true,
        location: true,
        workLocation: true,
        jobType: true,
        experienceLevel: true,
        salaryMin: true,
        salaryMax: true,
        createdAt: true,
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            location: true,
          },
        },
      },
      take: 50,
      orderBy: { createdAt: 'desc' },
    });

    return jobs.map((j) => ({
      ...j,
      type: 'job',
    }));
  }
}
