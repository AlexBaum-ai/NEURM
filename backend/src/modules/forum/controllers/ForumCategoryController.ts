import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { ZodError } from 'zod';
import { BaseController } from '../../../utils/baseController';
import { ForumCategoryService } from '../services/forumCategoryService';
import {
  CreateCategorySchema,
  UpdateCategorySchema,
  ReorderCategoriesSchema,
  AssignModeratorSchema,
  RemoveModeratorSchema,
  ListCategoriesQuerySchema,
  UuidParamSchema,
  SlugParamSchema,
} from '../validators/categoryValidators';

/**
 * ForumCategoryController
 *
 * Handles HTTP requests for forum category management:
 * - CRUD operations for categories
 * - Category hierarchy management
 * - Moderator assignment
 * - Category reordering
 */
@injectable()
export class ForumCategoryController extends BaseController {
  constructor(
    @inject('ForumCategoryService')
    private categoryService: ForumCategoryService
  ) {
    super();
  }

  /**
   * GET /api/forum/categories
   * Get all categories in hierarchical tree structure
   */
  public getCategoryTree = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const query = ListCategoriesQuerySchema.parse(req.query);
      const categories = query.includeInactive
        ? await this.categoryService.getAllCategories(true)
        : await this.categoryService.getCategoryTree();

