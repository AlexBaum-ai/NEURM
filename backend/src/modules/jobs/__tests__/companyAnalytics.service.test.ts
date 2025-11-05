import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CompanyAnalyticsService } from '../services/companyAnalyticsService';
import { prisma } from '@/lib/prisma';
import { redis } from '@/config/redis';
import { NotFoundError, ForbiddenError } from '@/utils/errors';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    company: {
      findUnique: vi.fn(),
    },
    job: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    jobApplication: {
      findFirst: vi.fn(),
    },
    jobAnalytics: {
      findMany: vi.fn(),
      groupBy: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

vi.mock('@/config/redis', () => ({
  redis: {
    get: vi.fn(),
    setex: vi.fn(),
    del: vi.fn(),
  },
}));

describe('CompanyAnalyticsService', () => {
  let service: CompanyAnalyticsService;
  const mockCompanyId = 'company-123';
  const mockUserId = 'user-123';
  const mockJobId = 'job-123';

  beforeEach(() => {
    service = new CompanyAnalyticsService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getCompanyAnalytics', () => {
    it('should return cached analytics if available', async () => {
      const mockAnalytics = {
        overview: {
          totalJobs: 5,
          totalApplications: 100,
          totalViews: 1000,
          conversionRate: 10,
        },
      };

      (prisma.company.findUnique as any).mockResolvedValue({
        id: mockCompanyId,
        ownerUserId: mockUserId,
      });

      (redis.get as any).mockResolvedValue(JSON.stringify(mockAnalytics));

      const result = await service.getCompanyAnalytics(mockCompanyId, mockUserId);

      expect(result).toEqual(mockAnalytics);
      expect(redis.get).toHaveBeenCalledWith(`company_analytics:${mockCompanyId}`);
    });

    it('should compute and cache analytics if not cached', async () => {
      const mockJobs = [
        {
          id: 'job-1',
          title: 'Test Job',
          viewCount: 100,
          applications: [
            {
              id: 'app-1',
              status: 'submitted',
              source: 'linkedin',
              user: {
                reputation: { totalReputation: 50 },
                userModels: [],
              },
            },
          ],
          matches: [{ matchScore: 85 }],
        },
      ];

      (prisma.company.findUnique as any).mockResolvedValue({
        id: mockCompanyId,
        ownerUserId: mockUserId,
      });

      (redis.get as any).mockResolvedValue(null);
      (prisma.job.findMany as any).mockResolvedValue(mockJobs);
      (prisma.jobAnalytics.groupBy as any).mockResolvedValue([]);
      (redis.setex as any).mockResolvedValue('OK');

      const result = await service.getCompanyAnalytics(mockCompanyId, mockUserId);

      expect(result).toHaveProperty('overview');
      expect(result.overview).toHaveProperty('totalJobs');
      expect(result.overview).toHaveProperty('totalApplications');
      expect(result.overview).toHaveProperty('conversionRate');
      expect(redis.setex).toHaveBeenCalled();
    });

    it('should throw NotFoundError if company does not exist', async () => {
      (prisma.company.findUnique as any).mockResolvedValue(null);

      await expect(
        service.getCompanyAnalytics(mockCompanyId, mockUserId)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError if user is not company owner', async () => {
      (prisma.company.findUnique as any).mockResolvedValue({
        id: mockCompanyId,
        ownerUserId: 'different-user',
      });

      await expect(
        service.getCompanyAnalytics(mockCompanyId, mockUserId)
      ).rejects.toThrow(ForbiddenError);
    });

    it('should handle date range filter', async () => {
      const dateRange = {
        from: new Date('2024-01-01'),
        to: new Date('2024-01-31'),
      };

      (prisma.company.findUnique as any).mockResolvedValue({
        id: mockCompanyId,
        ownerUserId: mockUserId,
      });

      (redis.get as any).mockResolvedValue(null);
      (prisma.job.findMany as any).mockResolvedValue([]);
      (prisma.jobAnalytics.groupBy as any).mockResolvedValue([]);
      (redis.setex as any).mockResolvedValue('OK');

      await service.getCompanyAnalytics(mockCompanyId, mockUserId, dateRange);

      expect(prisma.job.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            companyId: mockCompanyId,
            createdAt: {
              gte: dateRange.from,
              lte: dateRange.to,
            },
          }),
        })
      );
    });
  });

  describe('getJobAnalytics', () => {
    it('should return cached job analytics if available', async () => {
      const mockAnalytics = {
        overview: {
          totalApplications: 10,
          totalViews: 100,
          conversionRate: 10,
        },
      };

      (prisma.company.findUnique as any).mockResolvedValue({
        id: mockCompanyId,
        ownerUserId: mockUserId,
      });

      (prisma.job.findFirst as any).mockResolvedValue({
        id: mockJobId,
        companyId: mockCompanyId,
      });

      (redis.get as any).mockResolvedValue(JSON.stringify(mockAnalytics));

      const result = await service.getJobAnalytics(
        mockJobId,
        mockCompanyId,
        mockUserId
      );

      expect(result).toEqual(mockAnalytics);
      expect(redis.get).toHaveBeenCalledWith(`company_analytics:job:${mockJobId}`);
    });

    it('should compute and cache job analytics if not cached', async () => {
      const mockJob = {
        id: mockJobId,
        companyId: mockCompanyId,
        title: 'Test Job',
        viewCount: 100,
        applications: [
          {
            id: 'app-1',
            status: 'submitted',
            source: 'linkedin',
            statusHistory: [],
            user: {
              reputation: { totalReputation: 50 },
              userModels: [],
            },
          },
        ],
        matches: [{ matchScore: 85 }],
      };

      (prisma.company.findUnique as any).mockResolvedValue({
        id: mockCompanyId,
        ownerUserId: mockUserId,
      });

      (prisma.job.findFirst as any).mockResolvedValue({
        id: mockJobId,
        companyId: mockCompanyId,
      });

      (redis.get as any).mockResolvedValue(null);
      (prisma.job.findUnique as any).mockResolvedValue(mockJob);
      (prisma.jobApplication.findFirst as any).mockResolvedValue(null);
      (prisma.jobAnalytics.findMany as any).mockResolvedValue([]);
      (prisma.job.findMany as any).mockResolvedValue([mockJob]);
      (redis.setex as any).mockResolvedValue('OK');

      const result = await service.getJobAnalytics(
        mockJobId,
        mockCompanyId,
        mockUserId
      );

      expect(result).toHaveProperty('overview');
      expect(result).toHaveProperty('funnelData');
      expect(result).toHaveProperty('timeSeriesData');
      expect(result).toHaveProperty('demographics');
      expect(result).toHaveProperty('comparison');
      expect(redis.setex).toHaveBeenCalled();
    });

    it('should throw NotFoundError if job does not belong to company', async () => {
      (prisma.company.findUnique as any).mockResolvedValue({
        id: mockCompanyId,
        ownerUserId: mockUserId,
      });

      (prisma.job.findFirst as any).mockResolvedValue(null);

      await expect(
        service.getJobAnalytics(mockJobId, mockCompanyId, mockUserId)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('exportAnalyticsCSV', () => {
    it('should export company analytics to CSV', async () => {
      const mockAnalytics = {
        overview: {
          totalJobs: 5,
          totalApplications: 100,
          totalViews: 1000,
          conversionRate: 10,
        },
        topPerformingJobs: [
          {
            id: 'job-1',
            title: 'Test Job',
            applicationCount: 20,
          },
        ],
      };

      (prisma.company.findUnique as any).mockResolvedValue({
        id: mockCompanyId,
        ownerUserId: mockUserId,
      });

      (prisma.job.findMany as any).mockResolvedValue([]);
      (prisma.jobAnalytics.groupBy as any).mockResolvedValue([]);

      const csv = await service.exportAnalyticsCSV(
        mockCompanyId,
        mockUserId,
        'company'
      );

      expect(csv).toBeTruthy();
      expect(typeof csv).toBe('string');
      expect(csv).toContain('section');
    });

    it('should export job analytics to CSV', async () => {
      (prisma.company.findUnique as any).mockResolvedValue({
        id: mockCompanyId,
        ownerUserId: mockUserId,
      });

      (prisma.job.findFirst as any).mockResolvedValue({
        id: mockJobId,
        companyId: mockCompanyId,
      });

      (prisma.job.findUnique as any).mockResolvedValue({
        id: mockJobId,
        companyId: mockCompanyId,
        viewCount: 100,
        applications: [],
        matches: [],
      });

      (prisma.jobApplication.findFirst as any).mockResolvedValue(null);
      (prisma.jobAnalytics.findMany as any).mockResolvedValue([]);
      (prisma.job.findMany as any).mockResolvedValue([]);

      const csv = await service.exportAnalyticsCSV(
        mockCompanyId,
        mockUserId,
        'job',
        mockJobId
      );

      expect(csv).toBeTruthy();
      expect(typeof csv).toBe('string');
    });
  });

  describe('exportAnalyticsPDF', () => {
    it('should export company analytics to PDF', async () => {
      (prisma.company.findUnique as any).mockResolvedValue({
        id: mockCompanyId,
        ownerUserId: mockUserId,
      });

      (prisma.job.findMany as any).mockResolvedValue([]);
      (prisma.jobAnalytics.groupBy as any).mockResolvedValue([]);

      const pdf = await service.exportAnalyticsPDF(
        mockCompanyId,
        mockUserId,
        'company'
      );

      expect(pdf).toBeTruthy();
      expect(Buffer.isBuffer(pdf)).toBe(true);
    });
  });

  describe('invalidateCache', () => {
    it('should invalidate company analytics cache', async () => {
      (redis.del as any).mockResolvedValue(1);

      await service.invalidateCache(mockCompanyId);

      expect(redis.del).toHaveBeenCalledWith(`company_analytics:${mockCompanyId}`);
    });

    it('should invalidate both company and job analytics cache', async () => {
      (redis.del as any).mockResolvedValue(1);

      await service.invalidateCache(mockCompanyId, mockJobId);

      expect(redis.del).toHaveBeenCalledTimes(2);
      expect(redis.del).toHaveBeenCalledWith(`company_analytics:${mockCompanyId}`);
      expect(redis.del).toHaveBeenCalledWith(`company_analytics:job:${mockJobId}`);
    });
  });
});
