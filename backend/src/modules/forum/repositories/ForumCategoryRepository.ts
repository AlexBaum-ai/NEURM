import { PrismaClient, ForumCategory, CategoryVisibility, Prisma } from '@prisma/client';
import { injectable } from 'tsyringe';

export interface CategoryWithChildren extends ForumCategory {
  children?: CategoryWithChildren[];
  moderators?: {
    userId: string;
    assignedAt: Date;
    user: {
      id: string;
      username: string;
      email: string;
    };
  }[];
  _count?: {
    topics: number;
  };
}

export interface CreateCategoryData {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  parentId?: string;
  displayOrder?: number;
  guidelines?: string;
  visibility?: CategoryVisibility;
  isActive?: boolean;
}

export interface UpdateCategoryData {
  name?: string;
  slug?: string;
  description?: string;
  icon?: string;
  parentId?: string;
  displayOrder?: number;
  guidelines?: string;
  visibility?: CategoryVisibility;
  isActive?: boolean;
}

@injectable()
export class ForumCategoryRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get all categories with their children (hierarchical structure)
   */
  async findAllWithHierarchy(): Promise<CategoryWithChildren[]> {
    // Get all root categories (level 1, no parent)
    const rootCategories = await this.prisma.forumCategory.findMany({
      where: {
        parentId: null,
        isActive: true,
      },
      include: {
        children: {
          where: { isActive: true },
          include: {
            moderators: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    email: true,
                  },
                },
              },
            },
            _count: {
              select: {
                topics: true,
              },
            },
          },
          orderBy: { displayOrder: 'asc' },
        },
        moderators: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            topics: true,
          },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });

    return rootCategories as CategoryWithChildren[];
  }

  /**
   * Get all categories (flat list)
   */
  async findAll(includeInactive = false): Promise<ForumCategory[]> {
    return this.prisma.forumCategory.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  /**
   * Find category by ID
   */
  async findById(id: string, includeModerators = true): Promise<CategoryWithChildren | null> {
    return this.prisma.forumCategory.findUnique({
      where: { id },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
        },
        parent: true,
        moderators: includeModerators
          ? {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    email: true,
                  },
                },
              },
            }
          : false,
        _count: {
          select: {
            topics: true,
          },
        },
      },
    }) as Promise<CategoryWithChildren | null>;
  }

  /**
   * Find category by slug
   */
  async findBySlug(slug: string, includeModerators = true): Promise<CategoryWithChildren | null> {
    return this.prisma.forumCategory.findUnique({
      where: { slug },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
        },
        parent: true,
        moderators: includeModerators
          ? {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    email: true,
                  },
                },
              },
            }
          : false,
        _count: {
          select: {
            topics: true,
          },
        },
      },
    }) as Promise<CategoryWithChildren | null>;
  }

  /**
   * Create a new category
   */
  async create(data: CreateCategoryData): Promise<ForumCategory> {
    // Calculate level based on parent
    let level = 1;
    if (data.parentId) {
      const parent = await this.prisma.forumCategory.findUnique({
        where: { id: data.parentId },
        select: { level: true },
      });
      if (parent) {
        level = parent.level + 1;
        // Enforce max 2 levels
        if (level > 2) {
          throw new Error('Maximum category depth is 2 levels');
        }
      }
    }

    return this.prisma.forumCategory.create({
      data: {
        ...data,
        level,
      },
    });
  }

  /**
   * Update category
   */
  async update(id: string, data: UpdateCategoryData): Promise<ForumCategory> {
    // If changing parent, recalculate level
    let level: number | undefined;
    if (data.parentId !== undefined) {
      if (data.parentId === null) {
        level = 1;
      } else {
        const parent = await this.prisma.forumCategory.findUnique({
          where: { id: data.parentId },
          select: { level: true },
        });
        if (parent) {
          level = parent.level + 1;
          if (level > 2) {
            throw new Error('Maximum category depth is 2 levels');
          }
        }
      }
    }

    return this.prisma.forumCategory.update({
      where: { id },
      data: {
        ...data,
        ...(level !== undefined && { level }),
      },
    });
  }

  /**
   * Soft delete category (set isActive to false)
   */
  async softDelete(id: string): Promise<ForumCategory> {
    // Check if category has children
    const category = await this.prisma.forumCategory.findUnique({
      where: { id },
      include: {
        children: {
          where: { isActive: true },
        },
      },
    });

    if (category && category.children.length > 0) {
      throw new Error('Cannot delete category with active subcategories');
    }

    return this.prisma.forumCategory.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Hard delete category (permanent)
   */
  async delete(id: string): Promise<ForumCategory> {
    return this.prisma.forumCategory.delete({
      where: { id },
    });
  }

  /**
   * Reorder categories
   */
  async reorder(updates: { id: string; displayOrder: number }[]): Promise<void> {
    await this.prisma.$transaction(
      updates.map((update) =>
        this.prisma.forumCategory.update({
          where: { id: update.id },
          data: { displayOrder: update.displayOrder },
        })
      )
    );
  }

  /**
   * Assign moderator to category
   */
  async assignModerator(categoryId: string, userId: string): Promise<void> {
    await this.prisma.categoryModerator.create({
      data: {
        categoryId,
        userId,
      },
    });
  }

  /**
   * Remove moderator from category
   */
  async removeModerator(categoryId: string, userId: string): Promise<void> {
    await this.prisma.categoryModerator.delete({
      where: {
        categoryId_userId: {
          categoryId,
          userId,
        },
      },
    });
  }

  /**
   * Get moderators for a category
   */
  async getModerators(categoryId: string) {
    return this.prisma.categoryModerator.findMany({
      where: { categoryId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  /**
   * Check if user is moderator of category
   */
  async isModerator(categoryId: string, userId: string): Promise<boolean> {
    const moderator = await this.prisma.categoryModerator.findUnique({
      where: {
        categoryId_userId: {
          categoryId,
          userId,
        },
      },
    });
    return moderator !== null;
  }

  /**
   * Update category statistics
   */
  async updateStatistics(
    categoryId: string,
    data: {
      topicCount?: number;
      replyCount?: number;
      lastActivityAt?: Date;
    }
  ): Promise<ForumCategory> {
    return this.prisma.forumCategory.update({
      where: { id: categoryId },
      data,
    });
  }

  /**
   * Increment topic count
   */
  async incrementTopicCount(categoryId: string): Promise<void> {
    await this.prisma.forumCategory.update({
      where: { id: categoryId },
      data: {
        topicCount: { increment: 1 },
        lastActivityAt: new Date(),
      },
    });
  }

  /**
   * Decrement topic count
   */
  async decrementTopicCount(categoryId: string): Promise<void> {
    await this.prisma.forumCategory.update({
      where: { id: categoryId },
      data: {
        topicCount: { decrement: 1 },
      },
    });
  }

  /**
   * Check if slug is unique
   */
  async isSlugUnique(slug: string, excludeId?: string): Promise<boolean> {
    const category = await this.prisma.forumCategory.findUnique({
      where: { slug },
    });

    if (!category) return true;
    if (excludeId && category.id === excludeId) return true;
    return false;
  }
}
