import { ContentModerationService, ModerationUser } from '../services/contentModerationService';
import { SpamDetectionService } from '../services/spamDetectionService';
import { PrismaClient } from '@prisma/client';

// Mock dependencies
jest.mock('@/utils/logger');
jest.mock('@sentry/node');

const mockPrismaClient = {
  article: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  topic: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  reply: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  job: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  report: {
    findMany: jest.fn(),
    groupBy: jest.fn(),
    updateMany: jest.fn(),
  },
  moderationLog: {
    create: jest.fn(),
  },
};

const mockSpamDetectionService = {
  analyzeContent: jest.fn(),
  analyzeWithMLModel: jest.fn(),
  addSpamKeyword: jest.fn(),
  updateSpamKeyword: jest.fn(),
};

describe('ContentModerationService', () => {
  let contentModerationService: ContentModerationService;
  let mockUser: ModerationUser;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUser = {
      id: 'user-123',
      role: 'moderator',
      username: 'mod_user',
    };

    contentModerationService = new ContentModerationService(
      mockPrismaClient as any,
      mockSpamDetectionService as any
    );
  });

  describe('listContent', () => {
    it('should list all content types when no type filter is specified', async () => {
      const query = {
        page: 1,
        limit: 20,
        sortBy: 'createdAt' as const,
        sortOrder: 'desc' as const,
      };

      mockPrismaClient.article.findMany.mockResolvedValue([
        {
          id: 'article-1',
          title: 'Test Article',
          content: 'Article content',
          excerpt: 'Excerpt',
          authorId: 'author-1',
          author: { id: 'author-1', username: 'author', email: 'author@test.com' },
          status: 'approved',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      mockPrismaClient.topic.findMany.mockResolvedValue([]);
      mockPrismaClient.reply.findMany.mockResolvedValue([]);
      mockPrismaClient.job.findMany.mockResolvedValue([]);
      mockPrismaClient.report.groupBy.mockResolvedValue([]);

      const result = await contentModerationService.listContent(query, mockUser);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].type).toBe('article');
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
      expect(mockPrismaClient.article.findMany).toHaveBeenCalled();
      expect(mockPrismaClient.topic.findMany).toHaveBeenCalled();
      expect(mockPrismaClient.reply.findMany).toHaveBeenCalled();
      expect(mockPrismaClient.job.findMany).toHaveBeenCalled();
    });

    it('should filter content by specific type', async () => {
      const query = {
        type: 'article' as const,
        page: 1,
        limit: 20,
        sortBy: 'createdAt' as const,
        sortOrder: 'desc' as const,
      };

      mockPrismaClient.article.findMany.mockResolvedValue([]);
      mockPrismaClient.report.groupBy.mockResolvedValue([]);

      const result = await contentModerationService.listContent(query, mockUser);

      expect(mockPrismaClient.article.findMany).toHaveBeenCalled();
      expect(mockPrismaClient.topic.findMany).not.toHaveBeenCalled();
      expect(mockPrismaClient.reply.findMany).not.toHaveBeenCalled();
      expect(mockPrismaClient.job.findMany).not.toHaveBeenCalled();
    });

    it('should throw error if user is not moderator or admin', async () => {
      const query = {
        page: 1,
        limit: 20,
        sortBy: 'createdAt' as const,
        sortOrder: 'desc' as const,
      };

      const regularUser = { ...mockUser, role: 'user' };

      await expect(
        contentModerationService.listContent(query, regularUser)
      ).rejects.toThrow('You do not have permission to perform moderation actions');
    });

    it('should paginate results correctly', async () => {
      const query = {
        page: 2,
        limit: 2,
        sortBy: 'createdAt' as const,
        sortOrder: 'desc' as const,
      };

      const mockArticles = [
        {
          id: 'article-1',
          title: 'Article 1',
          content: 'Content 1',
          excerpt: 'Excerpt 1',
          authorId: 'author-1',
          author: { id: 'author-1', username: 'author1', email: 'author1@test.com' },
          status: 'approved',
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-01'),
        },
        {
          id: 'article-2',
          title: 'Article 2',
          content: 'Content 2',
          excerpt: 'Excerpt 2',
          authorId: 'author-2',
          author: { id: 'author-2', username: 'author2', email: 'author2@test.com' },
          status: 'approved',
          createdAt: new Date('2025-01-02'),
          updatedAt: new Date('2025-01-02'),
        },
        {
          id: 'article-3',
          title: 'Article 3',
          content: 'Content 3',
          excerpt: 'Excerpt 3',
          authorId: 'author-3',
          author: { id: 'author-3', username: 'author3', email: 'author3@test.com' },
          status: 'approved',
          createdAt: new Date('2025-01-03'),
          updatedAt: new Date('2025-01-03'),
        },
      ];

      mockPrismaClient.article.findMany.mockResolvedValue(mockArticles);
      mockPrismaClient.topic.findMany.mockResolvedValue([]);
      mockPrismaClient.reply.findMany.mockResolvedValue([]);
      mockPrismaClient.job.findMany.mockResolvedValue([]);
      mockPrismaClient.report.groupBy.mockResolvedValue([]);

      const result = await contentModerationService.listContent(query, mockUser);

      expect(result.items).toHaveLength(1); // Page 2 with limit 2 should show 1 item (items 3-3)
      expect(result.pagination.total).toBe(3);
      expect(result.pagination.totalPages).toBe(2);
      expect(result.pagination.page).toBe(2);
    });
  });

  describe('approveContent', () => {
    it('should approve content successfully', async () => {
      mockPrismaClient.article.update.mockResolvedValue({});
      mockPrismaClient.moderationLog.create.mockResolvedValue({});
      mockPrismaClient.report.updateMany.mockResolvedValue({ count: 2 });

      const result = await contentModerationService.approveContent(
        'article',
        'article-1',
        { note: 'Approved after review' },
        mockUser
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe('Content approved successfully');
      expect(mockPrismaClient.article.update).toHaveBeenCalledWith({
        where: { id: 'article-1' },
        data: { status: 'approved' },
      });
      expect(mockPrismaClient.moderationLog.create).toHaveBeenCalled();
    });

    it('should throw error for non-moderator', async () => {
      const regularUser = { ...mockUser, role: 'user' };

      await expect(
        contentModerationService.approveContent(
          'article',
          'article-1',
          {},
          regularUser
        )
      ).rejects.toThrow('You do not have permission to perform moderation actions');
    });
  });

  describe('rejectContent', () => {
    it('should reject content with reason', async () => {
      mockPrismaClient.article.update.mockResolvedValue({});
      mockPrismaClient.moderationLog.create.mockResolvedValue({});
      mockPrismaClient.report.updateMany.mockResolvedValue({ count: 2 });

      const result = await contentModerationService.rejectContent(
        'article',
        'article-1',
        {
          reason: 'Violates community guidelines',
          notifyAuthor: true,
        },
        mockUser
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe('Content rejected successfully');
      expect(mockPrismaClient.article.update).toHaveBeenCalledWith({
        where: { id: 'article-1' },
        data: { status: 'rejected' },
      });
      expect(mockPrismaClient.moderationLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'reject_content',
            reason: 'Violates community guidelines',
          }),
        })
      );
    });
  });

  describe('hideContent', () => {
    it('should hide content from public view', async () => {
      mockPrismaClient.article.update.mockResolvedValue({});
      mockPrismaClient.moderationLog.create.mockResolvedValue({});

      const result = await contentModerationService.hideContent(
        'article',
        'article-1',
        {
          reason: 'Under investigation',
          notifyAuthor: false,
        },
        mockUser
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe('Content hidden successfully');
      expect(mockPrismaClient.article.update).toHaveBeenCalledWith({
        where: { id: 'article-1' },
        data: { status: 'hidden' },
      });
    });
  });

  describe('deleteContent', () => {
    it('should soft delete content', async () => {
      mockPrismaClient.article.update.mockResolvedValue({});
      mockPrismaClient.moderationLog.create.mockResolvedValue({});
      mockPrismaClient.report.updateMany.mockResolvedValue({ count: 1 });

      const result = await contentModerationService.deleteContent(
        'article',
        'article-1',
        {
          reason: 'Spam content',
          hardDelete: false,
        },
        mockUser
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe('Content deleted successfully');
      expect(mockPrismaClient.article.update).toHaveBeenCalledWith({
        where: { id: 'article-1' },
        data: { status: 'deleted' },
      });
      expect(mockPrismaClient.article.delete).not.toHaveBeenCalled();
    });

    it('should hard delete content for admin', async () => {
      const adminUser = { ...mockUser, role: 'admin' };

      mockPrismaClient.article.delete.mockResolvedValue({});
      mockPrismaClient.moderationLog.create.mockResolvedValue({});
      mockPrismaClient.report.updateMany.mockResolvedValue({ count: 1 });

      const result = await contentModerationService.deleteContent(
        'article',
        'article-1',
        {
          reason: 'Spam content',
          hardDelete: true,
        },
        adminUser
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe('Content permanently deleted');
      expect(mockPrismaClient.article.delete).toHaveBeenCalledWith({
        where: { id: 'article-1' },
      });
    });

    it('should throw error when non-admin tries to hard delete', async () => {
      await expect(
        contentModerationService.deleteContent(
          'article',
          'article-1',
          {
            reason: 'Spam content',
            hardDelete: true,
          },
          mockUser // moderator, not admin
        )
      ).rejects.toThrow('Only administrators can permanently delete content');
    });
  });

  describe('bulkAction', () => {
    it('should perform bulk approve action successfully', async () => {
      mockPrismaClient.article.update.mockResolvedValue({});
      mockPrismaClient.topic.update.mockResolvedValue({});
      mockPrismaClient.moderationLog.create.mockResolvedValue({});
      mockPrismaClient.report.updateMany.mockResolvedValue({ count: 0 });

      const result = await contentModerationService.bulkAction(
        {
          action: 'approve',
          items: [
            { type: 'article', id: 'article-1' },
            { type: 'topic', id: 'topic-1' },
          ],
          notifyAuthors: false,
        },
        mockUser
      );

      expect(result.success).toBe(true);
      expect(result.processed).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle partial failures in bulk action', async () => {
      mockPrismaClient.article.update.mockResolvedValue({});
      mockPrismaClient.topic.update.mockRejectedValue(new Error('Topic not found'));
      mockPrismaClient.moderationLog.create.mockResolvedValue({});
      mockPrismaClient.report.updateMany.mockResolvedValue({ count: 0 });

      const result = await contentModerationService.bulkAction(
        {
          action: 'approve',
          items: [
            { type: 'article', id: 'article-1' },
            { type: 'topic', id: 'topic-1' },
          ],
          notifyAuthors: false,
        },
        mockUser
      );

      expect(result.success).toBe(false);
      expect(result.processed).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('topic:topic-1');
    });
  });

  describe('autoFlagSpam', () => {
    it('should auto-flag content with high spam score', async () => {
      mockSpamDetectionService.analyzeContent.mockResolvedValue({
        spamScore: 85,
        flaggedKeywords: ['spam', 'buy now'],
        isSpam: true,
        reason: 'Contains spam keywords',
        confidence: 0.9,
      });

      mockPrismaClient.topic.update.mockResolvedValue({});
      mockPrismaClient.moderationLog.create.mockResolvedValue({});

      await contentModerationService.autoFlagSpam(
        'topic',
        'topic-1',
        'Buy now! Limited time offer! Click here to get rich quick!',
        'Make money fast'
      );

      expect(mockSpamDetectionService.analyzeContent).toHaveBeenCalledWith(
        'Buy now! Limited time offer! Click here to get rich quick!',
        'Make money fast'
      );
      expect(mockPrismaClient.topic.update).toHaveBeenCalledWith({
        where: { id: 'topic-1' },
        data: { spamScore: 85 },
      });
      expect(mockPrismaClient.moderationLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'auto_flag_spam',
            moderatorId: 'system',
          }),
        })
      );
    });

    it('should not flag content with low spam score', async () => {
      mockSpamDetectionService.analyzeContent.mockResolvedValue({
        spamScore: 20,
        flaggedKeywords: [],
        isSpam: false,
        reason: 'Low spam probability',
        confidence: 0.3,
      });

      await contentModerationService.autoFlagSpam(
        'topic',
        'topic-1',
        'This is a legitimate discussion about machine learning',
        'ML Discussion'
      );

      expect(mockSpamDetectionService.analyzeContent).toHaveBeenCalled();
      expect(mockPrismaClient.topic.update).not.toHaveBeenCalled();
      expect(mockPrismaClient.moderationLog.create).not.toHaveBeenCalled();
    });

    it('should not throw errors on failure', async () => {
      mockSpamDetectionService.analyzeContent.mockRejectedValue(
        new Error('Spam detection failed')
      );

      // Should not throw
      await expect(
        contentModerationService.autoFlagSpam('topic', 'topic-1', 'content', 'title')
      ).resolves.not.toThrow();
    });
  });

  describe('listReportedContent', () => {
    it('should list reported content queue', async () => {
      const mockReports = [
        {
          id: 'report-1',
          reportableType: 'Article',
          reportableId: 'article-1',
          reason: 'spam',
          status: 'pending',
          createdAt: new Date(),
          reporter: { id: 'user-1', username: 'reporter', email: 'reporter@test.com' },
        },
        {
          id: 'report-2',
          reportableType: 'Article',
          reportableId: 'article-1',
          reason: 'spam',
          status: 'pending',
          createdAt: new Date(),
          reporter: { id: 'user-2', username: 'reporter2', email: 'reporter2@test.com' },
        },
      ];

      mockPrismaClient.report.findMany.mockResolvedValue(mockReports);
      mockPrismaClient.article.findUnique.mockResolvedValue({
        id: 'article-1',
        title: 'Reported Article',
        content: 'Spam content',
        excerpt: 'Spam',
        authorId: 'author-1',
        author: { id: 'author-1', username: 'author', email: 'author@test.com' },
        status: 'approved',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const query = {
        page: 1,
        limit: 20,
        sortBy: 'reportCount' as const,
        sortOrder: 'desc' as const,
      };

      const result = await contentModerationService.listReportedContent(query, mockUser);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].reportCount).toBe(2);
      expect(mockPrismaClient.report.findMany).toHaveBeenCalled();
    });
  });
});
