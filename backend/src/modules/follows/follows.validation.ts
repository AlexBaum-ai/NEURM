import { z } from 'zod';
import { FollowableType } from '@prisma/client';

export const followableTypeSchema = z.enum([
  'user',
  'company',
  'tag',
  'category',
  'model',
]);

export const createFollowSchema = z.object({
  followableType: followableTypeSchema,
  followableId: z.string().uuid('Invalid followable ID format'),
});

export const unfollowSchema = z.object({
  id: z.string().uuid('Invalid follow ID format'),
});

export const getFollowingSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  type: followableTypeSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
  offset: z.coerce.number().int().min(0).default(0).optional(),
});

export const getFollowersSchema = z.object({
  followableType: followableTypeSchema,
  followableId: z.string().uuid('Invalid followable ID format'),
  limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
  offset: z.coerce.number().int().min(0).default(0).optional(),
});

export const getFeedSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
  offset: z.coerce.number().int().min(0).default(0).optional(),
  type: z
    .enum(['articles', 'topics', 'jobs', 'all'])
    .default('all')
    .optional(),
});

export const isFollowingSchema = z.object({
  followableType: followableTypeSchema,
  followableId: z.string().uuid('Invalid followable ID format'),
});

export type CreateFollowInput = z.infer<typeof createFollowSchema>;
export type UnfollowInput = z.infer<typeof unfollowSchema>;
export type GetFollowingInput = z.infer<typeof getFollowingSchema>;
export type GetFollowersInput = z.infer<typeof getFollowersSchema>;
export type GetFeedInput = z.infer<typeof getFeedSchema>;
export type IsFollowingInput = z.infer<typeof isFollowingSchema>;
