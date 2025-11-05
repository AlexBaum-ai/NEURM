import * as Sentry from '@sentry/node';
import PromptRepository, { PromptWithDetails } from './prompts.repository';
import {
  CreatePromptInput,
  UpdatePromptInput,
  ListPromptsQuery,
  RatePromptInput,
  VotePromptInput,
} from './prompts.validation';
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from '@/utils/errors';
import logger from '@/utils/logger';

/**
 * Prompt response DTO
 */
export interface PromptResponse {
  id: string;
  userId: string;
  parentId: string | null;
  title: string;
  content: string;
  category: string;
  useCase: string | null;
  model: string | null;
  tags: string[];
  templateJson: any;
  ratingAvg: number;
  ratingCount: number;
  voteScore: number;
  upvoteCount: number;
  downvoteCount: number;
  forkCount: number;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  parent?: {
    id: string;
    title: string;
    authorUsername: string;
  } | null;
  counts: {
    forks: number;
    ratings: number;
    votes: number;
  };
  userVote?: number | null;
  userRating?: number | null;
}

/**
 * Paginated prompt list response
 */
export interface PaginatedPromptsResponse {
  prompts: PromptResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * PromptService
 * Business logic for prompt operations
 */
export class PromptService {
  private promptRepository: PromptRepository;

  constructor(promptRepository?: PromptRepository) {
    this.promptRepository = promptRepository || new PromptRepository();
  }

