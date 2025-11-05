import { BadgeService } from '../services/badgeService';
import { BadgeRepository } from '../repositories/BadgeRepository';
import { BadgeCategory, BadgeType, PrismaClient } from '@prisma/client';

// Mock Prisma Client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    user: {
      findUnique: jest.fn(),
    },
    badge: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    userBadge: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
      count: jest.fn(),
    },
    reply: {
      count: jest.fn(),
    },
    topic: {
      count: jest.fn(),
    },
    topicVote: {
      count: jest.fn(),
    },
    replyVote: {
      count: jest.fn(),
    },
    userReputation: {
      findUnique: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
    $queryRaw: jest.fn(),
  })),
  BadgeCategory: {
    skill: 'skill',
    activity: 'activity',
    special: 'special',
  },
  BadgeType: {
    bronze: 'bronze',
    silver: 'silver',
    gold: 'gold',
    platinum: 'platinum',
  },
}));

describe('BadgeService', () => {
  let badgeService: BadgeService;
  let badgeRepository: BadgeRepository;
  let prisma: any;

  beforeEach(() => {
    jest.clearAllMocks();
    badgeRepository = new BadgeRepository();
    badgeService = new BadgeService(badgeRepository);
    prisma = new PrismaClient();
  });

  describe('getAllBadges', () => {
    it('should return all badges', async () => {
      const mockBadges = [
        {
          id: 'badge-1',
          name: 'First Post',
          slug: 'first-post',
          description: 'Created your first topic',
          iconUrl: '/badges/first-post.svg',
          badgeType: 'bronze' as BadgeType,
          category: 'activity' as BadgeCategory,
          criteria: { type: 'topic_count', threshold: 1 },
          createdAt: new Date(),
        },
      ];

      jest.spyOn(badgeRepository, 'getAllBadges').mockResolvedValue(mockBadges);

      const result = await badgeService.getAllBadges();

      expect(result).toEqual(mockBadges);
      expect(badgeRepository.getAllBadges).toHaveBeenCalledTimes(1);
    });
  });

  describe('getBadgesByCategory', () => {
    it('should return badges filtered by category', async () => {
      const mockBadges = [
        {
          id: 'badge-1',
          name: 'Helpful',
          slug: 'helpful',
          description: 'Received 50 upvotes',
          iconUrl: '/badges/helpful.svg',
          badgeType: 'bronze' as BadgeType,
          category: 'skill' as BadgeCategory,
          criteria: { type: 'upvote_count', threshold: 50 },
          createdAt: new Date(),
        },
      ];

      jest.spyOn(badgeRepository, 'getBadgesByCategory').mockResolvedValue(mockBadges);

      const result = await badgeService.getBadgesByCategory('skill' as BadgeCategory);

      expect(result).toEqual(mockBadges);
      expect(badgeRepository.getBadgesByCategory).toHaveBeenCalledWith('skill');
    });
  });

  describe('getUserBadges', () => {
    it('should return user earned badges', async () => {
      const userId = 'user-1';
      const mockUserBadges = [
        {
          id: 'user-badge-1',
          userId: 'user-1',
          badgeId: 'badge-1',
          progress: 0,
          earnedAt: new Date(),
          badge: {
            id: 'badge-1',
            name: 'First Post',
            slug: 'first-post',
            description: 'Created your first topic',
            iconUrl: '/badges/first-post.svg',
            badgeType: 'bronze' as BadgeType,
            category: 'activity' as BadgeCategory,
            criteria: { type: 'topic_count', threshold: 1 },
            createdAt: new Date(),
          },
        },
      ];

      prisma.user.findUnique.mockResolvedValue({ id: userId });
      jest.spyOn(badgeRepository, 'getUserBadges').mockResolvedValue(mockUserBadges);

      const result = await badgeService.getUserBadges(userId);

      expect(result).toEqual(mockUserBadges);
      expect(badgeRepository.getUserBadges).toHaveBeenCalledWith(userId);
    });

    it('should throw error if user not found', async () => {
      const userId = 'non-existent-user';

      prisma.user.findUnique.mockResolvedValue(null);

      await expect(badgeService.getUserBadges(userId)).rejects.toThrow('User not found');
    });
  });

  describe('evaluateBadgeCriteria', () => {
    it('should evaluate badge criteria and return progress', async () => {
      const userId = 'user-1';
      const badgeId = 'badge-1';
      const mockBadge = {
        id: badgeId,
        name: 'First Post',
        slug: 'first-post',
        description: 'Created your first topic',
        iconUrl: '/badges/first-post.svg',
        badgeType: 'bronze' as BadgeType,
        category: 'activity' as BadgeCategory,
        criteria: { type: 'topic_count', threshold: 1, timeframe: 'all_time' },
        createdAt: new Date(),
      };

      jest.spyOn(badgeRepository, 'getBadgeById').mockResolvedValue(mockBadge);
      prisma.topic.count.mockResolvedValue(1);

      const result = await badgeService.evaluateBadgeCriteria(userId, badgeId);

      expect(result).toEqual({
        badgeId,
        isEarned: true,
        currentProgress: 1,
        threshold: 1,
        percentage: 100,
      });
    });

    it('should return partial progress when threshold not met', async () => {
      const userId = 'user-1';
      const badgeId = 'badge-1';
      const mockBadge = {
        id: badgeId,
        name: 'Contributor',
        slug: 'contributor',
        description: 'Posted 100 replies',
        iconUrl: '/badges/contributor.svg',
        badgeType: 'silver' as BadgeType,
        category: 'activity' as BadgeCategory,
        criteria: { type: 'reply_count', threshold: 100, timeframe: 'all_time' },
        createdAt: new Date(),
      };

      jest.spyOn(badgeRepository, 'getBadgeById').mockResolvedValue(mockBadge);
      prisma.reply.count.mockResolvedValue(50);

      const result = await badgeService.evaluateBadgeCriteria(userId, badgeId);

      expect(result).toEqual({
        badgeId,
        isEarned: false,
        currentProgress: 50,
        threshold: 100,
        percentage: 50,
      });
    });

    it('should throw error if badge not found', async () => {
      const userId = 'user-1';
      const badgeId = 'non-existent-badge';

      jest.spyOn(badgeRepository, 'getBadgeById').mockResolvedValue(null);

      await expect(badgeService.evaluateBadgeCriteria(userId, badgeId)).rejects.toThrow(
        'Badge not found'
      );
    });
  });

  describe('checkAndAwardBadges', () => {
    it('should award badges when criteria are met', async () => {
      const userId = 'user-1';
      const mockBadges = [
        {
          id: 'badge-1',
          name: 'First Post',
          slug: 'first-post',
          description: 'Created your first topic',
          iconUrl: '/badges/first-post.svg',
          badgeType: 'bronze' as BadgeType,
          category: 'activity' as BadgeCategory,
          criteria: { type: 'topic_count', threshold: 1, timeframe: 'all_time' },
          createdAt: new Date(),
        },
      ];

      jest.spyOn(badgeRepository, 'getAllBadges').mockResolvedValue(mockBadges);
      jest.spyOn(badgeRepository, 'hasUserEarnedBadge').mockResolvedValue(false);
      jest.spyOn(badgeRepository, 'updateBadgeProgress').mockResolvedValue({
        id: 'user-badge-1',
        userId,
        badgeId: 'badge-1',
        progress: 1,
        earnedAt: new Date(),
      });
      jest.spyOn(badgeRepository, 'awardBadge').mockResolvedValue({
        id: 'user-badge-1',
        userId,
        badgeId: 'badge-1',
        progress: 1,
        earnedAt: new Date(),
      });

      prisma.topic.count.mockResolvedValue(1);
      prisma.notification.create.mockResolvedValue({});

      const result = await badgeService.checkAndAwardBadges(userId);

      expect(result).toHaveLength(1);
      expect(result[0]).toBe('badge-1');
      expect(badgeRepository.awardBadge).toHaveBeenCalledWith(userId, 'badge-1', 1);
    });

    it('should not award already earned badges', async () => {
      const userId = 'user-1';
      const mockBadges = [
        {
          id: 'badge-1',
          name: 'First Post',
          slug: 'first-post',
          description: 'Created your first topic',
          iconUrl: '/badges/first-post.svg',
          badgeType: 'bronze' as BadgeType,
          category: 'activity' as BadgeCategory,
          criteria: { type: 'topic_count', threshold: 1, timeframe: 'all_time' },
          createdAt: new Date(),
        },
      ];

      jest.spyOn(badgeRepository, 'getAllBadges').mockResolvedValue(mockBadges);
      jest.spyOn(badgeRepository, 'hasUserEarnedBadge').mockResolvedValue(true);

      const result = await badgeService.checkAndAwardBadges(userId);

      expect(result).toHaveLength(0);
      expect(badgeRepository.awardBadge).not.toHaveBeenCalled();
    });
  });
});
