import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';
import { ZodError } from 'zod';
import AdminUsersService from './adminUsers.service';
import {
  getUsersQuerySchema,
  userIdParamSchema,
  updateUserSchema,
  changeUserRoleSchema,
  verifyUserEmailSchema,
  suspendUserSchema,
  banUserSchema,
  deleteUserSchema,
  getUserActivityQuerySchema,
  getUserReportsQuerySchema,
  bulkOperationSchema,
  GetUsersQuery,
  UpdateUserInput,
  ChangeUserRoleInput,
  VerifyUserEmailInput,
  SuspendUserInput,
  BanUserInput,
  DeleteUserInput,
  GetUserActivityQuery,
  GetUserReportsQuery,
  BulkOperationInput,
} from './adminUsers.validation';
import { BadRequestError, ValidationError } from '@/utils/errors';
import logger from '@/utils/logger';

/**
 * AdminUsersController
 * Handles HTTP requests for admin user management endpoints
 */
export class AdminUsersController {
  private service: AdminUsersService;

  constructor(service?: AdminUsersService) {
    this.service = service || new AdminUsersService();
  }

  /**
   * GET /api/admin/users
   * Get paginated list of users with filters and search
   */
  getUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate query parameters
      const validationResult = getUsersQuerySchema.safeParse(req.query);

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

      const query: GetUsersQuery = validationResult.data;

      const result = await this.service.getUsers(query);

