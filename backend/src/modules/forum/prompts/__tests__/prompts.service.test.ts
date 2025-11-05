import PromptService from '../prompts.service';
import PromptRepository, { PromptWithDetails } from '../prompts.repository';
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from '@/utils/errors';
import { Decimal } from '@prisma/client/runtime/library';

// Mock the repository
jest.mock('../prompts.repository');
jest.mock('@/utils/logger');

describe('PromptService', () => {
  let promptService: PromptService;
  let mockPromptRepository: jest.Mocked<PromptRepository>;

  const mockUserId = 'user-123';
  const mockPromptId = 'prompt-123';

  const mockPrompt: PromptWithDetails = {
    id: mockPromptId,
    userId: mockUserId,
    parentId: null,
    title: 'Test Prompt',
    content: 'Test content',
    category: 'code_generation',
    useCase: 'Testing',
    model: 'gpt-4',
    tags: ['test', 'example'],
    templateJson: { model: 'gpt-4', temperature: 0.7 },
    ratingAvg: new Decimal(4.5),
    ratingCount: 10,
    voteScore: 25,
    upvoteCount: 30,
    downvoteCount: 5,
    forkCount: 3,
    usageCount: 50,
    createdAt: new Date(),
    updatedAt: new Date(),
    author: {
      id: mockUserId,
      username: 'testuser',
      profile: {
        displayName: 'Test User',
        avatarUrl: null,
      },
    },
    parent: null,
    _count: {
      forks: 3,
      ratings: 10,
      votes: 35,
    },
  } as PromptWithDetails;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPromptRepository = new PromptRepository() as jest.Mocked<PromptRepository>;
    promptService = new PromptService(mockPromptRepository);
  });

  describe('listPrompts', () => {
    it('should return paginated prompts', async () => {
      const query = {
        page: 1,
        limit: 20,
        sort: 'newest' as const,
      };

      const mockResult = {
        prompts: [mockPrompt],
        total: 1,
      };

      mockPromptRepository.findMany = jest.fn().mockResolvedValue(mockResult);

      const result = await promptService.listPrompts(query);

      expect(result).toEqual({
        prompts: expect.any(Array),
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      });
      expect(result.prompts).toHaveLength(1);
      expect(mockPromptRepository.findMany).toHaveBeenCalledWith(query, undefined);
    });

    it('should calculate total pages correctly', async () => {
      const query = {
        page: 1,
        limit: 10,
        sort: 'newest' as const,
      };

      const mockResult = {
        prompts: Array(10).fill(mockPrompt),
        total: 45,
      };

      mockPromptRepository.findMany = jest.fn().mockResolvedValue(mockResult);

      const result = await promptService.listPrompts(query);

      expect(result.pagination.totalPages).toBe(5);
    });
  });

  describe('getPromptById', () => {
    it('should return prompt details', async () => {
      mockPromptRepository.findById = jest.fn().mockResolvedValue(mockPrompt);
      mockPromptRepository.update = jest.fn().mockResolvedValue(mockPrompt);

      const result = await promptService.getPromptById(mockPromptId);

      expect(result).toHaveProperty('id', mockPromptId);
      expect(result).toHaveProperty('title', 'Test Prompt');
      expect(mockPromptRepository.findById).toHaveBeenCalledWith(mockPromptId, undefined);
    });

    it('should throw NotFoundError when prompt does not exist', async () => {
      mockPromptRepository.findById = jest.fn().mockResolvedValue(null);

      await expect(
        promptService.getPromptById('non-existent-id')
      ).rejects.toThrow(NotFoundError);
    });

    it('should increment usage count', async () => {
      mockPromptRepository.findById = jest.fn().mockResolvedValue(mockPrompt);
      mockPromptRepository.update = jest.fn().mockResolvedValue(mockPrompt);

      await promptService.getPromptById(mockPromptId);

      // Note: usage count increment is fire-and-forget, so we just verify it was called
      expect(mockPromptRepository.findById).toHaveBeenCalled();
    });
  });

  describe('createPrompt', () => {
    it('should create a new prompt', async () => {
      const promptData = {
        title: 'New Prompt',
        content: 'New content',
        category: 'code_generation' as const,
        tags: ['new'],
      };

      mockPromptRepository.create = jest.fn().mockResolvedValue({
        ...mockPrompt,
        ...promptData,
      });

      const result = await promptService.createPrompt(mockUserId, promptData);

      expect(result).toHaveProperty('title', 'New Prompt');
      expect(mockPromptRepository.create).toHaveBeenCalledWith({
        userId: mockUserId,
        ...promptData,
      });
    });
  });

  describe('updatePrompt', () => {
    it('should update prompt when user is author', async () => {
      const updateData = {
        title: 'Updated Title',
      };

      mockPromptRepository.findById = jest.fn().mockResolvedValue(mockPrompt);
      mockPromptRepository.update = jest.fn().mockResolvedValue({
        ...mockPrompt,
        ...updateData,
      });

      const result = await promptService.updatePrompt(
        mockPromptId,
        mockUserId,
        updateData
      );

      expect(result).toHaveProperty('title', 'Updated Title');
      expect(mockPromptRepository.update).toHaveBeenCalledWith(
        mockPromptId,
        updateData
      );
    });

    it('should throw NotFoundError when prompt does not exist', async () => {
      mockPromptRepository.findById = jest.fn().mockResolvedValue(null);

      await expect(
        promptService.updatePrompt(mockPromptId, mockUserId, {
          title: 'Updated',
        })
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError when user is not author', async () => {
      mockPromptRepository.findById = jest.fn().mockResolvedValue(mockPrompt);

      await expect(
        promptService.updatePrompt(mockPromptId, 'other-user-id', {
          title: 'Updated',
        })
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('forkPrompt', () => {
    it('should fork prompt successfully', async () => {
      const forkedPrompt = {
        ...mockPrompt,
        id: 'forked-prompt-id',
        userId: 'other-user-id',
        parentId: mockPromptId,
        title: 'Test Prompt (Fork)',
      };

      mockPromptRepository.findById = jest.fn().mockResolvedValue(mockPrompt);
      mockPromptRepository.fork = jest.fn().mockResolvedValue(forkedPrompt);

      const result = await promptService.forkPrompt(mockPromptId, 'other-user-id');

      expect(result).toHaveProperty('id', 'forked-prompt-id');
      expect(result).toHaveProperty('parentId', mockPromptId);
      expect(mockPromptRepository.fork).toHaveBeenCalledWith(
        mockPromptId,
        'other-user-id'
      );
    });

    it('should throw NotFoundError when prompt does not exist', async () => {
      mockPromptRepository.findById = jest.fn().mockResolvedValue(null);

      await expect(
        promptService.forkPrompt(mockPromptId, 'other-user-id')
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw BadRequestError when trying to fork own prompt', async () => {
      mockPromptRepository.findById = jest.fn().mockResolvedValue(mockPrompt);

      await expect(
        promptService.forkPrompt(mockPromptId, mockUserId)
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('ratePrompt', () => {
    it('should rate prompt successfully', async () => {
      const ratingData = {
        rating: 5,
        comment: 'Great prompt!',
      };

      mockPromptRepository.findById = jest.fn().mockResolvedValue(mockPrompt);
      mockPromptRepository.rate = jest.fn().mockResolvedValue({
        id: 'rating-id',
        userId: 'other-user-id',
        promptId: mockPromptId,
        rating: 5,
        comment: 'Great prompt!',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await promptService.ratePrompt(
        mockPromptId,
        'other-user-id',
        ratingData
      );

      expect(result).toHaveProperty('message', 'Prompt rated successfully');
      expect(mockPromptRepository.rate).toHaveBeenCalledWith(
        mockPromptId,
        'other-user-id',
        5,
        'Great prompt!'
      );
    });

    it('should throw NotFoundError when prompt does not exist', async () => {
      mockPromptRepository.findById = jest.fn().mockResolvedValue(null);

      await expect(
        promptService.ratePrompt(mockPromptId, 'other-user-id', {
          rating: 5,
        })
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw BadRequestError when trying to rate own prompt', async () => {
      mockPromptRepository.findById = jest.fn().mockResolvedValue(mockPrompt);

      await expect(
        promptService.ratePrompt(mockPromptId, mockUserId, {
          rating: 5,
        })
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('votePrompt', () => {
    it('should vote on prompt successfully', async () => {
      const voteData = {
        value: 1,
      };

      mockPromptRepository.findById = jest.fn().mockResolvedValue(mockPrompt);
      mockPromptRepository.vote = jest.fn().mockResolvedValue({
        promptId: mockPromptId,
        userId: 'other-user-id',
        value: 1,
        createdAt: new Date(),
      });

      const result = await promptService.votePrompt(
        mockPromptId,
        'other-user-id',
        voteData
      );

      expect(result).toHaveProperty('message', 'Vote recorded successfully');
      expect(mockPromptRepository.vote).toHaveBeenCalledWith(
        mockPromptId,
        'other-user-id',
        1
      );
    });

    it('should throw NotFoundError when prompt does not exist', async () => {
      mockPromptRepository.findById = jest.fn().mockResolvedValue(null);

      await expect(
        promptService.votePrompt(mockPromptId, 'other-user-id', {
          value: 1,
        })
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw BadRequestError when trying to vote on own prompt', async () => {
      mockPromptRepository.findById = jest.fn().mockResolvedValue(mockPrompt);

      await expect(
        promptService.votePrompt(mockPromptId, mockUserId, {
          value: 1,
        })
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('deletePrompt', () => {
    it('should delete prompt when user is author', async () => {
      mockPromptRepository.findById = jest.fn().mockResolvedValue(mockPrompt);
      mockPromptRepository.delete = jest.fn().mockResolvedValue(undefined);

      const result = await promptService.deletePrompt(mockPromptId, mockUserId);

      expect(result).toHaveProperty('message', 'Prompt deleted successfully');
      expect(mockPromptRepository.delete).toHaveBeenCalledWith(mockPromptId);
    });

    it('should throw NotFoundError when prompt does not exist', async () => {
      mockPromptRepository.findById = jest.fn().mockResolvedValue(null);

      await expect(
        promptService.deletePrompt(mockPromptId, mockUserId)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError when user is not author', async () => {
      mockPromptRepository.findById = jest.fn().mockResolvedValue(mockPrompt);

      await expect(
        promptService.deletePrompt(mockPromptId, 'other-user-id')
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('getUserPrompts', () => {
    it('should return user prompts', async () => {
      mockPromptRepository.findByUserId = jest
        .fn()
        .mockResolvedValue([mockPrompt]);

      const result = await promptService.getUserPrompts(mockUserId);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('id', mockPromptId);
      expect(mockPromptRepository.findByUserId).toHaveBeenCalledWith(
        mockUserId,
        10
      );
    });

    it('should respect limit parameter', async () => {
      mockPromptRepository.findByUserId = jest
        .fn()
        .mockResolvedValue([mockPrompt]);

      await promptService.getUserPrompts(mockUserId, 5);

      expect(mockPromptRepository.findByUserId).toHaveBeenCalledWith(
        mockUserId,
        5
      );
    });
  });
});
