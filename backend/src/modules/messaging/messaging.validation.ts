import { z } from 'zod';

/**
 * Messaging Validation Schemas
 * Defines validation rules for messaging endpoints
 */

// Send message schema
export const sendMessageSchema = z.object({
  recipientId: z.string().uuid('Invalid recipient ID'),
  content: z
    .string()
    .min(1, 'Message content cannot be empty')
    .max(10000, 'Message content too long (max 10000 characters)'),
  contentFormat: z.enum(['markdown', 'plain']).default('markdown'),
  attachments: z
    .array(
      z.object({
        filename: z.string(),
        url: z.string().url(),
        storageKey: z.string(),
        mimeType: z.string(),
        fileSize: z.number().max(10 * 1024 * 1024, 'File size exceeds 10MB limit'),
        width: z.number().optional(),
        height: z.number().optional(),
      })
    )
    .max(5, 'Maximum 5 attachments per message')
    .optional(),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

// Get conversations query schema
export const getConversationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
});

export type GetConversationsQuery = z.infer<typeof getConversationsQuerySchema>;

// Get conversation messages query schema
export const getConversationMessagesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  before: z.string().datetime().optional(), // ISO timestamp for pagination
});

export type GetConversationMessagesQuery = z.infer<typeof getConversationMessagesQuerySchema>;

// Mark message as read schema
export const markMessageReadSchema = z.object({
  messageId: z.string().uuid('Invalid message ID'),
});

export type MarkMessageReadInput = z.infer<typeof markMessageReadSchema>;

// Delete conversation schema
export const deleteConversationSchema = z.object({
  conversationId: z.string().uuid('Invalid conversation ID'),
});

export type DeleteConversationInput = z.infer<typeof deleteConversationSchema>;

// Block user schema
export const blockUserSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  reason: z.string().max(500, 'Reason too long (max 500 characters)').optional(),
});

export type BlockUserInput = z.infer<typeof blockUserSchema>;

// Unblock user schema
export const unblockUserSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

export type UnblockUserInput = z.infer<typeof unblockUserSchema>;

// UUID param schema
export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid ID'),
});

export type UuidParam = z.infer<typeof uuidParamSchema>;
