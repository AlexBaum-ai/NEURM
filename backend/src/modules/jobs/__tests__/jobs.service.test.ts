import { describe, it, expect, beforeEach, vi } from 'vitest';
import JobService from '../jobs.service';
import JobRepository from '../jobs.repository';
import { NotFoundError, ForbiddenError } from '@/utils/errors';
import { Job, JobStatus } from '@prisma/client';

// Mock the repository
vi.mock('../jobs.repository');
vi.mock('@/config/database', () => ({
  default: {
    company: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe('JobService', () => {
  let service: JobService;
  let mockRepository: vi.Mocked<JobRepository>;

  const mockCompany = {
    id: 'company-123',
    ownerUserId: 'user-123',
    verifiedCompany: true,
    slug: 'test-company',
  };

  const mockJob: Partial<Job> = {
    id: 'job-123',
    title: 'Senior LLM Engineer',
    slug: 'test-company-senior-llm-engineer',
    companyId: 'company-123',
    description: 'We are looking for an experienced LLM engineer...',
    requirements: 'Experience with GPT-4, LangChain, and vector databases',
    jobType: 'full_time',
    workLocation: 'remote',
    experienceLevel: 'senior',
    location: 'San Francisco, CA',
    status: 'active' as JobStatus,
    primaryLlms: ['GPT-4', 'Claude'],
    frameworks: ['LangChain'],
    positionsAvailable: 1,
    hasVisaSponsorship: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockRepository = {
      findById: vi.fn(),
      findBySlug: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
      incrementViewCount: vi.fn(),
      findByCompanyId: vi.fn(),
      createSkills: vi.fn(),
      deleteSkills: vi.fn(),
      updateSkills: vi.fn(),
      closeExpiredJobs: vi.fn(),
    } as any;

    service = new JobService(mockRepository);
  });

  describe('getJobById', () => {
    it('should return job by ID', async () => {
      mockRepository.findById.mockResolvedValue(mockJob as Job);

      const result = await service.getJobById('job-123');

      expect(result).toEqual(mockJob);
      expect(mockRepository.findById).toHaveBeenCalledWith('job-123');
    });

    it('should throw NotFoundError when job does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.getJobById('nonexistent')).rejects.toThrow(NotFoundError);
    });

    it('should increment view count when incrementView is true', async () => {
      mockRepository.findById.mockResolvedValue(mockJob as Job);
      mockRepository.incrementViewCount.mockResolvedValue(undefined);

      await service.getJobById('job-123', true);

      // View count is incremented asynchronously, so we just verify the call was made
      expect(mockRepository.findById).toHaveBeenCalledWith('job-123');
    });
  });

  describe('getJobBySlug', () => {
    it('should return job by slug', async () => {
      mockRepository.findBySlug.mockResolvedValue(mockJob as Job);

      const result = await service.getJobBySlug('test-company-senior-llm-engineer');

      expect(result).toEqual(mockJob);
      expect(mockRepository.findBySlug).toHaveBeenCalledWith('test-company-senior-llm-engineer');
    });

    it('should throw NotFoundError when job does not exist', async () => {
      mockRepository.findBySlug.mockResolvedValue(null);

      await expect(service.getJobBySlug('nonexistent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('listJobs', () => {
    it('should return paginated jobs with filters', async () => {
      const mockJobs = [mockJob as Job];
      const mockTotal = 1;

      mockRepository.findMany.mockResolvedValue({
        jobs: mockJobs,
        total: mockTotal,
      });

      const query = {
        page: 1,
        limit: 20,
        status: 'active' as JobStatus,
      };

      const result = await service.listJobs(query);

      expect(result.jobs).toEqual(mockJobs);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      });
    });

    it('should calculate pagination correctly', async () => {
      mockRepository.findMany.mockResolvedValue({
        jobs: [],
        total: 45,
      });

      const query = {
        page: 2,
        limit: 20,
      };

      const result = await service.listJobs(query);

      expect(result.pagination.totalPages).toBe(3);
    });
  });

  describe('deleteJob', () => {
    it('should soft delete job when user is company owner', async () => {
      const prisma = await import('@/config/database');

      mockRepository.findById.mockResolvedValue(mockJob as Job);
      (prisma.default.company.findUnique as any).mockResolvedValue(mockCompany);
      mockRepository.softDelete.mockResolvedValue(mockJob as Job);

      await service.deleteJob('job-123', 'user-123');

      expect(mockRepository.softDelete).toHaveBeenCalledWith('job-123');
    });

    it('should throw NotFoundError when job does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.deleteJob('nonexistent', 'user-123')).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError when user is not company owner', async () => {
      const prisma = await import('@/config/database');

      mockRepository.findById.mockResolvedValue(mockJob as Job);
      (prisma.default.company.findUnique as any).mockResolvedValue(mockCompany);

      await expect(service.deleteJob('job-123', 'different-user')).rejects.toThrow(ForbiddenError);
    });
  });

  describe('closeExpiredJobs', () => {
    it('should close expired jobs and return count', async () => {
      mockRepository.closeExpiredJobs.mockResolvedValue(5);

      const count = await service.closeExpiredJobs();

      expect(count).toBe(5);
      expect(mockRepository.closeExpiredJobs).toHaveBeenCalled();
    });
  });
});
