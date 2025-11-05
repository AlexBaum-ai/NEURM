import { z } from 'zod';

/**
 * Validation schemas for saved jobs operations
 */

// Save job schema
export const saveJobSchema = z.object({
  notes: z.string().max(1000).optional(),
});

// Update saved job schema
export const updateSavedJobSchema = z.object({
  notes: z.string().max(1000).optional(),
});

// List saved jobs query schema
export const listSavedJobsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['savedAt', 'expiresAt']).default('savedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Types
export type SaveJobInput = z.infer<typeof saveJobSchema>;
export type UpdateSavedJobInput = z.infer<typeof updateSavedJobSchema>;
export type ListSavedJobsQuery = z.infer<typeof listSavedJobsQuerySchema>;
