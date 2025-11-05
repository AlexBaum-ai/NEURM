import { PrismaClient } from '@prisma/client';
import { TopicRepository } from '@/modules/forum/repositories/TopicRepository';
import { TopicService } from '@/modules/forum/services/topicService';
import redisClient from '@/config/redisClient';

// Mock dependencies
jest.mock('@prisma/client');
jest.mock('@/utils/logger');
jest.mock('@sentry/node');
jest.mock('@/config/redisClient');

const mockPrismaClient = {
  topic: {
    count: jest.fn(),
    findMany: jest.fn(),
  },
};

describe('Unanswered Questions Feature', () => {
  let topicRepository: TopicRepository;
  let topicService: TopicService;

  beforeEach(() => {
    jest.clearAllMocks();
    topicRepository = new TopicRepository(mockPrismaClient as any);
    topicService = new TopicService(topicRepository, {} as any);

    // Mock Redis client
    (redisClient.isReady as jest.Mock) = jest.fn().mockReturnValue(true);
    (redisClient.getJSON as jest.Mock) = jest.fn().mockResolvedValue(null);
    (redisClient.setJSON as jest.Mock) = jest.fn().mockResolvedValue(undefined);
    (redisClient.delPattern as jest.Mock) = jest.fn().mockResolvedValue(undefined);
  });

  describe('TopicRepository.findUnanswered', () => {
    it('should return unanswered questions with correct filters', async () => {
      const mockTopics = [
        {
          id: 'topic-1',
          title: 'How to use GPT-4?',
          type: 'question',
          acceptedReplyId: null,
          isLocked: false,
          isDraft: false,
          status: 'open',
          viewCount: 100,
          voteScore: 5,
          createdAt: new Date('2024-01-01'),
          author: {
            id: 'user-1',
            username: 'john_doe',
            email: 'john@example.com',
            profile: {
              displayName: 'John Doe',
              avatarUrl: null,
            },
          },
          category: {
            id: 'cat-1',
            name: 'General',
            slug: 'general',
          },
          tags: [],
          attachments: [],
          poll: null,
          _count: {
            replies: 2,
            votes: 5,
          },
        },
      ];

      mockPrismaClient.topic.count.mockResolvedValue(1);
      mockPrismaClient.topic.findMany.mockResolvedValue(mockTopics);

      const result = await topicRepository.findUnanswered(
        {},
        { page: 1, limit: 20, sortBy: 'createdAt', sortOrder: 'desc' }
      );

      expect(result.topics).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.topics[0].title).toBe('How to use GPT-4?');

      // Verify Prisma query filters
      expect(mockPrismaClient.topic.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          type: 'question',
          acceptedReplyId: null,
          isLocked: false,
          isDraft: false,
          status: { in: ['open', 'resolved'] },
        }),
      });
    });

    it('should filter by category when categoryId is provided', async () => {
      mockPrismaClient.topic.count.mockResolvedValue(0);
      mockPrismaClient.topic.findMany.mockResolvedValue([]);

      const categoryId = 'cat-123';
      await topicRepository.findUnanswered(
        { categoryId },
        { page: 1, limit: 20 }
      );

      expect(mockPrismaClient.topic.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          categoryId,
        }),
      });
    });

    it('should filter by tag when tag is provided', async () => {
      mockPrismaClient.topic.count.mockResolvedValue(0);
      mockPrismaClient.topic.findMany.mockResolvedValue([]);

      const tag = 'gpt-4';
      await topicRepository.findUnanswered({ tag }, { page: 1, limit: 20 });

      expect(mockPrismaClient.topic.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          tags: {
            some: {
              tag: {
                slug: tag,
              },
            },
          },
        }),
      });
    });

    it('should filter by date range when provided', async () => {
      mockPrismaClient.topic.count.mockResolvedValue(0);
      mockPrismaClient.topic.findMany.mockResolvedValue([]);

      const dateFrom = new Date('2024-01-01');
      const dateTo = new Date('2024-12-31');

      await topicRepository.findUnanswered(
        { dateFrom, dateTo },
        { page: 1, limit: 20 }
      );

      expect(mockPrismaClient.topic.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          createdAt: {
            gte: dateFrom,
            lte: dateTo,
          },
        }),
      });
    });

    it('should sort by viewCount when specified', async () => {
      mockPrismaClient.topic.count.mockResolvedValue(0);
      mockPrismaClient.topic.findMany.mockResolvedValue([]);

      await topicRepository.findUnanswered(
        {},
        { page: 1, limit: 20, sortBy: 'viewCount', sortOrder: 'desc' }
      );

      expect(mockPrismaClient.topic.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { viewCount: 'desc' },
        })
      );
    });

    it('should paginate correctly', async () => {
      mockPrismaClient.topic.count.mockResolvedValue(50);
      mockPrismaClient.topic.findMany.mockResolvedValue([]);

      await topicRepository.findUnanswered({}, { page: 3, limit: 10 });

      expect(mockPrismaClient.topic.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20, // (page 3 - 1) * 10
          take: 10,
        })
      );
    });
  });

  describe('TopicService.getUnansweredQuestions', () => {
    it('should return cached result when available', async () => {
      const cachedData = {
        topics: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        meta: { totalUnanswered: 0 },
      };

      (redisClient.getJSON as jest.Mock) = jest.fn().mockResolvedValue(cachedData);

      const result = await topicService.getUnansweredQuestions(
        {},
        { page: 1, limit: 20 }
      );

      expect(result).toEqual(cachedData);
      expect(redisClient.getJSON).toHaveBeenCalled();
      // Should not call repository when cached
      expect(mockPrismaClient.topic.count).not.toHaveBeenCalled();
    });

    it('should fetch from database when cache miss and cache result', async () => {
      (redisClient.getJSON as jest.Mock) = jest.fn().mockResolvedValue(null);

      const mockTopics = [
        {
          id: 'topic-1',
          title: 'Test Question',
          type: 'question',
          acceptedReplyId: null,
          author: { id: 'user-1', username: 'test', email: 'test@test.com', profile: null },
          category: { id: 'cat-1', name: 'Test', slug: 'test' },
          tags: [],
          attachments: [],
          poll: null,
          _count: { replies: 0, votes: 0 },
        },
      ];

      mockPrismaClient.topic.count.mockResolvedValue(1);
      mockPrismaClient.topic.findMany.mockResolvedValue(mockTopics);

      const result = await topicService.getUnansweredQuestions(
        {},
        { page: 1, limit: 20 }
      );

      expect(result.topics).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.meta.totalUnanswered).toBe(1);

      // Should cache the result
      expect(redisClient.setJSON).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        300 // 5 minutes TTL
      );
    });

    it('should handle cache errors gracefully', async () => {
      (redisClient.getJSON as jest.Mock) = jest.fn().mockRejectedValue(new Error('Cache error'));

      mockPrismaClient.topic.count.mockResolvedValue(0);
      mockPrismaClient.topic.findMany.mockResolvedValue([]);

      const result = await topicService.getUnansweredQuestions(
        {},
        { page: 1, limit: 20 }
      );

      expect(result).toBeDefined();
      expect(result.topics).toEqual([]);
    });

    it('should generate correct cache key', async () => {
      (redisClient.getJSON as jest.Mock) = jest.fn().mockResolvedValue(null);

      mockPrismaClient.topic.count.mockResolvedValue(0);
      mockPrismaClient.topic.findMany.mockResolvedValue([]);

      await topicService.getUnansweredQuestions(
        { categoryId: 'cat-1', tag: 'test' },
        { page: 1, limit: 20, sortBy: 'viewCount', sortOrder: 'desc' }
      );

      expect(redisClient.getJSON).toHaveBeenCalledWith(
        expect.stringContaining('unanswered_questions')
      );
      expect(redisClient.getJSON).toHaveBeenCalledWith(
        expect.stringContaining('cat:cat-1')
      );
      expect(redisClient.getJSON).toHaveBeenCalledWith(
        expect.stringContaining('tag:test')
      );
    });
  });

  describe('TopicService.invalidateUnansweredCache', () => {
    it('should delete all unanswered questions cache keys', async () => {
      await topicService.invalidateUnansweredCache();

      expect(redisClient.delPattern).toHaveBeenCalledWith('unanswered_questions:*');
    });

    it('should handle cache deletion errors gracefully', async () => {
      (redisClient.delPattern as jest.Mock) = jest.fn().mockRejectedValue(
        new Error('Delete error')
      );

      await expect(topicService.invalidateUnansweredCache()).resolves.not.toThrow();
    });

    it('should not attempt deletion when Redis is not ready', async () => {
      (redisClient.isReady as jest.Mock) = jest.fn().mockReturnValue(false);

      await topicService.invalidateUnansweredCache();

      expect(redisClient.delPattern).not.toHaveBeenCalled();
    });
  });
});
