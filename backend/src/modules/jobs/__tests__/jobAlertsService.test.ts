import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import JobAlertsService from '../services/jobAlertsService';
import prisma from '@/config/database';
import { NotFoundError, BadRequestError } from '@/utils/errors';

// Mock Prisma
vi.mock('@/config/database', () => ({
  default: {
    jobAlert: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    job: {
      findMany: vi.fn(),
    },
  },
}));

// Mock logger
vi.mock('@/utils/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('JobAlertsService', () => {
  let service: JobAlertsService;

  const mockUserId = 'user-123';
  const mockAlertId = 'alert-456';
  const mockAlert = {
    id: mockAlertId,
    userId: mockUserId,
    name: 'AI Engineer Jobs',
    criteriaJson: {
      keywords: ['AI', 'machine learning'],
      location: 'San Francisco',
      remote: true,
      jobTypes: ['full_time'],
      salaryMin: 150000,
    },
    active: true,
    lastSentAt: null,
    jobsClickedCount: 0,
    jobsSentCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockJob = {
    id: 'job-789',
    title: 'Senior AI Engineer',
    description: 'Looking for AI experts',
    status: 'active',
    publishedAt: new Date(),
    company: {
      id: 'company-1',
      name: 'Tech Corp',
      slug: 'tech-corp',
      logoUrl: 'https://example.com/logo.png',
      verifiedCompany: true,
    },
  };

  beforeEach(() => {
    service = new JobAlertsService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createAlert', () => {
    it('should create a job alert successfully', async () => {
      vi.mocked(prisma.jobAlert.count).mockResolvedValue(5);
      vi.mocked(prisma.jobAlert.create).mockResolvedValue(mockAlert as any);

      const result = await service.createAlert(mockUserId, {
        name: 'AI Engineer Jobs',
        criteria: mockAlert.criteriaJson as any,
      });

      expect(result).toEqual(mockAlert);
      expect(prisma.jobAlert.create).toHaveBeenCalled();
    });

    it('should throw BadRequestError if user has 10 alerts', async () => {
      vi.mocked(prisma.jobAlert.count).mockResolvedValue(10);

      await expect(
        service.createAlert(mockUserId, {
          name: 'AI Engineer Jobs',
          criteria: mockAlert.criteriaJson as any,
        })
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('updateAlert', () => {
    it('should update a job alert successfully', async () => {
      vi.mocked(prisma.jobAlert.findUnique).mockResolvedValue(mockAlert as any);
      vi.mocked(prisma.jobAlert.update).mockResolvedValue({
        ...mockAlert,
        name: 'Updated Alert Name',
      } as any);

      const result = await service.updateAlert(mockUserId, mockAlertId, {
        name: 'Updated Alert Name',
      });

      expect(result.name).toBe('Updated Alert Name');
      expect(prisma.jobAlert.update).toHaveBeenCalled();
    });

    it('should throw NotFoundError if alert does not exist', async () => {
      vi.mocked(prisma.jobAlert.findUnique).mockResolvedValue(null);

      await expect(
        service.updateAlert(mockUserId, mockAlertId, { name: 'Updated' })
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError if alert belongs to different user', async () => {
      vi.mocked(prisma.jobAlert.findUnique).mockResolvedValue({
        ...mockAlert,
        userId: 'different-user',
      } as any);

      await expect(
        service.updateAlert(mockUserId, mockAlertId, { name: 'Updated' })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteAlert', () => {
    it('should delete a job alert successfully', async () => {
      vi.mocked(prisma.jobAlert.findUnique).mockResolvedValue(mockAlert as any);
      vi.mocked(prisma.jobAlert.delete).mockResolvedValue(mockAlert as any);

      await service.deleteAlert(mockUserId, mockAlertId);

      expect(prisma.jobAlert.delete).toHaveBeenCalledWith({
        where: { id: mockAlertId },
      });
    });

    it('should throw NotFoundError if alert does not exist', async () => {
      vi.mocked(prisma.jobAlert.findUnique).mockResolvedValue(null);

      await expect(service.deleteAlert(mockUserId, mockAlertId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('getUserAlerts', () => {
    it('should return user alerts', async () => {
      const mockAlerts = [mockAlert];
      vi.mocked(prisma.jobAlert.findMany).mockResolvedValue(mockAlerts as any);

      const result = await service.getUserAlerts(mockUserId, {});

      expect(result).toEqual(mockAlerts);
    });

    it('should filter by active status', async () => {
      vi.mocked(prisma.jobAlert.findMany).mockResolvedValue([mockAlert] as any);

      await service.getUserAlerts(mockUserId, { active: true });

      expect(prisma.jobAlert.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ active: true }),
        })
      );
    });
  });

  describe('findMatchingJobs', () => {
    it('should find jobs matching criteria', async () => {
      vi.mocked(prisma.job.findMany).mockResolvedValue([mockJob] as any);

      const result = await service.findMatchingJobs(mockAlert.criteriaJson as any);

      expect(result).toEqual([mockJob]);
      expect(prisma.job.findMany).toHaveBeenCalled();
    });

    it('should filter by keywords', async () => {
      vi.mocked(prisma.job.findMany).mockResolvedValue([mockJob] as any);

      await service.findMatchingJobs({
        keywords: ['AI', 'machine learning'],
      } as any);

      expect(prisma.job.findMany).toHaveBeenCalled();
    });
  });

  describe('trackAlertClick', () => {
    it('should track alert click successfully', async () => {
      vi.mocked(prisma.jobAlert.findUnique).mockResolvedValue(mockAlert as any);
      vi.mocked(prisma.jobAlert.update).mockResolvedValue({
        ...mockAlert,
        jobsClickedCount: 1,
      } as any);

      await service.trackAlertClick(mockAlertId, 'job-123');

      expect(prisma.jobAlert.update).toHaveBeenCalledWith({
        where: { id: mockAlertId },
        data: {
          jobsClickedCount: {
            increment: 1,
          },
        },
      });
    });

    it('should throw NotFoundError if alert does not exist', async () => {
      vi.mocked(prisma.jobAlert.findUnique).mockResolvedValue(null);

      await expect(service.trackAlertClick(mockAlertId, 'job-123')).rejects.toThrow(NotFoundError);
    });
  });

  describe('processAlerts', () => {
    it('should process alerts successfully', async () => {
      const alertWithUser = {
        ...mockAlert,
        user: {
          id: mockUserId,
          email: 'user@example.com',
          username: 'testuser',
          locale: 'en',
        },
      };

      vi.mocked(prisma.jobAlert.findMany).mockResolvedValue([alertWithUser] as any);
      vi.mocked(prisma.job.findMany).mockResolvedValue([mockJob] as any);
      vi.mocked(prisma.jobAlert.update).mockResolvedValue(mockAlert as any);

      const result = await service.processAlerts();

      expect(result.processed).toBe(1);
      expect(result.sent).toBe(1);
      expect(result.errors).toBe(0);
    });

    it('should handle errors gracefully', async () => {
      const alertWithUser = {
        ...mockAlert,
        user: {
          id: mockUserId,
          email: 'user@example.com',
          username: 'testuser',
          locale: 'en',
        },
      };

      vi.mocked(prisma.jobAlert.findMany).mockResolvedValue([alertWithUser] as any);
      vi.mocked(prisma.job.findMany).mockRejectedValue(new Error('Database error'));

      const result = await service.processAlerts();

      expect(result.processed).toBe(1);
      expect(result.sent).toBe(0);
      expect(result.errors).toBe(1);
    });
  });
});