      return this.success(res, {
        categories,
        count: categories.length,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return this.handleZodError(res, error);
      }
      this.captureException(error as Error, { method: 'getCategoryTree' });
      return this.error(res, 'Failed to fetch categories');
    }
  });

  /**
   * GET /api/forum/categories/:slug
   * Get category by slug
   */
  public getCategoryBySlug = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const { slug } = SlugParamSchema.parse(req.params);
      const category = await this.categoryService.getCategoryBySlug(slug);

      if (!category) {
        return this.notFound(res, 'Category not found');
      }

      return this.success(res, { category });
    } catch (error) {
      if (error instanceof ZodError) {
        return this.handleZodError(res, error);
      }
      this.captureException(error as Error, { method: 'getCategoryBySlug' });
      return this.error(res, 'Failed to fetch category');
    }
  });

  /**
   * POST /api/forum/categories
   * Create new category (admin only)
   */
  public createCategory = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const data = CreateCategorySchema.parse(req.body);
      const userId = (req as any).user?.id;

      if (!userId) {
        return this.unauthorized(res, 'User not authenticated');
      }

      const category = await this.categoryService.createCategory(data, userId);

      return this.created(res, { category });
    } catch (error) {
      if (error instanceof ZodError) {
        return this.handleZodError(res, error);
      }

      const errorMessage = (error as Error).message;
      if (errorMessage.includes('already exists')) {
        return this.badRequest(res, errorMessage);
      }
      if (errorMessage.includes('not found') || errorMessage.includes('maximum depth')) {
        return this.badRequest(res, errorMessage);
      }

      this.captureException(error as Error, { method: 'createCategory', body: req.body });
      return this.error(res, 'Failed to create category');
    }
  });

  /**
   * PUT /api/forum/categories/:id
   * Update category (admin only)
   */
  public updateCategory = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = UuidParamSchema.parse(req.params);
      const data = UpdateCategorySchema.parse(req.body);
      const userId = (req as any).user?.id;

      if (!userId) {
        return this.unauthorized(res, 'User not authenticated');
      }

      const category = await this.categoryService.updateCategory(id, data, userId);

      return this.success(res, { category });
    } catch (error) {
      if (error instanceof ZodError) {
        return this.handleZodError(res, error);
      }

      const errorMessage = (error as Error).message;
      if (errorMessage.includes('not found')) {
        return this.notFound(res, errorMessage);
      }
      if (
        errorMessage.includes('already exists') ||
        errorMessage.includes('maximum depth') ||
        errorMessage.includes('own parent') ||
        errorMessage.includes('own child')
      ) {
        return this.badRequest(res, errorMessage);
      }

      this.captureException(error as Error, {
        method: 'updateCategory',
        categoryId: req.params.id,
        body: req.body,
      });
      return this.error(res, 'Failed to update category');
    }
  });

  /**
   * DELETE /api/forum/categories/:id
   * Soft delete category (admin only)
   */
  public deleteCategory = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = UuidParamSchema.parse(req.params);
      const userId = (req as any).user?.id;

      if (!userId) {
        return this.unauthorized(res, 'User not authenticated');
      }

      await this.categoryService.deleteCategory(id, userId);

      return this.noContent(res);
    } catch (error) {
      if (error instanceof ZodError) {
        return this.handleZodError(res, error);
      }

      const errorMessage = (error as Error).message;
      if (errorMessage.includes('not found')) {
        return this.notFound(res, errorMessage);
      }
      if (errorMessage.includes('Cannot delete')) {
        return this.badRequest(res, errorMessage);
      }

      this.captureException(error as Error, {
        method: 'deleteCategory',
        categoryId: req.params.id,
      });
      return this.error(res, 'Failed to delete category');
    }
  });

  /**
   * PUT /api/forum/categories/reorder
   * Reorder categories (admin only)
   */
  public reorderCategories = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const { categories } = ReorderCategoriesSchema.parse(req.body);
      const userId = (req as any).user?.id;

      if (!userId) {
        return this.unauthorized(res, 'User not authenticated');
      }

      await this.categoryService.reorderCategories(categories, userId);

      return this.success(res, { message: 'Categories reordered successfully' });
    } catch (error) {
      if (error instanceof ZodError) {
        return this.handleZodError(res, error);
      }

      const errorMessage = (error as Error).message;
      if (errorMessage.includes('not found')) {
        return this.notFound(res, errorMessage);
      }

      this.captureException(error as Error, { method: 'reorderCategories', body: req.body });
      return this.error(res, 'Failed to reorder categories');
    }
  });

  /**
   * POST /api/forum/categories/:id/moderators
   * Assign moderator to category (admin only)
   */
  public assignModerator = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = UuidParamSchema.parse(req.params);
      const { userId: moderatorId } = AssignModeratorSchema.parse(req.body);
      const userId = (req as any).user?.id;

      if (!userId) {
        return this.unauthorized(res, 'User not authenticated');
      }

      await this.categoryService.assignModerator(id, moderatorId, userId);

      return this.created(res, { message: 'Moderator assigned successfully' });
    } catch (error) {
      if (error instanceof ZodError) {
        return this.handleZodError(res, error);
      }

      const errorMessage = (error as Error).message;
      if (errorMessage.includes('not found')) {
        return this.notFound(res, errorMessage);
      }
      if (errorMessage.includes('already a moderator')) {
        return this.badRequest(res, errorMessage);
      }

      this.captureException(error as Error, {
        method: 'assignModerator',
        categoryId: req.params.id,
        body: req.body,
      });
      return this.error(res, 'Failed to assign moderator');
    }
  });

  /**
   * DELETE /api/forum/categories/:id/moderators/:userId
   * Remove moderator from category (admin only)
   */
  public removeModerator = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = UuidParamSchema.parse(req.params);
      const moderatorId = req.params.userId;
      const userId = (req as any).user?.id;

      if (!userId) {
        return this.unauthorized(res, 'User not authenticated');
      }

      if (!moderatorId) {
        return this.badRequest(res, 'Moderator user ID is required');
      }

      await this.categoryService.removeModerator(id, moderatorId, userId);

      return this.noContent(res);
    } catch (error) {
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('not found')) {
        return this.notFound(res, errorMessage);
      }
      if (errorMessage.includes('not a moderator')) {
        return this.badRequest(res, errorMessage);
      }

      this.captureException(error as Error, {
        method: 'removeModerator',
        categoryId: req.params.id,
        moderatorId: req.params.userId,
      });
      return this.error(res, 'Failed to remove moderator');
    }
  });

  /**
   * GET /api/forum/categories/:id/moderators
   * Get moderators for a category
   */
  public getCategoryModerators = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = UuidParamSchema.parse(req.params);
      const moderators = await this.categoryService.getCategoryModerators(id);

      return this.success(res, { moderators, count: moderators.length });
    } catch (error) {
      if (error instanceof ZodError) {
        return this.handleZodError(res, error);
      }
      this.captureException(error as Error, {
        method: 'getCategoryModerators',
        categoryId: req.params.id,
      });
      return this.error(res, 'Failed to fetch category moderators');
    }
  });
}
