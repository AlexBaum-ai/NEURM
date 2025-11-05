import { z } from 'zod';

/**
 * Validation schemas for news tags endpoints
 */

export const getTagsQuerySchema = z.object({
  search: z
    .string()
    .max(50, 'Search query must be 50 characters or less')
    .optional(),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 50))
    .pipe(z.number().min(1).max(100))
    .default(50),
  sortBy: z
    .enum(['name', 'usageCount', 'createdAt'])
    .optional()
    .default('usageCount'),
  sortOrder: z
    .enum(['asc', 'desc'])
    .optional()
    .default('desc'),
});

export const tagSlugParamSchema = z.object({
  slug: z
    .string()
    .min(1, 'Tag slug is required')
    .max(50, 'Tag slug must be 50 characters or less')
    .regex(/^[a-z0-9-]+$/, 'Tag slug must contain only lowercase letters, numbers, and hyphens'),
});

export type GetTagsQuery = z.infer<typeof getTagsQuerySchema>;
export type TagSlugParam = z.infer<typeof tagSlugParamSchema>;
