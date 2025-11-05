import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MessagingService } from '../messaging.service';
import { MessagingRepository } from '../messaging.repository';
import { BadRequestError, ForbiddenError, NotFoundError } from '@/utils/errors';

// Mock the repository
vi.mock('../messaging.repository');

describe('MessagingService', () => {
  let service: MessagingService;
  let mockRepository: any;

  beforeEach(() => {
    mockRepository = {
      findOrCreateConversation: vi.fn(),
      createMessage: vi.fn(),
      getUserConversations: vi.fn(),
      getConversationById: vi.fn(),
      getConversationMessages: vi.fn(),
      markConversationAsRead: vi.fn(),
      markMessageAsRead: vi.fn(),
      deleteConversation: vi.fn(),
      blockUser: vi.fn(),
      unblockUser: vi.fn(),
      isUserBlocked: vi.fn(),
      getBlockedUsers: vi.fn(),
      getUnreadCount: vi.fn(),
    };

    // Create service with mocked repository
    service = new MessagingService();
    (service as any).repository = mockRepository;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('should send a message successfully', async () => {
      const userId = 'user1';
      const recipientId = 'user2';
      const content = 'Hello, how are you?';

      const mockConversation = {
        id: 'conv1',
        participant1Id: userId,
        participant2Id: recipientId,
      };

      const mockMessage = {
        id: 'msg1',
        conversationId: 'conv1',
        senderId: userId,
        content,
        contentFormat: 'markdown',
        attachments: [],
      };

      mockRepository.isUserBlocked.mockResolvedValue(false);
      mockRepository.findOrCreateConversation.mockResolvedValue(mockConversation);
      mockRepository.createMessage.mockResolvedValue(mockMessage);

      const result = await service.sendMessage(userId, {
        recipientId,
        content,
        contentFormat: 'markdown',
      });

      expect(result.message).toEqual(mockMessage);
      expect(result.conversationId).toBe('conv1');
      expect(mockRepository.isUserBlocked).toHaveBeenCalledWith(userId, recipientId);
      expect(mockRepository.findOrCreateConversation).toHaveBeenCalledWith(userId, recipientId);
      expect(mockRepository.createMessage).toHaveBeenCalled();
    });

    it('should throw error when sending message to self', async () => {
      const userId = 'user1';

      await expect(
        service.sendMessage(userId, {
          recipientId: userId,
          content: 'Hello',
          contentFormat: 'markdown',
        })
      ).rejects.toThrow(BadRequestError);
    });

    it('should throw error when user is blocked', async () => {
      const userId = 'user1';
      const recipientId = 'user2';

      mockRepository.isUserBlocked.mockResolvedValue(true);

      await expect(
        service.sendMessage(userId, {
          recipientId,
          content: 'Hello',
          contentFormat: 'markdown',
        })
      ).rejects.toThrow(ForbiddenError);
    });

    it('should send message with attachments', async () => {
      const userId = 'user1';
      const recipientId = 'user2';
      const content = 'Check this out!';
      const attachments = [
        {
          filename: 'test.jpg',
          url: 'https://example.com/test.jpg',
          storageKey: 'uploads/test.jpg',
          mimeType: 'image/jpeg',
          fileSize: 1024,
          width: 800,
          height: 600,
        },
      ];

      const mockConversation = { id: 'conv1', participant1Id: userId, participant2Id: recipientId };
      const mockMessage = {
        id: 'msg1',
        conversationId: 'conv1',
        senderId: userId,
        content,
        contentFormat: 'markdown',
        attachments,
      };

      mockRepository.isUserBlocked.mockResolvedValue(false);
      mockRepository.findOrCreateConversation.mockResolvedValue(mockConversation);
      mockRepository.createMessage.mockResolvedValue(mockMessage);

      const result = await service.sendMessage(userId, {
        recipientId,
        content,
        contentFormat: 'markdown',
        attachments,
      });

      expect(result.message.attachments).toHaveLength(1);
    });
  });

  describe('getUserConversations', () => {
    it('should get user conversations with pagination', async () => {
      const userId = 'user1';
      const mockConversations = [
        {
          id: 'conv1',
          participant1: { id: 'user1', username: 'user1', profile: { displayName: 'User One', avatarUrl: null } },
          participant2: { id: 'user2', username: 'user2', profile: { displayName: 'User Two', avatarUrl: null } },
          messages: [
            {
              id: 'msg1',
              content: 'Last message',
              senderId: 'user2',
              readAt: null,
              createdAt: new Date(),
            },
          ],
          _count: { messages: 5 },
          lastMessageAt: new Date(),
          createdAt: new Date(),
        },
      ];

      mockRepository.getUserConversations.mockResolvedValue({
        conversations: mockConversations,
        total: 1,
        unreadCount: 1,
      });

      const result = await service.getUserConversations(userId, {
        page: 1,
        limit: 20,
      });

      expect(result.conversations).toHaveLength(1);
      expect(result.conversations[0].otherParticipant.username).toBe('user2');
      expect(result.pagination.total).toBe(1);
      expect(result.unreadCount).toBe(1);
    });

    it('should handle search query', async () => {
      const userId = 'user1';

      mockRepository.getUserConversations.mockResolvedValue({
        conversations: [],
        total: 0,
        unreadCount: 0,
      });

      await service.getUserConversations(userId, {
        page: 1,
        limit: 20,
        search: 'john',
      });

      expect(mockRepository.getUserConversations).toHaveBeenCalledWith(userId, {
        page: 1,
        limit: 20,
        search: 'john',
      });
    });
  });

  describe('getConversationMessages', () => {
    it('should get conversation messages and mark as read', async () => {
      const userId = 'user1';
      const conversationId = 'conv1';

      const mockConversation = { id: conversationId, participant1Id: userId, participant2Id: 'user2' };
      const mockMessages = [
        {
          id: 'msg1',
          content: 'Hello',
          contentFormat: 'markdown',
          senderId: 'user2',
          sender: { id: 'user2', username: 'user2', profile: { displayName: 'User Two', avatarUrl: null } },
          attachments: [],
          readAt: null,
          isEdited: false,
          editedAt: null,
          createdAt: new Date(),
        },
      ];

      mockRepository.getConversationById.mockResolvedValue(mockConversation);
      mockRepository.getConversationMessages.mockResolvedValue({
        messages: mockMessages,
        total: 1,
      });
      mockRepository.markConversationAsRead.mockResolvedValue(1);

      const result = await service.getConversationMessages(userId, conversationId, {
        page: 1,
        limit: 50,
      });

      expect(result.messages).toHaveLength(1);
      expect(mockRepository.markConversationAsRead).toHaveBeenCalledWith(conversationId, userId);
    });

    it('should throw error if conversation not found', async () => {
      const userId = 'user1';
      const conversationId = 'conv1';

      mockRepository.getConversationById.mockResolvedValue(null);

      await expect(
        service.getConversationMessages(userId, conversationId, {
          page: 1,
          limit: 50,
        })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('markMessageAsRead', () => {
    it('should mark message as read', async () => {
      const userId = 'user1';
      const messageId = 'msg1';

      mockRepository.markMessageAsRead.mockResolvedValue({ id: messageId, readAt: new Date() });

      const result = await service.markMessageAsRead(userId, messageId);

      expect(result.success).toBe(true);
      expect(mockRepository.markMessageAsRead).toHaveBeenCalledWith(messageId, userId);
    });

    it('should throw error if message not found', async () => {
      const userId = 'user1';
      const messageId = 'msg1';

      mockRepository.markMessageAsRead.mockResolvedValue(null);

      await expect(service.markMessageAsRead(userId, messageId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteConversation', () => {
    it('should delete conversation successfully', async () => {
      const userId = 'user1';
      const conversationId = 'conv1';

      mockRepository.deleteConversation.mockResolvedValue(true);

      const result = await service.deleteConversation(userId, conversationId);

      expect(result.success).toBe(true);
      expect(mockRepository.deleteConversation).toHaveBeenCalledWith(conversationId, userId);
    });

    it('should throw error if conversation not found', async () => {
      const userId = 'user1';
      const conversationId = 'conv1';

      mockRepository.deleteConversation.mockResolvedValue(false);

      await expect(service.deleteConversation(userId, conversationId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('blockUser', () => {
    it('should block user successfully', async () => {
      const userId = 'user1';
      const targetUserId = 'user2';

      mockRepository.isUserBlocked.mockResolvedValue(false);
      mockRepository.blockUser.mockResolvedValue({
        id: 'block1',
        blockerId: userId,
        blockedId: targetUserId,
      });

      const result = await service.blockUser(userId, {
        userId: targetUserId,
        reason: 'Spam',
      });

      expect(result.success).toBe(true);
      expect(mockRepository.blockUser).toHaveBeenCalledWith(userId, targetUserId, 'Spam');
    });

    it('should throw error when blocking self', async () => {
      const userId = 'user1';

      await expect(
        service.blockUser(userId, {
          userId: userId,
        })
      ).rejects.toThrow(BadRequestError);
    });

    it('should throw error if user already blocked', async () => {
      const userId = 'user1';
      const targetUserId = 'user2';

      mockRepository.isUserBlocked.mockResolvedValue(true);

      await expect(
        service.blockUser(userId, {
          userId: targetUserId,
        })
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('unblockUser', () => {
    it('should unblock user successfully', async () => {
      const userId = 'user1';
      const targetUserId = 'user2';

      mockRepository.unblockUser.mockResolvedValue(true);

      const result = await service.unblockUser(userId, targetUserId);

      expect(result.success).toBe(true);
      expect(mockRepository.unblockUser).toHaveBeenCalledWith(userId, targetUserId);
    });

    it('should throw error if block not found', async () => {
      const userId = 'user1';
      const targetUserId = 'user2';

      mockRepository.unblockUser.mockResolvedValue(false);

      await expect(service.unblockUser(userId, targetUserId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('getBlockedUsers', () => {
    it('should get blocked users list', async () => {
      const userId = 'user1';
      const mockBlockedUsers = [
        {
          id: 'block1',
          blocked: {
            id: 'user2',
            username: 'user2',
            profile: { displayName: 'User Two', avatarUrl: null },
          },
          reason: 'Spam',
          createdAt: new Date(),
        },
      ];

      mockRepository.getBlockedUsers.mockResolvedValue(mockBlockedUsers);

      const result = await service.getBlockedUsers(userId);

      expect(result.blockedUsers).toHaveLength(1);
      expect(result.blockedUsers[0].user.username).toBe('user2');
    });
  });

  describe('getUnreadCount', () => {
    it('should get unread message count', async () => {
      const userId = 'user1';

      mockRepository.getUnreadCount.mockResolvedValue(5);

      const result = await service.getUnreadCount(userId);

      expect(result.unreadCount).toBe(5);
    });
  });
});
