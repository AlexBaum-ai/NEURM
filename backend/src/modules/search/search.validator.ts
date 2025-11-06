/**
 * Search Validators
 *
 * Zod schemas for search request validation
 */

import { z } from 'zod';

export const contentTypeEnum = z.enum([
  'articles',
  'forum_topics',
  'forum_replies',
  'jobs',
  'users',
  'companies',
]);

export const sortByEnum = z.enum(['relevance', 'date', 'popularity']);

/**
 * Universal search request schema
 */
export const searchRequestSchema = z.object({
  q: z
    .string()
    .min(1, 'Search query is required')
    .max(500, 'Search query is too long'),
  type: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      return val.split(',').filter((t) => t.length > 0);
    })
    .pipe(z.array(contentTypeEnum).optional()),
  sort: sortByEnum.optional().default('relevance'),
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(100)),
  limit: z
    .string()
    .optional()
    .default('20')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(50)),
});

export type SearchRequestInput = z.input<typeof searchRequestSchema>;
export type SearchRequest = z.output<typeof searchRequestSchema>;

/**
 * Autocomplete request schema
 */
export const autocompleteRequestSchema = z.object({
  q: z
    .string()
    .min(2, 'Query must be at least 2 characters')
    .max(100, 'Query is too long'),
});

export type AutocompleteRequest = z.infer<typeof autocompleteRequestSchema>;

/**
 * Save search request schema
 */
export const saveSearchSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name is too long'),
  query: z
    .string()
    .min(1, 'Query is required')
    .max(500, 'Query is too long'),
  contentTypes: z.array(contentTypeEnum).optional(),
  sortBy: sortByEnum.optional(),
  notificationEnabled: z.boolean().optional().default(false),
});

export type SaveSearchRequest = z.infer<typeof saveSearchSchema>;

/**
 * Delete saved search params schema
 */
export const deleteSavedSearchSchema = z.object({
  searchId: z.string().uuid('Invalid search ID'),
});

export type DeleteSavedSearchParams = z.infer<typeof deleteSavedSearchSchema>;

/**
 * Advanced search schema (for future implementation)
 */
export const advancedSearchSchema = searchRequestSchema.extend({
  exact: z.string().optional(), // Exact phrase match
  exclude: z.string().optional(), // Terms to exclude
  author: z.string().optional(), // Filter by author
  dateFrom: z.string().datetime().optional(), // Date range start
  dateTo: z.string().datetime().optional(), // Date range end
  tags: z.array(z.string()).optional(), // Filter by tags
  category: z.string().optional(), // Filter by category
});

export type AdvancedSearchRequest = z.infer<typeof advancedSearchSchema>;
