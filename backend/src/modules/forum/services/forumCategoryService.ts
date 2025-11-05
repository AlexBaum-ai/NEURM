import { injectable, inject } from 'tsyringe';
import * as Sentry from '@sentry/node';
import {
  ForumCategoryRepository,
  CategoryWithChildren,
  CreateCategoryData,
  UpdateCategoryData,
} from '../repositories/ForumCategoryRepository';
import { ForumCategory, CategoryVisibility } from '@prisma/client';

export interface CategoryTreeNode extends ForumCategory {
  children?: CategoryTreeNode[];
  moderators?: any[];
  topicCount?: number;
}

export interface ReorderCategoryRequest {
  id: string;
  displayOrder: number;
}

@injectable()
export class ForumCategoryService {
  constructor(
    @inject('ForumCategoryRepository')
    private categoryRepository: ForumCategoryRepository
  ) {}

  /**
   * Get all categories in hierarchical tree structure
   */
  async getCategoryTree(): Promise<CategoryWithChildren[]> {
    try {
      const categories = await this.categoryRepository.findAllWithHierarchy();
      return categories;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'forumCategoryService', method: 'getCategoryTree' },
      });
      throw new Error('Failed to fetch category tree');
    }
  }

  /**
   * Get all categories (flat list)
   */
  async getAllCategories(includeInactive = false): Promise<ForumCategory[]> {
    try {
      return await this.categoryRepository.findAll(includeInactive);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'forumCategoryService', method: 'getAllCategories' },
      });
      throw new Error('Failed to fetch categories');
    }
  }

  /**
   * Get category by ID
   */
  async getCategoryById(id: string): Promise<CategoryWithChildren | null> {
    try {
      return await this.categoryRepository.findById(id);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'forumCategoryService', method: 'getCategoryById' },
        extra: { categoryId: id },
      });
      throw new Error('Failed to fetch category');
    }
  }

  /**
   * Get category by slug
   */
  async getCategoryBySlug(slug: string): Promise<CategoryWithChildren | null> {
    try {
      return await this.categoryRepository.findBySlug(slug);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'forumCategoryService', method: 'getCategoryBySlug' },
        extra: { slug },
      });
      throw new Error('Failed to fetch category');
    }
  }

  /**
   * Create a new category
   */
  async createCategory(data: CreateCategoryData, creatorId: string): Promise<ForumCategory> {
    try {
      // Validate slug uniqueness
      const isUnique = await this.categoryRepository.isSlugUnique(data.slug);
      if (!isUnique) {
        throw new Error('Category slug already exists');
      }

      // If parent is specified, validate it exists and check level
      if (data.parentId) {
        const parent = await this.categoryRepository.findById(data.parentId, false);
        if (!parent) {
          throw new Error('Parent category not found');
        }
        if (parent.level >= 2) {
          throw new Error('Cannot create subcategory: maximum depth is 2 levels');
        }
      }

      const category = await this.categoryRepository.create(data);

      Sentry.addBreadcrumb({
        category: 'forum',
        message: 'Category created',
        level: 'info',
        data: { categoryId: category.id, creatorId },
      });

      return category;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'forumCategoryService', method: 'createCategory' },
        extra: { data, creatorId },
      });
      throw error;
    }
  }

  /**
   * Update category
   */
  async updateCategory(
    id: string,
    data: UpdateCategoryData,
    updaterId: string
  ): Promise<ForumCategory> {
    try {
      // Check if category exists
      const existing = await this.categoryRepository.findById(id, false);
      if (!existing) {
        throw new Error('Category not found');
      }

      // Validate slug uniqueness if slug is being changed
      if (data.slug && data.slug !== existing.slug) {
        const isUnique = await this.categoryRepository.isSlugUnique(data.slug, id);
        if (!isUnique) {
          throw new Error('Category slug already exists');
        }
      }

      // If changing parent, validate
      if (data.parentId !== undefined && data.parentId !== existing.parentId) {
        if (data.parentId === id) {
          throw new Error('Category cannot be its own parent');
        }

        if (data.parentId) {
          const parent = await this.categoryRepository.findById(data.parentId, false);
          if (!parent) {
            throw new Error('Parent category not found');
          }
          if (parent.level >= 2) {
            throw new Error('Cannot move to subcategory: maximum depth is 2 levels');
          }
          // Check if new parent is not a child of this category
          if (parent.parentId === id) {
            throw new Error('Cannot move category to its own child');
          }
        }
      }

      const category = await this.categoryRepository.update(id, data);

      Sentry.addBreadcrumb({
        category: 'forum',
        message: 'Category updated',
        level: 'info',
        data: { categoryId: id, updaterId },
      });

      return category;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'forumCategoryService', method: 'updateCategory' },
        extra: { categoryId: id, data, updaterId },
      });
      throw error;
    }
  }

  /**
   * Delete category (soft delete)
   */
  async deleteCategory(id: string, deleterId: string): Promise<void> {
    try {
      const category = await this.categoryRepository.findById(id, false);
      if (!category) {
        throw new Error('Category not found');
      }

      // Check if has topics
      if (category._count && category._count.topics > 0) {
        throw new Error('Cannot delete category with existing topics');
      }

      await this.categoryRepository.softDelete(id);

      Sentry.addBreadcrumb({
        category: 'forum',
        message: 'Category deleted',
        level: 'info',
        data: { categoryId: id, deleterId },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'forumCategoryService', method: 'deleteCategory' },
        extra: { categoryId: id, deleterId },
      });
      throw error;
    }
  }

  /**
   * Reorder categories
   */
  async reorderCategories(updates: ReorderCategoryRequest[], updaterId: string): Promise<void> {
    try {
      // Validate all categories exist
      for (const update of updates) {
        const category = await this.categoryRepository.findById(update.id, false);
        if (!category) {
          throw new Error(`Category not found: ${update.id}`);
        }
      }

      await this.categoryRepository.reorder(updates);

      Sentry.addBreadcrumb({
        category: 'forum',
        message: 'Categories reordered',
        level: 'info',
        data: { count: updates.length, updaterId },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'forumCategoryService', method: 'reorderCategories' },
        extra: { updates, updaterId },
      });
      throw error;
    }
  }

  /**
   * Assign moderator to category
   */
  async assignModerator(categoryId: string, userId: string, assignerId: string): Promise<void> {
    try {
      const category = await this.categoryRepository.findById(categoryId, false);
      if (!category) {
        throw new Error('Category not found');
      }

      // Check if already a moderator
      const isMod = await this.categoryRepository.isModerator(categoryId, userId);
      if (isMod) {
        throw new Error('User is already a moderator of this category');
      }

      await this.categoryRepository.assignModerator(categoryId, userId);

      Sentry.addBreadcrumb({
        category: 'forum',
        message: 'Moderator assigned to category',
        level: 'info',
        data: { categoryId, userId, assignerId },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'forumCategoryService', method: 'assignModerator' },
        extra: { categoryId, userId, assignerId },
      });
      throw error;
    }
  }

  /**
   * Remove moderator from category
   */
  async removeModerator(categoryId: string, userId: string, removerId: string): Promise<void> {
    try {
      const category = await this.categoryRepository.findById(categoryId, false);
      if (!category) {
        throw new Error('Category not found');
      }

      const isMod = await this.categoryRepository.isModerator(categoryId, userId);
      if (!isMod) {
        throw new Error('User is not a moderator of this category');
      }

      await this.categoryRepository.removeModerator(categoryId, userId);

      Sentry.addBreadcrumb({
        category: 'forum',
        message: 'Moderator removed from category',
        level: 'info',
        data: { categoryId, userId, removerId },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'forumCategoryService', method: 'removeModerator' },
        extra: { categoryId, userId, removerId },
      });
      throw error;
    }
  }

  /**
   * Get moderators for a category
   */
  async getCategoryModerators(categoryId: string) {
    try {
      return await this.categoryRepository.getModerators(categoryId);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'forumCategoryService', method: 'getCategoryModerators' },
        extra: { categoryId },
      });
      throw new Error('Failed to fetch category moderators');
    }
  }

  /**
   * Check if user can moderate category
   */
  async canModerateCategory(categoryId: string, userId: string, userRole: string): Promise<boolean> {
    try {
      // Admins and moderators can moderate all categories
      if (userRole === 'admin' || userRole === 'moderator') {
        return true;
      }

      // Check if user is assigned as category moderator
      return await this.categoryRepository.isModerator(categoryId, userId);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'forumCategoryService', method: 'canModerateCategory' },
        extra: { categoryId, userId },
      });
      return false;
    }
  }

  /**
   * Update category statistics
   */
  async updateCategoryStatistics(
    categoryId: string,
    data: {
      topicCount?: number;
      replyCount?: number;
      lastActivityAt?: Date;
    }
  ): Promise<void> {
    try {
      await this.categoryRepository.updateStatistics(categoryId, data);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'forumCategoryService', method: 'updateCategoryStatistics' },
        extra: { categoryId, data },
      });
      // Don't throw - statistics updates are not critical
    }
  }

  /**
   * Generate slug from name
   */
  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 100);
  }
}
