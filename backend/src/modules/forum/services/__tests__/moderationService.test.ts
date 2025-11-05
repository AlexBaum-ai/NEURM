import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { ModerationService } from '../moderationService';
import { ModerationRepository } from '../../repositories/ModerationRepository';
import { UserRole, UserStatus } from '@prisma/client';

// Mock the repository
vi.mock('../../repositories/ModerationRepository');

describe('ModerationService', () => {
  let moderationService: ModerationService;
  let mockModerationRepository: jest.Mocked<ModerationRepository>;

  const mockModerator = {
    id: 'moderator-1',
    role: UserRole.moderator,
  };

  const mockAdmin = {
    id: 'admin-1',
    role: UserRole.admin,
  };

  const mockUser = {
    id: 'user-1',
    role: UserRole.user,
  };

  beforeEach(() => {
    mockModerationRepository = {
      createLog: vi.fn(),
      pinTopic: vi.fn(),
      lockTopic: vi.fn(),
      moveTopic: vi.fn(),
      mergeTopics: vi.fn(),
      hardDeleteTopic: vi.fn(),
      updateUserStatus: vi.fn(),
      getTopicById: vi.fn(),
      getUserById: vi.fn(),
      isCategoryModerator: vi.fn(),
      getCategoryById: vi.fn(),
      findLogs: vi.fn(),
    } as any;

    moderationService = new ModerationService(mockModerationRepository);
  });

  describe('pinTopic', () => {
    it('should pin a topic successfully when moderator has permission', async () => {
      const topicId = 'topic-1';
      const mockTopic = {
        id: topicId,
        categoryId: 'category-1',
        isPinned: false,
      };
      const pinnedTopic = { ...mockTopic, isPinned: true };

      mockModerationRepository.getTopicById.mockResolvedValue(mockTopic as any);
      mockModerationRepository.isCategoryModerator.mockResolvedValue(true);
      mockModerationRepository.pinTopic.mockResolvedValue(pinnedTopic as any);
      mockModerationRepository.createLog.mockResolvedValue({} as any);

      const result = await moderationService.pinTopic(
        topicId,
        { isPinned: true, reason: 'Important topic' },
        mockModerator
      );

      expect(result.isPinned).toBe(true);
      expect(mockModerationRepository.pinTopic).toHaveBeenCalledWith(topicId, true);
      expect(mockModerationRepository.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'topic_pinned',
          targetId: topicId,
        })
      );
    });

    it('should allow admin to pin any topic', async () => {
      const topicId = 'topic-1';
      const mockTopic = {
        id: topicId,
        categoryId: 'category-1',
        isPinned: false,
      };
      const pinnedTopic = { ...mockTopic, isPinned: true };

      mockModerationRepository.getTopicById.mockResolvedValue(mockTopic as any);
      mockModerationRepository.pinTopic.mockResolvedValue(pinnedTopic as any);
      mockModerationRepository.createLog.mockResolvedValue({} as any);

      const result = await moderationService.pinTopic(
        topicId,
        { isPinned: true },
        mockAdmin
      );

      expect(result.isPinned).toBe(true);
      // Admin should not need category moderator check
      expect(mockModerationRepository.isCategoryModerator).not.toHaveBeenCalled();
    });

    it('should throw error when moderator lacks category permission', async () => {
      const topicId = 'topic-1';
      const mockTopic = {
        id: topicId,
        categoryId: 'category-1',
      };

      mockModerationRepository.getTopicById.mockResolvedValue(mockTopic as any);
      mockModerationRepository.isCategoryModerator.mockResolvedValue(false);

      await expect(
        moderationService.pinTopic(topicId, { isPinned: true }, mockModerator)
      ).rejects.toThrow('do not have moderator permissions for this category');
    });

    it('should throw error when regular user tries to pin', async () => {
      const topicId = 'topic-1';
      const mockTopic = {
        id: topicId,
        categoryId: 'category-1',
      };

      mockModerationRepository.getTopicById.mockResolvedValue(mockTopic as any);

      await expect(
        moderationService.pinTopic(topicId, { isPinned: true }, mockUser)
      ).rejects.toThrow('Only moderators and administrators');
    });
  });

  describe('lockTopic', () => {
    it('should lock a topic successfully', async () => {
      const topicId = 'topic-1';
      const mockTopic = {
        id: topicId,
        categoryId: 'category-1',
        isLocked: false,
      };
      const lockedTopic = { ...mockTopic, isLocked: true };

      mockModerationRepository.getTopicById.mockResolvedValue(mockTopic as any);
      mockModerationRepository.isCategoryModerator.mockResolvedValue(true);
      mockModerationRepository.lockTopic.mockResolvedValue(lockedTopic as any);
      mockModerationRepository.createLog.mockResolvedValue({} as any);

      const result = await moderationService.lockTopic(
        topicId,
        { isLocked: true, reason: 'Off-topic discussion' },
        mockModerator
      );

      expect(result.isLocked).toBe(true);
      expect(mockModerationRepository.lockTopic).toHaveBeenCalledWith(topicId, true);
    });

    it('should unlock a topic', async () => {
      const topicId = 'topic-1';
      const mockTopic = {
        id: topicId,
        categoryId: 'category-1',
        isLocked: true,
      };
      const unlockedTopic = { ...mockTopic, isLocked: false };

      mockModerationRepository.getTopicById.mockResolvedValue(mockTopic as any);
      mockModerationRepository.isCategoryModerator.mockResolvedValue(true);
      mockModerationRepository.lockTopic.mockResolvedValue(unlockedTopic as any);
      mockModerationRepository.createLog.mockResolvedValue({} as any);

      const result = await moderationService.lockTopic(
        topicId,
        { isLocked: false },
        mockModerator
      );

      expect(result.isLocked).toBe(false);
      expect(mockModerationRepository.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'topic_unlocked',
        })
      );
    });
  });

  describe('moveTopic', () => {
    it('should move topic to new category successfully', async () => {
      const topicId = 'topic-1';
      const newCategoryId = 'category-2';
      const mockTopic = {
        id: topicId,
        categoryId: 'category-1',
      };
      const mockCategory = {
        id: newCategoryId,
        name: 'New Category',
      };
      const movedTopic = { ...mockTopic, categoryId: newCategoryId };

      mockModerationRepository.getTopicById.mockResolvedValue(mockTopic as any);
      mockModerationRepository.isCategoryModerator
        .mockResolvedValueOnce(true) // Source category
        .mockResolvedValueOnce(true); // Target category
      mockModerationRepository.getCategoryById.mockResolvedValue(mockCategory as any);
      mockModerationRepository.moveTopic.mockResolvedValue(movedTopic as any);
      mockModerationRepository.createLog.mockResolvedValue({} as any);

      const result = await moderationService.moveTopic(
        topicId,
        { categoryId: newCategoryId, reason: 'Better fit' },
        mockModerator
      );

      expect(result.categoryId).toBe(newCategoryId);
      expect(mockModerationRepository.moveTopic).toHaveBeenCalledWith(topicId, newCategoryId);
    });

    it('should throw error when target category not found', async () => {
      const topicId = 'topic-1';
      const mockTopic = {
        id: topicId,
        categoryId: 'category-1',
      };

      mockModerationRepository.getTopicById.mockResolvedValue(mockTopic as any);
      mockModerationRepository.isCategoryModerator.mockResolvedValue(true);
      mockModerationRepository.getCategoryById.mockResolvedValue(null);

      await expect(
        moderationService.moveTopic(topicId, { categoryId: 'invalid-category' }, mockModerator)
      ).rejects.toThrow('Target category not found');
    });
  });

  describe('mergeTopics', () => {
    it('should merge two topics successfully', async () => {
      const sourceTopicId = 'topic-1';
      const targetTopicId = 'topic-2';
      const mockSourceTopic = {
        id: sourceTopicId,
        title: 'Source Topic',
        categoryId: 'category-1',
      };
      const mockTargetTopic = {
        id: targetTopicId,
        title: 'Target Topic',
        categoryId: 'category-1',
      };

      mockModerationRepository.getTopicById
        .mockResolvedValueOnce(mockSourceTopic as any)
        .mockResolvedValueOnce(mockTargetTopic as any);
      mockModerationRepository.isCategoryModerator.mockResolvedValue(true);
      mockModerationRepository.mergeTopics.mockResolvedValue({} as any);
      mockModerationRepository.createLog.mockResolvedValue({} as any);

      const result = await moderationService.mergeTopics(
        sourceTopicId,
        { targetTopicId, reason: 'Duplicate content' },
        mockModerator
      );

      expect(result.targetTopicId).toBe(targetTopicId);
      expect(mockModerationRepository.mergeTopics).toHaveBeenCalledWith(
        sourceTopicId,
        targetTopicId
      );
    });

    it('should throw error when merging topic with itself', async () => {
      const topicId = 'topic-1';
      const mockTopic = {
        id: topicId,
        title: 'Topic',
        categoryId: 'category-1',
      };

      mockModerationRepository.getTopicById.mockResolvedValue(mockTopic as any);
      mockModerationRepository.isCategoryModerator.mockResolvedValue(true);

      await expect(
        moderationService.mergeTopics(topicId, { targetTopicId: topicId }, mockModerator)
      ).rejects.toThrow('Cannot merge a topic with itself');
    });
  });

  describe('hardDeleteTopic', () => {
    it('should allow admin to hard delete topic', async () => {
      const topicId = 'topic-1';
      const mockTopic = {
        id: topicId,
        title: 'Topic to Delete',
        authorId: 'user-1',
      };

      mockModerationRepository.getTopicById.mockResolvedValue(mockTopic as any);
      mockModerationRepository.hardDeleteTopic.mockResolvedValue({} as any);
      mockModerationRepository.createLog.mockResolvedValue({} as any);

      const result = await moderationService.hardDeleteTopic(
        topicId,
        'Spam content',
        mockAdmin
      );

      expect(result.message).toBe('Topic permanently deleted');
      expect(mockModerationRepository.hardDeleteTopic).toHaveBeenCalledWith(topicId);
    });

    it('should not allow moderator to hard delete topic', async () => {
      const topicId = 'topic-1';

      await expect(
        moderationService.hardDeleteTopic(topicId, 'Spam', mockModerator)
      ).rejects.toThrow('Only administrators can permanently delete topics');
    });
  });

  describe('warnUser', () => {
    it('should issue warning to user successfully', async () => {
      const userId = 'user-1';
      const mockTargetUser = {
        id: userId,
        username: 'testuser',
        role: UserRole.user,
        status: UserStatus.active,
      };

      mockModerationRepository.getUserById.mockResolvedValue(mockTargetUser as any);
      mockModerationRepository.createLog.mockResolvedValue({} as any);

      const result = await moderationService.warnUser(
        userId,
        { reason: 'Inappropriate language' },
        mockModerator
      );

      expect(result.message).toBe('Warning issued successfully');
      expect(mockModerationRepository.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'user_warned',
          targetId: userId,
        })
      );
    });

    it('should not allow warning admins', async () => {
      const adminUserId = 'admin-2';
      const mockTargetUser = {
        id: adminUserId,
        username: 'admin',
        role: UserRole.admin,
        status: UserStatus.active,
      };

      mockModerationRepository.getUserById.mockResolvedValue(mockTargetUser as any);

      await expect(
        moderationService.warnUser(adminUserId, { reason: 'Test' }, mockModerator)
      ).rejects.toThrow('Cannot warn administrators');
    });

    it('should not allow moderators to warn other moderators', async () => {
      const moderatorUserId = 'moderator-2';
      const mockTargetUser = {
        id: moderatorUserId,
        username: 'mod2',
        role: UserRole.moderator,
        status: UserStatus.active,
      };

      mockModerationRepository.getUserById.mockResolvedValue(mockTargetUser as any);

      await expect(
        moderationService.warnUser(moderatorUserId, { reason: 'Test' }, mockModerator)
      ).rejects.toThrow('Moderators cannot warn other moderators');
    });
  });

  describe('suspendUser', () => {
    it('should suspend user successfully', async () => {
      const userId = 'user-1';
      const mockTargetUser = {
        id: userId,
        username: 'testuser',
        role: UserRole.user,
        status: UserStatus.active,
      };

      mockModerationRepository.getUserById.mockResolvedValue(mockTargetUser as any);
      mockModerationRepository.updateUserStatus.mockResolvedValue({} as any);
      mockModerationRepository.createLog.mockResolvedValue({} as any);

      const result = await moderationService.suspendUser(
        userId,
        { reason: 'Repeated violations', duration: 7 },
        mockModerator
      );

      expect(result.message).toBe('User suspended successfully');
      expect(mockModerationRepository.updateUserStatus).toHaveBeenCalledWith(
        userId,
        UserStatus.suspended
      );
    });

    it('should not allow suspending admins', async () => {
      const adminUserId = 'admin-2';
      const mockTargetUser = {
        id: adminUserId,
        username: 'admin',
        role: UserRole.admin,
        status: UserStatus.active,
      };

      mockModerationRepository.getUserById.mockResolvedValue(mockTargetUser as any);

      await expect(
        moderationService.suspendUser(adminUserId, { reason: 'Test' }, mockModerator)
      ).rejects.toThrow('Cannot suspend administrators');
    });
  });

  describe('banUser', () => {
    it('should allow admin to ban user', async () => {
      const userId = 'user-1';
      const mockTargetUser = {
        id: userId,
        username: 'testuser',
        role: UserRole.user,
        status: UserStatus.active,
      };

      mockModerationRepository.getUserById.mockResolvedValue(mockTargetUser as any);
      mockModerationRepository.updateUserStatus.mockResolvedValue({} as any);
      mockModerationRepository.createLog.mockResolvedValue({} as any);

      const result = await moderationService.banUser(
        userId,
        { reason: 'Severe violations' },
        mockAdmin
      );

      expect(result.message).toBe('User banned successfully');
      expect(mockModerationRepository.updateUserStatus).toHaveBeenCalledWith(
        userId,
        UserStatus.banned
      );
    });

    it('should not allow moderator to ban user', async () => {
      const userId = 'user-1';

      await expect(
        moderationService.banUser(userId, { reason: 'Test' }, mockModerator)
      ).rejects.toThrow('Only administrators can permanently ban users');
    });

    it('should not allow banning other admins', async () => {
      const adminUserId = 'admin-2';
      const mockTargetUser = {
        id: adminUserId,
        username: 'admin',
        role: UserRole.admin,
        status: UserStatus.active,
      };

      mockModerationRepository.getUserById.mockResolvedValue(mockTargetUser as any);

      await expect(
        moderationService.banUser(adminUserId, { reason: 'Test' }, mockAdmin)
      ).rejects.toThrow('Cannot ban administrators');
    });
  });

  describe('getModerationLogs', () => {
    it('should return moderation logs for moderator', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          action: 'topic_pinned',
          targetId: 'topic-1',
          moderatorId: 'moderator-1',
        },
      ];

      mockModerationRepository.findLogs.mockResolvedValue({
        logs: mockLogs,
        total: 1,
      } as any);

      const result = await moderationService.getModerationLogs(
        {},
        { page: 1, limit: 20, sortBy: 'createdAt', sortOrder: 'desc' },
        mockModerator
      );

      expect(result.logs).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it('should not allow regular users to view logs', async () => {
      await expect(
        moderationService.getModerationLogs(
          {},
          { page: 1, limit: 20, sortBy: 'createdAt', sortOrder: 'desc' },
          mockUser
        )
      ).rejects.toThrow('Only moderators and administrators can view moderation logs');
    });
  });
});
