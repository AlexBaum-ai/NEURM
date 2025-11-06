/**
 * Dashboard Service Tests
 *
 * Tests for personalized dashboard functionality
 */

import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { DashboardService } from '../dashboard.service';
import { DashboardRepository } from '../dashboard.repository';
import { FollowsService } from '../../follows/follows.service';

// Mock dependencies
jest.mock('@prisma/client');
jest.mock('ioredis');
jest.mock('../../follows/follows.service');
jest.mock('@sentry/node');
jest.mock('../../../utils/logger');

describe('DashboardService', () => {
  let dashboardService: DashboardService;
  let mockPrisma: jest.Mocked<PrismaClient>;
  let mockRedis: jest.Mocked<Redis>;
  let mockDashboardRepo: jest.Mocked<DashboardRepository>;
  let mockFollowsService: jest.Mocked<FollowsService>;

  const mockUserId = 'user-123';
  const mockDashboardData = {
    widgets: {
      topStoriesToday: [
        {
          id: 'article-1',
          title: 'Test Article',
          excerpt: 'Test excerpt',
          slug: 'test-article',
          coverImageUrl: null,
          viewCount: 100,
          createdAt: new Date(),
          author: {
            username: 'testuser',
            profile: {
              firstName: 'Test',
              lastName: 'User',
              avatarUrl: null,
            },
          },
          category: {
            name: 'AI',
            slug: 'ai',
          },
        },
      ],
      yourStats: {
        forumReputation: 150,
        articlesRead: 25,
        jobsSaved: 5,
        applicationsSent: 3,
        topicsCreated: 10,
        repliesPosted: 50,
        upvotesReceived: 75,
      },
    },
    forYouFeed: [],
    recentActivity: [],
    quickActions: [
      {
        id: 'new_post',
        label: 'New Post',
        icon: 'plus-circle',
        url: '/forum/new',
        description: 'Start a new discussion',
      },
      {
        id: 'search_jobs',
        label: 'Search Jobs',
        icon: 'briefcase',
        url: '/jobs',
        description: 'Find your next opportunity',
      },
      {
        id: 'browse_forum',
        label: 'Browse Forum',
        icon: 'message-square',
        url: '/forum',
        description: 'Join the conversation',
      },
    ],
    config: {
      widgets: [
        { id: 'top_stories_today', enabled: true, order: 0 },
        { id: 'trending_discussions', enabled: true, order: 1 },
        { id: 'job_matches', enabled: true, order: 2 },
        { id: 'your_stats', enabled: true, order: 3 },
        { id: 'following_activity', enabled: true, order: 4 },
        { id: 'trending_tags', enabled: true, order: 5 },
      ],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;
    mockRedis = new Redis() as jest.Mocked<Redis>;

    dashboardService = new DashboardService(mockPrisma, mockRedis);

    // Access private properties for testing
    mockDashboardRepo = (dashboardService as any).dashboardRepo;
    mockFollowsService = (dashboardService as any).followsService;
  });

  describe('getDashboard', () => {
    it('should return cached dashboard data if available', async () => {
      const cachedData = JSON.stringify(mockDashboardData);
      mockRedis.get = jest.fn().mockResolvedValue(cachedData);

      const result = await dashboardService.getDashboard({
        userId: mockUserId,
      });

      expect(mockRedis.get).toHaveBeenCalledWith(`dashboard:${mockUserId}`);
      expect(result).toEqual(mockDashboardData);
    });

    it('should fetch and cache dashboard data if not cached', async () => {
      mockRedis.get = jest.fn().mockResolvedValue(null);
      mockRedis.setex = jest.fn().mockResolvedValue('OK');

      // Mock repository methods
      mockDashboardRepo.getDashboardConfig = jest.fn().mockResolvedValue({
        widgets: [
          { id: 'top_stories_today', enabled: true, order: 0 },
          { id: 'your_stats', enabled: true, order: 1 },
        ],
      });

      mockDashboardRepo.getTopStoriesToday = jest
        .fn()
        .mockResolvedValue(mockDashboardData.widgets.topStoriesToday);

      mockDashboardRepo.getUserStats = jest
        .fn()
        .mockResolvedValue(mockDashboardData.widgets.yourStats);

      mockDashboardRepo.getUserActivity = jest.fn().mockResolvedValue([]);

      mockPrisma.follow = {
        findMany: jest.fn().mockResolvedValue([]),
      } as any;

      const result = await dashboardService.getDashboard({
        userId: mockUserId,
      });

      expect(mockRedis.get).toHaveBeenCalledWith(`dashboard:${mockUserId}`);
      expect(mockRedis.setex).toHaveBeenCalledWith(
        `dashboard:${mockUserId}`,
        300,
        expect.any(String)
      );
      expect(result).toHaveProperty('widgets');
      expect(result).toHaveProperty('forYouFeed');
      expect(result).toHaveProperty('recentActivity');
      expect(result).toHaveProperty('quickActions');
      expect(result).toHaveProperty('config');
    });

    it('should fetch only specified widgets', async () => {
      mockRedis.get = jest.fn().mockResolvedValue(null);
      mockRedis.setex = jest.fn().mockResolvedValue('OK');

      mockDashboardRepo.getDashboardConfig = jest.fn().mockResolvedValue({
        widgets: [
          { id: 'top_stories_today', enabled: true, order: 0 },
          { id: 'your_stats', enabled: true, order: 1 },
        ],
      });

      mockDashboardRepo.getTopStoriesToday = jest
        .fn()
        .mockResolvedValue(mockDashboardData.widgets.topStoriesToday);

      mockDashboardRepo.getUserActivity = jest.fn().mockResolvedValue([]);

      mockPrisma.follow = {
        findMany: jest.fn().mockResolvedValue([]),
      } as any;

      await dashboardService.getDashboard({
        userId: mockUserId,
        includeWidgets: ['top_stories_today'],
      });

      expect(mockDashboardRepo.getTopStoriesToday).toHaveBeenCalled();
      expect(mockDashboardRepo.getUserStats).not.toHaveBeenCalled();
    });

    it('should include quick actions in dashboard', async () => {
      mockRedis.get = jest.fn().mockResolvedValue(null);
      mockRedis.setex = jest.fn().mockResolvedValue('OK');

      mockDashboardRepo.getDashboardConfig = jest.fn().mockResolvedValue({
        widgets: [],
      });

      mockDashboardRepo.getUserActivity = jest.fn().mockResolvedValue([]);

      mockPrisma.follow = {
        findMany: jest.fn().mockResolvedValue([]),
      } as any;

      const result = await dashboardService.getDashboard({
        userId: mockUserId,
      });

      expect(result.quickActions).toHaveLength(3);
      expect(result.quickActions[0]).toHaveProperty('id', 'new_post');
      expect(result.quickActions[1]).toHaveProperty('id', 'search_jobs');
      expect(result.quickActions[2]).toHaveProperty('id', 'browse_forum');
    });
  });

  describe('updateConfig', () => {
    it('should update dashboard configuration', async () => {
      const newConfig = {
        widgets: [
          { id: 'your_stats', enabled: true, order: 0 },
          { id: 'job_matches', enabled: true, order: 1 },
        ],
      };

      mockDashboardRepo.updateDashboardConfig = jest
        .fn()
        .mockResolvedValue(newConfig);

      mockRedis.del = jest.fn().mockResolvedValue(1);

      const result = await dashboardService.updateConfig(mockUserId, newConfig);

      expect(mockDashboardRepo.updateDashboardConfig).toHaveBeenCalledWith(
        mockUserId,
        newConfig
      );
      expect(mockRedis.del).toHaveBeenCalledWith(`dashboard:${mockUserId}`);
      expect(result).toEqual(newConfig);
    });

    it('should invalidate cache after config update', async () => {
      const newConfig = {
        widgets: [{ id: 'your_stats', enabled: true, order: 0 }],
      };

      mockDashboardRepo.updateDashboardConfig = jest
        .fn()
        .mockResolvedValue(newConfig);

      mockRedis.del = jest.fn().mockResolvedValue(1);

      await dashboardService.updateConfig(mockUserId, newConfig);

      expect(mockRedis.del).toHaveBeenCalledWith(`dashboard:${mockUserId}`);
    });
  });

  describe('For You Feed Generation', () => {
    it('should generate personalized feed based on follows', async () => {
      mockRedis.get = jest.fn().mockResolvedValue(null);
      mockRedis.setex = jest.fn().mockResolvedValue('OK');

      mockDashboardRepo.getDashboardConfig = jest.fn().mockResolvedValue({
        widgets: [],
      });

      mockDashboardRepo.getUserActivity = jest.fn().mockResolvedValue([]);

      // Mock followed categories
      mockPrisma.follow = {
        findMany: jest.fn().mockImplementation(({ where }) => {
          if (where.followableType === 'category') {
            return Promise.resolve([{ followableId: 'cat-1' }]);
          }
          return Promise.resolve([]);
        }),
      } as any;

      // Mock articles from followed categories
      mockPrisma.article = {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'article-1',
            title: 'Followed Article',
            excerpt: 'Test excerpt',
            slug: 'followed-article',
            createdAt: new Date(),
          },
        ]),
      } as any;

      mockPrisma.topic = {
        findMany: jest.fn().mockResolvedValue([]),
      } as any;

      mockPrisma.job = {
        findMany: jest.fn().mockResolvedValue([]),
      } as any;

      const result = await dashboardService.getDashboard({
        userId: mockUserId,
      });

      expect(result.forYouFeed.length).toBeGreaterThan(0);
      expect(result.forYouFeed[0]).toHaveProperty('reason');
      expect(result.forYouFeed[0]).toHaveProperty('relevanceScore');
    });

    it('should show trending content if user has no follows', async () => {
      mockRedis.get = jest.fn().mockResolvedValue(null);
      mockRedis.setex = jest.fn().mockResolvedValue('OK');

      mockDashboardRepo.getDashboardConfig = jest.fn().mockResolvedValue({
        widgets: [],
      });

      mockDashboardRepo.getUserActivity = jest.fn().mockResolvedValue([]);

      mockDashboardRepo.getTrendingDiscussions = jest.fn().mockResolvedValue([
        {
          id: 'topic-1',
          title: 'Trending Topic',
          slug: 'trending-topic',
          type: 'discussion',
          viewCount: 500,
          replyCount: 25,
          upvoteCount: 100,
          createdAt: new Date(),
        },
      ]);

      // No follows
      mockPrisma.follow = {
        findMany: jest.fn().mockResolvedValue([]),
      } as any;

      mockPrisma.article = {
        findMany: jest.fn().mockResolvedValue([]),
      } as any;

      mockPrisma.topic = {
        findMany: jest.fn().mockResolvedValue([]),
      } as any;

      mockPrisma.job = {
        findMany: jest.fn().mockResolvedValue([]),
      } as any;

      const result = await dashboardService.getDashboard({
        userId: mockUserId,
      });

      expect(result.forYouFeed.length).toBeGreaterThan(0);
      expect(result.forYouFeed[0].reason).toContain('Trending');
    });
  });

  describe('Error Handling', () => {
    it('should handle dashboard fetch errors', async () => {
      mockRedis.get = jest.fn().mockResolvedValue(null);

      mockDashboardRepo.getDashboardConfig = jest
        .fn()
        .mockRejectedValue(new Error('Database error'));

      await expect(
        dashboardService.getDashboard({
          userId: mockUserId,
        })
      ).rejects.toThrow('Database error');
    });

    it('should handle config update errors', async () => {
      const newConfig = {
        widgets: [{ id: 'your_stats', enabled: true, order: 0 }],
      };

      mockDashboardRepo.updateDashboardConfig = jest
        .fn()
        .mockRejectedValue(new Error('Update failed'));

      await expect(
        dashboardService.updateConfig(mockUserId, newConfig)
      ).rejects.toThrow('Update failed');
    });
  });
});
