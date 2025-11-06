import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { NotificationService } from '../notifications.service';
import NotificationRepository from '../notifications.repository';
import { NotFoundError, BadRequestError } from '@/utils/errors';
import { NotificationType } from '@prisma/client';

// Mock the repository
vi.mock('../notifications.repository');

// Mock logger and Sentry
vi.mock('@/utils/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('@sentry/node', () => ({
  captureException: vi.fn(),
}));

describe('NotificationService', () => {
  let service: NotificationService;
  let mockRepository: {
    createNotification: Mock;
    findById: Mock;
    findByUser: Mock;
    markAsRead: Mock;
    markAllAsRead: Mock;
    deleteNotification: Mock;
    getUnreadCount: Mock;
    findRecentByBundleKey: Mock;
    updateBundleCount: Mock;
    getUserPreferences: Mock;
    isUserInDndMode: Mock;
  };

  beforeEach(() => {
    mockRepository = {
      createNotification: vi.fn(),
      findById: vi.fn(),
      findByUser: vi.fn(),
      markAsRead: vi.fn(),
      markAllAsRead: vi.fn(),
      deleteNotification: vi.fn(),
      getUnreadCount: vi.fn(),
      findRecentByBundleKey: vi.fn(),
      updateBundleCount: vi.fn(),
      getUserPreferences: vi.fn(),
      isUserInDndMode: vi.fn(),
    };

    service = new NotificationService(mockRepository as any);
  });

  describe('createNotification', () => {
    it('should create a new notification successfully', async () => {
      const userId = 'user-id';
      const input = {
        userId,
        type: 'forum_reply' as NotificationType,
        title: 'New Reply',
        message: 'Someone replied to your topic',
        referenceId: 'topic-123',
        referenceType: 'topic' as const,
        deliveryChannels: ['in_app' as const, 'email' as const],
        data: { topicId: 'topic-123' },
      };

      const mockNotification = {
        id: 'notification-id',
        ...input,
        bundleKey: 'forum_reply:topic-123',
        bundleCount: 1,
        readAt: null,
        createdAt: new Date(),
      };

      mockRepository.isUserInDndMode.mockResolvedValue(false);
      mockRepository.getUserPreferences.mockResolvedValue({
        forum_reply: { in_app: true, email: true, push: false, frequency: 'realtime' },
      });
      mockRepository.findRecentByBundleKey.mockResolvedValue(null);
      mockRepository.createNotification.mockResolvedValue(mockNotification);

      const result = await service.createNotification(input);

      expect(result).toEqual(mockNotification);
      expect(mockRepository.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          type: input.type,
          title: input.title,
          message: input.message,
          bundleKey: expect.any(String),
        })
      );
    });

    it('should skip notification if user is in DND mode', async () => {
      const userId = 'user-id';
      const input = {
        userId,
        type: 'forum_reply' as NotificationType,
        title: 'New Reply',
        message: 'Someone replied to your topic',
        referenceId: 'topic-123',
        referenceType: 'topic' as const,
      };

      mockRepository.isUserInDndMode.mockResolvedValue(true);

      const result = await service.createNotification(input);

      expect(result).toBeNull();
      expect(mockRepository.createNotification).not.toHaveBeenCalled();
    });

    it('should bundle notifications within time window', async () => {
      const userId = 'user-id';
      const input = {
        userId,
        type: 'forum_reply' as NotificationType,
        title: 'New Reply',
        message: 'Someone replied to your topic',
        referenceId: 'topic-123',
        referenceType: 'topic' as const,
        deliveryChannels: ['in_app' as const],
      };

      const existingNotification = {
        id: 'existing-notification',
        ...input,
        bundleKey: 'forum_reply:topic-123',
        bundleCount: 1,
        createdAt: new Date(),
        readAt: null,
      };

      const updatedNotification = {
        ...existingNotification,
        bundleCount: 2,
      };

      mockRepository.isUserInDndMode.mockResolvedValue(false);
      mockRepository.getUserPreferences.mockResolvedValue({
        forum_reply: { in_app: true, email: true, push: false, frequency: 'realtime' },
      });
      mockRepository.findRecentByBundleKey.mockResolvedValue(existingNotification);
      mockRepository.updateBundleCount.mockResolvedValue(updatedNotification);

      const result = await service.createNotification(input);

      expect(result?.bundleCount).toBe(2);
      expect(mockRepository.updateBundleCount).toHaveBeenCalledWith(
        existingNotification.id,
        2
      );
      expect(mockRepository.createNotification).not.toHaveBeenCalled();
    });

    it('should skip notification if all channels are disabled', async () => {
      const userId = 'user-id';
      const input = {
        userId,
        type: 'forum_reply' as NotificationType,
        title: 'New Reply',
        message: 'Someone replied to your topic',
        referenceId: 'topic-123',
        referenceType: 'topic' as const,
        deliveryChannels: ['in_app' as const],
      };

      mockRepository.isUserInDndMode.mockResolvedValue(false);
      mockRepository.getUserPreferences.mockResolvedValue({
        forum_reply: { in_app: false, email: false, push: false, frequency: 'off' },
      });

      const result = await service.createNotification(input);

      expect(result).toBeNull();
      expect(mockRepository.createNotification).not.toHaveBeenCalled();
    });
  });

  describe('getNotifications', () => {
    it('should return user notifications with pagination', async () => {
      const userId = 'user-id';
      const mockNotifications = [
        {
          id: 'notification-1',
          userId,
          type: 'forum_reply',
          title: 'New Reply',
          message: 'Someone replied',
          readAt: null,
          createdAt: new Date(),
        },
        {
          id: 'notification-2',
          userId,
          type: 'news_trending',
          title: 'Trending Article',
          message: 'Article is trending',
          readAt: new Date(),
          createdAt: new Date(),
        },
      ];

      mockRepository.findByUser.mockResolvedValue({
        notifications: mockNotifications,
        total: 2,
      });

      const result = await service.getNotifications(userId, {
        page: 1,
        limit: 20,
      });

      expect(result.notifications).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(mockRepository.findByUser).toHaveBeenCalledWith(userId, {
        page: 1,
        limit: 20,
      });
    });

    it('should filter notifications by type', async () => {
      const userId = 'user-id';
      const type = 'forum_reply';

      mockRepository.findByUser.mockResolvedValue({
        notifications: [],
        total: 0,
      });

      await service.getNotifications(userId, {
        page: 1,
        limit: 20,
        type,
      });

      expect(mockRepository.findByUser).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          type,
        })
      );
    });

    it('should filter unread notifications', async () => {
      const userId = 'user-id';

      mockRepository.findByUser.mockResolvedValue({
        notifications: [],
        total: 0,
      });

      await service.getNotifications(userId, {
        page: 1,
        limit: 20,
        unreadOnly: true,
      });

      expect(mockRepository.findByUser).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          unreadOnly: true,
        })
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      const notificationId = 'notification-id';
      const userId = 'user-id';

      const mockNotification = {
        id: notificationId,
        userId,
        type: 'forum_reply',
        title: 'New Reply',
        message: 'Someone replied',
        readAt: null,
        createdAt: new Date(),
      };

      const updatedNotification = {
        ...mockNotification,
        readAt: new Date(),
      };

      mockRepository.findById.mockResolvedValue(mockNotification);
      mockRepository.markAsRead.mockResolvedValue(updatedNotification);

      const result = await service.markAsRead(notificationId, userId);

      expect(result.readAt).not.toBeNull();
      expect(mockRepository.markAsRead).toHaveBeenCalledWith(notificationId);
    });

    it('should throw NotFoundError if notification does not exist', async () => {
      const notificationId = 'non-existent';
      const userId = 'user-id';

      mockRepository.findById.mockResolvedValue(null);

      await expect(service.markAsRead(notificationId, userId)).rejects.toThrow(NotFoundError);
      expect(mockRepository.markAsRead).not.toHaveBeenCalled();
    });

    it('should throw error if notification belongs to different user', async () => {
      const notificationId = 'notification-id';
      const userId = 'user-id';
      const differentUserId = 'different-user';

      const mockNotification = {
        id: notificationId,
        userId: differentUserId,
        type: 'forum_reply',
        title: 'New Reply',
        message: 'Someone replied',
        readAt: null,
        createdAt: new Date(),
      };

      mockRepository.findById.mockResolvedValue(mockNotification);

      await expect(service.markAsRead(notificationId, userId)).rejects.toThrow();
      expect(mockRepository.markAsRead).not.toHaveBeenCalled();
    });

    it('should not update if already read', async () => {
      const notificationId = 'notification-id';
      const userId = 'user-id';

      const mockNotification = {
        id: notificationId,
        userId,
        type: 'forum_reply',
        title: 'New Reply',
        message: 'Someone replied',
        readAt: new Date(),
        createdAt: new Date(),
      };

      mockRepository.findById.mockResolvedValue(mockNotification);

      const result = await service.markAsRead(notificationId, userId);

      expect(result).toEqual(mockNotification);
      expect(mockRepository.markAsRead).not.toHaveBeenCalled();
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all user notifications as read', async () => {
      const userId = 'user-id';

      mockRepository.markAllAsRead.mockResolvedValue({ count: 5 });

      const result = await service.markAllAsRead(userId);

      expect(result.count).toBe(5);
      expect(mockRepository.markAllAsRead).toHaveBeenCalledWith(userId);
    });
  });

  describe('deleteNotification', () => {
    it('should delete a notification', async () => {
      const notificationId = 'notification-id';
      const userId = 'user-id';

      const mockNotification = {
        id: notificationId,
        userId,
        type: 'forum_reply',
        title: 'New Reply',
        message: 'Someone replied',
        readAt: null,
        createdAt: new Date(),
      };

      mockRepository.findById.mockResolvedValue(mockNotification);
      mockRepository.deleteNotification.mockResolvedValue(mockNotification);

      await service.deleteNotification(notificationId, userId);

      expect(mockRepository.deleteNotification).toHaveBeenCalledWith(notificationId);
    });

    it('should throw NotFoundError if notification does not exist', async () => {
      const notificationId = 'non-existent';
      const userId = 'user-id';

      mockRepository.findById.mockResolvedValue(null);

      await expect(service.deleteNotification(notificationId, userId)).rejects.toThrow(
        NotFoundError
      );
      expect(mockRepository.deleteNotification).not.toHaveBeenCalled();
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread notification count', async () => {
      const userId = 'user-id';

      mockRepository.getUnreadCount.mockResolvedValue(10);

      const result = await service.getUnreadCount(userId);

      expect(result.count).toBe(10);
      expect(mockRepository.getUnreadCount).toHaveBeenCalledWith(userId);
    });
  });
});
