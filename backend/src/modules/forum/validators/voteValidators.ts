import { z } from 'zod';

/**
 * Vote Validation Schemas
 *
 * Defines Zod validation schemas for forum voting operations:
 * - Topic and reply voting
 * - Vote value constraints (upvote +1, downvote -1, remove 0)
 * - Parameter validation
 */

// Vote values enum
export const voteValues = [1, -1, 0] as const;

/**
 * Vote action validation schema
 * Validates the vote action in request body
 *
 * vote: 1 (upvote), -1 (downvote), 0 (remove vote)
 */
export const voteActionSchema = z.object({
  vote: z
    .number()
    .refine((val) => voteValues.includes(val as any), {
      message: 'Vote must be 1 (upvote), -1 (downvote), or 0 (remove)',
    }),
});

export type VoteActionInput = z.infer<typeof voteActionSchema>;

/**
 * Topic ID parameter validation
 */
export const topicIdParamSchema = z.object({
  id: z.string().uuid('Invalid topic ID'),
});

/**
 * Reply ID parameter validation
 */
export const replyIdParamSchema = z.object({
  id: z.string().uuid('Invalid reply ID'),
});

/**
 * Vote type for discriminating between topic and reply votes
 */
export type VoteType = 'topic' | 'reply';

/**
 * Vote result type returned by vote operations
 */
export interface VoteResult {
  success: boolean;
  voteScore: number;
  upvoteCount: number;
  downvoteCount: number;
  userVote: number; // Current user's vote value
  hidden?: boolean; // Whether the post is hidden due to low score
}

/**
 * User's vote history item
 */
export interface UserVoteItem {
  id: string;
  type: VoteType;
  targetId: string;
  targetTitle: string;
  value: number;
  votedAt: Date;
}

/**
 * Get user votes query parameters
 */
export const getUserVotesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.enum(['topic', 'reply']).optional(),
});

export type GetUserVotesQuery = z.infer<typeof getUserVotesQuerySchema>;
