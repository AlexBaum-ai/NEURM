/**
 * Analytics Service Tests
 *
 * Unit tests for analytics service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { AnalyticsService } from '../analytics.service';
import { AnalyticsRepository } from '../analytics.repository';

// Mock dependencies
vi.mock('@prisma/client');
vi.mock('ioredis');
vi.mock('../analytics.repository');
vi.mock('@/utils/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;
  let mockPrisma: any;
  let mockRedis: any;
  let mockAnalyticsRepo: any;

  beforeEach(() => {
    // Setup mocks
    mockPrisma = {
      platformMetrics: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
    };

    mockRedis = {
      get: vi.fn(),
      setex: vi.fn(),
      keys: vi.fn(),
      del: vi.fn(),
    };

    mockAnalyticsRepo = {
      getUserGrowth: vi.fn(),
      getEngagementTrends: vi.fn(),
      getContentPerformance: vi.fn(),
      getRevenue: vi.fn(),
      getTopContributors: vi.fn(),
      getTrafficSources: vi.fn(),
      getCohortRetention: vi.fn(),
      getUserOnboardingFunnel: vi.fn(),
      getJobApplicationFunnel: vi.fn(),
      getAggregatedMetrics: vi.fn(),
    };

    // Create service instance
    analyticsService = new AnalyticsService(mockPrisma, mockRedis);
    (analyticsService as any).analyticsRepo = mockAnalyticsRepo;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getComprehensiveAnalytics', () => {
    it('should return cached analytics if available', async () => {
      const cachedData = {
        userGrowth: [],
        summary: { totalUsers: 100, totalArticles: 50, totalTopics: 20, avgEngagement: 120 },
        generatedAt: new Date(),
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(cachedData));

      const result = await analyticsService.getComprehensiveAnalytics();

      expect(mockRedis.get).toHaveBeenCalled();
      expect(result).toEqual(cachedData);
      expect(mockAnalyticsRepo.getUserGrowth).not.toHaveBeenCalled();
    });

    it('should fetch and cache analytics if not cached', async () => {
      mockRedis.get.mockResolvedValue(null);

      const mockUserGrowth = [
        { date: new Date(), totalUsers: 100, newUsers: 10, activeUsers: 50, weeklyActive: 80, monthlyActive: 95 },
      ];
      const mockEngagement = [
        { date: new Date(), pageViews: 1000, uniqueVisitors: 500, avgSessionTime: 120, bounceRate: 40 },
      ];
      const mockContent = [
        { date: new Date(), totalArticles: 50, newArticles: 5, totalTopics: 20, newTopics: 2, totalReplies: 100, newReplies: 10 },
      ];
      const mockRevenue = [{ date: new Date(), mrr: 1000, arpu: 10, churn: 5 }];
      const mockContributors = [
        {
          userId: '1',
          username: 'testuser',
          displayName: 'Test User',
          avatarUrl: null,
          contributionScore: 100,
          articlesCount: 5,
          topicsCount: 10,
          repliesCount: 20,
          helpfulVotes: 15,
        },
      ];
      const mockTrafficSources = [{ source: 'Google', visits: 500, percentage: 50 }];

      mockAnalyticsRepo.getUserGrowth.mockResolvedValue(mockUserGrowth);
      mockAnalyticsRepo.getEngagementTrends.mockResolvedValue(mockEngagement);
      mockAnalyticsRepo.getContentPerformance.mockResolvedValue(mockContent);
      mockAnalyticsRepo.getRevenue.mockResolvedValue(mockRevenue);
      mockAnalyticsRepo.getTopContributors.mockResolvedValue(mockContributors);
      mockAnalyticsRepo.getTrafficSources.mockResolvedValue(mockTrafficSources);

      mockPrisma.platformMetrics.findFirst.mockResolvedValue({
        totalUsers: 100,
        totalArticles: 50,
        totalTopics: 20,
      });

      const result = await analyticsService.getComprehensiveAnalytics();

      expect(mockAnalyticsRepo.getUserGrowth).toHaveBeenCalled();
      expect(mockAnalyticsRepo.getEngagementTrends).toHaveBeenCalled();
      expect(mockAnalyticsRepo.getContentPerformance).toHaveBeenCalled();
      expect(mockRedis.setex).toHaveBeenCalled();
      expect(result).toHaveProperty('userGrowth');
      expect(result).toHaveProperty('summary');
      expect(result.summary.totalUsers).toBe(100);
    });

    it('should fetch only requested metrics', async () => {
      mockRedis.get.mockResolvedValue(null);

      mockAnalyticsRepo.getUserGrowth.mockResolvedValue([]);
      mockPrisma.platformMetrics.findFirst.mockResolvedValue({
        totalUsers: 100,
        totalArticles: 50,
        totalTopics: 20,
      });

      await analyticsService.getComprehensiveAnalytics('monthly', ['user_growth']);

      expect(mockAnalyticsRepo.getUserGrowth).toHaveBeenCalled();
      expect(mockAnalyticsRepo.getEngagementTrends).not.toHaveBeenCalled();
      expect(mockAnalyticsRepo.getContentPerformance).not.toHaveBeenCalled();
    });
  });

  describe('getCustomAnalytics', () => {
    it('should return custom analytics with data', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const mockData = [
        {
          period: new Date('2024-01-01'),
          newUsers: 10,
          avgActiveUsers: 50,
          newArticles: 5,
          pageViews: 1000,
        },
      ];

      mockAnalyticsRepo.getAggregatedMetrics.mockResolvedValue(mockData);

      const result = await analyticsService.getCustomAnalytics(startDate, endDate, ['user_growth'], 'daily');

      expect(mockAnalyticsRepo.getAggregatedMetrics).toHaveBeenCalledWith(startDate, endDate, 'daily');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('insights');
      expect(result.data).toEqual(mockData);
    });

    it('should include comparison data when provided', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const compareWith = {
        startDate: new Date('2023-12-01'),
        endDate: new Date('2023-12-31'),
      };

      const mockCurrentData = [{ period: new Date(), newUsers: 20 }];
      const mockComparisonData = [{ period: new Date(), newUsers: 10 }];

      mockAnalyticsRepo.getAggregatedMetrics
        .mockResolvedValueOnce(mockCurrentData)
        .mockResolvedValueOnce(mockComparisonData);

      const result = await analyticsService.getCustomAnalytics(
        startDate,
        endDate,
        ['user_growth'],
        'daily',
        compareWith
      );

      expect(mockAnalyticsRepo.getAggregatedMetrics).toHaveBeenCalledTimes(2);
      expect(result).toHaveProperty('comparison');
      expect(result.comparison).toEqual(mockComparisonData);
    });
  });

  describe('getCohortAnalysis', () => {
    it('should return cohort retention data', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const mockCohorts = [
        {
          cohort: '2024-01-01',
          period0: 100,
          period1: 80,
          period2: 60,
          period3: 50,
          period4: 45,
          period5: 40,
          period6: 38,
          period7: 35,
        },
      ];

      mockAnalyticsRepo.getCohortRetention.mockResolvedValue(mockCohorts);

      const result = await analyticsService.getCohortAnalysis(startDate, endDate);

      expect(mockAnalyticsRepo.getCohortRetention).toHaveBeenCalledWith(startDate, endDate);
      expect(result).toEqual(mockCohorts);
    });
  });

  describe('getFunnelAnalysis', () => {
    it('should return user onboarding funnel', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const mockFunnel = [
        { step: 'Registration', users: 1000, conversionRate: 100, dropoffRate: 0 },
        { step: 'Email Verified', users: 800, conversionRate: 80, dropoffRate: 20 },
        { step: 'Profile Completed', users: 600, conversionRate: 75, dropoffRate: 25 },
      ];

      mockAnalyticsRepo.getUserOnboardingFunnel.mockResolvedValue(mockFunnel);

      const result = await analyticsService.getFunnelAnalysis('user_onboarding', startDate, endDate);

      expect(mockAnalyticsRepo.getUserOnboardingFunnel).toHaveBeenCalledWith(startDate, endDate);
      expect(result).toEqual(mockFunnel);
      expect(result[0].step).toBe('Registration');
      expect(result[0].users).toBe(1000);
    });

    it('should return job application funnel', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const mockFunnel = [
        { step: 'Job View', users: 500, conversionRate: 100, dropoffRate: 0 },
        { step: 'Application Started', users: 200, conversionRate: 40, dropoffRate: 60 },
        { step: 'Application Submitted', users: 150, conversionRate: 75, dropoffRate: 25 },
      ];

      mockAnalyticsRepo.getJobApplicationFunnel.mockResolvedValue(mockFunnel);

      const result = await analyticsService.getFunnelAnalysis('job_application', startDate, endDate);

      expect(mockAnalyticsRepo.getJobApplicationFunnel).toHaveBeenCalledWith(startDate, endDate);
      expect(result).toEqual(mockFunnel);
    });
  });

  describe('exportToCSV', () => {
    it('should export analytics data to CSV format', async () => {
      const mockData = [
        { date: '2024-01-01', newUsers: 10, activeUsers: 50 },
        { date: '2024-01-02', newUsers: 15, activeUsers: 55 },
      ];

      const result = await analyticsService.exportToCSV(mockData, ['user_growth']);

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      expect(result).toContain('date');
    });
  });

  describe('exportToPDF', () => {
    it('should export analytics data to PDF format', async () => {
      const mockAnalytics = {
        userGrowth: [
          { date: new Date(), totalUsers: 100, newUsers: 10, activeUsers: 50, weeklyActive: 80, monthlyActive: 95 },
        ],
        summary: { totalUsers: 100, totalArticles: 50, totalTopics: 20, avgEngagement: 120 },
        topContributors: [],
        trafficSources: [],
        generatedAt: new Date(),
      };

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const result = await analyticsService.exportToPDF(mockAnalytics, startDate, endDate, true);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('scheduleReport', () => {
    it('should schedule a recurring report', async () => {
      const result = await analyticsService.scheduleReport(
        'weekly',
        ['admin@example.com'],
        ['user_growth', 'engagement_trends'],
        'pdf',
        true
      );

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('message');
      expect(result.id).toContain('report-');
    });
  });

  describe('getABTestResults', () => {
    it('should return A/B test results', async () => {
      const result = await analyticsService.getABTestResults();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('testId');
      expect(result[0]).toHaveProperty('variants');
    });
  });

  describe('invalidateCache', () => {
    it('should invalidate analytics cache', async () => {
      mockRedis.keys.mockResolvedValue(['admin:analytics:key1', 'admin:analytics:key2']);
      mockRedis.del.mockResolvedValue(2);

      await analyticsService.invalidateCache();

      expect(mockRedis.keys).toHaveBeenCalledWith('admin:analytics:*');
      expect(mockRedis.del).toHaveBeenCalledWith('admin:analytics:key1', 'admin:analytics:key2');
    });

    it('should handle no keys to delete', async () => {
      mockRedis.keys.mockResolvedValue([]);

      await analyticsService.invalidateCache();

      expect(mockRedis.keys).toHaveBeenCalled();
      expect(mockRedis.del).not.toHaveBeenCalled();
    });
  });
});
