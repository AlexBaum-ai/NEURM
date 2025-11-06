import { z } from 'zod';
import { ActivityType, ActivityTargetType, PrivacyVisibility } from '@prisma/client';

export const activityTypeSchema = z.enum([
  'posted_article',
  'created_topic',
  'replied',
  'upvoted',
  'bookmarked',
  'applied_job',
  'earned_badge',
  'followed_user',
]);

export const activityTargetTypeSchema = z.enum([
  'article',
  'topic',
  'reply',
  'job',
  'badge',
  'user',
]);

export const privacyVisibilitySchema = z.enum([
  'public',
  'community',
  'recruiters',
  'private',
]);

export const createActivitySchema = z.object({
  activityType: activityTypeSchema,
  targetType: activityTargetTypeSchema,
  targetId: z.string().uuid('Invalid target ID format'),
  privacy: privacyVisibilitySchema.default('public').optional(),
  metadata: z.record(z.any()).optional(),
});

export const getUserActivitySchema = z.object({
  username: z.string().min(1, 'Username is required'),
  type: activityTypeSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
  offset: z.coerce.number().int().min(0).default(0).optional(),
});

export const getFollowingFeedSchema = z.object({
  type: activityTypeSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
  offset: z.coerce.number().int().min(0).default(0).optional(),
});

export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type GetUserActivityInput = z.infer<typeof getUserActivitySchema>;
export type GetFollowingFeedInput = z.infer<typeof getFollowingFeedSchema>;
