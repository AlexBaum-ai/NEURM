import { PrismaClient, Prompt, PromptRating, PromptVote } from '@prisma/client';
import prisma from '@/config/database';
import { ListPromptsQuery } from './prompts.validation';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Prompt with author and counts
 */
export interface PromptWithDetails extends Prompt {
  author: {
    id: string;
    username: string;
    profile: {
      displayName: string | null;
      avatarUrl: string | null;
    } | null;
  };
  parent?: {
    id: string;
    title: string;
    author: {
      username: string;
    };
  } | null;
  _count: {
    forks: number;
    ratings: number;
    votes: number;
  };
  userVote?: {
    value: number;
  } | null;
  userRating?: {
    rating: number;
  } | null;
}

/**
 * PromptRepository
 * Data access layer for prompt operations
 */
export class PromptRepository {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = prisma) {
    this.prisma = prismaClient;
  }

  /**
   * Find prompt by ID with full details
   */
  async findById(
    promptId: string,
    userId?: string
  ): Promise<PromptWithDetails | null> {
    return this.prisma.prompt.findUnique({
      where: { id: promptId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
        parent: {
          select: {
            id: true,
            title: true,
            author: {
              select: {
                username: true,
              },
            },
          },
        },
        _count: {
          select: {
            forks: true,
            ratings: true,
            votes: true,
          },
        },
        ...(userId && {
          votes: {
            where: { userId },
            select: { value: true },
            take: 1,
          },
          ratings: {
            where: { userId },
            select: { rating: true },
            take: 1,
          },
        }),
      },
    }) as Promise<PromptWithDetails | null>;
  }

  /**
   * List prompts with filters and pagination
   */
  async findMany(
    query: ListPromptsQuery,
    userId?: string
  ): Promise<{ prompts: PromptWithDetails[]; total: number }> {
    const { page, limit, category, useCase, model, search, sort, minRating, tags } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (useCase) {
      where.useCase = { contains: useCase, mode: 'insensitive' };
    }

    if (model) {
      where.model = { contains: model, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (minRating && minRating > 0) {
      where.ratingAvg = { gte: new Decimal(minRating) };
    }

    if (tags) {
      const tagArray = tags.split(',').map((t) => t.trim());
      where.tags = { hasSome: tagArray };
    }

    // Build orderBy clause
    let orderBy: any = {};
    switch (sort) {
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'top_rated':
        orderBy = { ratingAvg: 'desc' };
        break;
      case 'most_voted':
        orderBy = { voteScore: 'desc' };
        break;
      case 'most_forked':
        orderBy = { forkCount: 'desc' };
        break;
      case 'trending':
        // Trending: High vote score + recent
        orderBy = [{ voteScore: 'desc' }, { createdAt: 'desc' }];
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    const [prompts, total] = await Promise.all([
      this.prisma.prompt.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              profile: {
                select: {
                  displayName: true,
                  avatarUrl: true,
                },
              },
            },
          },
          parent: {
            select: {
              id: true,
              title: true,
              author: {
                select: {
                  username: true,
                },
              },
            },
          },
          _count: {
            select: {
              forks: true,
              ratings: true,
              votes: true,
            },
          },
          ...(userId && {
            votes: {
              where: { userId },
              select: { value: true },
              take: 1,
            },
            ratings: {
              where: { userId },
              select: { rating: true },
              take: 1,
            },
          }),
        },
      }) as Promise<PromptWithDetails[]>,
      this.prisma.prompt.count({ where }),
    ]);

    return { prompts, total };
  }

  /**
   * Create new prompt
   */
  async create(data: {
    userId: string;
    title: string;
    content: string;
    category: string;
    useCase?: string | null;
    model?: string | null;
    tags?: string[];
    templateJson?: any;
  }): Promise<PromptWithDetails> {
    const prompt = await this.prisma.prompt.create({
      data,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
        parent: {
          select: {
            id: true,
            title: true,
            author: {
              select: {
                username: true,
              },
            },
          },
        },
        _count: {
          select: {
            forks: true,
            ratings: true,
            votes: true,
          },
        },
      },
    });

    return prompt as PromptWithDetails;
  }

  /**
   * Update prompt
   */
  async update(
    promptId: string,
    data: {
      title?: string;
      content?: string;
      category?: string;
      useCase?: string | null;
      model?: string | null;
      tags?: string[];
      templateJson?: any;
    }
  ): Promise<PromptWithDetails> {
    const prompt = await this.prisma.prompt.update({
      where: { id: promptId },
      data,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
        parent: {
          select: {
            id: true,
            title: true,
            author: {
              select: {
                username: true,
              },
            },
          },
        },
        _count: {
          select: {
            forks: true,
            ratings: true,
            votes: true,
          },
        },
      },
    });

    return prompt as PromptWithDetails;
  }

  /**
   * Fork prompt (create copy with parent reference)
   */
  async fork(promptId: string, userId: string): Promise<PromptWithDetails> {
    // Get original prompt
    const originalPrompt = await this.prisma.prompt.findUnique({
      where: { id: promptId },
    });

    if (!originalPrompt) {
      throw new Error('Prompt not found');
    }

    // Create fork and increment parent's fork count in a transaction
    const [forkedPrompt] = await this.prisma.$transaction([
      this.prisma.prompt.create({
        data: {
          userId,
          parentId: promptId,
          title: `${originalPrompt.title} (Fork)`,
          content: originalPrompt.content,
          category: originalPrompt.category,
          useCase: originalPrompt.useCase,
          model: originalPrompt.model,
          tags: originalPrompt.tags,
          templateJson: originalPrompt.templateJson,
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              profile: {
                select: {
                  displayName: true,
                  avatarUrl: true,
                },
              },
            },
          },
          parent: {
            select: {
              id: true,
              title: true,
              author: {
                select: {
                  username: true,
                },
              },
            },
          },
          _count: {
            select: {
              forks: true,
              ratings: true,
              votes: true,
            },
          },
        },
      }),
      this.prisma.prompt.update({
        where: { id: promptId },
        data: { forkCount: { increment: 1 } },
      }),
    ]);

    return forkedPrompt as PromptWithDetails;
  }

  /**
   * Rate prompt
   */
  async rate(
    promptId: string,
    userId: string,
    rating: number,
    comment?: string | null
  ): Promise<PromptRating> {
    // Upsert rating
    const promptRating = await this.prisma.promptRating.upsert({
      where: {
        userId_promptId: {
          userId,
          promptId,
        },
      },
      create: {
        userId,
        promptId,
        rating,
        comment,
      },
      update: {
        rating,
        comment,
      },
    });

    // Recalculate average rating
    await this.recalculateRating(promptId);

    return promptRating;
  }

  /**
   * Vote on prompt
   */
  async vote(promptId: string, userId: string, value: number): Promise<PromptVote> {
    // Get existing vote if any
    const existingVote = await this.prisma.promptVote.findUnique({
      where: {
        promptId_userId: {
          promptId,
          userId,
        },
      },
    });

    let vote: PromptVote;

    if (existingVote) {
      // If same value, remove vote (toggle off)
      if (existingVote.value === value) {
        vote = await this.prisma.promptVote.delete({
          where: {
            promptId_userId: {
              promptId,
              userId,
            },
          },
        });

        // Update vote counts
        await this.prisma.prompt.update({
          where: { id: promptId },
          data: {
            voteScore: { decrement: value },
            ...(value === 1 && { upvoteCount: { decrement: 1 } }),
            ...(value === -1 && { downvoteCount: { decrement: 1 } }),
          },
        });
      } else {
        // Change vote
        vote = await this.prisma.promptVote.update({
          where: {
            promptId_userId: {
              promptId,
              userId,
            },
          },
          data: { value },
        });

        // Update vote counts (remove old, add new)
        const scoreDiff = value - existingVote.value; // Will be 2 or -2
        await this.prisma.prompt.update({
          where: { id: promptId },
          data: {
            voteScore: { increment: scoreDiff },
            ...(value === 1 && {
              upvoteCount: { increment: 1 },
              downvoteCount: { decrement: 1 },
            }),
            ...(value === -1 && {
              downvoteCount: { increment: 1 },
              upvoteCount: { decrement: 1 },
            }),
          },
        });
      }
    } else {
      // Create new vote
      vote = await this.prisma.promptVote.create({
        data: {
          promptId,
          userId,
          value,
        },
      });

      // Update vote counts
      await this.prisma.prompt.update({
        where: { id: promptId },
        data: {
          voteScore: { increment: value },
          ...(value === 1 && { upvoteCount: { increment: 1 } }),
          ...(value === -1 && { downvoteCount: { increment: 1 } }),
        },
      });
    }

    return vote;
  }

  /**
   * Delete prompt (author only)
   */
  async delete(promptId: string): Promise<void> {
    await this.prisma.prompt.delete({
      where: { id: promptId },
    });
  }

  /**
   * Recalculate average rating for a prompt
   */
  private async recalculateRating(promptId: string): Promise<void> {
    const result = await this.prisma.promptRating.aggregate({
      where: { promptId },
      _avg: { rating: true },
      _count: true,
    });

    await this.prisma.prompt.update({
      where: { id: promptId },
      data: {
        ratingAvg: result._avg.rating ? new Decimal(result._avg.rating) : new Decimal(0),
        ratingCount: result._count,
      },
    });
  }

  /**
   * Get user's prompts
   */
  async findByUserId(userId: string, limit = 10): Promise<PromptWithDetails[]> {
    const prompts = await this.prisma.prompt.findMany({
      where: { userId },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
        parent: {
          select: {
            id: true,
            title: true,
            author: {
              select: {
                username: true,
              },
            },
          },
        },
        _count: {
          select: {
            forks: true,
            ratings: true,
            votes: true,
          },
        },
      },
    });

    return prompts as PromptWithDetails[];
  }
}

export default PromptRepository;
