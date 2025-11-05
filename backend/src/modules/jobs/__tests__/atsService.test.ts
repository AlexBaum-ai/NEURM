import { ATSService } from '../services/atsService';
import prisma from '@/config/database';
import { ApplicationStatus } from '@prisma/client';

// Mock Prisma
jest.mock('@/config/database', () => ({
  __esModule: true,
  default: {
    company: {
      findUnique: jest.fn(),
    },
    jobApplication: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    applicationNote: {
      create: jest.fn(),
    },
    applicationRating: {
      upsert: jest.fn(),
    },
    applicationShare: {
      upsert: jest.fn(),
    },
    applicationStatusHistory: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
  },
}));

// Mock logger
jest.mock('@/utils/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock Sentry
jest.mock('@sentry/node', () => ({
  captureException: jest.fn(),
  startTransaction: jest.fn(() => ({
    finish: jest.fn(),
  })),
}));

describe('ATSService', () => {
  let atsService: ATSService;

  beforeEach(() => {
    atsService = new ATSService();
    jest.clearAllMocks();
  });

  describe('getCompanyApplications', () => {
    const mockUserId = 'user-123';
    const mockCompanyId = 'company-123';

    const mockCompany = {
      id: mockCompanyId,
      ownerUserId: mockUserId,
    };

    const mockApplications = [
      {
        id: 'app-1',
        jobId: 'job-1',
        userId: 'candidate-1',
        status: 'submitted' as ApplicationStatus,
        appliedAt: new Date('2025-01-01'),
        user: {
          id: 'candidate-1',
          username: 'candidate1',
          email: 'candidate1@example.com',
          profile: {
            displayName: 'Candidate One',
            avatarUrl: null,
            location: 'New York',
          },
          reputation: {
            totalScore: 150,
            level: 'contributor',
          },
          userBadges: [
            {
              badge: {
                name: 'Helpful',
                type: 'silver',
                category: 'activity',
                icon: 'helpful.svg',
              },
            },
          ],
          jobMatches: [
            {
              matchScore: 85.5,
              matchReasons: { skills: 90, experience: 81 },
            },
          ],
        },
        job: {
          id: 'job-1',
          title: 'Senior LLM Engineer',
          slug: 'senior-llm-engineer',
          location: 'Remote',
          jobType: 'full_time',
          experienceLevel: 'senior',
        },
        ratings: [
          { rating: 4 },
          { rating: 5 },
        ],
        notes: [{ id: 'note-1' }],
      },
    ];

    it('should fetch company applications successfully', async () => {
      (prisma.company.findUnique as jest.Mock).mockResolvedValue(mockCompany);
      (prisma.jobApplication.findMany as jest.Mock).mockResolvedValue(mockApplications);
      (prisma.jobApplication.count as jest.Mock).mockResolvedValue(1);

      const result = await atsService.getCompanyApplications(mockUserId);

      expect(prisma.company.findUnique).toHaveBeenCalledWith({
        where: { ownerUserId: mockUserId },
        select: { id: true },
      });

      expect(result.applications).toHaveLength(1);
      expect(result.applications[0].averageRating).toBe(4.5);
      expect(result.applications[0].matchScore).toBe(85.5);
      expect(result.pagination.total).toBe(1);
    });

    it('should filter applications by status', async () => {
      (prisma.company.findUnique as jest.Mock).mockResolvedValue(mockCompany);
      (prisma.jobApplication.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.jobApplication.count as jest.Mock).mockResolvedValue(0);

      await atsService.getCompanyApplications(mockUserId, {
        status: 'interview',
      });

      expect(prisma.jobApplication.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'interview',
          }),
        })
      );
    });

    it('should filter applications by date range', async () => {
      const dateFrom = new Date('2025-01-01');
      const dateTo = new Date('2025-01-31');

      (prisma.company.findUnique as jest.Mock).mockResolvedValue(mockCompany);
      (prisma.jobApplication.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.jobApplication.count as jest.Mock).mockResolvedValue(0);

      await atsService.getCompanyApplications(mockUserId, {
        dateFrom,
        dateTo,
      });

      expect(prisma.jobApplication.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            appliedAt: {
              gte: dateFrom,
              lte: dateTo,
            },
          }),
        })
      );
    });

    it('should throw ForbiddenError if user is not company owner', async () => {
      (prisma.company.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        atsService.getCompanyApplications(mockUserId)
      ).rejects.toThrow('Only company owners can access applications');
    });
  });

  describe('updateApplicationStatus', () => {
    const mockApplicationId = 'app-123';
    const mockUserId = 'user-123';
    const newStatus = 'interview' as ApplicationStatus;

    const mockApplication = {
      id: mockApplicationId,
      status: 'viewed' as ApplicationStatus,
      job: {
        title: 'Senior LLM Engineer',
        company: {
          ownerUserId: mockUserId,
        },
      },
      user: {
        id: 'candidate-1',
        username: 'candidate1',
        email: 'candidate1@example.com',
      },
    };

    it('should update application status successfully', async () => {
      (prisma.jobApplication.findUnique as jest.Mock).mockResolvedValue(mockApplication);
      (prisma.jobApplication.update as jest.Mock).mockResolvedValue({
        ...mockApplication,
        status: newStatus,
      });
      (prisma.applicationStatusHistory.create as jest.Mock).mockResolvedValue({});
      (prisma.notification.create as jest.Mock).mockResolvedValue({});

      const result = await atsService.updateApplicationStatus(
        mockApplicationId,
        newStatus,
        mockUserId
      );

      expect(result.status).toBe(newStatus);
      expect(prisma.applicationStatusHistory.create).toHaveBeenCalled();
      expect(prisma.notification.create).toHaveBeenCalled();
    });

    it('should throw NotFoundError if application not found', async () => {
      (prisma.jobApplication.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        atsService.updateApplicationStatus(mockApplicationId, newStatus, mockUserId)
      ).rejects.toThrow('Application not found');
    });

    it('should throw ForbiddenError if user is not company owner', async () => {
      (prisma.jobApplication.findUnique as jest.Mock).mockResolvedValue({
        ...mockApplication,
        job: {
          ...mockApplication.job,
          company: {
            ownerUserId: 'different-user',
          },
        },
      });

      await expect(
        atsService.updateApplicationStatus(mockApplicationId, newStatus, mockUserId)
      ).rejects.toThrow('Only the company owner can update application status');
    });
  });

  describe('addNote', () => {
    const mockApplicationId = 'app-123';
    const mockUserId = 'user-123';
    const mockNote = 'Great candidate, moving to next round';

    const mockApplication = {
      id: mockApplicationId,
      status: 'screening' as ApplicationStatus,
      job: {
        company: {
          ownerUserId: mockUserId,
        },
      },
    };

    it('should add note successfully', async () => {
      (prisma.jobApplication.findUnique as jest.Mock).mockResolvedValue(mockApplication);
      (prisma.applicationNote.create as jest.Mock).mockResolvedValue({
        id: 'note-1',
        note: mockNote,
        isInternal: true,
        user: {
          username: 'recruiter1',
          profile: {
            displayName: 'Recruiter One',
          },
        },
      });
      (prisma.applicationStatusHistory.create as jest.Mock).mockResolvedValue({});

      const result = await atsService.addNote(
        mockApplicationId,
        mockUserId,
        mockNote
      );

      expect(result.note).toBe(mockNote);
      expect(prisma.applicationNote.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            applicationId: mockApplicationId,
            userId: mockUserId,
            note: mockNote,
          }),
        })
      );
    });

    it('should throw NotFoundError if application not found', async () => {
      (prisma.jobApplication.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        atsService.addNote(mockApplicationId, mockUserId, mockNote)
      ).rejects.toThrow('Application not found');
    });
  });

  describe('rateApplication', () => {
    const mockApplicationId = 'app-123';
    const mockUserId = 'user-123';
    const mockRating = 4;

    const mockApplication = {
      id: mockApplicationId,
      status: 'screening' as ApplicationStatus,
      job: {
        company: {
          ownerUserId: mockUserId,
        },
      },
    };

    it('should rate application successfully', async () => {
      (prisma.jobApplication.findUnique as jest.Mock).mockResolvedValue(mockApplication);
      (prisma.applicationRating.upsert as jest.Mock).mockResolvedValue({
        id: 'rating-1',
        rating: mockRating,
        user: {
          username: 'recruiter1',
          profile: {
            displayName: 'Recruiter One',
          },
        },
      });
      (prisma.applicationStatusHistory.create as jest.Mock).mockResolvedValue({});

      const result = await atsService.rateApplication(
        mockApplicationId,
        mockUserId,
        mockRating
      );

      expect(result.rating).toBe(mockRating);
      expect(prisma.applicationRating.upsert).toHaveBeenCalled();
    });

    it('should throw ValidationError for invalid rating', async () => {
      await expect(
        atsService.rateApplication(mockApplicationId, mockUserId, 6)
      ).rejects.toThrow('Rating must be between 1 and 5');

      await expect(
        atsService.rateApplication(mockApplicationId, mockUserId, 0)
      ).rejects.toThrow('Rating must be between 1 and 5');
    });
  });

  describe('shareApplication', () => {
    const mockApplicationId = 'app-123';
    const mockUserId = 'user-123';
    const mockSharedWith = 'team-member-1';
    const mockMessage = 'Please review this candidate';

    const mockApplication = {
      id: mockApplicationId,
      status: 'screening' as ApplicationStatus,
      job: {
        company: {
          ownerUserId: mockUserId,
        },
      },
    };

    const mockRecipient = {
      id: mockSharedWith,
      username: 'teammember1',
      email: 'teammember1@example.com',
    };

    it('should share application successfully', async () => {
      (prisma.jobApplication.findUnique as jest.Mock).mockResolvedValue(mockApplication);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockRecipient);
      (prisma.applicationShare.upsert as jest.Mock).mockResolvedValue({
        id: 'share-1',
        sharer: {
          username: 'recruiter1',
          profile: { displayName: 'Recruiter One' },
        },
        recipient: {
          username: 'teammember1',
          profile: { displayName: 'Team Member One' },
        },
      });
      (prisma.notification.create as jest.Mock).mockResolvedValue({});
      (prisma.applicationStatusHistory.create as jest.Mock).mockResolvedValue({});

      const result = await atsService.shareApplication(
        mockApplicationId,
        mockUserId,
        mockSharedWith,
        mockMessage
      );

      expect(prisma.applicationShare.upsert).toHaveBeenCalled();
      expect(prisma.notification.create).toHaveBeenCalled();
    });

    it('should throw NotFoundError if recipient not found', async () => {
      (prisma.jobApplication.findUnique as jest.Mock).mockResolvedValue(mockApplication);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        atsService.shareApplication(
          mockApplicationId,
          mockUserId,
          mockSharedWith,
          mockMessage
        )
      ).rejects.toThrow('Recipient user not found');
    });
  });

  describe('bulkUpdateStatus', () => {
    const mockApplicationIds = ['app-1', 'app-2', 'app-3'];
    const mockUserId = 'user-123';
    const newStatus = 'screening' as ApplicationStatus;

    const mockApplications = mockApplicationIds.map((id, index) => ({
      id,
      status: 'viewed' as ApplicationStatus,
      job: {
        company: {
          ownerUserId: mockUserId,
        },
      },
    }));

    it('should bulk update application status successfully', async () => {
      (prisma.jobApplication.findMany as jest.Mock).mockResolvedValue(mockApplications);
      (prisma.jobApplication.updateMany as jest.Mock).mockResolvedValue({
        count: 3,
      });
      (prisma.applicationStatusHistory.create as jest.Mock).mockResolvedValue({});

      const result = await atsService.bulkUpdateStatus(
        mockApplicationIds,
        newStatus,
        mockUserId
      );

      expect(result.updated).toBe(3);
      expect(result.status).toBe(newStatus);
      expect(prisma.applicationStatusHistory.create).toHaveBeenCalledTimes(3);
    });

    it('should throw ForbiddenError if some applications do not belong to user', async () => {
      const mixedApplications = [
        ...mockApplications.slice(0, 2),
        {
          ...mockApplications[2],
          job: {
            company: {
              ownerUserId: 'different-user',
            },
          },
        },
      ];

      (prisma.jobApplication.findMany as jest.Mock).mockResolvedValue(mixedApplications);

      await expect(
        atsService.bulkUpdateStatus(mockApplicationIds, newStatus, mockUserId)
      ).rejects.toThrow('Some applications do not belong to your company');
    });
  });

  describe('getApplicationActivity', () => {
    const mockApplicationId = 'app-123';
    const mockUserId = 'user-123';

    const mockApplication = {
      id: mockApplicationId,
      job: {
        company: {
          ownerUserId: mockUserId,
        },
      },
    };

    const mockActivity = [
      {
        id: 'history-1',
        fromStatus: null,
        toStatus: 'submitted',
        notes: 'Application submitted',
        createdAt: new Date('2025-01-01'),
      },
      {
        id: 'history-2',
        fromStatus: 'submitted',
        toStatus: 'viewed',
        notes: 'Status changed from submitted to viewed',
        createdAt: new Date('2025-01-02'),
      },
    ];

    it('should fetch application activity successfully', async () => {
      (prisma.jobApplication.findUnique as jest.Mock).mockResolvedValue(mockApplication);
      (prisma.applicationStatusHistory.findMany as jest.Mock).mockResolvedValue(mockActivity);

      const result = await atsService.getApplicationActivity(
        mockApplicationId,
        mockUserId
      );

      expect(result).toHaveLength(2);
      expect(result[0].toStatus).toBe('submitted');
    });

    it('should throw ForbiddenError if user is not company owner', async () => {
      (prisma.jobApplication.findUnique as jest.Mock).mockResolvedValue({
        ...mockApplication,
        job: {
          company: {
            ownerUserId: 'different-user',
          },
        },
      });

      await expect(
        atsService.getApplicationActivity(mockApplicationId, mockUserId)
      ).rejects.toThrow('You do not have permission to view this activity log');
    });
  });
});
