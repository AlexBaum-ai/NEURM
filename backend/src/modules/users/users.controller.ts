import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';
import { ZodError } from 'zod';
import UserService from './users.service';
import {
  updateProfileSchema,
  usernameParamSchema,
  updatePrivacySettingsSchema,
  changeEmailSchema,
  changePasswordSchema,
  deleteAccountSchema,
  UpdateProfileInput,
  UpdatePrivacySettingsInput,
  ChangeEmailInput,
  ChangePasswordInput,
  DeleteAccountInput,
} from './users.validation';
import { BadRequestError, ValidationError } from '@/utils/errors';
import logger from '@/utils/logger';
import UploadService from '@/services/upload.service';

/**
 * UserController
 * Handles HTTP requests for user profile endpoints
 */
export class UserController {
  private userService: UserService;
  private uploadService: UploadService;

  constructor(userService?: UserService, uploadService?: UploadService) {
    this.userService = userService || new UserService();
    this.uploadService = uploadService || new UploadService();
  }

  /**
   * GET /api/v1/users/me
   * Get current authenticated user's profile
   */
  getCurrentUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      const profile = await this.userService.getCurrentUserProfile(userId);

      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * GET /api/v1/users/:username
   * Get public user profile by username
   */
  getUserByUsername = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate username parameter
      const validationResult = usernameParamSchema.safeParse(req.params);

      if (!validationResult.success) {
        const error = validationResult.error as ZodError;
        throw new ValidationError(
          error.issues[0].message
        );
      }

      const { username } = validationResult.data;
      const requestingUserId = req.user?.id;

      const profile = await this.userService.getPublicProfile(
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
   * PATCH /api/v1/users/me
   * Update current user's profile
   */
  updateCurrentUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Validate request body
      const validationResult = updateProfileSchema.safeParse(req.body);

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

      const data: UpdateProfileInput = validationResult.data;

      logger.info(`User ${userId} updating profile`, {
        userId,
        fields: Object.keys(data),
      });

      const updatedProfile = await this.userService.updateProfile(userId, data);

      res.status(200).json({
        success: true,
        data: updatedProfile,
        message: 'Profile updated successfully',
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * GET /api/v1/users/me/privacy
   * Get current user's privacy settings
   */
  getPrivacySettings = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      const settings = await this.userService.getPrivacySettings(userId);

      res.status(200).json({
        success: true,
        data: settings,
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * PATCH /api/v1/users/me/privacy
   * Update current user's privacy settings
   */
  updatePrivacySettings = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Validate request body
      const validationResult = updatePrivacySettingsSchema.safeParse(req.body);

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

      const data: UpdatePrivacySettingsInput = validationResult.data;

      logger.info(`User ${userId} updating privacy settings`, {
        userId,
        sections: Object.keys(data),
      });

      const updatedSettings = await this.userService.updatePrivacySettings(userId, data);

      res.status(200).json({
        success: true,
        data: updatedSettings,
        message: 'Privacy settings updated successfully',
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * POST /api/v1/users/me/avatar
   * Upload avatar image
   */
  uploadAvatar = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Check if file was uploaded
      if (!req.file) {
        throw new BadRequestError('No file uploaded');
      }

      logger.info(`User ${userId} uploading avatar`, {
        userId,
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      });

      // Upload avatar with multiple sizes
      const result = await this.uploadService.uploadAvatar(userId, req.file.buffer);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Avatar uploaded successfully',
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'UserController', method: 'uploadAvatar' },
        extra: {
          userId: req.user?.id,
          fileSize: req.file?.size,
          mimetype: req.file?.mimetype,
        },
      });
      throw error;
    }
  };

  /**
   * POST /api/v1/users/me/cover
   * Upload cover image
   */
  uploadCover = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Check if file was uploaded
      if (!req.file) {
        throw new BadRequestError('No file uploaded');
      }

      logger.info(`User ${userId} uploading cover image`, {
        userId,
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      });

      // Upload cover with multiple sizes
      const result = await this.uploadService.uploadCover(userId, req.file.buffer);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Cover image uploaded successfully',
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'UserController', method: 'uploadCover' },
        extra: {
          userId: req.user?.id,
          fileSize: req.file?.size,
          mimetype: req.file?.mimetype,
        },
      });
      throw error;
    }
  };

  /**
   * PATCH /api/v1/users/me/email
   * Request email change (sends verification email)
   */
  requestEmailChange = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Validate request body
      const validationResult = changeEmailSchema.safeParse(req.body);

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

      const data: ChangeEmailInput = validationResult.data;

      const result = await this.userService.requestEmailChange(userId, data);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * PATCH /api/v1/users/me/password
   * Change user password
   */
  changePassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Validate request body
      const validationResult = changePasswordSchema.safeParse(req.body);

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

      const data: ChangePasswordInput = validationResult.data;

      const result = await this.userService.changePassword(userId, data);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * DELETE /api/v1/users/me
   * Delete user account (soft delete with 30-day grace period)
   */
  deleteAccount = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Validate request body
      const validationResult = deleteAccountSchema.safeParse(req.body);

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

      const data: DeleteAccountInput = validationResult.data;

      const result = await this.userService.deleteAccount(userId, data);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * GET /api/v1/users/me/data-export
   * Export all user data for GDPR compliance
   */
  exportUserData = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      const exportData = await this.userService.exportUserData(userId);

      res.status(200).json({
        success: true,
        data: exportData,
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * GET /api/v1/users/me/saved-jobs
   * Get user's saved jobs with pagination
   */
  getSavedJobs = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError('User ID not found in request');
      }

      // Import SavedJobsService dynamically to avoid circular dependency
      const { default: SavedJobsService } = await import(
        '@/modules/jobs/services/savedJobsService'
      );
      const savedJobsService = new SavedJobsService();

      // Parse query parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const sortBy = (req.query.sortBy as string) || 'savedAt';
      const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';

      const query = { page, limit, sortBy, sortOrder };

      logger.info(`User ${userId} fetching saved jobs`);

      const result = await savedJobsService.getSavedJobs(userId, query);

      res.status(200).json({
        success: true,
        data: result.savedJobs,
        pagination: result.pagination,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { controller: 'UserController', method: 'getSavedJobs' },
        extra: {
          userId: req.user?.id,
          query: req.query,
        },
      });
      throw error;
    }
  };
}

export default UserController;
