import { PrismaClient, NewsTag, Prisma } from '@prisma/client';
import prisma from '@/config/database';

/**
 * TagRepository
 * Data access layer for news tags
 */
export class TagRepository {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || prisma;
  }

  /**
   * Get all tags with optional search filter
   */
  async getAllTags(options: {
    search?: string;
    limit?: number;
    sortBy?: 'name' | 'usageCount' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
  }): Promise<NewsTag[]> {
    const {
      search,
      limit = 50,
      sortBy = 'usageCount',
      sortOrder = 'desc',
    } = options;

    const where: Prisma.NewsTagWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { slug: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    return this.prisma.newsTag.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      take: limit,
    });
  }

  /**
   * Search tags for autocomplete (ILIKE query with limit 10)
   */
  async searchTags(query: string): Promise<NewsTag[]> {
    return this.prisma.newsTag.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { slug: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: [
        { usageCount: 'desc' },
        { name: 'asc' },
      ],
      take: 10,
    });
  }

  /**
   * Get tag by slug
   */
  async getTagBySlug(slug: string): Promise<NewsTag | null> {
    return this.prisma.newsTag.findUnique({
      where: { slug },
    });
  }

  /**
   * Get tag by name
   */
  async getTagByName(name: string): Promise<NewsTag | null> {
    return this.prisma.newsTag.findUnique({
      where: { name },
    });
  }

  /**
   * Get tag by ID
   */
  async getTagById(id: string): Promise<NewsTag | null> {
    return this.prisma.newsTag.findUnique({
      where: { id },
    });
  }

  /**
   * Get tags by IDs
   */
  async getTagsByIds(ids: string[]): Promise<NewsTag[]> {
    return this.prisma.newsTag.findMany({
      where: {
        id: {
          in: ids,
        },
      },
    });
  }

  /**
   * Create a new tag
   */
  async createTag(data: { name: string; slug: string; description?: string }): Promise<NewsTag> {
    return this.prisma.newsTag.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        usageCount: 0,
      },
    });
  }

  /**
   * Increment usage count for a tag
   */
  async incrementUsageCount(tagId: string): Promise<void> {
    await this.prisma.newsTag.update({
      where: { id: tagId },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    });
  }

  /**
   * Decrement usage count for a tag
   */
  async decrementUsageCount(tagId: string): Promise<void> {
    await this.prisma.newsTag.update({
      where: { id: tagId },
      data: {
        usageCount: {
          decrement: 1,
        },
      },
    });
  }

  /**
   * Recalculate usage count for a tag
   */
  async recalculateUsageCount(tagId: string): Promise<number> {
    const count = await this.prisma.articleTag.count({
      where: { tagId },
    });

    await this.prisma.newsTag.update({
      where: { id: tagId },
      data: { usageCount: count },
    });

    return count;
  }

  /**
   * Get popular tags (highest usage count)
   */
  async getPopularTags(limit: number = 20): Promise<NewsTag[]> {
    return this.prisma.newsTag.findMany({
      where: {
        usageCount: {
          gt: 0,
        },
      },
      orderBy: [
        { usageCount: 'desc' },
        { name: 'asc' },
      ],
      take: limit,
    });
  }

  /**
   * Get tags for an article
   */
  async getArticleTags(articleId: string): Promise<NewsTag[]> {
    const articleTags = await this.prisma.articleTag.findMany({
      where: { articleId },
      include: {
        tag: true,
      },
    });

    return articleTags.map((at) => at.tag);
  }

  /**
   * Bulk update usage counts for multiple tags
   */
  async bulkUpdateUsageCounts(tagIds: string[]): Promise<void> {
    for (const tagId of tagIds) {
      await this.recalculateUsageCount(tagId);
    }
  }
}

export default TagRepository;
