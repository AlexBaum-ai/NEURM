import { PrismaClient, NewsCategory } from '@prisma/client';
import prisma from '@/config/database';

/**
 * CategoryRepository
 * Data access layer for news categories
 */
export class CategoryRepository {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || prisma;
  }

  /**
   * Get all categories with hierarchical structure
   * Uses self-join to build category tree
   */
  async getAllCategories(includeInactive: boolean = false): Promise<NewsCategory[]> {
    const where = includeInactive ? {} : { isActive: true };

    return this.prisma.newsCategory.findMany({
      where,
      orderBy: [
        { level: 'asc' },
        { displayOrder: 'asc' },
        { name: 'asc' },
      ],
      include: {
        parent: true,
        children: {
          where: includeInactive ? {} : { isActive: true },
          orderBy: [
            { displayOrder: 'asc' },
            { name: 'asc' },
          ],
          include: {
            children: {
              where: includeInactive ? {} : { isActive: true },
              orderBy: [
                { displayOrder: 'asc' },
                { name: 'asc' },
              ],
            },
          },
        },
      },
    });
  }

  /**
   * Get root categories (level 1, no parent)
   */
  async getRootCategories(includeInactive: boolean = false): Promise<NewsCategory[]> {
    const where = {
      parentId: null,
      ...(includeInactive ? {} : { isActive: true }),
    };

    return this.prisma.newsCategory.findMany({
      where,
      orderBy: [
        { displayOrder: 'asc' },
        { name: 'asc' },
      ],
      include: {
        children: {
          where: includeInactive ? {} : { isActive: true },
          orderBy: [
            { displayOrder: 'asc' },
            { name: 'asc' },
          ],
          include: {
            children: {
              where: includeInactive ? {} : { isActive: true },
              orderBy: [
                { displayOrder: 'asc' },
                { name: 'asc' },
              ],
            },
          },
        },
      },
    });
  }

  /**
   * Get category by slug with full hierarchy
   */
  async getCategoryBySlug(slug: string): Promise<NewsCategory | null> {
    return this.prisma.newsCategory.findUnique({
      where: { slug },
      include: {
        parent: {
          include: {
            parent: true,
          },
        },
        children: {
          where: { isActive: true },
          orderBy: [
            { displayOrder: 'asc' },
            { name: 'asc' },
          ],
          include: {
            children: {
              where: { isActive: true },
              orderBy: [
                { displayOrder: 'asc' },
                { name: 'asc' },
              ],
            },
          },
        },
      },
    });
  }

  /**
   * Get category by ID
   */
  async getCategoryById(id: string): Promise<NewsCategory | null> {
    return this.prisma.newsCategory.findUnique({
      where: { id },
    });
  }

  /**
   * Increment article count for a category
   */
  async incrementArticleCount(categoryId: string): Promise<void> {
    await this.prisma.newsCategory.update({
      where: { id: categoryId },
      data: {
        articleCount: {
          increment: 1,
        },
      },
    });
  }

  /**
   * Decrement article count for a category
   */
  async decrementArticleCount(categoryId: string): Promise<void> {
    await this.prisma.newsCategory.update({
      where: { id: categoryId },
      data: {
        articleCount: {
          decrement: 1,
        },
      },
    });
  }

  /**
   * Recalculate article count for a category
   */
  async recalculateArticleCount(categoryId: string): Promise<number> {
    const count = await this.prisma.article.count({
      where: {
        categoryId,
        status: 'published',
      },
    });

    await this.prisma.newsCategory.update({
      where: { id: categoryId },
      data: { articleCount: count },
    });

    return count;
  }

  /**
   * Get categories with article counts
   */
  async getCategoriesWithCounts(): Promise<NewsCategory[]> {
    return this.prisma.newsCategory.findMany({
      where: { isActive: true },
      orderBy: [
        { level: 'asc' },
        { displayOrder: 'asc' },
        { name: 'asc' },
      ],
    });
  }
}

export default CategoryRepository;
