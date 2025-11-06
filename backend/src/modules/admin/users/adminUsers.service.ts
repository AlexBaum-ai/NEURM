import * as Sentry from '@sentry/node';
import { UserRole, UserStatus } from '@prisma/client';
import AdminUsersRepository from './adminUsers.repository';
import {
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
import { NotFoundError, BadRequestError, ConflictError } from '@/utils/errors';
import logger from '@/utils/logger';
import prisma from '@/config/database';

/**
 * AdminUsersService
 * Business logic for admin user management operations
 */
export class AdminUsersService {
  private repository: AdminUsersRepository;

  constructor(repository?: AdminUsersRepository) {
    this.repository = repository || new AdminUsersRepository();
  }

  /**
   * Get paginated list of users
   */
  async getUsers(query: GetUsersQuery) {
    try {
      const result = await this.repository.getUsers(query);

      logger.info('Admin retrieved user list', {
        page: query.page,
        limit: query.limit,
        total: result.pagination.total,
      });

      return result;
    } catch (error) {
      logger.error('Error retrieving users:', error);
      Sentry.captureException(error, {
        tags: { service: 'AdminUsersService', method: 'getUsers' },
      });
      throw error;
    }
  }

  /**
   * Get user by ID with full details
   */
  async getUserById(userId: string) {
    try {
      const user = await this.repository.getUserById(userId);

      if (!user) {
        throw new NotFoundError('User not found');
      }

      logger.info('Admin retrieved user details', { userId });

      return user;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error retrieving user:', error);
      Sentry.captureException(error, {
        tags: { service: 'AdminUsersService', method: 'getUserById' },
        extra: { userId },
      });
      throw error;
    }
  }

  /**
   * Update user data
   */
  async updateUser(
    userId: string,
    data: UpdateUserInput,
    adminId: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    try {
      // Check if user exists
      const existingUser = await this.repository.getUserById(userId);
      if (!existingUser) {
        throw new NotFoundError('User not found');
      }

      // Check for email uniqueness if email is being changed
      if (data.email && data.email !== existingUser.email) {
        const emailExists = await prisma.user.findUnique({
          where: { email: data.email },
        });
        if (emailExists) {
          throw new ConflictError('Email already in use');
        }
      }

      // Check for username uniqueness if username is being changed
      if (data.username && data.username !== existingUser.username) {
        const usernameExists = await prisma.user.findUnique({
          where: { username: data.username },
        });
        if (usernameExists) {
          throw new ConflictError('Username already taken');
        }
      }

      // Update user
      const updatedUser = await this.repository.updateUser(userId, data);

      // Create audit log
      await this.repository.createAuditLog({
        adminId,
        action: 'user_updated',
        targetType: 'user',
        targetId: userId,
        changes: {
          before: { email: existingUser.email, username: existingUser.username },
          after: { email: updatedUser.email, username: updatedUser.username },
        },
        ipAddress,
        userAgent,
      });

      logger.info('Admin updated user', { userId, adminId, fields: Object.keys(data) });

      return updatedUser;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ConflictError) {
        throw error;
      }
      logger.error('Error updating user:', error);
      Sentry.captureException(error, {
        tags: { service: 'AdminUsersService', method: 'updateUser' },
        extra: { userId, data },
      });
      throw error;
    }
  }

  /**
   * Change user role
   */
  async changeUserRole(
    userId: string,
    input: ChangeUserRoleInput,
    adminId: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    try {
      // Check if user exists
      const existingUser = await this.repository.getUserById(userId);
      if (!existingUser) {
        throw new NotFoundError('User not found');
      }

      // Prevent changing own role
      if (userId === adminId) {
        throw new BadRequestError('Cannot change your own role');
      }

      // Change role
      const updatedUser = await this.repository.changeUserRole(userId, input.role);

      // Create audit log
      await this.repository.createAuditLog({
        adminId,
        action: 'role_changed',
        targetType: 'user',
        targetId: userId,
        changes: {
          before: { role: existingUser.role },
          after: { role: input.role },
        },
        reason: input.reason,
        ipAddress,
        userAgent,
      });

      logger.info('Admin changed user role', {
        userId,
        adminId,
        oldRole: existingUser.role,
        newRole: input.role,
      });

      return updatedUser;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error;
      }
      logger.error('Error changing user role:', error);
      Sentry.captureException(error, {
        tags: { service: 'AdminUsersService', method: 'changeUserRole' },
        extra: { userId, role: input.role },
      });
      throw error;
    }
  }

  /**
   * Manually verify user email
   */
  async verifyUserEmail(
    userId: string,
    input: VerifyUserEmailInput,
    adminId: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    try {
      // Check if user exists
      const existingUser = await this.repository.getUserById(userId);
      if (!existingUser) {
        throw new NotFoundError('User not found');
      }

      if (existingUser.emailVerified) {
        throw new BadRequestError('Email already verified');
      }

      // Verify email
      const updatedUser = await this.repository.verifyUserEmail(userId);

      // Create audit log
      await this.repository.createAuditLog({
        adminId,
        action: 'email_verified',
        targetType: 'user',
        targetId: userId,
        reason: input.reason,
        ipAddress,
        userAgent,
      });

      logger.info('Admin manually verified user email', { userId, adminId });

      return updatedUser;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error;
      }
      logger.error('Error verifying user email:', error);
      Sentry.captureException(error, {
        tags: { service: 'AdminUsersService', method: 'verifyUserEmail' },
        extra: { userId },
      });
      throw error;
    }
  }

  /**
   * Suspend user
   */
  async suspendUser(
    userId: string,
    input: SuspendUserInput,
    adminId: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    try {
      // Check if user exists
      const existingUser = await this.repository.getUserById(userId);
      if (!existingUser) {
        throw new NotFoundError('User not found');
      }

      // Prevent suspending yourself
      if (userId === adminId) {
        throw new BadRequestError('Cannot suspend yourself');
      }

      // Prevent suspending admins
      if (existingUser.role === UserRole.admin) {
        throw new BadRequestError('Cannot suspend admin users');
      }

      // Suspend user
      const updatedUser = await this.repository.suspendUser(userId);

      // Invalidate all user sessions
      await prisma.session.deleteMany({
        where: { userId },
      });

      // Create audit log
      await this.repository.createAuditLog({
        adminId,
        action: 'user_suspended',
        targetType: 'user',
        targetId: userId,
        changes: {
          status: UserStatus.suspended,
          durationDays: input.durationDays,
          permanent: input.permanent,
        },
        reason: input.reason,
        ipAddress,
        userAgent,
      });

      logger.info('Admin suspended user', {
        userId,
        adminId,
        permanent: input.permanent,
        durationDays: input.durationDays,
      });

      return updatedUser;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error;
      }
      logger.error('Error suspending user:', error);
      Sentry.captureException(error, {
        tags: { service: 'AdminUsersService', method: 'suspendUser' },
        extra: { userId, input },
      });
      throw error;
    }
  }

  /**
   * Ban user permanently
   */
  async banUser(
    userId: string,
    input: BanUserInput,
    adminId: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    try {
      // Check if user exists
      const existingUser = await this.repository.getUserById(userId);
      if (!existingUser) {
        throw new NotFoundError('User not found');
      }

      // Prevent banning yourself
      if (userId === adminId) {
        throw new BadRequestError('Cannot ban yourself');
      }

      // Prevent banning admins
      if (existingUser.role === UserRole.admin) {
        throw new BadRequestError('Cannot ban admin users');
      }

      // Ban user
      const updatedUser = await this.repository.banUser(userId);

      // Invalidate all user sessions
      await prisma.session.deleteMany({
        where: { userId },
      });

      // Create audit log
      await this.repository.createAuditLog({
        adminId,
        action: 'user_banned',
        targetType: 'user',
        targetId: userId,
        changes: {
          status: UserStatus.banned,
          permanent: input.permanent,
        },
        reason: input.reason,
        ipAddress,
        userAgent,
      });

      logger.info('Admin banned user', { userId, adminId, permanent: input.permanent });

      return updatedUser;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error;
      }
      logger.error('Error banning user:', error);
      Sentry.captureException(error, {
        tags: { service: 'AdminUsersService', method: 'banUser' },
        extra: { userId, input },
      });
      throw error;
    }
  }

  /**
   * Delete user account
   */
  async deleteUser(
    userId: string,
    input: DeleteUserInput,
    adminId: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    try {
      // Check if user exists
      const existingUser = await this.repository.getUserById(userId);
      if (!existingUser) {
        throw new NotFoundError('User not found');
      }

      // Prevent deleting yourself
      if (userId === adminId) {
        throw new BadRequestError('Cannot delete your own account');
      }

      // Prevent deleting admins
      if (existingUser.role === UserRole.admin && !input.hardDelete) {
        throw new BadRequestError('Cannot delete admin users without hard delete');
      }

      // Delete user (soft or hard)
      let result;
      if (input.hardDelete) {
        result = await this.repository.hardDeleteUser(userId);
      } else {
        result = await this.repository.softDeleteUser(userId);
      }

      // Create audit log
      await this.repository.createAuditLog({
        adminId,
        action: input.hardDelete ? 'user_hard_deleted' : 'user_soft_deleted',
        targetType: 'user',
        targetId: userId,
        changes: {
          hardDelete: input.hardDelete,
        },
        reason: input.reason,
        ipAddress,
        userAgent,
      });

      logger.info('Admin deleted user', {
        userId,
        adminId,
        hardDelete: input.hardDelete,
      });

      return result;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error;
      }
      logger.error('Error deleting user:', error);
      Sentry.captureException(error, {
        tags: { service: 'AdminUsersService', method: 'deleteUser' },
        extra: { userId, input },
      });
      throw error;
    }
  }

  /**
   * Get user activity history
   */
  async getUserActivity(userId: string, query: GetUserActivityQuery) {
    try {
      // Check if user exists
      const user = await this.repository.getUserById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      const result = await this.repository.getUserActivity(userId, query);

      logger.info('Admin retrieved user activity', { userId, page: query.page });

      return result;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error retrieving user activity:', error);
      Sentry.captureException(error, {
        tags: { service: 'AdminUsersService', method: 'getUserActivity' },
        extra: { userId, query },
      });
      throw error;
    }
  }

  /**
   * Get reports against a user
   */
  async getUserReports(userId: string, query: GetUserReportsQuery) {
    try {
      // Check if user exists
      const user = await this.repository.getUserById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      const result = await this.repository.getUserReports(userId, query);

      logger.info('Admin retrieved user reports', { userId, page: query.page });

      return result;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error retrieving user reports:', error);
      Sentry.captureException(error, {
        tags: { service: 'AdminUsersService', method: 'getUserReports' },
        extra: { userId, query },
      });
      throw error;
    }
  }

  /**
   * Bulk operations on users
   */
  async bulkOperation(
    input: BulkOperationInput,
    adminId: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    try {
      const { userIds, action, status, reason } = input;

      // Get users to validate
      const users = await this.repository.getUsersByIds(userIds);

      if (users.length !== userIds.length) {
        throw new BadRequestError('Some user IDs are invalid');
      }

      // Prevent operations on admins
      const hasAdmin = users.some((user) => user.role === UserRole.admin);
      if (hasAdmin && (action === 'delete' || action === 'change_status')) {
        throw new BadRequestError('Cannot perform bulk operations on admin users');
      }

      let result;

      switch (action) {
        case 'export':
          // Export user data as CSV
          result = {
            users: users.map((user) => ({
              id: user.id,
              email: user.email,
              username: user.username,
              role: user.role,
              status: user.status,
            })),
          };
          break;

        case 'change_status':
          if (!status) {
            throw new BadRequestError('Status is required for change_status action');
          }
          await this.repository.bulkUpdateStatus(userIds, status);
          result = { updated: userIds.length };
          break;

        case 'delete':
          // Soft delete all users
          await this.repository.bulkUpdateStatus(userIds, UserStatus.deleted);
          result = { deleted: userIds.length };
          break;

        default:
          throw new BadRequestError(`Unknown action: ${action}`);
      }

      // Create audit log for bulk operation
      await this.repository.createAuditLog({
        adminId,
        action: `bulk_${action}`,
        targetType: 'user',
        targetId: userIds.join(','),
        changes: { userIds, action, status },
        reason,
        ipAddress,
        userAgent,
      });

      logger.info('Admin performed bulk operation', {
        adminId,
        action,
        userCount: userIds.length,
      });

      return result;
    } catch (error) {
      if (error instanceof BadRequestError) {
        throw error;
      }
      logger.error('Error performing bulk operation:', error);
      Sentry.captureException(error, {
        tags: { service: 'AdminUsersService', method: 'bulkOperation' },
        extra: { input },
      });
      throw error;
    }
  }
}

export default AdminUsersService;
