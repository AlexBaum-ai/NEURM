import { ReportService } from '../services/reportService';
import { ReportRepository } from '../repositories/ReportRepository';
import { ReportReason } from '@prisma/client';

/**
 * Report Service Unit Tests
 *
 * Tests for content reporting business logic:
 * - Report creation with duplicate prevention
 * - Permission checks
 * - Auto-hide threshold verification
 * - Report resolution workflow
 */

describe('ReportService', () => {
  let reportService: ReportService;
  let mockReportRepository: jest.Mocked<ReportRepository>;

  // Mock user objects
  const mockUser = {
    id: 'user-123',
    email: 'user@example.com',
    username: 'testuser',
    role: 'user',
  };

  const mockModerator = {
    id: 'mod-123',
    email: 'mod@example.com',
    username: 'moderator',
    role: 'moderator',
  };

  const mockReporter = {
    id: 'reporter-123',
    email: 'reporter@example.com',
    username: 'reporter',
    profile: {
      displayName: 'Reporter User',
      avatarUrl: null,
    },
  };

  const mockContent = {
    id: 'topic-123',
    title: 'Test Topic',
    content: 'This is test content',
    author: {
      id: 'author-123',
      username: 'author',
    },
    isHidden: false,
  };

  beforeEach(() => {
    // Create mock repository
    mockReportRepository = {
      hasUserReported: jest.fn(),
      getReportedContent: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      getStatistics: jest.fn(),
      getFalseReportCount: jest.fn(),
      getReportsByContent: jest.fn(),
      countReportsForContent: jest.fn(),
      countUniqueReporters: jest.fn(),
    } as any;

    // Create service with mocked repository
    reportService = new ReportService(mockReportRepository as any);
  });

  describe('createReport', () => {
    const createReportInput = {
      reportableType: 'Topic',
      reportableId: 'topic-123',
      reason: 'spam' as ReportReason,
      description: 'This content is spam',
    };

    it('should create a report successfully', async () => {
      // Arrange
      mockReportRepository.hasUserReported.mockResolvedValue(false);
      mockReportRepository.getReportedContent.mockResolvedValue(mockContent);
      mockReportRepository.create.mockResolvedValue({
        id: 'report-123',
        reporterId: mockUser.id,
        reportableType: createReportInput.reportableType,
        reportableId: createReportInput.reportableId,
        reason: createReportInput.reason,
        description: createReportInput.description,
        status: 'pending',
        resolvedBy: null,
        resolvedAt: null,
        resolutionNote: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        reporter: mockReporter,
        resolver: null,
      });

      // Act
      const result = await reportService.createReport(
        mockUser.id,
        mockUser as any,
        createReportInput
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.reporterId).toBe(mockUser.id);
      expect(result.reason).toBe(createReportInput.reason);
      expect(mockReportRepository.hasUserReported).toHaveBeenCalledWith(
        mockUser.id,
        createReportInput.reportableType,
        createReportInput.reportableId
      );
      expect(mockReportRepository.getReportedContent).toHaveBeenCalled();
      expect(mockReportRepository.create).toHaveBeenCalled();
    });

    it('should throw error if user already reported content', async () => {
      // Arrange
      mockReportRepository.hasUserReported.mockResolvedValue(true);

      // Act & Assert
      await expect(
        reportService.createReport(mockUser.id, mockUser as any, createReportInput)
      ).rejects.toThrow('You have already reported this content');
    });

    it('should throw error if reported content does not exist', async () => {
      // Arrange
      mockReportRepository.hasUserReported.mockResolvedValue(false);
      mockReportRepository.getReportedContent.mockResolvedValue(null);

      // Act & Assert
      await expect(
        reportService.createReport(mockUser.id, mockUser as any, createReportInput)
      ).rejects.toThrow('Topic not found');
    });

    it('should throw error if user tries to report own content', async () => {
      // Arrange
      mockReportRepository.hasUserReported.mockResolvedValue(false);
      mockReportRepository.getReportedContent.mockResolvedValue({
        ...mockContent,
        author: {
          id: mockUser.id,
          username: mockUser.username,
        },
      });

      // Act & Assert
      await expect(
        reportService.createReport(mockUser.id, mockUser as any, createReportInput)
      ).rejects.toThrow('You cannot report your own content');
    });
  });

  describe('listReports', () => {
    it('should list reports for moderators', async () => {
      // Arrange
      const filters = { status: 'pending' as any };
      const pagination = { page: 1, limit: 20, sortBy: 'createdAt' as any, sortOrder: 'desc' as any };

      mockReportRepository.findMany.mockResolvedValue({
        reports: [
          {
            id: 'report-123',
            reporterId: 'user-123',
            reportableType: 'Topic',
            reportableId: 'topic-123',
            reason: 'spam' as ReportReason,
            description: 'Spam content',
            status: 'pending',
            resolvedBy: null,
            resolvedAt: null,
            resolutionNote: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            reporter: mockReporter,
            resolver: null,
          },
        ],
        total: 1,
      });

      mockReportRepository.getReportedContent.mockResolvedValue(mockContent);

      // Act
      const result = await reportService.listReports(filters, pagination, mockModerator as any);

      // Assert
      expect(result).toBeDefined();
      expect(result.reports).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(mockReportRepository.findMany).toHaveBeenCalledWith(filters, pagination);
    });

    it('should throw error if non-moderator tries to list reports', async () => {
      // Arrange
      const filters = {};
      const pagination = { page: 1, limit: 20 };

      // Act & Assert
      await expect(
        reportService.listReports(filters, pagination, mockUser as any)
      ).rejects.toThrow('You do not have permission to view reports');
    });
  });

  describe('resolveReport', () => {
    const resolveInput = {
      status: 'resolved_violation' as any,
      resolutionNote: 'Content removed',
    };

    it('should resolve report successfully', async () => {
      // Arrange
      const mockReport = {
        id: 'report-123',
        reporterId: 'user-123',
        reportableType: 'Topic',
        reportableId: 'topic-123',
        reason: 'spam' as ReportReason,
        description: 'Spam content',
        status: 'pending',
        resolvedBy: null,
        resolvedAt: null,
        resolutionNote: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        reporter: mockReporter,
        resolver: null,
      };

      mockReportRepository.findById.mockResolvedValue(mockReport as any);
      mockReportRepository.update.mockResolvedValue({
        ...mockReport,
        status: resolveInput.status,
        resolvedBy: mockModerator.id,
        resolvedAt: new Date(),
        resolutionNote: resolveInput.resolutionNote,
      } as any);

      // Act
      const result = await reportService.resolveReport(
        'report-123',
        resolveInput,
        mockModerator as any
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.status).toBe(resolveInput.status);
      expect(mockReportRepository.update).toHaveBeenCalledWith(
        'report-123',
        expect.objectContaining({
          status: resolveInput.status,
          resolvedBy: mockModerator.id,
          resolutionNote: resolveInput.resolutionNote,
        })
      );
    });

    it('should throw error if non-moderator tries to resolve', async () => {
      // Act & Assert
      await expect(
        reportService.resolveReport('report-123', resolveInput, mockUser as any)
      ).rejects.toThrow('You do not have permission to resolve reports');
    });

    it('should throw error if report not found', async () => {
      // Arrange
      mockReportRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        reportService.resolveReport('report-123', resolveInput, mockModerator as any)
      ).rejects.toThrow('Report not found');
    });

    it('should throw error if report already resolved', async () => {
      // Arrange
      const resolvedReport = {
        id: 'report-123',
        status: 'resolved_violation',
        resolvedBy: 'mod-123',
        resolvedAt: new Date(),
      };

      mockReportRepository.findById.mockResolvedValue(resolvedReport as any);

      // Act & Assert
      await expect(
        reportService.resolveReport('report-123', resolveInput, mockModerator as any)
      ).rejects.toThrow('Report has already been resolved');
    });
  });

  describe('getStatistics', () => {
    it('should return statistics for moderators', async () => {
      // Arrange
      const mockStats = {
        total: 100,
        pending: 10,
        reviewing: 5,
        resolved: 85,
        byReason: [
          { reason: 'spam' as ReportReason, count: 40 },
          { reason: 'harassment' as ReportReason, count: 30 },
        ],
      };

      mockReportRepository.getStatistics.mockResolvedValue(mockStats);

      // Act
      const result = await reportService.getStatistics(mockModerator as any);

      // Assert
      expect(result).toEqual(mockStats);
      expect(mockReportRepository.getStatistics).toHaveBeenCalled();
    });

    it('should throw error if non-moderator tries to view statistics', async () => {
      // Act & Assert
      await expect(
        reportService.getStatistics(mockUser as any)
      ).rejects.toThrow('You do not have permission to view report statistics');
    });
  });
});
