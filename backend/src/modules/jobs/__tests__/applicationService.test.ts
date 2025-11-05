import { describe, it, expect, beforeEach, vi } from 'vitest';
import ApplicationService from '../services/applicationService';
import { NotFoundError, BadRequestError, ForbiddenError } from '@/utils/errors';
import { JobApplication, ApplicationStatus } from '@prisma/client';

// Mock prisma
vi.mock('@/config/database', () => ({
  default: {
    job: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    jobApplication: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    applicationStatusHistory: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
  },
}));

// Mock logger
vi.mock('@/utils/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('ApplicationService', () => {
  let service: ApplicationService;
  let mockPrisma: any;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    profile: {
      displayName: 'Test User',
    },
    skills: [
      {
        skillName: 'Python',
        skillType: 'programming_language',
        proficiency: 5,
      },
    ],
    workExperiences: [
      {
        title: 'ML Engineer',
        company: 'Tech Corp',
        location: 'San Francisco',
        employmentType: 'full_time',
        startDate: new Date('2020-01-01'),
        endDate: null,
        description: 'Working on LLM applications',
        techStack: { languages: ['Python'], frameworks: ['TensorFlow'] },
      },
    ],
    educations: [
      {
        institution: 'Stanford University',
        degree: 'MS in Computer Science',
        fieldOfStudy: 'Machine Learning',
        startDate: new Date('2018-01-01'),
        endDate: new Date('2020-01-01'),
        description: 'Focus on deep learning',
      },
    ],
    portfolioProjects: [],
  };

  const mockJob = {
    id: 'job-123',
    title: 'Senior ML Engineer',
    slug: 'senior-ml-engineer',
    status: 'active',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    screeningQuestions: null,
    company: {
      name: 'Tech Corp',
      ownerUserId: 'company-owner-123',
    },
  };

  const mockApplication: Partial<JobApplication> = {
    id: 'app-123',
    jobId: 'job-123',
    userId: 'user-123',
    coverLetter: 'I am very interested...',
    resumeUrl: null,
    screeningAnswers: null,
    source: 'easy_apply',
    status: 'submitted' as ApplicationStatus,
    appliedAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    const { default: prisma } = require('@/config/database');
    mockPrisma = prisma;
    service = new ApplicationService();

    // Reset all mocks
    vi.clearAllMocks();
  });

  describe('applyToJob', () => {
    it('should successfully create a job application', async () => {
      mockPrisma.job.findUnique.mockResolvedValue(mockJob);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.jobApplication.findUnique.mockResolvedValue(null); // No existing application
      mockPrisma.jobApplication.create.mockResolvedValue({
        ...mockApplication,
        job: {
          title: mockJob.title,
          slug: mockJob.slug,
          company: mockJob.company,
        },
        user: {
          username: mockUser.username,
          email: mockUser.email,
          profile: mockUser.profile,
        },
      });
      mockPrisma.job.update.mockResolvedValue(mockJob);
      mockPrisma.notification.create.mockResolvedValue({});

      const result = await service.applyToJob({
        jobId: 'job-123',
        userId: 'user-123',
        coverLetter: 'I am very interested...',
      });

      expect(result).toBeDefined();
      expect(mockPrisma.job.findUnique).toHaveBeenCalledWith({
        where: { id: 'job-123' },
        include: {
          company: {
            select: {
              name: true,
              ownerUserId: true,
            },
          },
        },
      });
      expect(mockPrisma.jobApplication.create).toHaveBeenCalled();
      expect(mockPrisma.job.update).toHaveBeenCalledWith({
        where: { id: 'job-123' },
        data: {
          applicationCount: {
            increment: 1,
          },
        },
      });
    });

    it('should throw NotFoundError when job does not exist', async () => {
      mockPrisma.job.findUnique.mockResolvedValue(null);

      await expect(
        service.applyToJob({
          jobId: 'job-123',
          userId: 'user-123',
        })
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw BadRequestError when job is not active', async () => {
      mockPrisma.job.findUnique.mockResolvedValue({
        ...mockJob,
        status: 'closed',
      });

      await expect(
        service.applyToJob({
          jobId: 'job-123',
          userId: 'user-123',
        })
      ).rejects.toThrow(BadRequestError);
    });

    it('should throw BadRequestError when job has expired', async () => {
      mockPrisma.job.findUnique.mockResolvedValue({
        ...mockJob,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      });

      await expect(
        service.applyToJob({
          jobId: 'job-123',
          userId: 'user-123',
        })
      ).rejects.toThrow(BadRequestError);
    });

    it('should throw BadRequestError when duplicate application exists', async () => {
      mockPrisma.job.findUnique.mockResolvedValue(mockJob);
      mockPrisma.jobApplication.findUnique.mockResolvedValue(mockApplication);

      await expect(
        service.applyToJob({
          jobId: 'job-123',
          userId: 'user-123',
        })
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('getUserApplications', () => {
    it('should return user applications', async () => {
      const mockApplications = [
        {
          ...mockApplication,
          job: {
            id: 'job-123',
            title: 'Senior ML Engineer',
            slug: 'senior-ml-engineer',
            jobType: 'full_time',
            workLocation: 'remote',
            location: 'San Francisco',
            status: 'active',
            company: {
              name: 'Tech Corp',
              logoUrl: null,
              slug: 'tech-corp',
            },
          },
        },
      ];

      mockPrisma.jobApplication.findMany.mockResolvedValue(mockApplications);

      const result = await service.getUserApplications('user-123');

      expect(result).toEqual(mockApplications);
      expect(mockPrisma.jobApplication.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        orderBy: { appliedAt: 'desc' },
        include: expect.any(Object),
      });
    });

    it('should filter applications by status', async () => {
      mockPrisma.jobApplication.findMany.mockResolvedValue([]);

      await service.getUserApplications('user-123', { status: 'interview' });

      expect(mockPrisma.jobApplication.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123', status: 'interview' },
        orderBy: { appliedAt: 'desc' },
        include: expect.any(Object),
      });
    });
  });

  describe('getApplicationById', () => {
    it('should return application for owner', async () => {
      mockPrisma.jobApplication.findUnique.mockResolvedValue({
        ...mockApplication,
        userId: 'user-123',
        job: {
          company: {
            ownerUserId: 'company-owner-123',
          },
        },
      });

      const result = await service.getApplicationById('app-123', 'user-123');

      expect(result).toBeDefined();
    });

    it('should return application for company owner', async () => {
      mockPrisma.jobApplication.findUnique.mockResolvedValue({
        ...mockApplication,
        userId: 'user-456',
        job: {
          company: {
            ownerUserId: 'user-123',
          },
        },
      });

      const result = await service.getApplicationById('app-123', 'user-123');

      expect(result).toBeDefined();
    });

    it('should throw NotFoundError when application does not exist', async () => {
      mockPrisma.jobApplication.findUnique.mockResolvedValue(null);

      await expect(
        service.getApplicationById('app-123', 'user-123')
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError for unauthorized user', async () => {
      mockPrisma.jobApplication.findUnique.mockResolvedValue({
        ...mockApplication,
        userId: 'user-456',
        job: {
          company: {
            ownerUserId: 'company-owner-789',
          },
        },
      });

      await expect(
        service.getApplicationById('app-123', 'user-123')
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('withdrawApplication', () => {
    it('should successfully withdraw application', async () => {
      mockPrisma.jobApplication.findUnique.mockResolvedValue({
        ...mockApplication,
        userId: 'user-123',
        status: 'submitted',
        job: {
          company: {
            ownerUserId: 'company-owner-123',
          },
        },
      });

      mockPrisma.jobApplication.update.mockResolvedValue({
        ...mockApplication,
        status: 'withdrawn',
        job: {
          title: mockJob.title,
          company: {
            name: mockJob.company.name,
          },
        },
      });

      mockPrisma.notification.create.mockResolvedValue({});

      const result = await service.withdrawApplication('app-123', 'user-123');

      expect(result.status).toBe('withdrawn');
      expect(mockPrisma.jobApplication.update).toHaveBeenCalledWith({
        where: { id: 'app-123' },
        data: { status: 'withdrawn' },
        include: expect.any(Object),
      });
    });

    it('should throw ForbiddenError when withdrawing others application', async () => {
      mockPrisma.jobApplication.findUnique.mockResolvedValue({
        ...mockApplication,
        userId: 'user-456',
      });

      await expect(
        service.withdrawApplication('app-123', 'user-123')
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw BadRequestError when already withdrawn', async () => {
      mockPrisma.jobApplication.findUnique.mockResolvedValue({
        ...mockApplication,
        userId: 'user-123',
        status: 'withdrawn',
      });

      await expect(
        service.withdrawApplication('app-123', 'user-123')
      ).rejects.toThrow(BadRequestError);
    });

    it('should throw BadRequestError when trying to withdraw after offer', async () => {
      mockPrisma.jobApplication.findUnique.mockResolvedValue({
        ...mockApplication,
        userId: 'user-123',
        status: 'offer',
      });

      await expect(
        service.withdrawApplication('app-123', 'user-123')
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('updateApplicationStatus', () => {
    it('should update application status by company owner', async () => {
      mockPrisma.jobApplication.findUnique.mockResolvedValue({
        ...mockApplication,
        job: {
          company: {
            ownerUserId: 'user-123',
          },
        },
      });

      mockPrisma.jobApplication.update.mockResolvedValue({
        ...mockApplication,
        status: 'interview',
        job: {
          title: mockJob.title,
          slug: mockJob.slug,
        },
        user: {
          id: 'user-456',
          username: 'candidate',
          email: 'candidate@example.com',
        },
      });

      mockPrisma.notification.create.mockResolvedValue({});

      const result = await service.updateApplicationStatus('app-123', 'interview', 'user-123');

      expect(result.status).toBe('interview');
      expect(mockPrisma.notification.create).toHaveBeenCalled();
    });

    it('should throw ForbiddenError when non-owner tries to update', async () => {
      mockPrisma.jobApplication.findUnique.mockResolvedValue({
        ...mockApplication,
        job: {
          company: {
            ownerUserId: 'company-owner-789',
          },
        },
      });

      await expect(
        service.updateApplicationStatus('app-123', 'interview', 'user-123')
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('getUserApplicationStats', () => {
    it('should return application statistics', async () => {
      mockPrisma.jobApplication.count.mockResolvedValue(10);
      mockPrisma.jobApplication.groupBy.mockResolvedValue([
        { status: 'submitted', _count: 4 },
        { status: 'viewed', _count: 3 },
        { status: 'interview', _count: 2 },
        { status: 'offer', _count: 1 },
      ]);

      const stats = await service.getUserApplicationStats('user-123');

      expect(stats.totalApplied).toBe(10);
      expect(stats.viewedRate).toBe(30);
      expect(stats.interviewRate).toBe(20);
      expect(stats.offerRate).toBe(10);
    });
  });

  describe('getUserApplications with filters', () => {
    const mockApplications = [
      {
        id: 'app-1',
        status: 'submitted',
        appliedAt: new Date(),
        updatedAt: new Date(),
        job: {
          id: 'job-1',
          title: 'Senior ML Engineer',
          slug: 'senior-ml-engineer',
          jobType: 'full_time',
          workLocation: 'remote',
          location: 'San Francisco',
          status: 'active',
          company: {
            name: 'Tech Corp',
            logoUrl: 'logo.png',
            slug: 'tech-corp',
          },
        },
      },
    ];

    it('should filter applications by "active" preset', async () => {
      mockPrisma.jobApplication.findMany.mockResolvedValue(mockApplications);

      const result = await service.getUserApplications('user-123', {
        filter: 'active',
      });

      expect(result).toBeDefined();
      expect(mockPrisma.jobApplication.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-123',
            status: { in: ['submitted', 'viewed', 'screening'] },
          }),
        })
      );
    });

    it('should filter applications by "interviews" preset', async () => {
      mockPrisma.jobApplication.findMany.mockResolvedValue(mockApplications);

      const result = await service.getUserApplications('user-123', {
        filter: 'interviews',
      });

      expect(result).toBeDefined();
      expect(mockPrisma.jobApplication.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-123',
            status: 'interview',
          }),
        })
      );
    });
  });

  describe('getApplicationHistory', () => {
    it('should return application status history for owner', async () => {
      const mockHistory = [
        {
          id: 'history-1',
          applicationId: 'app-123',
          fromStatus: null,
          toStatus: 'submitted',
          changedById: 'user-123',
          notes: 'Application submitted',
          createdAt: new Date(),
        },
        {
          id: 'history-2',
          applicationId: 'app-123',
          fromStatus: 'submitted',
          toStatus: 'viewed',
          changedById: 'company-owner-123',
          notes: 'Status changed from submitted to viewed',
          createdAt: new Date(),
        },
      ];

      mockPrisma.jobApplication.findUnique.mockResolvedValue({
        ...mockApplication,
        userId: 'user-123',
        job: {
          company: {
            ownerUserId: 'company-owner-123',
          },
        },
      });

      mockPrisma.applicationStatusHistory = {
        findMany: vi.fn().mockResolvedValue(mockHistory),
      };

      const result = await service.getApplicationHistory('app-123', 'user-123');

      expect(result).toHaveLength(2);
      expect(result[0].toStatus).toBe('submitted');
      expect(result[1].toStatus).toBe('viewed');
    });

    it('should throw ForbiddenError when unauthorized user tries to access history', async () => {
      mockPrisma.jobApplication.findUnique.mockResolvedValue({
        ...mockApplication,
        userId: 'user-456',
        job: {
          company: {
            ownerUserId: 'company-owner-789',
          },
        },
      });

      await expect(
        service.getApplicationHistory('app-123', 'user-123')
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('exportApplicationsToCSV', () => {
    it('should export applications as CSV format', async () => {
      const mockApplications = [
        {
          id: 'app-1',
          status: 'submitted',
          appliedAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-02'),
          job: {
            id: 'job-1',
            title: 'Senior ML Engineer',
            slug: 'senior-ml-engineer',
            jobType: 'full_time',
            workLocation: 'remote',
            location: 'San Francisco',
            status: 'active',
            company: {
              name: 'Tech Corp',
              logoUrl: 'logo.png',
              slug: 'tech-corp',
            },
          },
        },
      ];

      mockPrisma.jobApplication.findMany.mockResolvedValue(mockApplications);

      const csv = await service.exportApplicationsToCSV('user-123');

      expect(csv).toContain('Application ID');
      expect(csv).toContain('Job Title');
      expect(csv).toContain('Company');
      expect(csv).toContain('Status');
      expect(csv).toContain('app-1');
      expect(csv).toContain('Senior ML Engineer');
      expect(csv).toContain('Tech Corp');
      expect(csv).toContain('submitted');
    });

    it('should handle empty applications list', async () => {
      mockPrisma.jobApplication.findMany.mockResolvedValue([]);

      const csv = await service.exportApplicationsToCSV('user-123');

      expect(csv).toContain('Application ID');
      // Should only contain header
      expect(csv.split('\n').length).toBe(1);
    });
  });
});
