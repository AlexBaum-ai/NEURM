import { z } from 'zod';

/**
 * Validation schemas for moderation endpoints
 */

// Common ID parameter validation
export const topicIdParamSchema = z.object({
  id: z.string().uuid('Invalid topic ID'),
});

export const userIdParamSchema = z.object({
  id: z.string().uuid('Invalid user ID'),
});

// Pin topic
export const pinTopicSchema = z.object({
  isPinned: z.boolean({
    required_error: 'isPinned is required',
    invalid_type_error: 'isPinned must be a boolean',
  }),
  reason: z.string().max(500, 'Reason must be at most 500 characters').optional(),
});

// Lock topic
export const lockTopicSchema = z.object({
  isLocked: z.boolean({
    required_error: 'isLocked is required',
    invalid_type_error: 'isLocked must be a boolean',
  }),
  reason: z.string().max(500, 'Reason must be at most 500 characters').optional(),
});

// Move topic
export const moveTopicSchema = z.object({
  categoryId: z.string().uuid('Invalid category ID'),
  reason: z.string().max(500, 'Reason must be at most 500 characters').optional(),
});

// Merge topics
export const mergeTopicsSchema = z.object({
  targetTopicId: z.string().uuid('Invalid target topic ID'),
  reason: z.string().max(500, 'Reason must be at most 500 characters').optional(),
});

// Delete topic (hard delete)
export const deleteTopicSchema = z.object({
  reason: z
    .string()
    .min(10, 'Reason must be at least 10 characters')
    .max(500, 'Reason must be at most 500 characters'),
});

// Warn user
export const warnUserSchema = z.object({
  reason: z
    .string()
    .min(10, 'Reason must be at least 10 characters')
    .max(500, 'Reason must be at most 500 characters'),
});

// Suspend user
export const suspendUserSchema = z.object({
  reason: z
    .string()
    .min(10, 'Reason must be at least 10 characters')
    .max(500, 'Reason must be at most 500 characters'),
  duration: z
    .number()
    .int('Duration must be an integer')
    .min(1, 'Duration must be at least 1 day')
    .max(365, 'Duration must be at most 365 days')
    .optional(),
});

// Ban user
export const banUserSchema = z.object({
  reason: z
    .string()
    .min(10, 'Reason must be at least 10 characters')
    .max(500, 'Reason must be at most 500 characters'),
});

// Moderation logs query parameters
export const moderationLogsQuerySchema = z.object({
  moderatorId: z.string().uuid().optional(),
  action: z.string().max(100).optional(),
  targetType: z.enum(['topic', 'reply', 'user']).optional(),
  targetId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional().or(z.string().date().optional()),
  endDate: z.string().datetime().optional().or(z.string().date().optional()),
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, 'Page must be greater than 0'),
  limit: z
    .string()
    .optional()
    .default('20')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
  sortBy: z.enum(['createdAt', 'action']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});
