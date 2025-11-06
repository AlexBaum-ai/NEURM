import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';
import { ZodError } from 'zod';
import { UseCaseService } from './useCase.service';
import {
  createUseCaseSchema,
  updateUseCaseSchema,
  reviewUseCaseSchema,
  useCaseFiltersSchema,
  CreateUseCaseInput,
  UpdateUseCaseInput,
  ReviewUseCaseInput,
  UseCaseFilters,
} from './useCase.validation';
import { BadRequestError, ValidationError } from '@/utils/errors';
import logger from '@/utils/logger';
import { BaseController } from '@/utils/baseController';

/**
 * UseCaseController
 * Handles HTTP requests for use case endpoints
 */
export class UseCaseController extends BaseController {
  private service: UseCaseService;

  constructor(service?: UseCaseService) {
    super();
    this.service = service || new UseCaseService();
  }

  /**
   * POST /api/v1/use-cases/submit
   * Submit a new use case (authenticated users)
   */
  submitUseCase = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;

    if (!userId) {
      throw new BadRequestError('User ID not found in request');
    }

    // Validate request body
    const validationResult = createUseCaseSchema.safeParse(req.body);

    if (!validationResult.success) {
      const error = validationResult.error as ZodError;
      const errors = error.issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      throw new ValidationError(
        `Validation failed: ${errors.map((e) => e.message).join(', ')}`
      );
    }

    const data: CreateUseCaseInput = validationResult.data;

    logger.info(`User ${userId} submitting use case: ${data.title}`);

    const useCase = await this.service.submitUseCase(data, userId);

    res.status(201).json({
      success: true,
      data: useCase,
      message: 'Use case submitted successfully and is pending review',
    });
  });

  /**
   * GET /api/v1/use-cases
   * List published use cases with filters and pagination
   */
  listUseCases = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // Validate query parameters
    const validationResult = useCaseFiltersSchema.safeParse(req.query);

    if (!validationResult.success) {
      const error = validationResult.error as ZodError;
      throw new ValidationError(error.issues[0].message);
    }

    const filters: UseCaseFilters = validationResult.data;

    const result = await this.service.listUseCases(filters);

    res.status(200).json({
      success: true,
      data: result.useCases,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  });

  /**
   * GET /api/v1/use-cases/featured
   * Get featured use cases
   */
  getFeaturedUseCases = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 5;

    if (isNaN(limit) || limit < 1 || limit > 20) {
      throw new BadRequestError('Limit must be a number between 1 and 20');
    }

    const useCases = await this.service.getFeaturedUseCases(limit);

    res.status(200).json({
      success: true,
      data: useCases,
    });
  });

  /**
   * GET /api/v1/use-cases/:slug
   * Get use case by slug (public)
   */
  getUseCaseBySlug = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { slug } = req.params;

    if (!slug) {
      throw new BadRequestError('Slug parameter is required');
    }

    const result = await this.service.getUseCaseBySlug(slug);

    res.status(200).json({
      success: true,
      data: result.useCase,
      related: result.relatedUseCases,
    });
  });

  /**
   * GET /api/v1/use-cases/id/:id
   * Get use case by ID (with permissions check)
   */
  getUseCaseById = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!id) {
      throw new BadRequestError('ID parameter is required');
    }

    const useCase = await this.service.getUseCaseById(id, userId, userRole);

    res.status(200).json({
      success: true,
      data: useCase,
    });
  });

  /**
   * PUT /api/v1/use-cases/:id
   * Update use case (author or admin)
   */
  updateUseCase = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      throw new BadRequestError('User information not found in request');
    }

    if (!id) {
      throw new BadRequestError('ID parameter is required');
    }

    // Validate request body
    const validationResult = updateUseCaseSchema.safeParse(req.body);

    if (!validationResult.success) {
      const error = validationResult.error as ZodError;
      const errors = error.issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      throw new ValidationError(
        `Validation failed: ${errors.map((e) => e.message).join(', ')}`
      );
    }

    const data: UpdateUseCaseInput = validationResult.data;

    logger.info(`User ${userId} updating use case: ${id}`);

    const useCase = await this.service.updateUseCase(id, data, userId, userRole);

    res.status(200).json({
      success: true,
      data: useCase,
      message: 'Use case updated successfully',
    });
  });

  /**
   * PUT /api/v1/admin/use-cases/:id/review
   * Review use case (admin only)
   */
  reviewUseCase = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new BadRequestError('User ID not found in request');
    }

    if (!id) {
      throw new BadRequestError('ID parameter is required');
    }

    // Validate request body
    const validationResult = reviewUseCaseSchema.safeParse(req.body);

    if (!validationResult.success) {
      const error = validationResult.error as ZodError;
      const errors = error.issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      throw new ValidationError(
        `Validation failed: ${errors.map((e) => e.message).join(', ')}`
      );
    }

    const data: ReviewUseCaseInput = validationResult.data;

    logger.info(`Admin ${userId} reviewing use case: ${id} - Status: ${data.status}`);

    const useCase = await this.service.reviewUseCase(id, data, userId);

    res.status(200).json({
      success: true,
      data: useCase,
      message: `Use case ${data.status} successfully`,
    });
  });

  /**
   * DELETE /api/v1/use-cases/:id
   * Delete use case (author or admin)
   */
  deleteUseCase = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      throw new BadRequestError('User information not found in request');
    }

    if (!id) {
      throw new BadRequestError('ID parameter is required');
    }

    logger.info(`User ${userId} deleting use case: ${id}`);

    await this.service.deleteUseCase(id, userId, userRole);

    res.status(200).json({
      success: true,
      message: 'Use case deleted successfully',
    });
  });

  /**
   * GET /api/v1/admin/use-cases
   * List all use cases for admin review (with all statuses)
   */
  listAllUseCases = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // Validate query parameters
    const validationResult = useCaseFiltersSchema.safeParse(req.query);

    if (!validationResult.success) {
      const error = validationResult.error as ZodError;
      throw new ValidationError(error.issues[0].message);
    }

    const filters: UseCaseFilters = validationResult.data;

    // Admin can see all statuses
    const result = await this.service.listUseCases(filters);

    res.status(200).json({
      success: true,
      data: result.useCases,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  });

  /**
   * GET /api/v1/use-cases/my-submissions
   * List current user's submitted use cases
   */
  listMyUseCases = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;

    if (!userId) {
      throw new BadRequestError('User ID not found in request');
    }

    // Validate query parameters
    const validationResult = useCaseFiltersSchema.safeParse(req.query);

    if (!validationResult.success) {
      const error = validationResult.error as ZodError;
      throw new ValidationError(error.issues[0].message);
    }

    const filters: UseCaseFilters = {
      ...validationResult.data,
      authorId: userId, // Filter by current user
    };

    const result = await this.service.listUseCases(filters);

    res.status(200).json({
      success: true,
      data: result.useCases,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  });
}

export default new UseCaseController();
