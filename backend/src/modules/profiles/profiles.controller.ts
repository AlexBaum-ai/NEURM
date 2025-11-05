import { Request, Response } from 'express';
import { ZodError } from 'zod';
import ProfilesService from './profiles.service';
import {
  updateCandidateProfileSchema,
  usernameParamSchema,
  UpdateCandidateProfileInput,
} from './profiles.validation';
import { BadRequestError, ValidationError } from '@/utils/errors';
import logger from '@/utils/logger';

/**
 * ProfilesController
 * Handles HTTP requests for candidate profile endpoints
 */
export class ProfilesController {
  private profilesService: ProfilesService;

  constructor(profilesService?: ProfilesService) {
    this.profilesService = profilesService || new ProfilesService();
  }

  /**
   * PUT /api/v1/profiles/candidate
   * Update candidate profile (job preferences + basic fields)
   */
  updateCandidateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Validate request body
      const validationResult = updateCandidateProfileSchema.safeParse(req.body);

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

      const data: UpdateCandidateProfileInput = validationResult.data;

      logger.info(`User ${userId} updating candidate profile`, {
        userId,
        fields: Object.keys(data),
      });

      const updatedProfile = await this.profilesService.updateCandidateProfile(userId, data);

      res.status(200).json({
        success: true,
        data: updatedProfile,
        message: 'Candidate profile updated successfully',
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * GET /api/v1/profiles/:username
   * Get public candidate profile by username
   */
  getCandidateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate username parameter
      const validationResult = usernameParamSchema.safeParse(req.params);

      if (!validationResult.success) {
        const error = validationResult.error as ZodError;
        throw new ValidationError(error.issues[0].message);
      }

      const { username } = validationResult.data;
      const requestingUserId = req.user?.id;

      logger.info(`Fetching candidate profile for username: ${username}`, {
        requestingUserId,
      });

      const profile = await this.profilesService.getCandidateProfile(
        username,
        requestingUserId
      );

      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * GET /api/v1/profiles/:username/portfolio
   * Get portfolio projects for a user
   */
  getPortfolio = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate username parameter
      const validationResult = usernameParamSchema.safeParse(req.params);

      if (!validationResult.success) {
        const error = validationResult.error as ZodError;
        throw new ValidationError(error.issues[0].message);
      }

      const { username } = validationResult.data;
      const requestingUserId = req.user?.id;

      logger.info(`Fetching portfolio for username: ${username}`, {
        requestingUserId,
      });

      const portfolio = await this.profilesService.getPortfolio(username, requestingUserId);

      res.status(200).json({
        success: true,
        data: portfolio,
      });
    } catch (error) {
      throw error;
    }
  };
}

export default ProfilesController;
