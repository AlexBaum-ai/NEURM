import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';
import { MessagingService } from './messaging.service';
import {
  sendMessageSchema,
  getConversationsQuerySchema,
  getConversationMessagesQuerySchema,
  markMessageReadSchema,
  deleteConversationSchema,
  blockUserSchema,
  unblockUserSchema,
  uuidParamSchema,
} from './messaging.validation';
import { BadRequestError } from '@/utils/errors';
import logger from '@/utils/logger';
import { BaseController } from '@/utils/baseController';

/**
 * MessagingController
 * Handles HTTP requests for messaging endpoints
 */
export class MessagingController extends BaseController {
  private service: MessagingService;

  constructor(service?: MessagingService) {
    super();
    this.service = service || new MessagingService();
  }

  /**
   * POST /api/v1/messages
   * Send a new message
   */
  sendMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      const validatedData = sendMessageSchema.parse(req.body);
      const result = await this.service.sendMessage(userId, validatedData);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      this.handleError(res, error, 'Error sending message');
    }
  };

  /**
   * GET /api/v1/conversations
   * Get user's conversations
   */
  getConversations = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      const validatedQuery = getConversationsQuerySchema.parse(req.query);
      const result = await this.service.getUserConversations(userId, validatedQuery);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      this.handleError(res, error, 'Error fetching conversations');
    }
  };

  /**
   * GET /api/v1/conversations/:id/messages
   * Get messages in a conversation
   */
  getConversationMessages = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      const { id: conversationId } = uuidParamSchema.parse(req.params);
      const validatedQuery = getConversationMessagesQuerySchema.parse(req.query);

      const result = await this.service.getConversationMessages(userId, conversationId, validatedQuery);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      this.handleError(res, error, 'Error fetching conversation messages');
    }
  };

  /**
   * PUT /api/v1/messages/:id/read
   * Mark a message as read
   */
  markMessageAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      const { id: messageId } = uuidParamSchema.parse(req.params);
      const result = await this.service.markMessageAsRead(userId, messageId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      this.handleError(res, error, 'Error marking message as read');
    }
  };

  /**
   * DELETE /api/v1/conversations/:id
   * Delete a conversation
   */
  deleteConversation = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      const { id: conversationId } = uuidParamSchema.parse(req.params);
      const result = await this.service.deleteConversation(userId, conversationId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      this.handleError(res, error, 'Error deleting conversation');
    }
  };

  /**
   * POST /api/v1/users/:id/block
   * Block a user from messaging
   */
  blockUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      const { id: targetUserId } = uuidParamSchema.parse(req.params);
      const { reason } = req.body;

      const result = await this.service.blockUser(userId, {
        userId: targetUserId,
        reason,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      this.handleError(res, error, 'Error blocking user');
    }
  };

  /**
   * DELETE /api/v1/users/:id/block
   * Unblock a user
   */
  unblockUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      const { id: targetUserId } = uuidParamSchema.parse(req.params);
      const result = await this.service.unblockUser(userId, targetUserId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      this.handleError(res, error, 'Error unblocking user');
    }
  };

  /**
   * GET /api/v1/users/blocked
   * Get list of blocked users
   */
  getBlockedUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      const result = await this.service.getBlockedUsers(userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      this.handleError(res, error, 'Error fetching blocked users');
    }
  };

  /**
   * GET /api/v1/messages/unread-count
   * Get unread message count
   */
  getUnreadCount = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      const result = await this.service.getUnreadCount(userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      this.handleError(res, error, 'Error fetching unread count');
    }
  };
}
