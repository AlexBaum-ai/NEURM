import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import SavedJobsService from '../services/savedJobsService';
import prisma from '@/config/database';
import { NotFoundError, ConflictError } from '@/utils/errors';

// Mock Prisma
vi.mock('@/config/database', () => ({
  default: {
    savedJob: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    job: {
      findUnique: vi.fn(),
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

describe('SavedJobsService', () => {
  let service: SavedJobsService;

  const mockUserId = 'user-123';
  const mockJobId = 'job-456';
  const mockSavedJob = {
    id: 'saved-789',
    userId: mockUserId,
    jobId: mockJobId,
    notes: 'Interesting role',
    savedAt: new Date(),
    job: {
      id: mockJobId,
      title: 'Senior AI Engineer',
      status: 'active',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      company: {
        id: 'company-1',
        name: 'Tech Corp',
        slug: 'tech-corp',
        logoUrl: 'https://example.com/logo.png',
        verifiedCompany: true,
      },
    },
  };

  beforeEach(() => {
    service = new SavedJobsService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('saveJob', () => {
    it('should save a job successfully', async () => {
      vi.mocked(prisma.job.findUnique).mockResolvedValue({ id: mockJobId, status: 'active' } as any);
      vi.mocked(prisma.savedJob.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.savedJob.create).mockResolvedValue(mockSavedJob as any);

      const result = await service.saveJob(mockUserId, mockJobId, { notes: 'Interesting role' });

      expect(result).toEqual(mockSavedJob);
      expect(prisma.job.findUnique).toHaveBeenCalledWith({
        where: { id: mockJobId },
        select: { id: true, status: true },
      });
      expect(prisma.savedJob.create).toHaveBeenCalled();
    });

    it('should throw NotFoundError if job does not exist', async () => {
      vi.mocked(prisma.job.findUnique).mockResolvedValue(null);

      await expect(service.saveJob(mockUserId, mockJobId)).rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError if job is already saved', async () => {
      vi.mocked(prisma.job.findUnique).mockResolvedValue({ id: mockJobId, status: 'active' } as any);
      vi.mocked(prisma.savedJob.findUnique).mockResolvedValue(mockSavedJob as any);

      await expect(service.saveJob(mockUserId, mockJobId)).rejects.toThrow(ConflictError);
    });
  });

  describe('unsaveJob', () => {
    it('should unsave a job successfully', async () => {
      vi.mocked(prisma.savedJob.findUnique).mockResolvedValue(mockSavedJob as any);
      vi.mocked(prisma.savedJob.delete).mockResolvedValue(mockSavedJob as any);

      await service.unsaveJob(mockUserId, mockJobId);

      expect(prisma.savedJob.delete).toHaveBeenCalledWith({
        where: { id: mockSavedJob.id },
      });
    });

    it('should throw NotFoundError if saved job does not exist', async () => {
      vi.mocked(prisma.savedJob.findUnique).mockResolvedValue(null);

      await expect(service.unsaveJob(mockUserId, mockJobId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('getSavedJobs', () => {
    it('should return paginated saved jobs', async () => {
      const mockSavedJobs = [mockSavedJob];
      vi.mocked(prisma.savedJob.count).mockResolvedValue(1);
      vi.mocked(prisma.savedJob.findMany).mockResolvedValue(mockSavedJobs as any);

      const result = await service.getSavedJobs(mockUserId, { page: 1, limit: 20 });

      expect(result.savedJobs).toHaveLength(1);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      });
    });

    it('should mark jobs expiring soon', async () => {
      const expiringJob = {
        ...mockSavedJob,
        job: {
          ...mockSavedJob.job,
          expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
        },
      };

      vi.mocked(prisma.savedJob.count).mockResolvedValue(1);
      vi.mocked(prisma.savedJob.findMany).mockResolvedValue([expiringJob] as any);

      const result = await service.getSavedJobs(mockUserId, { page: 1, limit: 20 });

      expect(result.savedJobs[0].expiringsSoon).toBe(true);
      expect(result.savedJobs[0].daysUntilExpiry).toBe(2);
    });
  });

  describe('isJobSaved', () => {
    it('should return true if job is saved', async () => {
      vi.mocked(prisma.savedJob.findUnique).mockResolvedValue(mockSavedJob as any);

      const result = await service.isJobSaved(mockUserId, mockJobId);

      expect(result).toBe(true);
    });

    it('should return false if job is not saved', async () => {
      vi.mocked(prisma.savedJob.findUnique).mockResolvedValue(null);

      const result = await service.isJobSaved(mockUserId, mockJobId);

      expect(result).toBe(false);
    });
  });

  describe('getJobsExpiringSoon', () => {
    it('should return jobs expiring in specified days', async () => {
      const mockExpiringSavedJobs = [mockSavedJob];
      vi.mocked(prisma.savedJob.findMany).mockResolvedValue(mockExpiringSavedJobs as any);

      const result = await service.getJobsExpiringSoon(3);

      expect(result).toEqual(mockExpiringSavedJobs);
      expect(prisma.savedJob.findMany).toHaveBeenCalled();
    });
  });
});
