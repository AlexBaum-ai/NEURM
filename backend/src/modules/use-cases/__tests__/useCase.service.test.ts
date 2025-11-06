import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UseCaseService } from '../useCase.service';
import { UseCaseRepository } from '../useCase.repository';
import { UseCaseStatus } from '@prisma/client';
import { NotFoundError, ForbiddenError, BadRequestError } from '@/utils/errors';

// Mock dependencies
vi.mock('../useCase.repository');
vi.mock('@/config/redisClient', () => ({
  default: {
    isReady: () => false,
    getJSON: vi.fn(),
    setJSON: vi.fn(),
    del: vi.fn(),
    keys: vi.fn(),
  },
}));

describe('UseCaseService', () => {
  let service: UseCaseService;
  let mockRepo: vi.Mocked<UseCaseRepository>;

  beforeEach(() => {
    mockRepo = {
      create: vi.fn(),
      findById: vi.fn(),
      findBySlug: vi.fn(),
      list: vi.fn(),
      update: vi.fn(),
      review: vi.fn(),
      delete: vi.fn(),
      incrementViewCount: vi.fn(),
      getFeatured: vi.fn(),
      getRelated: vi.fn(),
      slugExists: vi.fn(),
    } as any;

    service = new UseCaseService(mockRepo);
  });

  describe('submitUseCase', () => {
    const mockUseCaseData = {
      title: 'Test Use Case',
      summary: 'This is a test summary for the use case that is long enough to pass validation',
      content: {
        problem: 'This is the problem statement that is long enough to pass validation requirements',
        solution: 'This is the solution description that is long enough to pass validation requirements',
        results: 'These are the results that are long enough to pass validation requirements for the test',
      },
      techStack: ['OpenAI GPT-4', 'LangChain', 'Python'],
      category: 'code_generation' as any,
      industry: 'saas' as any,
      implementationType: 'rag' as any,
    };

    it('should create a new use case with unique slug', async () => {
      mockRepo.slugExists.mockResolvedValue(false);
      mockRepo.create.mockResolvedValue({
        id: 'use-case-id',
        slug: 'test-use-case',
        ...mockUseCaseData,
        status: UseCaseStatus.pending,
        authorId: 'user-id',
      } as any);

      const result = await service.submitUseCase(mockUseCaseData, 'user-id');

      expect(result.status).toBe(UseCaseStatus.pending);
      expect(mockRepo.slugExists).toHaveBeenCalled();
      expect(mockRepo.create).toHaveBeenCalled();
    });

    it('should generate unique slug when slug exists', async () => {
      mockRepo.slugExists
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      mockRepo.create.mockResolvedValue({
        id: 'use-case-id',
        slug: 'test-use-case-1',
        ...mockUseCaseData,
        status: UseCaseStatus.pending,
        authorId: 'user-id',
      } as any);

      await service.submitUseCase(mockUseCaseData, 'user-id');

      expect(mockRepo.slugExists).toHaveBeenCalledTimes(2);
    });
  });

  describe('getUseCaseBySlug', () => {
    it('should throw NotFoundError if use case does not exist', async () => {
      mockRepo.findBySlug.mockResolvedValue(null);

      await expect(
        service.getUseCaseBySlug('non-existent-slug')
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError if use case is not published', async () => {
      mockRepo.findBySlug.mockResolvedValue({
        id: 'use-case-id',
        status: UseCaseStatus.pending,
      } as any);

      await expect(
        service.getUseCaseBySlug('pending-slug')
      ).rejects.toThrow(NotFoundError);
    });

    it('should return use case and related use cases', async () => {
      const mockUseCase = {
        id: 'use-case-id',
        slug: 'test-slug',
        status: UseCaseStatus.published,
        category: 'code_generation',
        industry: 'saas',
      } as any;

      mockRepo.findBySlug.mockResolvedValue(mockUseCase);
      mockRepo.getRelated.mockResolvedValue([]);
      mockRepo.incrementViewCount.mockResolvedValue(undefined);

      const result = await service.getUseCaseBySlug('test-slug');

      expect(result.useCase).toEqual(mockUseCase);
      expect(mockRepo.incrementViewCount).toHaveBeenCalledWith('use-case-id');
    });
  });

  describe('getUseCaseById', () => {
    it('should throw NotFoundError if use case does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(
        service.getUseCaseById('non-existent-id', 'user-id', 'user')
      ).rejects.toThrow(NotFoundError);
    });

    it('should allow admin to view non-published use case', async () => {
      mockRepo.findById.mockResolvedValue({
        id: 'use-case-id',
        status: UseCaseStatus.pending,
        authorId: 'other-user-id',
      } as any);

      const result = await service.getUseCaseById(
        'use-case-id',
        'admin-user-id',
        'admin'
      );

      expect(result.status).toBe(UseCaseStatus.pending);
    });

    it('should allow author to view their own non-published use case', async () => {
      mockRepo.findById.mockResolvedValue({
        id: 'use-case-id',
        status: UseCaseStatus.pending,
        authorId: 'author-id',
      } as any);

      const result = await service.getUseCaseById(
        'use-case-id',
        'author-id',
        'user'
      );

      expect(result.status).toBe(UseCaseStatus.pending);
    });

    it('should throw ForbiddenError for non-author viewing non-published use case', async () => {
      mockRepo.findById.mockResolvedValue({
        id: 'use-case-id',
        status: UseCaseStatus.pending,
        authorId: 'other-user-id',
      } as any);

      await expect(
        service.getUseCaseById('use-case-id', 'user-id', 'user')
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('updateUseCase', () => {
    it('should throw NotFoundError if use case does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(
        service.updateUseCase('non-existent-id', {}, 'user-id', 'user')
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError if user is not author or admin', async () => {
      mockRepo.findById.mockResolvedValue({
        id: 'use-case-id',
        authorId: 'other-user-id',
        status: UseCaseStatus.pending,
      } as any);

      await expect(
        service.updateUseCase('use-case-id', {}, 'user-id', 'user')
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw BadRequestError if author tries to update published use case', async () => {
      mockRepo.findById.mockResolvedValue({
        id: 'use-case-id',
        authorId: 'user-id',
        status: UseCaseStatus.published,
      } as any);

      await expect(
        service.updateUseCase('use-case-id', {}, 'user-id', 'user')
      ).rejects.toThrow(BadRequestError);
    });

    it('should allow admin to update published use case', async () => {
      mockRepo.findById.mockResolvedValue({
        id: 'use-case-id',
        authorId: 'other-user-id',
        status: UseCaseStatus.published,
        slug: 'test-slug',
      } as any);

      mockRepo.update.mockResolvedValue({
        id: 'use-case-id',
        title: 'Updated Title',
      } as any);

      const result = await service.updateUseCase(
        'use-case-id',
        { title: 'Updated Title' },
        'admin-id',
        'admin'
      );

      expect(mockRepo.update).toHaveBeenCalled();
    });

    it('should allow author to update pending use case', async () => {
      mockRepo.findById.mockResolvedValue({
        id: 'use-case-id',
        authorId: 'user-id',
        status: UseCaseStatus.pending,
        slug: 'test-slug',
      } as any);

      mockRepo.update.mockResolvedValue({
        id: 'use-case-id',
        title: 'Updated Title',
      } as any);

      await service.updateUseCase(
        'use-case-id',
        { title: 'Updated Title' },
        'user-id',
        'user'
      );

      expect(mockRepo.update).toHaveBeenCalled();
    });
  });

  describe('reviewUseCase', () => {
    it('should throw NotFoundError if use case does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(
        service.reviewUseCase(
          'non-existent-id',
          { status: UseCaseStatus.approved },
          'admin-id'
        )
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw BadRequestError if rejecting without reason', async () => {
      mockRepo.findById.mockResolvedValue({
        id: 'use-case-id',
        status: UseCaseStatus.pending,
      } as any);

      await expect(
        service.reviewUseCase(
          'use-case-id',
          { status: UseCaseStatus.rejected },
          'admin-id'
        )
      ).rejects.toThrow(BadRequestError);
    });

    it('should approve use case successfully', async () => {
      mockRepo.findById.mockResolvedValue({
        id: 'use-case-id',
        slug: 'test-slug',
        status: UseCaseStatus.pending,
      } as any);

      mockRepo.review.mockResolvedValue({
        id: 'use-case-id',
        status: UseCaseStatus.approved,
      } as any);

      const result = await service.reviewUseCase(
        'use-case-id',
        { status: UseCaseStatus.approved },
        'admin-id'
      );

      expect(result.status).toBe(UseCaseStatus.approved);
      expect(mockRepo.review).toHaveBeenCalled();
    });

    it('should reject use case with reason', async () => {
      mockRepo.findById.mockResolvedValue({
        id: 'use-case-id',
        slug: 'test-slug',
        status: UseCaseStatus.pending,
      } as any);

      mockRepo.review.mockResolvedValue({
        id: 'use-case-id',
        status: UseCaseStatus.rejected,
      } as any);

      await service.reviewUseCase(
        'use-case-id',
        {
          status: UseCaseStatus.rejected,
          rejectionReason: 'Does not meet quality standards',
        },
        'admin-id'
      );

      expect(mockRepo.review).toHaveBeenCalled();
    });
  });

  describe('deleteUseCase', () => {
    it('should throw NotFoundError if use case does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(
        service.deleteUseCase('non-existent-id', 'user-id', 'user')
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError if user is not author or admin', async () => {
      mockRepo.findById.mockResolvedValue({
        id: 'use-case-id',
        authorId: 'other-user-id',
      } as any);

      await expect(
        service.deleteUseCase('use-case-id', 'user-id', 'user')
      ).rejects.toThrow(ForbiddenError);
    });

    it('should allow author to delete their own use case', async () => {
      mockRepo.findById.mockResolvedValue({
        id: 'use-case-id',
        slug: 'test-slug',
        authorId: 'user-id',
      } as any);

      mockRepo.delete.mockResolvedValue(undefined);

      await service.deleteUseCase('use-case-id', 'user-id', 'user');

      expect(mockRepo.delete).toHaveBeenCalledWith('use-case-id');
    });

    it('should allow admin to delete any use case', async () => {
      mockRepo.findById.mockResolvedValue({
        id: 'use-case-id',
        slug: 'test-slug',
        authorId: 'other-user-id',
      } as any);

      mockRepo.delete.mockResolvedValue(undefined);

      await service.deleteUseCase('use-case-id', 'admin-id', 'admin');

      expect(mockRepo.delete).toHaveBeenCalledWith('use-case-id');
    });
  });

  describe('listUseCases', () => {
    it('should return paginated use cases', async () => {
      const mockUseCases = [
        { id: '1', status: UseCaseStatus.published },
        { id: '2', status: UseCaseStatus.published },
      ] as any[];

      mockRepo.list.mockResolvedValue({
        useCases: mockUseCases,
        total: 2,
      });

      const result = await service.listUseCases({
        page: 1,
        limit: 20,
        sort: 'recent',
      });

      expect(result.useCases).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.totalPages).toBe(1);
    });
  });

  describe('getFeaturedUseCases', () => {
    it('should return featured use cases', async () => {
      const mockUseCases = [
        { id: '1', featured: true, status: UseCaseStatus.published },
        { id: '2', featured: true, status: UseCaseStatus.published },
      ] as any[];

      mockRepo.getFeatured.mockResolvedValue(mockUseCases);

      const result = await service.getFeaturedUseCases(5);

      expect(result).toHaveLength(2);
      expect(mockRepo.getFeatured).toHaveBeenCalledWith(5);
    });
  });
});
