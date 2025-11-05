import { z } from 'zod';

/**
 * Validator schemas for forum reply operations
 *
 * Features:
 * - Create, update, delete reply
 * - Quote functionality
 * - @mention support
 * - Max 3 levels of threading
 * - Edit restrictions (within 15 min)
 */

// Base reply content validation
const replyContentSchema = z.string()
  .min(1, 'Reply content is required')
  .min(10, 'Reply must be at least 10 characters')
  .max(10000, 'Reply must not exceed 10,000 characters');

// Validation for creating a new reply
export const createReplySchema = z.object({
  content: replyContentSchema,
  parentReplyId: z.string().uuid().optional()
    .describe('Parent reply ID for threading (max 3 levels)'),
  quotedReplyId: z.string().uuid().optional()
    .describe('Reply being quoted'),
});

export type CreateReplyInput = z.infer<typeof createReplySchema>;

// Validation for updating an existing reply
export const updateReplySchema = z.object({
  content: replyContentSchema,
  editReason: z.string()
    .min(1, 'Edit reason is required')
    .max(500, 'Edit reason must not exceed 500 characters')
    .optional()
    .describe('Reason for editing (optional, visible to moderators)'),
});

export type UpdateReplyInput = z.infer<typeof updateReplySchema>;

// Validation for accepting an answer (question topics only)
export const acceptAnswerSchema = z.object({
  replyId: z.string().uuid(),
});

export type AcceptAnswerInput = z.infer<typeof acceptAnswerSchema>;

// Validation for listing replies with sorting and filtering
export const listRepliesQuerySchema = z.object({
  sort: z.enum(['oldest', 'newest', 'most_voted'])
    .optional()
    .default('oldest')
    .describe('Sort order for replies'),
  includeDeleted: z.string()
    .transform(val => val === 'true')
    .optional()
    .default('false')
    .describe('Include deleted replies (moderators only)'),
});

export type ListRepliesQuery = z.infer<typeof listRepliesQuerySchema>;

// Validation for UUID parameters
export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid reply ID format'),
});

export const topicIdParamSchema = z.object({
  topicId: z.string().uuid('Invalid topic ID format'),
});

export type UuidParam = z.infer<typeof uuidParamSchema>;
export type TopicIdParam = z.infer<typeof topicIdParamSchema>;

/**
 * Helper function to extract @mentions from content
 * @param content - Reply content
 * @returns Array of mentioned usernames
 */
export function extractMentions(content: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1]);
  }

  // Return unique mentions
  return [...new Set(mentions)];
}

/**
 * Helper function to validate threading depth
 * @param depth - Current nesting depth
 * @param maxDepth - Maximum allowed depth (default 3)
 * @returns true if valid, false otherwise
 */
export function validateThreadingDepth(depth: number, maxDepth: number = 3): boolean {
  return depth < maxDepth;
}

/**
 * Helper function to check if edit is within time limit
 * @param createdAt - Reply creation timestamp
 * @param editLimitMinutes - Edit time limit in minutes (default 15)
 * @returns true if within limit, false otherwise
 */
export function isWithinEditTimeLimit(
  createdAt: Date,
  editLimitMinutes: number = 15
): boolean {
  const now = new Date();
  const diffMs = now.getTime() - createdAt.getTime();
  const diffMinutes = diffMs / (1000 * 60);
  return diffMinutes <= editLimitMinutes;
}
