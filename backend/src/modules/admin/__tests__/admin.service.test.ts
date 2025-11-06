/**
 * Admin Service Unit Tests
 */

import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis-mock';
import { AdminService } from '../admin.service';
import { AdminRepository } from '../admin.repository';

// Mock dependencies
jest.mock('../admin.repository');
jest.mock('../../utils/logger');
jest.mock('@sentry/node');

describe('AdminService', () => {
  let adminService: AdminService;
  let mockPrisma: jest.Mocked<PrismaClient>;
  let mockRedis: Redis;
  let mockAdminRepo: jest.Mocked<AdminRepository>;

  beforeEach(() => {
    // Create mock instances
    mockPrisma = {
      user: {
        count: jest.fn(),
      },
      article: {
        count: jest.fn(),
      },
      topic: {
        count: jest.fn(),
      },
      reply: {
        count: jest.fn(),
      },
      job: {
        count: jest.fn(),
      },
      application: {
        count: jest.fn(),
      },
      platformMetrics: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        upsert: jest.fn(),
      },
      $queryRaw: jest.fn(),
    } as any;

    mockRedis = new Redis();
    adminService = new AdminService(mockPrisma, mockRedis);

    // Get the mocked repository
    mockAdminRepo = (adminService as any).adminRepo as jest.Mocked<AdminRepository>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboardData', () => {
    it('should return complete dashboard data', async () => {
      // Mock repository methods
      mockAdminRepo.getQuickStats = jest.fn().resolves({
        totalUsers: 1000,
        totalArticles: 500,
        totalTopics: 300,
        totalJobs: 50,
        totalApplications: 200,
      });

      mockAdminRepo.getAlerts = jest.fn().resolves([]);
      mockAdminRepo.getRecentActivity = jest.fn().resolves([]);
      mockAdminRepo.getDailyActiveUsers = jest.fn().resolves(100);
      mockAdminRepo.getWeeklyActiveUsers = jest.fn().resolves(500);
      mockAdminRepo.getMonthlyActiveUsers = jest.fn().resolves(800);
      mockAdminRepo.calculateRetentionRate = jest.fn().resolves(75.5);
      mockAdminRepo.getLatestMetrics = jest.fn().resolves({
        mrr: 10000,
        arpu: 50,
      });
      mockAdminRepo.getUserGrowthData = jest.fn().resolves([]);
      mockAdminRepo.getContentGrowthData = jest.fn().resolves([]);
      mockAdminRepo.getRevenueGrowthData = jest.fn().resolves([]);
      mockAdminRepo.getApplicationsToday = jest.fn().resolves(25);
      mockAdminRepo.getErrorCountToday = jest.fn().resolves(5);

      // Mock Prisma for system health
      (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue([{ size: '100 MB' }]);

      // Set Redis counters
      await mockRedis.set('admin:realtime:users_online', '50');
      await mockRedis.set('admin:realtime:posts_per_hour', '12');

      const dashboard = await adminService.getDashboardData(true);

      expect(dashboard).toBeDefined();
      expect(dashboard.quickStats.totalUsers).toBe(1000);
      expect(dashboard.realTimeStats.usersOnline).toBe(50);
      expect(dashboard.realTimeStats.postsPerHour).toBe(12);
      expect(dashboard.keyMetrics.dau).toBe(100);
      expect(dashboard.keyMetrics.mau).toBe(800);
    });

    it('should use cached data when available and not forcing refresh', async () => {
      const cachedData = {
        realTimeStats: { usersOnline: 50, postsPerHour: 10, applicationsToday: 5 },
        keyMetrics: { dau: 100, mau: 800, wau: 500, mrr: 10000, arpu: 50, nps: null, retentionRate: 75 },
        quickStats: { totalUsers: 1000, totalArticles: 500, totalTopics: 300, totalJobs: 50, totalApplications: 200 },
        growthCharts: { users: [], content: [], revenue: [] },
        alerts: [],
        recentActivity: [],
        systemHealth: {
          apiResponseTime: { avg: 50, p95: 100, p99: 150 },
          errorRate: 0.5,
          databaseSize: '100 MB',
          redisStatus: 'connected' as const,
          databaseStatus: 'connected' as const,
        },
        generatedAt: new Date(),
      };

      await mockRedis.setex('admin:dashboard', 300, JSON.stringify(cachedData));

      const dashboard = await adminService.getDashboardData(false);

      expect(dashboard).toEqual(expect.objectContaining({
        quickStats: cachedData.quickStats,
        realTimeStats: cachedData.realTimeStats,
      }));

      // Repository methods should not be called when using cache
      expect(mockAdminRepo.getQuickStats).not.toHaveBeenCalled();
    });
  });

  describe('incrementOnlineUsers', () => {
    it('should increment online users counter in Redis', async () => {
      const userId = 'user-123';

      await adminService.incrementOnlineUsers(userId);

      const userKey = `admin:realtime:user:${userId}`;
      const value = await mockRedis.get(userKey);

      expect(value).toBe('1');
    });
  });

  describe('incrementPostsPerHour', () => {
    it('should increment posts per hour counter in Redis', async () => {
      await adminService.incrementPostsPerHour();

      const hour = new Date().getHours();
      const hourKey = `admin:realtime:posts:${hour}`;
      const value = await mockRedis.get(hourKey);

      expect(value).toBe('1');

      // Increment again
      await adminService.incrementPostsPerHour();
      const updatedValue = await mockRedis.get(hourKey);

      expect(updatedValue).toBe('2');
    });
  });

  describe('exportToCSV', () => {
    it('should generate CSV export with metrics data', async () => {
      const mockMetrics = [
        {
          date: new Date('2025-01-01'),
          totalUsers: 1000,
          newUsers: 50,
          activeUsers: 100,
          weeklyActive: 500,
          monthlyActive: 800,
          totalArticles: 500,
          newArticles: 10,
          totalTopics: 300,
          newTopics: 5,
          totalJobs: 50,
          activeJobs: 40,
          applications: 25,
          pageViews: 10000,
          errorCount: 5,
          spamReports: 2,
          abuseReports: 1,
        },
      ];

      (mockPrisma.platformMetrics.findMany as jest.Mock).mockResolvedValue(mockMetrics);

      const csv = await adminService.exportToCSV();

      expect(csv).toContain('Date,Total Users,New Users');
      expect(csv).toContain('2025-01-01,1000,50');
    });
  });

  describe('precomputeDailyMetrics', () => {
    it('should precompute and store daily metrics', async () => {
      const targetDate = new Date('2025-01-01');

      // Mock all counts
      (mockPrisma.user.count as jest.Mock).mockResolvedValue(1000);
      (mockPrisma.article.count as jest.Mock).mockResolvedValue(500);
      (mockPrisma.topic.count as jest.Mock).mockResolvedValue(300);
      (mockPrisma.reply.count as jest.Mock).mockResolvedValue(1500);
      (mockPrisma.job.count as jest.Mock).mockResolvedValue(50);
      (mockPrisma.application.count as jest.Mock).mockResolvedValue(25);

      mockAdminRepo.getDailyActiveUsers = jest.fn().resolves(100);
      mockAdminRepo.getWeeklyActiveUsers = jest.fn().resolves(500);
      mockAdminRepo.getMonthlyActiveUsers = jest.fn().resolves(800);
      mockAdminRepo.storeDailyMetrics = jest.fn().resolves();

      await adminService.precomputeDailyMetrics(targetDate);

      expect(mockAdminRepo.storeDailyMetrics).toHaveBeenCalledWith(
        expect.any(Date),
        expect.objectContaining({
          totalUsers: 1000,
          activeUsers: 100,
          weeklyActive: 500,
          monthlyActive: 800,
        })
      );
    });
  });

  describe('invalidateCache', () => {
    it('should delete dashboard cache from Redis', async () => {
      const cacheKey = 'admin:dashboard';
      await mockRedis.set(cacheKey, 'cached-data');

      await adminService.invalidateCache();

      const cachedValue = await mockRedis.get(cacheKey);
      expect(cachedValue).toBeNull();
    });
  });
});
