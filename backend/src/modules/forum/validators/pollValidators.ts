import { z } from 'zod';
import { PollType } from '@prisma/client';

/**
 * Poll Validators
 *
 * Zod schemas for validating poll-related requests
 */

// Poll type enum
export const pollTypeSchema = z.enum(['single', 'multiple']);

// Create poll request body
export const createPollSchema = z.object({
  topicId: z.string().uuid().optional(),
  question: z
    .string()
    .min(5, 'Poll question must be at least 5 characters')
    .max(255, 'Poll question cannot exceed 255 characters'),
  pollType: pollTypeSchema,
  isAnonymous: z.boolean().optional().default(true),
  deadline: z
    .string()
    .datetime()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  options: z
    .array(
      z
        .string()
        .min(1, 'Poll option cannot be empty')
        .max(200, 'Poll option cannot exceed 200 characters')
    )
    .min(2, 'Poll must have at least 2 options')
    .max(10, 'Poll cannot have more than 10 options'),
});

export type CreatePollInput = z.infer<typeof createPollSchema>;

// Vote on poll request body
export const votePollSchema = z.object({
  optionIds: z
    .array(z.string().uuid('Invalid option ID format'))
    .min(1, 'You must select at least one option')
    .max(10, 'Cannot select more than 10 options'),
});

export type VotePollInput = z.infer<typeof votePollSchema>;

// Poll ID parameter
export const pollIdParamSchema = z.object({
  id: z.string().uuid('Invalid poll ID format'),
});

export type PollIdParam = z.infer<typeof pollIdParamSchema>;

// Topic ID parameter (for getting poll by topic)
export const topicIdParamSchema = z.object({
  topicId: z.string().uuid('Invalid topic ID format'),
});

export type TopicIdParam = z.infer<typeof topicIdParamSchema>;

// Get poll results query parameters
export const getPollResultsQuerySchema = z.object({
  includeVotes: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
});

export type GetPollResultsQuery = z.infer<typeof getPollResultsQuerySchema>;
