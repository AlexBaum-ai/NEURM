import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { FollowsService } from '../follows.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

describe('FollowsService', () => {
  let service: FollowsService;
  let prisma: DeepMockProxy<PrismaClient>;
  let redis: DeepMockProxy<Redis>;

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    redis = mockDeep<Redis>();
    service = new FollowsService(prisma as any, redis as any);
  });

  describe('createFollow', () => {
    it('should create a follow relationship', async () => {
      const userId = 'user-1';
      const followableId = 'company-1';
      const mockFollow = {
        id: 'follow-1',
        followerId: userId,
        followableType: 'company',
        followableId,
        createdAt: new Date(),
        follower: {
          id: userId,
          username: 'testuser',
          email: 'test@example.com',
        },
      };

      (prisma.company.findUnique as any).mockResolvedValue({ id: followableId });
      (prisma.polymorphicFollow.findUnique as any).mockResolvedValue(null);
      (prisma.polymorphicFollow.create as any).mockResolvedValue(mockFollow);
      (redis.keys as any).mockResolvedValue([]);

      const result = await service.createFollow(userId, {
        followableType: 'company',
        followableId,
      });

      expect(result).toEqual(mockFollow);
      expect(prisma.polymorphicFollow.create).toHaveBeenCalledWith({
        data: {
          followerId: userId,
          followableType: 'company',
          followableId,
        },
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
    });

    it('should prevent self-following', async () => {
      const userId = 'user-1';

      await expect(
        service.createFollow(userId, {
          followableType: 'user',
          followableId: userId,
        })
      ).rejects.toThrow('Cannot follow yourself');
    });

    it('should prevent duplicate follows', async () => {
      const userId = 'user-1';
      const followableId = 'company-1';

      (prisma.company.findUnique as any).mockResolvedValue({ id: followableId });
      (prisma.polymorphicFollow.findUnique as any).mockResolvedValue({
        id: 'follow-1',
      });

      await expect(
        service.createFollow(userId, {
          followableType: 'company',
          followableId,
        })
      ).rejects.toThrow('Already following this entity');
    });

    it('should send notification when following a user', async () => {
      const userId = 'user-1';
      const followableId = 'user-2';
      const mockFollow = {
        id: 'follow-1',
        followerId: userId,
        followableType: 'user',
        followableId,
        createdAt: new Date(),
        follower: {
          id: userId,
          username: 'testuser',
          email: 'test@example.com',
        },
      };

      (prisma.user.findUnique as any).mockResolvedValue({ id: followableId });
      (prisma.polymorphicFollow.findUnique as any).mockResolvedValue(null);
      (prisma.polymorphicFollow.create as any).mockResolvedValue(mockFollow);
      (redis.keys as any).mockResolvedValue([]);
      (prisma.notification.create as any).mockResolvedValue({});

      await service.createFollow(userId, {
        followableType: 'user',
        followableId,
      });

      expect(prisma.notification.create).toHaveBeenCalled();
    });
  });

  describe('unfollow', () => {
    it('should unfollow an entity', async () => {
      const userId = 'user-1';
      const followId = 'follow-1';
      const mockFollow = {
        id: followId,
        followerId: userId,
        followableType: 'company',
        followableId: 'company-1',
        createdAt: new Date(),
        follower: {
          id: userId,
          username: 'testuser',
          email: 'test@example.com',
        },
      };

      (prisma.polymorphicFollow.findUnique as any).mockResolvedValue(mockFollow);
      (prisma.polymorphicFollow.delete as any).mockResolvedValue(mockFollow);
      (redis.keys as any).mockResolvedValue([]);

      const result = await service.unfollow(userId, followId);

      expect(result).toEqual({
        success: true,
        message: 'Unfollowed successfully',
      });
      expect(prisma.polymorphicFollow.delete).toHaveBeenCalledWith({
        where: {
          id: followId,
          followerId: userId,
        },
      });
    });

    it('should throw error if follow not found', async () => {
      const userId = 'user-1';
      const followId = 'follow-1';

      (prisma.polymorphicFollow.findUnique as any).mockResolvedValue(null);

      await expect(service.unfollow(userId, followId)).rejects.toThrow(
        'Follow relationship not found'
      );
    });

    it('should prevent unfollowing by non-owner', async () => {
      const userId = 'user-1';
      const followId = 'follow-1';
      const mockFollow = {
        id: followId,
        followerId: 'user-2', // Different user
        followableType: 'company',
        followableId: 'company-1',
        createdAt: new Date(),
        follower: {
          id: 'user-2',
          username: 'otheruser',
          email: 'other@example.com',
        },
      };

      (prisma.polymorphicFollow.findUnique as any).mockResolvedValue(mockFollow);

      await expect(service.unfollow(userId, followId)).rejects.toThrow(
        'Unauthorized to unfollow this entity'
      );
    });
  });

  describe('getFollowing', () => {
    it('should return following list', async () => {
      const userId = 'user-1';
      const mockUser = {
        id: userId,
        privacySettings: [],
      };
      const mockFollowing = [
        {
          id: 'follow-1',
          followerId: userId,
          followableType: 'company',
          followableId: 'company-1',
          createdAt: new Date(),
        },
      ];

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
      (prisma.polymorphicFollow.findMany as any).mockResolvedValue(mockFollowing);
      (prisma.polymorphicFollow.count as any).mockResolvedValue(1);
      (prisma.company.findUnique as any).mockResolvedValue({
        id: 'company-1',
        name: 'Test Company',
        slug: 'test-company',
      });

      const result = await service.getFollowing({ userId, limit: 20, offset: 0 });

      expect(result.total).toBe(1);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('getFollowers', () => {
    it('should return followers list', async () => {
      const followableId = 'company-1';
      const mockFollowers = [
        {
          id: 'follow-1',
          followerId: 'user-1',
          followableType: 'company',
          followableId,
          createdAt: new Date(),
          follower: {
            id: 'user-1',
            username: 'testuser',
            email: 'test@example.com',
            profile: null,
          },
        },
      ];

      (prisma.company.findUnique as any).mockResolvedValue({ id: followableId });
      (prisma.polymorphicFollow.findMany as any).mockResolvedValue(mockFollowers);
      (prisma.polymorphicFollow.count as any).mockResolvedValue(1);

      const result = await service.getFollowers({
        followableType: 'company',
        followableId,
        limit: 20,
        offset: 0,
      });

      expect(result.total).toBe(1);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('getFollowingFeed', () => {
    it('should return feed from cached data', async () => {
      const userId = 'user-1';
      const mockCachedFeed = JSON.stringify({
        data: [],
        total: 0,
        limit: 20,
        offset: 0,
      });

      (redis.get as any).mockResolvedValue(mockCachedFeed);

      const result = await service.getFollowingFeed(userId, {
        limit: 20,
        offset: 0,
        type: 'all',
      });

      expect(result).toEqual(JSON.parse(mockCachedFeed));
      expect(redis.get).toHaveBeenCalled();
    });

    it('should generate and cache feed if not cached', async () => {
      const userId = 'user-1';

      (redis.get as any).mockResolvedValue(null);
      (prisma.polymorphicFollow.findMany as any).mockResolvedValue([]);
      (prisma.article.findMany as any).mockResolvedValue([]);
      (prisma.topic.findMany as any).mockResolvedValue([]);
      (prisma.job.findMany as any).mockResolvedValue([]);
      (redis.setex as any).mockResolvedValue('OK');

      const result = await service.getFollowingFeed(userId, {
        limit: 20,
        offset: 0,
        type: 'all',
      });

      expect(result.data).toEqual([]);
      expect(redis.setex).toHaveBeenCalled();
    });
  });

  describe('isFollowing', () => {
    it('should return true if following', async () => {
      const userId = 'user-1';
      const followableId = 'company-1';

      (prisma.polymorphicFollow.findUnique as any).mockResolvedValue({
        id: 'follow-1',
      });

      const result = await service.isFollowing(userId, 'company', followableId);

      expect(result).toBe(true);
    });

    it('should return false if not following', async () => {
      const userId = 'user-1';
      const followableId = 'company-1';

      (prisma.polymorphicFollow.findUnique as any).mockResolvedValue(null);

      const result = await service.isFollowing(userId, 'company', followableId);

      expect(result).toBe(false);
    });
  });
});
