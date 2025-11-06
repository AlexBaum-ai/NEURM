import { Request, Response } from 'express';
import { ZodError } from 'zod';
import EndorsementsService from './endorsements.service';
import {
  endorsementParamsSchema,
  listEndorsementsQuerySchema,
  EndorsementParams,
  ListEndorsementsQuery,
} from './endorsements.validation';
import { BadRequestError, ValidationError } from '@/utils/errors';
import logger from '@/utils/logger';
import * as Sentry from '@sentry/node';

/**
 * EndorsementsController
 * Handles HTTP requests for skill endorsements endpoints
 */
export class EndorsementsController {
  private endorsementsService: EndorsementsService;

  constructor(endorsementsService?: EndorsementsService) {
    this.endorsementsService = endorsementsService || new EndorsementsService();
  }

  /**
   * POST /api/v1/profiles/:username/skills/:skillId/endorse
   * Create an endorsement for a user's skill
   */
  createEndorsement = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Validate params
      const validationResult = endorsementParamsSchema.safeParse(req.params);

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

      const { username, skillId } = validationResult.data as EndorsementParams;

      await this.endorsementsService.createEndorsement(userId, username, skillId);

      logger.info(`User ${userId} endorsed skill ${skillId} of user ${username}`);

      res.status(201).json({
        success: true,
        message: 'Skill endorsed successfully',
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'EndorsementsController', method: 'createEndorsement' },
        extra: { params: req.params, userId: req.user?.id },
      });
      throw error;
    }
  };

  /**
   * DELETE /api/v1/profiles/:username/skills/:skillId/endorse
   * Remove an endorsement from a user's skill
   */
  removeEndorsement = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Validate params
      const validationResult = endorsementParamsSchema.safeParse(req.params);

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

      const { username, skillId } = validationResult.data as EndorsementParams;

      await this.endorsementsService.removeEndorsement(userId, username, skillId);

      logger.info(`User ${userId} removed endorsement from skill ${skillId} of user ${username}`);

      res.status(200).json({
        success: true,
        message: 'Endorsement removed successfully',
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'EndorsementsController', method: 'removeEndorsement' },
        extra: { params: req.params, userId: req.user?.id },
      });
      throw error;
    }
  };

  /**
   * GET /api/v1/profiles/:username/skills/:skillId/endorsements
   * Get all endorsements for a skill
   */
  getEndorsements = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate params
      const paramsValidation = endorsementParamsSchema.safeParse(req.params);

      if (!paramsValidation.success) {
        const error = paramsValidation.error as ZodError;
        const errors = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        throw new ValidationError(
          `Validation failed: ${errors.map((e) => e.message).join(', ')}`
        );
      }

      // Validate query params
      const queryValidation = listEndorsementsQuerySchema.safeParse(req.query);

      if (!queryValidation.success) {
        const error = queryValidation.error as ZodError;
        const errors = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        throw new ValidationError(
          `Validation failed: ${errors.map((e) => e.message).join(', ')}`
        );
      }

      const { username, skillId } = paramsValidation.data as EndorsementParams;
      const { limit, offset } = queryValidation.data as ListEndorsementsQuery;

      const result = await this.endorsementsService.getEndorsements(
        username,
        skillId,
        { limit, offset }
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'EndorsementsController', method: 'getEndorsements' },
        extra: { params: req.params, query: req.query },
      });
      throw error;
    }
  };
}

export default EndorsementsController;
