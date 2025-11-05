import { Router } from 'express';
import { MessagingController } from './messaging.controller';
import { authMiddleware } from '@/middleware/auth.middleware';
import { createRateLimiter } from '@/middleware/rateLimiter.middleware';

const router = Router();
const controller = new MessagingController();

// All messaging routes require authentication
router.use(authMiddleware);

// Rate limiters
const messageRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 messages per minute
  message: 'Too many messages sent. Please try again later.',
});

const conversationRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
});

/**
 * @route   POST /api/v1/messages
 * @desc    Send a new message
 * @access  Private
 */
router.post('/messages', messageRateLimiter, controller.sendMessage);

/**
 * @route   GET /api/v1/conversations
 * @desc    Get user's conversations
 * @access  Private
 */
router.get('/conversations', conversationRateLimiter, controller.getConversations);

/**
 * @route   GET /api/v1/conversations/:id/messages
 * @desc    Get messages in a conversation
 * @access  Private
 */
router.get('/conversations/:id/messages', conversationRateLimiter, controller.getConversationMessages);

/**
 * @route   PUT /api/v1/messages/:id/read
 * @desc    Mark a message as read
 * @access  Private
 */
router.put('/messages/:id/read', conversationRateLimiter, controller.markMessageAsRead);

/**
 * @route   DELETE /api/v1/conversations/:id
 * @desc    Delete a conversation
 * @access  Private
 */
router.delete('/conversations/:id', conversationRateLimiter, controller.deleteConversation);

/**
 * @route   POST /api/v1/users/:id/block
 * @desc    Block a user from messaging
 * @access  Private
 */
router.post('/users/:id/block', conversationRateLimiter, controller.blockUser);

/**
 * @route   DELETE /api/v1/users/:id/block
 * @desc    Unblock a user
 * @access  Private
 */
router.delete('/users/:id/block', conversationRateLimiter, controller.unblockUser);

/**
 * @route   GET /api/v1/users/blocked
 * @desc    Get list of blocked users
 * @access  Private
 */
router.get('/users/blocked', conversationRateLimiter, controller.getBlockedUsers);

/**
 * @route   GET /api/v1/messages/unread-count
 * @desc    Get unread message count
 * @access  Private
 */
router.get('/messages/unread-count', conversationRateLimiter, controller.getUnreadCount);

export default router;
