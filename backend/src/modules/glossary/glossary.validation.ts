import { z } from 'zod';

/**
 * Glossary term categories enum
 */
export enum GlossaryCategory {
  MODELS = 'Models',
  TECHNIQUES = 'Techniques',
  METRICS = 'Metrics',
  TOOLS = 'Tools',
  CONCEPTS = 'Concepts',
}

/**
 * List glossary terms query validation
 */
export const listGlossaryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  category: z.nativeEnum(GlossaryCategory).optional(),
  sortBy: z.enum(['term', 'category', 'viewCount', 'createdAt']).default('term'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  letter: z.string().length(1).regex(/^[A-Z]$/).optional(), // For A-Z navigation
});

export type ListGlossaryQuery = z.infer<typeof listGlossaryQuerySchema>;

/**
 * Get glossary term by slug params validation
 */
export const getGlossaryBySlugParamsSchema = z.object({
  slug: z.string().min(1, 'Slug is required'),
});

export type GetGlossaryBySlugParams = z.infer<typeof getGlossaryBySlugParamsSchema>;

/**
 * Search glossary query validation
 */
export const searchGlossaryQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required').max(100),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  category: z.nativeEnum(GlossaryCategory).optional(),
});

export type SearchGlossaryQuery = z.infer<typeof searchGlossaryQuerySchema>;

/**
 * Create glossary term validation (Admin only)
 */
export const createGlossaryTermSchema = z.object({
  term: z.string().min(1, 'Term is required').max(100),
  definition: z.string().min(10, 'Definition must be at least 10 characters'),
  examples: z.string().optional(),
  category: z.nativeEnum(GlossaryCategory, {
    errorMap: () => ({ message: 'Invalid category' }),
  }),
  relatedTerms: z.array(z.string()).optional().default([]),
});

export type CreateGlossaryTermData = z.infer<typeof createGlossaryTermSchema>;

/**
 * Update glossary term validation (Admin only)
 */
export const updateGlossaryTermSchema = z.object({
  term: z.string().min(1).max(100).optional(),
  definition: z.string().min(10).optional(),
  examples: z.string().optional(),
  category: z.nativeEnum(GlossaryCategory).optional(),
  relatedTerms: z.array(z.string()).optional(),
});

export type UpdateGlossaryTermData = z.infer<typeof updateGlossaryTermSchema>;

/**
 * Get glossary term by ID params validation
 */
export const getGlossaryByIdParamsSchema = z.object({
  id: z.string().uuid('Invalid glossary term ID'),
});

export type GetGlossaryByIdParams = z.infer<typeof getGlossaryByIdParamsSchema>;
