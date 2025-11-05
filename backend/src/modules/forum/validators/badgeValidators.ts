import { z } from 'zod';

/**
 * Badge Validators
 *
 * Zod schemas for badge-related endpoints
 */

/**
 * GET /api/badges
 * Query parameters for filtering badges
 */
export const getBadgesSchema = z.object({
  query: z
    .object({
      category: z.enum(['skill', 'activity', 'special']).optional(),
      type: z.enum(['bronze', 'silver', 'gold', 'platinum']).optional(),
    })
    .optional(),
});

/**
 * GET /api/badges/:badgeId
 * Get single badge by ID
 */
export const getBadgeByIdSchema = z.object({
  params: z.object({
    badgeId: z.string().uuid('Invalid badge ID format'),
  }),
});

/**
 * GET /api/badges/:badgeId/holders
 * Get users who earned a specific badge
 */
export const getBadgeHoldersSchema = z.object({
  params: z.object({
    badgeId: z.string().uuid('Invalid badge ID format'),
  }),
  query: z
    .object({
      limit: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : 50))
        .refine((val) => val > 0 && val <= 100, {
          message: 'Limit must be between 1 and 100',
        }),
    })
    .optional(),
});

/**
 * GET /api/users/:userId/badges
 * Get user's earned badges
 */
export const getUserBadgesSchema = z.object({
  params: z.object({
    userId: z.string().uuid('Invalid user ID format'),
  }),
  query: z
    .object({
      includeProgress: z
        .string()
        .optional()
        .transform((val) => val === 'true'),
    })
    .optional(),
});

/**
 * GET /api/users/:userId/badges/progress
 * Get badge progress for user
 */
export const getUserBadgeProgressSchema = z.object({
  params: z.object({
    userId: z.string().uuid('Invalid user ID format'),
  }),
});

/**
 * POST /api/badges (Admin only)
 * Create a new badge
 */
export const createBadgeSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, 'Badge name is required')
      .max(100, 'Badge name must be at most 100 characters'),
    slug: z
      .string()
      .min(1, 'Badge slug is required')
      .max(100, 'Badge slug must be at most 100 characters')
      .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
    description: z.string().min(1, 'Badge description is required'),
    iconUrl: z.string().url('Invalid icon URL'),
    badgeType: z.enum(['bronze', 'silver', 'gold', 'platinum'], {
      errorMap: () => ({ message: 'Invalid badge type' }),
    }),
    category: z.enum(['skill', 'activity', 'special'], {
      errorMap: () => ({ message: 'Invalid badge category' }),
    }),
    criteria: z.object({
      type: z.enum([
        'reply_count',
        'topic_count',
        'upvote_count',
        'reputation',
        'best_answer_count',
        'streak_days',
        'vote_count',
        'accepted_answer_count',
      ]),
      threshold: z.number().int().positive('Threshold must be a positive integer'),
      timeframe: z.enum(['all_time', '30_days', '7_days']).optional(),
    }),
  }),
});

/**
 * POST /api/users/:userId/badges/check
 * Manually trigger badge check for user (admin/system only)
 */
export const checkUserBadgesSchema = z.object({
  params: z.object({
    userId: z.string().uuid('Invalid user ID format'),
  }),
});
