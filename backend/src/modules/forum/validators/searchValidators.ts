import { z } from 'zod';

/**
 * Validator for search query parameters
 */
export const searchQuerySchema = z.object({
  query: z
    .string()
    .min(1, 'Search query is required')
    .max(500, 'Search query is too long (max 500 characters)')
    .trim(),
  categoryId: z.string().uuid().optional(),
  type: z
    .string()
    .transform((val) => (val ? val.split(',') : undefined))
    .optional(),
  status: z
    .string()
    .transform((val) => (val ? val.split(',') : undefined))
    .optional(),
  dateFrom: z
    .string()
    .datetime()
    .transform((val) => new Date(val))
    .optional(),
  dateTo: z
    .string()
    .datetime()
    .transform((val) => new Date(val))
    .optional(),
  hasCode: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  minUpvotes: z
    .string()
    .transform((val) => parseInt(val, 10))
    .optional(),
  authorId: z.string().uuid().optional(),
  sortBy: z.enum(['relevance', 'date', 'popularity', 'votes']).default('relevance'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('1'),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('20')
    .refine((val) => val >= 1 && val <= 100, {
      message: 'Limit must be between 1 and 100',
    }),
});

export type SearchQueryInput = z.infer<typeof searchQuerySchema>;

/**
 * Validator for autocomplete suggestions query
 */
export const suggestionsQuerySchema = z.object({
  query: z
    .string()
    .min(2, 'Query must be at least 2 characters')
    .max(500, 'Query is too long (max 500 characters)')
    .trim(),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('10')
    .refine((val) => val >= 1 && val <= 20, {
      message: 'Limit must be between 1 and 20',
    }),
});

export type SuggestionsQueryInput = z.infer<typeof suggestionsQuerySchema>;

/**
 * Validator for creating a saved search
 */
export const createSavedSearchSchema = z.object({
  name: z
    .string()
    .min(1, 'Search name is required')
    .max(100, 'Search name is too long (max 100 characters)')
    .trim(),
  query: z
    .string()
    .min(1, 'Search query is required')
    .max(500, 'Search query is too long (max 500 characters)')
    .trim(),
  filters: z
    .object({
      categoryId: z.string().uuid().optional(),
      type: z.array(z.string()).optional(),
      status: z.array(z.string()).optional(),
      dateFrom: z.string().datetime().optional(),
      dateTo: z.string().datetime().optional(),
      hasCode: z.boolean().optional(),
      minUpvotes: z.number().int().min(0).optional(),
      authorId: z.string().uuid().optional(),
    })
    .optional(),
});

export type CreateSavedSearchInput = z.infer<typeof createSavedSearchSchema>;

/**
 * Validator for updating a saved search
 */
export const updateSavedSearchSchema = z.object({
  name: z
    .string()
    .min(1, 'Search name is required')
    .max(100, 'Search name is too long (max 100 characters)')
    .trim()
    .optional(),
  query: z
    .string()
    .min(1, 'Search query is required')
    .max(500, 'Search query is too long (max 500 characters)')
    .trim()
    .optional(),
  filters: z
    .object({
      categoryId: z.string().uuid().optional(),
      type: z.array(z.string()).optional(),
      status: z.array(z.string()).optional(),
      dateFrom: z.string().datetime().optional(),
      dateTo: z.string().datetime().optional(),
      hasCode: z.boolean().optional(),
      minUpvotes: z.number().int().min(0).optional(),
      authorId: z.string().uuid().optional(),
    })
    .optional(),
});

export type UpdateSavedSearchInput = z.infer<typeof updateSavedSearchSchema>;

/**
 * Validator for search history query
 */
export const searchHistoryQuerySchema = z.object({
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('10')
    .refine((val) => val >= 1 && val <= 50, {
      message: 'Limit must be between 1 and 50',
    }),
});

export type SearchHistoryQueryInput = z.infer<typeof searchHistoryQuerySchema>;

/**
 * Validator for popular queries
 */
export const popularQueriesSchema = z.object({
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('10')
    .refine((val) => val >= 1 && val <= 20, {
      message: 'Limit must be between 1 and 20',
    }),
});

export type PopularQueriesInput = z.infer<typeof popularQueriesSchema>;
