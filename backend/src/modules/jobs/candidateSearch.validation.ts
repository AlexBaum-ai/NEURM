import { z } from 'zod';

/**
 * Candidate search query parameters validation
 */
export const candidateSearchSchema = z.object({
  // Text search
  query: z.string().optional(),

  // Skills filter
  skills: z.union([z.string(), z.array(z.string())]).optional()
    .transform((val) => Array.isArray(val) ? val : val ? [val] : undefined),

  // Experience filter
  experience: z.union([z.string(), z.array(z.string())]).optional()
    .transform((val) => Array.isArray(val) ? val : val ? [val] : undefined),
  experienceMin: z.coerce.number().int().min(0).max(50).optional(),
  experienceMax: z.coerce.number().int().min(0).max(50).optional(),

  // LLM models filter
  models: z.union([z.string(), z.array(z.string())]).optional()
    .transform((val) => Array.isArray(val) ? val : val ? [val] : undefined),

  // Frameworks filter
  frameworks: z.union([z.string(), z.array(z.string())]).optional()
    .transform((val) => Array.isArray(val) ? val : val ? [val] : undefined),

  // Location filter
  location: z.string().optional(),
  remotePreference: z.enum(['remote', 'hybrid', 'on_site', 'any']).optional(),

  // Availability filter
  availabilityStatus: z.enum(['not_looking', 'open', 'actively_looking']).optional(),

  // Salary expectations
  salaryMin: z.coerce.number().positive().optional(),
  salaryMax: z.coerce.number().positive().optional(),
  salaryCurrency: z.string().length(3).optional(),

  // Job type preferences
  jobTypes: z.union([z.string(), z.array(z.string())]).optional()
    .transform((val) => Array.isArray(val) ? val : val ? [val] : undefined),

  // Boolean operators
  operator: z.enum(['AND', 'OR']).default('AND').optional(),

  // Sorting
  sortBy: z.enum([
    'match_score',
    'reputation',
    'profile_views',
    'recent_activity',
    'years_experience',
    'created_at'
  ]).default('match_score').optional(),

  sortOrder: z.enum(['asc', 'desc']).default('desc').optional(),

  // Pagination
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20).optional(),
});

export type CandidateSearchInput = z.infer<typeof candidateSearchSchema>;

/**
 * Save search validation
 */
export const saveSearchSchema = z.object({
  name: z.string().min(1).max(100),
  filters: z.record(z.any()), // The search filters as JSON
  notificationEnabled: z.boolean().default(false).optional(),
  notificationFrequency: z.enum(['real_time', 'daily', 'weekly']).default('daily').optional(),
});

export type SaveSearchInput = z.infer<typeof saveSearchSchema>;

/**
 * Export candidates validation
 */
export const exportCandidatesSchema = z.object({
  candidateIds: z.array(z.string().uuid()).min(1).max(1000),
  format: z.enum(['csv', 'json']).default('csv').optional(),
  fields: z.array(z.string()).optional(),
});

export type ExportCandidatesInput = z.infer<typeof exportCandidatesSchema>;

/**
 * Track profile view validation
 */
export const trackProfileViewSchema = z.object({
  profileId: z.string().uuid(),
});

export type TrackProfileViewInput = z.infer<typeof trackProfileViewSchema>;
