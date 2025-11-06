import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { ActivitiesService } from '../activities.service';
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-extended';

vi.mock('ioredis');

describe('ActivitiesService', () => {
  let prisma: DeepMockProxy<PrismaClient>;
  let redis: DeepMockProxy<Redis>;
  let service: ActivitiesService;

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    redis = mockDeep<Redis>();
    service = new ActivitiesService(prisma as any, redis as any);
    mockReset(prisma);
    mockReset(redis);
  });

  describe('createActivity', () => {
    it('should create a new activity', async () => {
      const userId = 'user-1';
      const input = {
        activityType: 'posted_article' as const,
        targetType: 'article' as const,
        targetId: 'article-1',
        privacy: 'public' as const,
        metadata: { title: 'Test Article' },
      };

      const mockActivity = {
        id: 'activity-1',
        userId,
        activityType: 'posted_article',
        targetType: 'article',
        targetId: 'article-1',
        privacy: 'public',
        metadata: { title: 'Test Article' },
        createdAt: new Date(),
        user: {
          id: userId,
          username: 'testuser',
          profile: {
            firstName: 'Test',
            lastName: 'User',
            avatarUrl: null,
          },
        },
      };

      (prisma.userActivity.create as any).mockResolvedValue(mockActivity);
      redis.keys.mockResolvedValue([]);

      const result = await service.createActivity(userId, input);

      expect(result).toEqual(mockActivity);
      expect(prisma.userActivity.create).toHaveBeenCalledWith({
        data: {
          userId,
          activityType: input.activityType,
          targetType: input.targetType,
          targetId: input.targetId,
          privacy: input.privacy,
          metadata: input.metadata,
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
    });
  });

  describe('getUserActivities', () => {
    it('should return user activities with time grouping', async () => {
      const username = 'testuser';
      const userId = 'user-1';

      const mockUser = { id: userId };
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 8);

      const mockActivities = [
        {
          id: 'activity-1',
          userId,
          activityType: 'posted_article',
          targetType: 'article',
          targetId: 'article-1',
          privacy: 'public',
          metadata: {},
          createdAt: today,
          user: {
            id: userId,
            username,
            profile: { firstName: 'Test', lastName: 'User', avatarUrl: null },
          },
        },
        {
          id: 'activity-2',
          userId,
          activityType: 'created_topic',
          targetType: 'topic',
          targetId: 'topic-1',
          privacy: 'public',
          metadata: {},
          createdAt: yesterday,
          user: {
            id: userId,
            username,
            profile: { firstName: 'Test', lastName: 'User', avatarUrl: null },
          },
        },
        {
          id: 'activity-3',
          userId,
          activityType: 'replied',
          targetType: 'reply',
          targetId: 'reply-1',
          privacy: 'public',
          metadata: {},
          createdAt: lastWeek,
          user: {
            id: userId,
            username,
            profile: { firstName: 'Test', lastName: 'User', avatarUrl: null },
          },
        },
      ];

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
      (prisma.userActivity.findMany as any).mockResolvedValue(mockActivities);
      (prisma.userActivity.count as any).mockResolvedValue(3);
      redis.get.mockResolvedValue(null);
      redis.setex.mockResolvedValue('OK');

      const result = await service.getUserActivities({ username, limit: 20, offset: 0 });

      expect(result.activities.today).toHaveLength(1);
      expect(result.activities.thisWeek).toHaveLength(1);
      expect(result.activities.earlier).toHaveLength(1);
      expect(result.pagination.total).toBe(3);
    });

    it('should throw error if user not found', async () => {
      const username = 'nonexistent';

      (prisma.user.findUnique as any).mockResolvedValue(null);

      await expect(
        service.getUserActivities({ username, limit: 20, offset: 0 })
      ).rejects.toThrow('User not found');
    });

    it('should filter by activity type', async () => {
      const username = 'testuser';
      const userId = 'user-1';

      (prisma.user.findUnique as any).mockResolvedValue({ id: userId });
      (prisma.userActivity.findMany as any).mockResolvedValue([]);
      (prisma.userActivity.count as any).mockResolvedValue(0);
      redis.get.mockResolvedValue(null);
      redis.setex.mockResolvedValue('OK');

      await service.getUserActivities({
        username,
        type: 'posted_article' as any,
        limit: 20,
        offset: 0,
      });

      expect(prisma.userActivity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId,
          }),
          take: 20,
          skip: 0,
        })
      );
    });
  });

  describe('getFollowingFeed', () => {
    it('should return activities from followed users', async () => {
      const userId = 'user-1';
      const followingIds = ['user-2', 'user-3'];

      const mockFollows = followingIds.map((id) => ({
        followerId: userId,
        followingId: id,
        createdAt: new Date(),
      }));

      const mockActivities = [
        {
          id: 'activity-1',
          userId: 'user-2',
          activityType: 'posted_article',
          targetType: 'article',
          targetId: 'article-1',
          privacy: 'public',
          metadata: {},
          createdAt: new Date(),
          user: {
            id: 'user-2',
            username: 'user2',
            profile: { firstName: 'User', lastName: 'Two', avatarUrl: null },
          },
        },
      ];

      (prisma.follow.findMany as any).mockResolvedValue(mockFollows);
      (prisma.userActivity.findMany as any).mockResolvedValue(mockActivities);
      redis.get.mockResolvedValue(null);
      redis.setex.mockResolvedValue('OK');

      const result = await service.getFollowingFeed(userId, { limit: 20, offset: 0 });

      expect(result.activities.today).toBeDefined();
      expect(result.activities.thisWeek).toBeDefined();
      expect(result.activities.earlier).toBeDefined();
      expect(prisma.follow.findMany).toHaveBeenCalledWith({
        where: { followerId: userId },
        select: { followingId: true },
      });
    });

    it('should return empty array if user follows nobody', async () => {
      const userId = 'user-1';

      (prisma.follow.findMany as any).mockResolvedValue([]);
      redis.get.mockResolvedValue(null);
      redis.setex.mockResolvedValue('OK');

      const result = await service.getFollowingFeed(userId, { limit: 20, offset: 0 });

      expect(result.activities.today).toEqual([]);
      expect(result.activities.thisWeek).toEqual([]);
      expect(result.activities.earlier).toEqual([]);
    });
  });

  describe('trackActivity', () => {
    it('should create an activity with provided parameters', async () => {
      const userId = 'user-1';
      const activityType = 'posted_article' as any;
      const targetType = 'article';
      const targetId = 'article-1';
      const privacy = 'public' as any;
      const metadata = { title: 'Test' };

      const mockActivity = {
        id: 'activity-1',
        userId,
        activityType,
        targetType,
        targetId,
        privacy,
        metadata,
        createdAt: new Date(),
        user: {
          id: userId,
          username: 'testuser',
          profile: { firstName: 'Test', lastName: 'User', avatarUrl: null },
        },
      };

      (prisma.userActivity.create as any).mockResolvedValue(mockActivity);
      redis.keys.mockResolvedValue([]);

      const result = await service.trackActivity(
        userId,
        activityType,
        targetType,
        targetId,
        privacy,
        metadata
      );

      expect(result).toEqual(mockActivity);
    });
  });
});
