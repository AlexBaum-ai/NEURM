import { Request, Response } from 'express';
import { ZodError } from 'zod';
import EducationService from './education.service';
import {
  createEducationSchema,
  updateEducationSchema,
  educationIdParamSchema,
  CreateEducationInput,
  UpdateEducationInput,
} from './education.validation';
import { BadRequestError, ValidationError } from '@/utils/errors';
import logger from '@/utils/logger';

/**
 * EducationController
 * Handles HTTP requests for education endpoints
 */
export class EducationController {
  private educationService: EducationService;

  constructor(educationService?: EducationService) {
    this.educationService = educationService || new EducationService();
  }

  /**
   * GET /api/v1/users/me/education
   * Get all education entries for the current user
   */
  getEducationList = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      const educations = await this.educationService.getEducationList(userId);

      res.status(200).json({
        success: true,
        data: educations,
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * POST /api/v1/users/me/education
   * Create a new education entry
   */
  createEducation = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Validate request body
      const validationResult = createEducationSchema.safeParse(req.body);

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

      const data: CreateEducationInput = validationResult.data;

      logger.info(`User ${userId} creating education entry`, {
        userId,
        institution: data.institution,
      });

      const education = await this.educationService.createEducation(userId, data);

      res.status(201).json({
        success: true,
        data: education,
        message: 'Education entry created successfully',
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * PUT /api/v1/users/me/education/:id
   * Update an education entry
   */
  updateEducation = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Validate education ID parameter
      const paramValidation = educationIdParamSchema.safeParse(req.params);

      if (!paramValidation.success) {
        const error = paramValidation.error as ZodError;
        throw new ValidationError(error.issues[0].message);
      }

      const { id: educationId } = paramValidation.data;

      // Validate request body
      const bodyValidation = updateEducationSchema.safeParse(req.body);

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

      const data: UpdateEducationInput = bodyValidation.data;

      logger.info(`User ${userId} updating education entry ${educationId}`, {
        userId,
        educationId,
        fields: Object.keys(data),
      });

      const education = await this.educationService.updateEducation(
        userId,
        educationId,
        data
      );

      res.status(200).json({
        success: true,
        data: education,
        message: 'Education entry updated successfully',
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * DELETE /api/v1/users/me/education/:id
   * Delete an education entry
   */
  deleteEducation = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Validate education ID parameter
      const paramValidation = educationIdParamSchema.safeParse(req.params);

      if (!paramValidation.success) {
        const error = paramValidation.error as ZodError;
        throw new ValidationError(error.issues[0].message);
      }

      const { id: educationId } = paramValidation.data;

      logger.info(`User ${userId} deleting education entry ${educationId}`, {
        userId,
        educationId,
      });

      await this.educationService.deleteEducation(userId, educationId);

      res.status(200).json({
        success: true,
        message: 'Education entry deleted successfully',
      });
    } catch (error) {
      throw error;
    }
  };
}

export default EducationController;
