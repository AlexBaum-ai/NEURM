import { z } from 'zod';
import { ModelCategory } from '@prisma/client';

/**
 * List models query validation
 */
export const listModelsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  provider: z.string().optional(),
  category: z.nativeEnum(ModelCategory).optional(),
  status: z.string().optional(),
  search: z.string().optional(),
  sortBy: z
    .enum([
      'name',
      'provider',
      'releaseDate',
      'viewCount',
      'followCount',
      'createdAt',
    ])
    .default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type ListModelsQuery = z.infer<typeof listModelsQuerySchema>;

/**
 * Get model by slug params validation
 */
export const getModelBySlugParamsSchema = z.object({
  slug: z.string().min(1, 'Slug is required'),
});

export type GetModelBySlugParams = z.infer<typeof getModelBySlugParamsSchema>;

/**
 * Get related content query validation
 */
export const relatedContentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type RelatedContentQuery = z.infer<typeof relatedContentQuerySchema>;

/**
 * Follow/unfollow model validation
 */
export const followModelParamsSchema = z.object({
  slug: z.string().min(1, 'Slug is required'),
});

export type FollowModelParams = z.infer<typeof followModelParamsSchema>;