      res.status(200).json({
        success: true,
        data: result.users,
        pagination: result.pagination,
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * GET /api/admin/users/:id
   * Get full user profile (including private data)
   */
  getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate user ID parameter
      const validationResult = userIdParamSchema.safeParse(req.params);

      if (!validationResult.success) {
        const error = validationResult.error as ZodError;
        throw new ValidationError(error.issues[0].message);
      }

      const { id } = validationResult.data;

      const user = await this.service.getUserById(id);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * PUT /api/admin/users/:id
   * Update user data
   */
  updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const adminId = req.user?.id;
      if (!adminId) {
        throw new BadRequestError('Admin ID not found in request');
      }

      // Validate user ID parameter
      const paramValidation = userIdParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        const error = paramValidation.error as ZodError;
        throw new ValidationError(error.issues[0].message);
      }

      const { id } = paramValidation.data;

      // Validate request body
      const bodyValidation = updateUserSchema.safeParse(req.body);
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

      const data: UpdateUserInput = bodyValidation.data;

      const updatedUser = await this.service.updateUser(
        id,
        data,
        adminId,
        req.ip,
        req.get('user-agent')
      );

      res.status(200).json({
        success: true,
        data: updatedUser,
        message: 'User updated successfully',
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * PUT /api/admin/users/:id/role
   * Change user role
   */
  changeUserRole = async (req: Request, res: Response): Promise<void> => {
    try {
      const adminId = req.user?.id;
      if (!adminId) {
        throw new BadRequestError('Admin ID not found in request');
      }

      // Validate user ID parameter
      const paramValidation = userIdParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        const error = paramValidation.error as ZodError;
        throw new ValidationError(error.issues[0].message);
      }

      const { id } = paramValidation.data;

      // Validate request body
      const bodyValidation = changeUserRoleSchema.safeParse(req.body);
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

      const input: ChangeUserRoleInput = bodyValidation.data;

      const updatedUser = await this.service.changeUserRole(
        id,
        input,
        adminId,
        req.ip,
        req.get('user-agent')
      );

      res.status(200).json({
        success: true,
        data: updatedUser,
        message: 'User role changed successfully',
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * POST /api/admin/users/:id/verify
   * Manually verify user email
   */
  verifyUserEmail = async (req: Request, res: Response): Promise<void> => {
    try {
      const adminId = req.user?.id;
      if (!adminId) {
        throw new BadRequestError('Admin ID not found in request');
      }

      // Validate user ID parameter
      const paramValidation = userIdParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        const error = paramValidation.error as ZodError;
        throw new ValidationError(error.issues[0].message);
      }

      const { id } = paramValidation.data;

      // Validate request body
      const bodyValidation = verifyUserEmailSchema.safeParse(req.body);
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

      const input: VerifyUserEmailInput = bodyValidation.data;

      const updatedUser = await this.service.verifyUserEmail(
        id,
        input,
        adminId,
        req.ip,
        req.get('user-agent')
      );

      res.status(200).json({
        success: true,
        data: updatedUser,
        message: 'User email verified successfully',
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * POST /api/admin/users/:id/suspend
   * Suspend user with reason and duration
   */
  suspendUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const adminId = req.user?.id;
      if (!adminId) {
        throw new BadRequestError('Admin ID not found in request');
      }

      // Validate user ID parameter
      const paramValidation = userIdParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        const error = paramValidation.error as ZodError;
        throw new ValidationError(error.issues[0].message);
      }

      const { id } = paramValidation.data;

      // Validate request body
      const bodyValidation = suspendUserSchema.safeParse(req.body);
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

      const input: SuspendUserInput = bodyValidation.data;

      const updatedUser = await this.service.suspendUser(
        id,
        input,
        adminId,
        req.ip,
        req.get('user-agent')
      );

      res.status(200).json({
        success: true,
        data: updatedUser,
        message: 'User suspended successfully',
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * POST /api/admin/users/:id/ban
   * Ban user permanently
   */
  banUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const adminId = req.user?.id;
      if (!adminId) {
        throw new BadRequestError('Admin ID not found in request');
      }

      // Validate user ID parameter
      const paramValidation = userIdParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        const error = paramValidation.error as ZodError;
        throw new ValidationError(error.issues[0].message);
      }

      const { id } = paramValidation.data;

      // Validate request body
      const bodyValidation = banUserSchema.safeParse(req.body);
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

      const input: BanUserInput = bodyValidation.data;

      const updatedUser = await this.service.banUser(
        id,
        input,
        adminId,
        req.ip,
        req.get('user-agent')
      );

      res.status(200).json({
        success: true,
        data: updatedUser,
        message: 'User banned successfully',
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * DELETE /api/admin/users/:id
   * Delete user account (soft delete by default)
   */
  deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const adminId = req.user?.id;
      if (!adminId) {
        throw new BadRequestError('Admin ID not found in request');
      }

      // Validate user ID parameter
      const paramValidation = userIdParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        const error = paramValidation.error as ZodError;
        throw new ValidationError(error.issues[0].message);
      }

      const { id } = paramValidation.data;

      // Validate request body
      const bodyValidation = deleteUserSchema.safeParse(req.body);
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

      const input: DeleteUserInput = bodyValidation.data;

      await this.service.deleteUser(
        id,
        input,
        adminId,
        req.ip,
        req.get('user-agent')
      );

      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * GET /api/admin/users/:id/activity
   * Get user activity history
   */
  getUserActivity = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate user ID parameter
      const paramValidation = userIdParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        const error = paramValidation.error as ZodError;
        throw new ValidationError(error.issues[0].message);
      }

      const { id } = paramValidation.data;

      // Validate query parameters
      const queryValidation = getUserActivityQuerySchema.safeParse(req.query);
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

      const query: GetUserActivityQuery = queryValidation.data;

      const result = await this.service.getUserActivity(id, query);

      res.status(200).json({
        success: true,
        data: result.activities,
        pagination: result.pagination,
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * GET /api/admin/users/:id/reports
   * Get reports against user
   */
  getUserReports = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate user ID parameter
      const paramValidation = userIdParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        const error = paramValidation.error as ZodError;
        throw new ValidationError(error.issues[0].message);
      }

      const { id } = paramValidation.data;

      // Validate query parameters
      const queryValidation = getUserReportsQuerySchema.safeParse(req.query);
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

      const query: GetUserReportsQuery = queryValidation.data;

      const result = await this.service.getUserReports(id, query);

      res.status(200).json({
        success: true,
        data: result.reports,
        pagination: result.pagination,
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * POST /api/admin/users/bulk
   * Perform bulk operations on users
   */
  bulkOperation = async (req: Request, res: Response): Promise<void> => {
    try {
      const adminId = req.user?.id;
      if (!adminId) {
        throw new BadRequestError('Admin ID not found in request');
      }

      // Validate request body
      const bodyValidation = bulkOperationSchema.safeParse(req.body);
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

      const input: BulkOperationInput = bodyValidation.data;

      const result = await this.service.bulkOperation(
        input,
        adminId,
        req.ip,
        req.get('user-agent')
      );

      res.status(200).json({
        success: true,
        data: result,
        message: 'Bulk operation completed successfully',
      });
    } catch (error) {
      throw error;
    }
  };
}

export default AdminUsersController;
