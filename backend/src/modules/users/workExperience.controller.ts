import { Request, Response } from 'express';
import { ZodError } from 'zod';
import WorkExperienceService from './workExperience.service';
import {
  createWorkExperienceSchema,
  updateWorkExperienceSchema,
  workExperienceIdParamSchema,
  CreateWorkExperienceInput,
  UpdateWorkExperienceInput,
} from './workExperience.validation';
import { BadRequestError, ValidationError } from '@/utils/errors';
import logger from '@/utils/logger';

/**
 * WorkExperienceController
 * Handles HTTP requests for work experience endpoints
 */
export class WorkExperienceController {
  private service: WorkExperienceService;

  constructor(service?: WorkExperienceService) {
    this.service = service || new WorkExperienceService();
  }

  /**
   * POST /api/v1/users/me/work-experience
   * Create a new work experience entry
   */
  createWorkExperience = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Validate request body
      const validationResult = createWorkExperienceSchema.safeParse(req.body);

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

      const data: CreateWorkExperienceInput = validationResult.data;

      logger.info(`Creating work experience for user ${userId}`);

      const workExperience = await this.service.createWorkExperience(userId, data);

      res.status(201).json({
        success: true,
        data: workExperience,
        message: 'Work experience created successfully',
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * GET /api/v1/users/me/work-experience
   * Get all work experience entries for current user
   */
  getWorkExperiences = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      const experiences = await this.service.getWorkExperiences(userId);

      res.status(200).json({
        success: true,
        data: experiences,
        count: experiences.length,
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * PUT /api/v1/users/me/work-experience/:id
   * Update a specific work experience entry
   */
  updateWorkExperience = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Validate ID parameter
      const paramValidation = workExperienceIdParamSchema.safeParse(req.params);

      if (!paramValidation.success) {
        const error = paramValidation.error as ZodError;
        throw new ValidationError(error.issues[0].message);
      }

      const { id } = paramValidation.data;

      // Validate request body
      const bodyValidation = updateWorkExperienceSchema.safeParse(req.body);

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

      const data: UpdateWorkExperienceInput = bodyValidation.data;

      logger.info(`Updating work experience ${id} for user ${userId}`);

      const updated = await this.service.updateWorkExperience(id, userId, data);

      res.status(200).json({
        success: true,
        data: updated,
        message: 'Work experience updated successfully',
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * DELETE /api/v1/users/me/work-experience/:id
   * Delete a specific work experience entry
   */
  deleteWorkExperience = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Validate ID parameter
      const paramValidation = workExperienceIdParamSchema.safeParse(req.params);

      if (!paramValidation.success) {
        const error = paramValidation.error as ZodError;
        throw new ValidationError(error.issues[0].message);
      }

      const { id } = paramValidation.data;

      logger.info(`Deleting work experience ${id} for user ${userId}`);

      await this.service.deleteWorkExperience(id, userId);

      res.status(200).json({
        success: true,
        message: 'Work experience deleted successfully',
      });
    } catch (error) {
      throw error;
    }
  };
}

export default WorkExperienceController;
