import { AdminUsersService } from '../adminUsers.service';
import { AdminUsersRepository } from '../adminUsers.repository';
import { UserRole, UserStatus } from '@prisma/client';
import { NotFoundError, BadRequestError, ConflictError } from '@/utils/errors';

// Mock the repository
jest.mock('../adminUsers.repository');

// Mock logger and Sentry
jest.mock('@/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

jest.mock('@sentry/node', () => ({
  captureException: jest.fn(),
}));

// Mock prisma
jest.mock('@/config/database', () => ({
  user: {
    findUnique: jest.fn(),
  },
  session: {
    deleteMany: jest.fn(),
  },
}));

describe('AdminUsersService', () => {
  let service: AdminUsersService;
  let mockRepository: jest.Mocked<AdminUsersRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepository = new AdminUsersRepository() as jest.Mocked<AdminUsersRepository>;
    service = new AdminUsersService(mockRepository);
  });

  describe('getUsers', () => {
    it('should return paginated users list', async () => {
      const mockQuery = {
        page: 1,
        limit: 50,
        sortBy: 'created_at' as const,
        sortOrder: 'desc' as const,
      };

      const mockResult = {
        users: [
          {
            id: 'user-1',
            email: 'user1@example.com',
            username: 'user1',
            role: UserRole.user,
            status: UserStatus.active,
          },
        ],
        pagination: {
          page: 1,
          limit: 50,
          total: 1,
          totalPages: 1,
        },
      };

      mockRepository.getUsers.mockResolvedValue(mockResult);

      const result = await service.getUsers(mockQuery);

      expect(result).toEqual(mockResult);
      expect(mockRepository.getUsers).toHaveBeenCalledWith(mockQuery);
    });
  });

  describe('getUserById', () => {
    it('should return user details when user exists', async () => {
      const userId = 'user-1';
      const mockUser = {
        id: userId,
        email: 'user@example.com',
        username: 'testuser',
        role: UserRole.user,
        status: UserStatus.active,
      };

      mockRepository.getUserById.mockResolvedValue(mockUser as any);

      const result = await service.getUserById(userId);

      expect(result).toEqual(mockUser);
      expect(mockRepository.getUserById).toHaveBeenCalledWith(userId);
    });

    it('should throw NotFoundError when user does not exist', async () => {
      const userId = 'nonexistent-user';
      mockRepository.getUserById.mockResolvedValue(null);

      await expect(service.getUserById(userId)).rejects.toThrow(NotFoundError);
      await expect(service.getUserById(userId)).rejects.toThrow('User not found');
    });
  });

  describe('updateUser', () => {
    it('should update user data successfully', async () => {
      const userId = 'user-1';
      const adminId = 'admin-1';
      const updateData = { email: 'newemail@example.com' };

      const existingUser = {
        id: userId,
        email: 'oldemail@example.com',
        username: 'testuser',
        role: UserRole.user,
        status: UserStatus.active,
      };

      const updatedUser = {
        id: userId,
        email: 'newemail@example.com',
        username: 'testuser',
        role: UserRole.user,
        status: UserStatus.active,
      };

      mockRepository.getUserById.mockResolvedValue(existingUser as any);
      mockRepository.updateUser.mockResolvedValue(updatedUser as any);
      mockRepository.createAuditLog.mockResolvedValue({} as any);

      const result = await service.updateUser(userId, updateData, adminId);

      expect(result).toEqual(updatedUser);
      expect(mockRepository.getUserById).toHaveBeenCalledWith(userId);
      expect(mockRepository.updateUser).toHaveBeenCalledWith(userId, updateData);
      expect(mockRepository.createAuditLog).toHaveBeenCalled();
    });

    it('should throw NotFoundError when user does not exist', async () => {
      const userId = 'nonexistent-user';
      const adminId = 'admin-1';
      const updateData = { email: 'newemail@example.com' };

      mockRepository.getUserById.mockResolvedValue(null);

      await expect(service.updateUser(userId, updateData, adminId)).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('changeUserRole', () => {
    it('should change user role successfully', async () => {
      const userId = 'user-1';
      const adminId = 'admin-1';
      const input = {
        role: UserRole.moderator,
        reason: 'Promoting to moderator for excellent contributions',
      };

      const existingUser = {
        id: userId,
        email: 'user@example.com',
        username: 'testuser',
        role: UserRole.user,
        status: UserStatus.active,
      };

      const updatedUser = {
        id: userId,
        email: 'user@example.com',
        username: 'testuser',
        role: UserRole.moderator,
        status: UserStatus.active,
      };

      mockRepository.getUserById.mockResolvedValue(existingUser as any);
      mockRepository.changeUserRole.mockResolvedValue(updatedUser as any);
      mockRepository.createAuditLog.mockResolvedValue({} as any);

      const result = await service.changeUserRole(userId, input, adminId);

      expect(result).toEqual(updatedUser);
      expect(mockRepository.changeUserRole).toHaveBeenCalledWith(userId, input.role);
      expect(mockRepository.createAuditLog).toHaveBeenCalled();
    });

    it('should throw BadRequestError when trying to change own role', async () => {
      const userId = 'admin-1';
      const adminId = 'admin-1';
      const input = {
        role: UserRole.user,
        reason: 'Test reason',
      };

      const existingUser = {
        id: userId,
        role: UserRole.admin,
      };

      mockRepository.getUserById.mockResolvedValue(existingUser as any);

      await expect(service.changeUserRole(userId, input, adminId)).rejects.toThrow(
        BadRequestError
      );
      await expect(service.changeUserRole(userId, input, adminId)).rejects.toThrow(
        'Cannot change your own role'
      );
    });
  });

  describe('suspendUser', () => {
    it('should suspend user successfully', async () => {
      const userId = 'user-1';
      const adminId = 'admin-1';
      const input = {
        reason: 'Violating community guidelines',
        durationDays: 30,
        permanent: false,
      };

      const existingUser = {
        id: userId,
        email: 'user@example.com',
        username: 'testuser',
        role: UserRole.user,
        status: UserStatus.active,
      };

      const suspendedUser = {
        ...existingUser,
        status: UserStatus.suspended,
      };

      mockRepository.getUserById.mockResolvedValue(existingUser as any);
      mockRepository.suspendUser.mockResolvedValue(suspendedUser as any);
      mockRepository.createAuditLog.mockResolvedValue({} as any);

      const prisma = require('@/config/database');
      prisma.session.deleteMany.mockResolvedValue({ count: 2 });

      const result = await service.suspendUser(userId, input, adminId);

      expect(result).toEqual(suspendedUser);
      expect(mockRepository.suspendUser).toHaveBeenCalledWith(userId);
      expect(prisma.session.deleteMany).toHaveBeenCalledWith({ where: { userId } });
      expect(mockRepository.createAuditLog).toHaveBeenCalled();
    });

    it('should throw BadRequestError when trying to suspend yourself', async () => {
      const userId = 'admin-1';
      const adminId = 'admin-1';
      const input = {
        reason: 'Test reason',
        permanent: false,
      };

      const existingUser = {
        id: userId,
        role: UserRole.admin,
      };

      mockRepository.getUserById.mockResolvedValue(existingUser as any);

      await expect(service.suspendUser(userId, input, adminId)).rejects.toThrow(
        BadRequestError
      );
      await expect(service.suspendUser(userId, input, adminId)).rejects.toThrow(
        'Cannot suspend yourself'
      );
    });

    it('should throw BadRequestError when trying to suspend admin user', async () => {
      const userId = 'user-1';
      const adminId = 'admin-1';
      const input = {
        reason: 'Test reason',
        permanent: false,
      };

      const existingUser = {
        id: userId,
        role: UserRole.admin,
        status: UserStatus.active,
      };

      mockRepository.getUserById.mockResolvedValue(existingUser as any);

      await expect(service.suspendUser(userId, input, adminId)).rejects.toThrow(
        BadRequestError
      );
      await expect(service.suspendUser(userId, input, adminId)).rejects.toThrow(
        'Cannot suspend admin users'
      );
    });
  });

  describe('banUser', () => {
    it('should ban user successfully', async () => {
      const userId = 'user-1';
      const adminId = 'admin-1';
      const input = {
        reason: 'Severe violation of terms of service',
        permanent: true,
      };

      const existingUser = {
        id: userId,
        email: 'user@example.com',
        username: 'testuser',
        role: UserRole.user,
        status: UserStatus.active,
      };

      const bannedUser = {
        ...existingUser,
        status: UserStatus.banned,
      };

      mockRepository.getUserById.mockResolvedValue(existingUser as any);
      mockRepository.banUser.mockResolvedValue(bannedUser as any);
      mockRepository.createAuditLog.mockResolvedValue({} as any);

      const prisma = require('@/config/database');
      prisma.session.deleteMany.mockResolvedValue({ count: 2 });

      const result = await service.banUser(userId, input, adminId);

      expect(result).toEqual(bannedUser);
      expect(mockRepository.banUser).toHaveBeenCalledWith(userId);
      expect(prisma.session.deleteMany).toHaveBeenCalledWith({ where: { userId } });
      expect(mockRepository.createAuditLog).toHaveBeenCalled();
    });

    it('should throw BadRequestError when trying to ban yourself', async () => {
      const userId = 'admin-1';
      const adminId = 'admin-1';
      const input = {
        reason: 'Test reason',
        permanent: true,
      };

      const existingUser = {
        id: userId,
        role: UserRole.admin,
      };

      mockRepository.getUserById.mockResolvedValue(existingUser as any);

      await expect(service.banUser(userId, input, adminId)).rejects.toThrow(
        BadRequestError
      );
      await expect(service.banUser(userId, input, adminId)).rejects.toThrow(
        'Cannot ban yourself'
      );
    });
  });

  describe('deleteUser', () => {
    it('should soft delete user successfully', async () => {
      const userId = 'user-1';
      const adminId = 'admin-1';
      const input = {
        reason: 'User requested account deletion',
        hardDelete: false,
      };

      const existingUser = {
        id: userId,
        email: 'user@example.com',
        username: 'testuser',
        role: UserRole.user,
        status: UserStatus.active,
      };

      const deletedUser = {
        ...existingUser,
        status: UserStatus.deleted,
      };

      mockRepository.getUserById.mockResolvedValue(existingUser as any);
      mockRepository.softDeleteUser.mockResolvedValue(deletedUser as any);
      mockRepository.createAuditLog.mockResolvedValue({} as any);

      const result = await service.deleteUser(userId, input, adminId);

      expect(result).toEqual(deletedUser);
      expect(mockRepository.softDeleteUser).toHaveBeenCalledWith(userId);
      expect(mockRepository.createAuditLog).toHaveBeenCalled();
    });

    it('should hard delete user successfully', async () => {
      const userId = 'user-1';
      const adminId = 'admin-1';
      const input = {
        reason: 'Spam account',
        hardDelete: true,
      };

      const existingUser = {
        id: userId,
        email: 'spam@example.com',
        username: 'spammer',
        role: UserRole.user,
        status: UserStatus.active,
      };

      mockRepository.getUserById.mockResolvedValue(existingUser as any);
      mockRepository.hardDeleteUser.mockResolvedValue(existingUser as any);
      mockRepository.createAuditLog.mockResolvedValue({} as any);

      const result = await service.deleteUser(userId, input, adminId);

      expect(result).toEqual(existingUser);
      expect(mockRepository.hardDeleteUser).toHaveBeenCalledWith(userId);
      expect(mockRepository.createAuditLog).toHaveBeenCalled();
    });

    it('should throw BadRequestError when trying to delete yourself', async () => {
      const userId = 'admin-1';
      const adminId = 'admin-1';
      const input = {
        reason: 'Test reason',
        hardDelete: false,
      };

      const existingUser = {
        id: userId,
        role: UserRole.admin,
      };

      mockRepository.getUserById.mockResolvedValue(existingUser as any);

      await expect(service.deleteUser(userId, input, adminId)).rejects.toThrow(
        BadRequestError
      );
      await expect(service.deleteUser(userId, input, adminId)).rejects.toThrow(
        'Cannot delete your own account'
      );
    });
  });

  describe('verifyUserEmail', () => {
    it('should verify user email successfully', async () => {
      const userId = 'user-1';
      const adminId = 'admin-1';
      const input = {
        reason: 'User confirmed identity via support ticket',
      };

      const existingUser = {
        id: userId,
        email: 'user@example.com',
        emailVerified: false,
      };

      const verifiedUser = {
        ...existingUser,
        emailVerified: true,
      };

      mockRepository.getUserById.mockResolvedValue(existingUser as any);
      mockRepository.verifyUserEmail.mockResolvedValue(verifiedUser as any);
      mockRepository.createAuditLog.mockResolvedValue({} as any);

      const result = await service.verifyUserEmail(userId, input, adminId);

      expect(result).toEqual(verifiedUser);
      expect(mockRepository.verifyUserEmail).toHaveBeenCalledWith(userId);
      expect(mockRepository.createAuditLog).toHaveBeenCalled();
    });

    it('should throw BadRequestError when email already verified', async () => {
      const userId = 'user-1';
      const adminId = 'admin-1';
      const input = { reason: 'Test' };

      const existingUser = {
        id: userId,
        email: 'user@example.com',
        emailVerified: true,
      };

      mockRepository.getUserById.mockResolvedValue(existingUser as any);

      await expect(service.verifyUserEmail(userId, input, adminId)).rejects.toThrow(
        BadRequestError
      );
      await expect(service.verifyUserEmail(userId, input, adminId)).rejects.toThrow(
        'Email already verified'
      );
    });
  });
});
