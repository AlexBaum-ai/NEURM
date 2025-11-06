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

/**
 * Compare models query validation
 */
export const compareModelsQuerySchema = z.object({
  ids: z
    .string()
    .min(1, 'At least one model ID is required')
    .transform((val) => val.split(',').map((id) => id.trim()))
    .refine((ids) => ids.length >= 2 && ids.length <= 5, {
      message: 'You must compare between 2 and 5 models',
    }),
});

export type CompareModelsQuery = z.infer<typeof compareModelsQuerySchema>;

/**
 * Get model benchmarks params validation
 */
export const getModelBenchmarksParamsSchema = z.object({
  slug: z.string().min(1, 'Slug is required'),
});

export type GetModelBenchmarksParams = z.infer<
  typeof getModelBenchmarksParamsSchema
>;

/**
 * Get model versions params validation
 */
export const getModelVersionsParamsSchema = z.object({
  slug: z.string().min(1, 'Slug is required'),
});

export type GetModelVersionsParams = z.infer<
  typeof getModelVersionsParamsSchema
>;

/**
 * Create model version validation (admin only)
 */
export const createModelVersionSchema = z.object({
  version: z.string().min(1, 'Version is required').max(100),
  releasedAt: z.coerce.date(),
  changelog: z.string().optional(),
  isLatest: z.boolean().default(false),
  status: z.string().max(50).optional(),
  features: z.record(z.any()).optional(),
  improvements: z.record(z.any()).optional(),
  deprecated: z.boolean().default(false),
});

export type CreateModelVersion = z.infer<typeof createModelVersionSchema>;

/**
 * Update model validation (admin only)
 */
export const updateModelSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  contextWindow: z.number().int().positive().optional(),
  modelSize: z.string().max(50).optional(),
  modalities: z.array(z.string()).optional(),
  releaseDate: z.coerce.date().optional(),
  latestVersion: z.string().max(50).optional(),
  status: z.string().max(50).optional(),
  pricingInput: z.number().positive().optional(),
  pricingOutput: z.number().positive().optional(),
  officialUrl: z.string().url().max(500).optional(),
  apiDocsUrl: z.string().url().max(500).optional(),
  logoUrl: z.string().url().max(500).optional(),
  bestFor: z.array(z.string()).optional(),
  notIdealFor: z.array(z.string()).optional(),
  apiQuickstart: z.record(z.string()).optional(),
});

export type UpdateModel = z.infer<typeof updateModelSchema>;
