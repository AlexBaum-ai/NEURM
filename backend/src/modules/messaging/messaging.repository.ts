import { PrismaClient, Conversation, ConversationMessage, MessageAttachment, UserBlock } from '@prisma/client';
import * as Sentry from '@sentry/node';
import logger from '@/utils/logger';

/**
 * MessagingRepository
 * Data access layer for messaging operations
 */
export class MessagingRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Find or create a conversation between two users
   */
  async findOrCreateConversation(userId1: string, userId2: string): Promise<Conversation> {
    try {
      // Ensure consistent ordering to prevent duplicate conversations
      const [participant1Id, participant2Id] = [userId1, userId2].sort();

      // Try to find existing conversation
      let conversation = await this.prisma.conversation.findFirst({
        where: {
          OR: [
            { participant1Id: participant1Id, participant2Id: participant2Id },
            { participant1Id: participant2Id, participant2Id: participant1Id },
          ],
        },
      });

      // Create if doesn't exist
      if (!conversation) {
        conversation = await this.prisma.conversation.create({
          data: {
            participant1Id,
            participant2Id,
          },
        });
      }

      return conversation;
    } catch (error) {
      logger.error('Error finding or creating conversation:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Get user's conversations with pagination and search
   */
  async getUserConversations(
    userId: string,
    options: {
      page: number;
      limit: number;
      search?: string;
    }
  ): Promise<{
    conversations: Array<
      Conversation & {
        participant1: { id: string; username: string; profile: { displayName: string | null; avatarUrl: string | null } | null };
        participant2: { id: string; username: string; profile: { displayName: string | null; avatarUrl: string | null } | null };
        messages: Array<{ id: string; content: string; senderId: string; readAt: Date | null; createdAt: Date }>;
        _count: { messages: number };
      }
    >;
    total: number;
    unreadCount: number;
  }> {
    try {
      const { page, limit, search } = options;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {
        OR: [{ participant1Id: userId }, { participant2Id: userId }],
      };

      // Add search filter if provided
      if (search) {
        where.OR = [
          {
            participant1Id: userId,
            participant2: {
              OR: [
                { username: { contains: search, mode: 'insensitive' } },
                { profile: { displayName: { contains: search, mode: 'insensitive' } } },
              ],
            },
          },
          {
            participant2Id: userId,
            participant1: {
              OR: [
                { username: { contains: search, mode: 'insensitive' } },
                { profile: { displayName: { contains: search, mode: 'insensitive' } } },
              ],
            },
          },
        ];
      }

      // Get conversations with participants and last message
      const conversations = await this.prisma.conversation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { lastMessageAt: 'desc' },
        include: {
          participant1: {
            select: {
              id: true,
              username: true,
              profile: { select: { displayName: true, avatarUrl: true } },
            },
          },
          participant2: {
            select: {
              id: true,
              username: true,
              profile: { select: { displayName: true, avatarUrl: true } },
            },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              content: true,
              senderId: true,
              readAt: true,
              createdAt: true,
            },
          },
          _count: {
            select: { messages: true },
          },
        },
      });

      // Get total count
      const total = await this.prisma.conversation.count({ where });

      // Get unread count
      const unreadCount = await this.prisma.conversationMessage.count({
        where: {
          conversation: {
            OR: [{ participant1Id: userId }, { participant2Id: userId }],
          },
          senderId: { not: userId },
          readAt: null,
        },
      });

      return { conversations, total, unreadCount };
    } catch (error) {
      logger.error('Error getting user conversations:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Get conversation by ID
   */
  async getConversationById(conversationId: string, userId: string): Promise<Conversation | null> {
    try {
      return await this.prisma.conversation.findFirst({
        where: {
          id: conversationId,
          OR: [{ participant1Id: userId }, { participant2Id: userId }],
        },
      });
    } catch (error) {
      logger.error('Error getting conversation by ID:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Get conversation messages with pagination
   */
  async getConversationMessages(
    conversationId: string,
    options: {
      page: number;
      limit: number;
      before?: string;
    }
  ): Promise<{
    messages: Array<
      ConversationMessage & {
        sender: { id: string; username: string; profile: { displayName: string | null; avatarUrl: string | null } | null };
        attachments: MessageAttachment[];
      }
    >;
    total: number;
  }> {
    try {
      const { page, limit, before } = options;
      const skip = (page - 1) * limit;

      const where: any = {
        conversationId,
        isDeleted: false,
      };

      if (before) {
        where.createdAt = { lt: new Date(before) };
      }

      const messages = await this.prisma.conversationMessage.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              profile: { select: { displayName: true, avatarUrl: true } },
            },
          },
          attachments: true,
        },
      });

      const total = await this.prisma.conversationMessage.count({ where });

      return { messages, total };
    } catch (error) {
      logger.error('Error getting conversation messages:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Create a new message
   */
  async createMessage(data: {
    conversationId: string;
    senderId: string;
    content: string;
    contentFormat: string;
    attachments?: Array<{
      filename: string;
      originalFilename: string;
      mimeType: string;
      fileSize: number;
      url: string;
      storageKey: string;
      width?: number;
      height?: number;
    }>;
  }): Promise<ConversationMessage & { attachments: MessageAttachment[] }> {
    try {
      const message = await this.prisma.conversationMessage.create({
        data: {
          conversationId: data.conversationId,
          senderId: data.senderId,
          content: data.content,
          contentFormat: data.contentFormat,
          attachments: data.attachments
            ? {
                create: data.attachments.map((att) => ({
                  filename: att.filename,
                  originalFilename: att.originalFilename || att.filename,
                  mimeType: att.mimeType,
                  fileSize: att.fileSize,
                  url: att.url,
                  storageKey: att.storageKey,
                  width: att.width,
                  height: att.height,
                })),
              }
            : undefined,
        },
        include: {
          attachments: true,
        },
      });

      // Update conversation's last message
      await this.prisma.conversation.update({
        where: { id: data.conversationId },
        data: {
          lastMessageAt: new Date(),
          lastMessageText: data.content.substring(0, 500),
        },
      });

      return message;
    } catch (error) {
      logger.error('Error creating message:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Mark message as read
   */
  async markMessageAsRead(messageId: string, userId: string): Promise<ConversationMessage | null> {
    try {
      // Only mark as read if current user is the recipient (not the sender)
      const message = await this.prisma.conversationMessage.findFirst({
        where: {
          id: messageId,
          senderId: { not: userId },
          readAt: null,
        },
      });

      if (!message) {
        return null;
      }

      return await this.prisma.conversationMessage.update({
        where: { id: messageId },
        data: { readAt: new Date() },
      });
    } catch (error) {
      logger.error('Error marking message as read:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Mark all messages in a conversation as read
   */
  async markConversationAsRead(conversationId: string, userId: string): Promise<number> {
    try {
      const result = await this.prisma.conversationMessage.updateMany({
        where: {
          conversationId,
          senderId: { not: userId },
          readAt: null,
        },
        data: { readAt: new Date() },
      });

      return result.count;
    } catch (error) {
      logger.error('Error marking conversation as read:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Delete a conversation (soft delete all messages)
   */
  async deleteConversation(conversationId: string, userId: string): Promise<boolean> {
    try {
      // Verify user is a participant
      const conversation = await this.prisma.conversation.findFirst({
        where: {
          id: conversationId,
          OR: [{ participant1Id: userId }, { participant2Id: userId }],
        },
      });

      if (!conversation) {
        return false;
      }

      // Actually delete the conversation and cascade to messages
      await this.prisma.conversation.delete({
        where: { id: conversationId },
      });

      return true;
    } catch (error) {
      logger.error('Error deleting conversation:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Block a user
   */
  async blockUser(blockerId: string, blockedId: string, reason?: string): Promise<UserBlock> {
    try {
      return await this.prisma.userBlock.create({
        data: {
          blockerId,
          blockedId,
          reason,
        },
      });
    } catch (error) {
      logger.error('Error blocking user:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Unblock a user
   */
  async unblockUser(blockerId: string, blockedId: string): Promise<boolean> {
    try {
      const result = await this.prisma.userBlock.deleteMany({
        where: {
          blockerId,
          blockedId,
        },
      });

      return result.count > 0;
    } catch (error) {
      logger.error('Error unblocking user:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Check if user is blocked
   */
  async isUserBlocked(userId1: string, userId2: string): Promise<boolean> {
    try {
      const block = await this.prisma.userBlock.findFirst({
        where: {
          OR: [
            { blockerId: userId1, blockedId: userId2 },
            { blockerId: userId2, blockedId: userId1 },
          ],
        },
      });

      return !!block;
    } catch (error) {
      logger.error('Error checking if user is blocked:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Get user's blocked list
   */
  async getBlockedUsers(userId: string): Promise<
    Array<
      UserBlock & {
        blocked: { id: string; username: string; profile: { displayName: string | null; avatarUrl: string | null } | null };
      }
    >
  > {
    try {
      return await this.prisma.userBlock.findMany({
        where: { blockerId: userId },
        include: {
          blocked: {
            select: {
              id: true,
              username: true,
              profile: { select: { displayName: true, avatarUrl: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      logger.error('Error getting blocked users:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Get unread message count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      return await this.prisma.conversationMessage.count({
        where: {
          conversation: {
            OR: [{ participant1Id: userId }, { participant2Id: userId }],
          },
          senderId: { not: userId },
          readAt: null,
        },
      });
    } catch (error) {
      logger.error('Error getting unread count:', error);
      Sentry.captureException(error);
      throw error;
    }
  }
}
