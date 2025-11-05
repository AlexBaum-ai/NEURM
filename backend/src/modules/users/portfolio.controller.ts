import { Request, Response } from 'express';
import { ZodError } from 'zod';
import PortfolioProjectService from './portfolio.service';
import {
  createPortfolioProjectSchema,
  updatePortfolioProjectSchema,
  portfolioProjectIdParamSchema,
  CreatePortfolioProjectInput,
  UpdatePortfolioProjectInput,
} from './portfolio.validation';
import { BadRequestError, ValidationError } from '@/utils/errors';
import logger from '@/utils/logger';

/**
 * PortfolioProjectController
 * Handles HTTP requests for portfolio project endpoints
 */
export class PortfolioProjectController {
  private service: PortfolioProjectService;

  constructor(service?: PortfolioProjectService) {
    this.service = service || new PortfolioProjectService();
  }

  /**
   * POST /api/v1/users/me/portfolio
   * Create a new portfolio project
   */
  createPortfolioProject = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Validate request body
      const validationResult = createPortfolioProjectSchema.safeParse(req.body);

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

      const data: CreatePortfolioProjectInput = validationResult.data;

      logger.info(`Creating portfolio project for user ${userId}`);

      const project = await this.service.createPortfolioProject(userId, data);

      res.status(201).json({
        success: true,
        data: project,
        message: 'Portfolio project created successfully',
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * GET /api/v1/users/me/portfolio
   * Get all portfolio projects for current user
   */
  getPortfolioProjects = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      const projects = await this.service.getPortfolioProjects(userId);

      res.status(200).json({
        success: true,
        data: projects,
        count: projects.length,
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * GET /api/v1/users/me/portfolio/:id
   * Get a specific portfolio project
   */
  getPortfolioProject = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Validate ID parameter
      const paramValidation = portfolioProjectIdParamSchema.safeParse(req.params);

      if (!paramValidation.success) {
        const error = paramValidation.error as ZodError;
        throw new ValidationError(error.issues[0].message);
      }

      const { id } = paramValidation.data;

      const project = await this.service.getPortfolioProjectById(id, userId);

      res.status(200).json({
        success: true,
        data: project,
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * PUT /api/v1/users/me/portfolio/:id
   * Update a specific portfolio project
   */
  updatePortfolioProject = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Validate ID parameter
      const paramValidation = portfolioProjectIdParamSchema.safeParse(req.params);

      if (!paramValidation.success) {
        const error = paramValidation.error as ZodError;
        throw new ValidationError(error.issues[0].message);
      }

      const { id } = paramValidation.data;

      // Validate request body
      const bodyValidation = updatePortfolioProjectSchema.safeParse(req.body);

      if (!bodyValidation.success) {
        const error = bodyValidation.error as ZodError;
        const errors = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        throw new ValidationError(
          `Validation failed: ${errors.map((e) => e.message).join(', ')}`
        );
      }

      const data: UpdatePortfolioProjectInput = bodyValidation.data;

      logger.info(`Updating portfolio project ${id} for user ${userId}`);

      const updated = await this.service.updatePortfolioProject(id, userId, data);

      res.status(200).json({
        success: true,
        data: updated,
        message: 'Portfolio project updated successfully',
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * DELETE /api/v1/users/me/portfolio/:id
   * Delete a specific portfolio project
   */
  deletePortfolioProject = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Validate ID parameter
      const paramValidation = portfolioProjectIdParamSchema.safeParse(req.params);

      if (!paramValidation.success) {
        const error = paramValidation.error as ZodError;
        throw new ValidationError(error.issues[0].message);
      }

      const { id } = paramValidation.data;

      logger.info(`Deleting portfolio project ${id} for user ${userId}`);

      await this.service.deletePortfolioProject(id, userId);

      res.status(200).json({
        success: true,
        message: 'Portfolio project deleted successfully',
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * GET /api/v1/users/me/portfolio/stats
   * Get portfolio statistics
   */
  getPortfolioStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      const stats = await this.service.getPortfolioStats(userId);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      throw error;
    }
  };
}

export default PortfolioProjectController;
