import { z } from 'zod';

/**
 * Track Profile View Schema
 * POST /api/v1/profiles/:username/view
 */
export const trackProfileViewSchema = z.object({
  params: z.object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(50, 'Username must be at most 50 characters')
      .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  }),
  body: z
    .object({
      anonymous: z.boolean().optional().default(false),
    })
    .optional()
    .default({}),
});

export type TrackProfileViewInput = z.infer<typeof trackProfileViewSchema>;

/**
 * Get My Profile Viewers Schema
 * GET /api/v1/profiles/me/views
 */
export const getMyProfileViewersSchema = z.object({
  query: z.object({
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
      .refine((val) => val >= 1 && val <= 100, 'Limit must be between 1 and 100'),
  }),
});

export type GetMyProfileViewersInput = z.infer<typeof getMyProfileViewersSchema>;

/**
 * Get Profile View Count Schema
 * GET /api/v1/profiles/:username/view-count
 */
export const getProfileViewCountSchema = z.object({
  params: z.object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(50, 'Username must be at most 50 characters')
      .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  }),
});

export type GetProfileViewCountInput = z.infer<typeof getProfileViewCountSchema>;
