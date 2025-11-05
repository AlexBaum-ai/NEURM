import { z } from 'zod';
import { ReputationLevel, ReputationEventType } from '@prisma/client';

/**
 * Reputation Validators
 *
 * Zod schemas for validating reputation-related requests and responses
 */

// ============================================================================
// REQUEST VALIDATORS
// ============================================================================

/**
 * Validator for getting user reputation
 */
export const getUserReputationSchema = z.object({
  params: z.object({
    userId: z.string().uuid('Invalid user ID format'),
  }),
});

export type GetUserReputationRequest = z.infer<typeof getUserReputationSchema>;

// ============================================================================
// RESPONSE VALIDATORS
// ============================================================================

/**
 * Reputation breakdown response
 */
export const reputationBreakdownSchema = z.object({
  topicsCreated: z.number().int(),
  repliesCreated: z.number().int(),
  upvotesReceived: z.number().int(),
  downvotesReceived: z.number().int(),
  bestAnswers: z.number().int(),
  badgesEarned: z.number().int(),
  penalties: z.number().int(),
});

export type ReputationBreakdown = z.infer<typeof reputationBreakdownSchema>;

/**
 * Recent activity item response
 */
export const recentActivityItemSchema = z.object({
  id: z.string().uuid(),
  eventType: z.nativeEnum(ReputationEventType),
  points: z.number().int(),
  description: z.string(),
  referenceId: z.string().uuid().nullable(),
  createdAt: z.date(),
});

export type RecentActivityItem = z.infer<typeof recentActivityItemSchema>;

/**
 * Level progress response
 */
export const levelProgressSchema = z.object({
  current: z.number().int().min(0),
  nextLevelThreshold: z.number().int().min(0).nullable(),
  percentage: z.number().int().min(0).max(100),
});

export type LevelProgress = z.infer<typeof levelProgressSchema>;

/**
 * Permissions response
 */
export const permissionsSchema = z.object({
  canDownvote: z.boolean(),
  canEditOthersContent: z.boolean(),
  canModerate: z.boolean(),
});

export type Permissions = z.infer<typeof permissionsSchema>;

/**
 * Complete reputation response
 */
export const reputationResponseSchema = z.object({
  userId: z.string().uuid(),
  totalReputation: z.number().int().min(0),
  level: z.nativeEnum(ReputationLevel),
  levelProgress: levelProgressSchema,
  breakdown: reputationBreakdownSchema,
  recentActivity: z.array(recentActivityItemSchema),
  permissions: permissionsSchema,
});

export type ReputationResponse = z.infer<typeof reputationResponseSchema>;

// ============================================================================
// HELPER VALIDATORS
// ============================================================================

/**
 * Reputation level enum values
 */
export const reputationLevelValues = [
  'newcomer',
  'contributor',
  'expert',
  'master',
  'legend',
] as const;

/**
 * Reputation event type enum values
 */
export const reputationEventTypeValues = [
  'topic_created',
  'reply_created',
  'upvote_received',
  'downvote_received',
  'best_answer',
  'badge_earned',
  'penalty',
] as const;

/**
 * Level thresholds for display purposes
 */
export const LEVEL_THRESHOLDS = {
  newcomer: { min: 0, max: 99, name: 'Newcomer' },
  contributor: { min: 100, max: 499, name: 'Contributor' },
  expert: { min: 500, max: 999, name: 'Expert' },
  master: { min: 1000, max: 2499, name: 'Master' },
  legend: { min: 2500, max: Infinity, name: 'Legend' },
} as const;

/**
 * Reputation points for different actions
 */
export const REPUTATION_POINTS = {
  topic_created: 5,
  reply_created: 2,
  upvote_received: 10,
  downvote_received: -5,
  best_answer: 25,
} as const;