  /**
   * List prompts with filters and pagination
   */
  async listPrompts(
    query: ListPromptsQuery,
    userId?: string
  ): Promise<PaginatedPromptsResponse> {
    try {
      const { prompts, total } = await this.promptRepository.findMany(query, userId);

      const totalPages = Math.ceil(total / query.limit);

      return {
        prompts: prompts.map((p) => this.mapToResponse(p)),
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'PromptService', method: 'listPrompts' },
        extra: { query, userId },
      });
      throw error;
    }
  }

  /**
   * Get prompt by ID
   */
  async getPromptById(promptId: string, userId?: string): Promise<PromptResponse> {
    try {
      const prompt = await this.promptRepository.findById(promptId, userId);

      if (!prompt) {
        throw new NotFoundError('Prompt not found');
      }

      // Increment usage count (fire and forget)
      this.promptRepository
        .update(promptId, { usageCount: (prompt.usageCount || 0) + 1 } as any)
        .catch((err) => {
          logger.error('Failed to increment prompt usage count', {
            promptId,
            error: err,
          });
        });

      return this.mapToResponse(prompt);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'PromptService', method: 'getPromptById' },
        extra: { promptId, userId },
      });
      throw error;
    }
  }

  /**
   * Create new prompt
   */
  async createPrompt(
    userId: string,
    data: CreatePromptInput
  ): Promise<PromptResponse> {
    try {
      logger.info('Creating new prompt', { userId, title: data.title });

      const prompt = await this.promptRepository.create({
        userId,
        ...data,
      });

      logger.info('Prompt created successfully', { promptId: prompt.id });

      return this.mapToResponse(prompt);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'PromptService', method: 'createPrompt' },
        extra: { userId, data },
      });
      logger.error('Failed to create prompt', { userId, error });
      throw error;
    }
  }

  /**
   * Update prompt (author only)
   */
  async updatePrompt(
    promptId: string,
    userId: string,
    data: UpdatePromptInput
  ): Promise<PromptResponse> {
    try {
      // Check ownership
      const existingPrompt = await this.promptRepository.findById(promptId);

      if (!existingPrompt) {
        throw new NotFoundError('Prompt not found');
      }

      if (existingPrompt.userId !== userId) {
        throw new ForbiddenError('You can only update your own prompts');
      }

      logger.info('Updating prompt', { promptId, userId });

      const prompt = await this.promptRepository.update(promptId, data);

      logger.info('Prompt updated successfully', { promptId });

      return this.mapToResponse(prompt);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'PromptService', method: 'updatePrompt' },
        extra: { promptId, userId, data },
      });
      logger.error('Failed to update prompt', { promptId, userId, error });
      throw error;
    }
  }

  /**
   * Fork prompt
   */
  async forkPrompt(promptId: string, userId: string): Promise<PromptResponse> {
    try {
      // Check if prompt exists
      const existingPrompt = await this.promptRepository.findById(promptId);

      if (!existingPrompt) {
        throw new NotFoundError('Prompt not found');
      }

      // Don't allow forking your own prompt
      if (existingPrompt.userId === userId) {
        throw new BadRequestError('You cannot fork your own prompt');
      }

      logger.info('Forking prompt', { promptId, userId });

      const forkedPrompt = await this.promptRepository.fork(promptId, userId);

      logger.info('Prompt forked successfully', {
        originalPromptId: promptId,
        forkedPromptId: forkedPrompt.id,
      });

      return this.mapToResponse(forkedPrompt);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'PromptService', method: 'forkPrompt' },
        extra: { promptId, userId },
      });
      logger.error('Failed to fork prompt', { promptId, userId, error });
      throw error;
    }
  }

  /**
   * Rate prompt
   */
  async ratePrompt(
    promptId: string,
    userId: string,
    data: RatePromptInput
  ): Promise<{ message: string }> {
    try {
      // Check if prompt exists
      const existingPrompt = await this.promptRepository.findById(promptId);

      if (!existingPrompt) {
        throw new NotFoundError('Prompt not found');
      }

      // Don't allow rating your own prompt
      if (existingPrompt.userId === userId) {
        throw new BadRequestError('You cannot rate your own prompt');
      }

      logger.info('Rating prompt', {
        promptId,
        userId,
        rating: data.rating,
      });

      await this.promptRepository.rate(
        promptId,
        userId,
        data.rating,
        data.comment
      );

      logger.info('Prompt rated successfully', { promptId, userId });

      return {
        message: 'Prompt rated successfully',
      };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'PromptService', method: 'ratePrompt' },
        extra: { promptId, userId, data },
      });
      logger.error('Failed to rate prompt', { promptId, userId, error });
      throw error;
    }
  }

  /**
   * Vote on prompt
   */
  async votePrompt(
    promptId: string,
    userId: string,
    data: VotePromptInput
  ): Promise<{ message: string }> {
    try {
      // Check if prompt exists
      const existingPrompt = await this.promptRepository.findById(promptId);

      if (!existingPrompt) {
        throw new NotFoundError('Prompt not found');
      }

      // Don't allow voting on your own prompt
      if (existingPrompt.userId === userId) {
        throw new BadRequestError('You cannot vote on your own prompt');
      }

      logger.info('Voting on prompt', {
        promptId,
        userId,
        value: data.value,
      });

      await this.promptRepository.vote(promptId, userId, data.value);

      logger.info('Prompt voted successfully', { promptId, userId });

      return {
        message: 'Vote recorded successfully',
      };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'PromptService', method: 'votePrompt' },
        extra: { promptId, userId, data },
      });
      logger.error('Failed to vote on prompt', { promptId, userId, error });
      throw error;
    }
  }

  /**
   * Delete prompt (author only)
   */
  async deletePrompt(promptId: string, userId: string): Promise<{ message: string }> {
    try {
      // Check ownership
      const existingPrompt = await this.promptRepository.findById(promptId);

      if (!existingPrompt) {
        throw new NotFoundError('Prompt not found');
      }

      if (existingPrompt.userId !== userId) {
        throw new ForbiddenError('You can only delete your own prompts');
      }

      logger.info('Deleting prompt', { promptId, userId });

      await this.promptRepository.delete(promptId);

      logger.info('Prompt deleted successfully', { promptId });

      return {
        message: 'Prompt deleted successfully',
      };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'PromptService', method: 'deletePrompt' },
        extra: { promptId, userId },
      });
      logger.error('Failed to delete prompt', { promptId, userId, error });
      throw error;
    }
  }

  /**
   * Get user's prompts
   */
  async getUserPrompts(userId: string, limit = 10): Promise<PromptResponse[]> {
    try {
      const prompts = await this.promptRepository.findByUserId(userId, limit);
      return prompts.map((p) => this.mapToResponse(p));
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'PromptService', method: 'getUserPrompts' },
        extra: { userId, limit },
      });
      throw error;
    }
  }

  /**
   * Map Prompt entity to PromptResponse DTO
   */
  private mapToResponse(prompt: PromptWithDetails): PromptResponse {
    return {
      id: prompt.id,
      userId: prompt.userId,
      parentId: prompt.parentId,
      title: prompt.title,
      content: prompt.content,
      category: prompt.category,
      useCase: prompt.useCase,
      model: prompt.model,
      tags: prompt.tags,
      templateJson: prompt.templateJson,
      ratingAvg: Number(prompt.ratingAvg),
      ratingCount: prompt.ratingCount,
      voteScore: prompt.voteScore,
      upvoteCount: prompt.upvoteCount,
      downvoteCount: prompt.downvoteCount,
      forkCount: prompt.forkCount,
      usageCount: prompt.usageCount,
      createdAt: prompt.createdAt,
      updatedAt: prompt.updatedAt,
      author: {
        id: prompt.author.id,
        username: prompt.author.username,
        displayName: prompt.author.profile?.displayName || null,
        avatarUrl: prompt.author.profile?.avatarUrl || null,
      },
      parent: prompt.parent
        ? {
            id: prompt.parent.id,
            title: prompt.parent.title,
            authorUsername: prompt.parent.author.username,
          }
        : null,
      counts: {
        forks: prompt._count.forks,
        ratings: prompt._count.ratings,
        votes: prompt._count.votes,
      },
      userVote: (prompt as any).votes?.[0]?.value || null,
      userRating: (prompt as any).ratings?.[0]?.rating || null,
    };
  }
}

export default PromptService;
