import { z } from 'zod';

/**
 * Validation schemas for news categories endpoints
 */

export const getCategoriesQuerySchema = z.object({
  includeInactive: z
    .string()
    .optional()
    .transform((val) => val === 'true')
    .pipe(z.boolean())
    .default(false),
});

export const categorySlugParamSchema = z.object({
  slug: z
    .string()
    .min(1, 'Category slug is required')
    .max(100, 'Category slug must be 100 characters or less')
    .regex(/^[a-z0-9-]+$/, 'Category slug must contain only lowercase letters, numbers, and hyphens'),
});

export type GetCategoriesQuery = z.infer<typeof getCategoriesQuerySchema>;
export type CategorySlugParam = z.infer<typeof categorySlugParamSchema>;
