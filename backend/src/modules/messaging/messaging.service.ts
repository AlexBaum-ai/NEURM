import { PrismaClient } from '@prisma/client';
import * as Sentry from '@sentry/node';
import { MessagingRepository } from './messaging.repository';
import { BadRequestError, ForbiddenError, NotFoundError } from '@/utils/errors';
import logger from '@/utils/logger';
import {
  SendMessageInput,
  GetConversationsQuery,
  GetConversationMessagesQuery,
  BlockUserInput,
} from './messaging.validation';

/**
 * MessagingService
 * Business logic for messaging operations
 */
export class MessagingService {
  private repository: MessagingRepository;

  constructor(prisma?: PrismaClient) {
    const prismaClient = prisma || new PrismaClient();
    this.repository = new MessagingRepository(prismaClient);
  }

  /**
   * Send a new message
   */
  async sendMessage(userId: string, input: SendMessageInput) {
    try {
      const { recipientId, content, contentFormat, attachments } = input;

      // Validate not sending to self
      if (userId === recipientId) {
        throw new BadRequestError('Cannot send message to yourself');
      }

      // Check if blocked
      const isBlocked = await this.repository.isUserBlocked(userId, recipientId);
      if (isBlocked) {
        throw new ForbiddenError('Cannot send message to this user');
      }

      // Find or create conversation
      const conversation = await this.repository.findOrCreateConversation(userId, recipientId);

      // Create message with attachments
      const message = await this.repository.createMessage({
        conversationId: conversation.id,
        senderId: userId,
        content,
        contentFormat: contentFormat || 'markdown',
        attachments,
      });

      logger.info(`Message sent from user ${userId} to ${recipientId}`);
      return {
        message,
        conversationId: conversation.id,
      };
    } catch (error) {
      logger.error('Error in sendMessage service:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Get user's conversations
   */
  async getUserConversations(userId: string, query: GetConversationsQuery) {
    try {
      const { page, limit, search } = query;

      const result = await this.repository.getUserConversations(userId, {
        page,
        limit,
        search,
      });

      // Map conversations to include other participant info
      const conversations = result.conversations.map((conv) => {
        const otherParticipant = conv.participant1.id === userId ? conv.participant2 : conv.participant1;
        const lastMessage = conv.messages[0] || null;

        return {
          id: conv.id,
          otherParticipant: {
            id: otherParticipant.id,
            username: otherParticipant.username,
            displayName: otherParticipant.profile?.displayName || otherParticipant.username,
            avatarUrl: otherParticipant.profile?.avatarUrl,
          },
          lastMessage: lastMessage
            ? {
                id: lastMessage.id,
                content: lastMessage.content,
                isSentByMe: lastMessage.senderId === userId,
                isRead: !!lastMessage.readAt,
                createdAt: lastMessage.createdAt,
              }
            : null,
          messageCount: conv._count.messages,
          lastMessageAt: conv.lastMessageAt,
          createdAt: conv.createdAt,
        };
      });

      return {
        conversations,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
        },
        unreadCount: result.unreadCount,
      };
    } catch (error) {
      logger.error('Error in getUserConversations service:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Get conversation messages
   */
  async getConversationMessages(userId: string, conversationId: string, query: GetConversationMessagesQuery) {
    try {
      // Verify user is a participant
      const conversation = await this.repository.getConversationById(conversationId, userId);
      if (!conversation) {
        throw new NotFoundError('Conversation not found');
      }

      const { page, limit, before } = query;

      const result = await this.repository.getConversationMessages(conversationId, {
        page,
        limit,
        before,
      });

      // Mark messages as read
      await this.repository.markConversationAsRead(conversationId, userId);

      // Format messages
      const messages = result.messages.map((msg) => ({
        id: msg.id,
        content: msg.content,
        contentFormat: msg.contentFormat,
        sender: {
          id: msg.sender.id,
          username: msg.sender.username,
          displayName: msg.sender.profile?.displayName || msg.sender.username,
          avatarUrl: msg.sender.profile?.avatarUrl,
        },
        isSentByMe: msg.senderId === userId,
        attachments: msg.attachments.map((att) => ({
          id: att.id,
          filename: att.filename,
          originalFilename: att.originalFilename,
          mimeType: att.mimeType,
          fileSize: att.fileSize,
          url: att.url,
          width: att.width,
          height: att.height,
        })),
        isRead: !!msg.readAt,
        readAt: msg.readAt,
        isEdited: msg.isEdited,
        editedAt: msg.editedAt,
        createdAt: msg.createdAt,
      }));

      return {
        messages,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
        },
      };
    } catch (error) {
      logger.error('Error in getConversationMessages service:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Mark message as read
   */
  async markMessageAsRead(userId: string, messageId: string) {
    try {
      const message = await this.repository.markMessageAsRead(messageId, userId);
      if (!message) {
        throw new NotFoundError('Message not found or already read');
      }

      return {
        success: true,
        message: 'Message marked as read',
      };
    } catch (error) {
      logger.error('Error in markMessageAsRead service:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Delete conversation
   */
  async deleteConversation(userId: string, conversationId: string) {
    try {
      const deleted = await this.repository.deleteConversation(conversationId, userId);
      if (!deleted) {
        throw new NotFoundError('Conversation not found');
      }

      return {
        success: true,
        message: 'Conversation deleted successfully',
      };
    } catch (error) {
      logger.error('Error in deleteConversation service:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Block user
   */
  async blockUser(userId: string, input: BlockUserInput) {
    try {
      const { userId: targetUserId, reason } = input;

      // Validate not blocking self
      if (userId === targetUserId) {
        throw new BadRequestError('Cannot block yourself');
      }

      // Check if already blocked
      const isBlocked = await this.repository.isUserBlocked(userId, targetUserId);
      if (isBlocked) {
        throw new BadRequestError('User is already blocked');
      }

      await this.repository.blockUser(userId, targetUserId, reason);

      logger.info(`User ${userId} blocked user ${targetUserId}`);
      return {
        success: true,
        message: 'User blocked successfully',
      };
    } catch (error) {
      logger.error('Error in blockUser service:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Unblock user
   */
  async unblockUser(userId: string, targetUserId: string) {
    try {
      const unblocked = await this.repository.unblockUser(userId, targetUserId);
      if (!unblocked) {
        throw new NotFoundError('User block not found');
      }

      logger.info(`User ${userId} unblocked user ${targetUserId}`);
      return {
        success: true,
        message: 'User unblocked successfully',
      };
    } catch (error) {
      logger.error('Error in unblockUser service:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Get blocked users list
   */
  async getBlockedUsers(userId: string) {
    try {
      const blockedUsers = await this.repository.getBlockedUsers(userId);

      return {
        blockedUsers: blockedUsers.map((block) => ({
          id: block.id,
          user: {
            id: block.blocked.id,
            username: block.blocked.username,
            displayName: block.blocked.profile?.displayName || block.blocked.username,
            avatarUrl: block.blocked.profile?.avatarUrl,
          },
          reason: block.reason,
          blockedAt: block.createdAt,
        })),
      };
    } catch (error) {
      logger.error('Error in getBlockedUsers service:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Get unread message count
   */
  async getUnreadCount(userId: string) {
    try {
      const count = await this.repository.getUnreadCount(userId);
      return { unreadCount: count };
    } catch (error) {
      logger.error('Error in getUnreadCount service:', error);
      Sentry.captureException(error);
      throw error;
    }
  }
}
