import { z } from 'zod';

/**
 * Job Validation Schemas
 * Validates job posting creation, updates, and queries
 */

// ============================================================================
// ENUMS
// ============================================================================

export const JobTypeEnum = z.enum(['full_time', 'part_time', 'contract', 'freelance']);
export const WorkLocationEnum = z.enum(['remote', 'hybrid', 'onsite']);
export const ExperienceLevelEnum = z.enum(['entry', 'junior', 'mid', 'senior', 'lead', 'principal']);
export const JobStatusEnum = z.enum(['draft', 'active', 'paused', 'closed', 'filled']);
export const ModelStrategyEnum = z.enum(['commercial_api', 'open_source', 'hybrid']);

// ============================================================================
// JOB SKILL SCHEMAS
// ============================================================================

export const jobSkillSchema = z.object({
  skillName: z.string().min(1).max(100),
  skillType: z.string().min(1).max(50),
  requiredLevel: z.number().int().min(1).max(5),
  isRequired: z.boolean().default(true),
});

export type JobSkillInput = z.infer<typeof jobSkillSchema>;

// ============================================================================
// CREATE JOB SCHEMA
// ============================================================================

export const createJobSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters').max(200, 'Title must not exceed 200 characters'),
  description: z.string().min(100, 'Description must be at least 100 characters'),
  requirements: z.string().min(50, 'Requirements must be at least 50 characters'),
  responsibilities: z.string().optional(),
  benefits: z.string().optional(),
  jobType: JobTypeEnum,
  workLocation: WorkLocationEnum,
  experienceLevel: ExperienceLevelEnum,
  location: z.string().min(1).max(200),
  salaryMin: z.number().positive().optional(),
  salaryMax: z.number().positive().optional(),
  salaryCurrency: z.string().length(3).default('EUR'),
  salaryIsPublic: z.boolean().default(true),
  positionsAvailable: z.number().int().positive().default(1),
  hasVisaSponsorship: z.boolean().default(false),
  primaryLlms: z.array(z.string()).min(1, 'At least one LLM must be specified').max(10),
  frameworks: z.array(z.string()).max(20).default([]),
  vectorDatabases: z.array(z.string()).max(10).default([]),
  infrastructure: z.array(z.string()).max(10).default([]),
  programmingLanguages: z.array(z.string()).max(10).default([]),
  useCaseType: z.string().max(100).optional(),
  modelStrategy: ModelStrategyEnum.optional(),
  screeningQuestions: z.array(z.object({
    question: z.string(),
    required: z.boolean().default(false),
    type: z.enum(['text', 'textarea', 'select', 'multiselect']).default('text'),
    options: z.array(z.string()).optional(),
  })).optional(),
  skills: z.array(jobSkillSchema).optional(),
  status: JobStatusEnum.default('draft'),
  expiresAt: z.string().datetime().optional(),
}).refine(
  (data) => {
    // Salary validation: max should be greater than min if both provided
    if (data.salaryMin && data.salaryMax) {
      return data.salaryMax >= data.salaryMin;
    }
    return true;
  },
  {
    message: 'Maximum salary must be greater than or equal to minimum salary',
    path: ['salaryMax'],
  }
);

export type CreateJobInput = z.infer<typeof createJobSchema>;

// ============================================================================
// UPDATE JOB SCHEMA
// ============================================================================

export const updateJobSchema = createJobSchema.partial().extend({
  status: JobStatusEnum.optional(),
});

export type UpdateJobInput = z.infer<typeof updateJobSchema>;

// ============================================================================
// QUERY SCHEMAS
// ============================================================================

export const listJobsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: JobStatusEnum.optional(),
  jobType: JobTypeEnum.optional(),
  workLocation: WorkLocationEnum.optional(),
  experienceLevel: ExperienceLevelEnum.optional(),
  location: z.string().optional(),
  hasVisaSponsorship: z.coerce.boolean().optional(),
  salaryMin: z.coerce.number().positive().optional(),
  salaryMax: z.coerce.number().positive().optional(),
  primaryLlms: z.string().optional(), // Comma-separated
  frameworks: z.string().optional(), // Comma-separated
  modelStrategy: ModelStrategyEnum.optional(),
  search: z.string().optional(),
  sortBy: z.enum(['publishedAt', 'salaryMax', 'viewCount', 'matchScore']).default('publishedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  match: z.coerce.boolean().optional(), // Include match scores
  minMatchScore: z.coerce.number().min(0).max(100).optional(), // Filter by minimum match score
});

export type ListJobsQuery = z.infer<typeof listJobsQuerySchema>;

// ============================================================================
// PARAM SCHEMAS
// ============================================================================

export const jobIdParamSchema = z.object({
  id: z.string().uuid('Invalid job ID format'),
});

export const jobSlugParamSchema = z.object({
  slug: z.string().min(1, 'Job slug is required'),
});

export type JobIdParam = z.infer<typeof jobIdParamSchema>;
export type JobSlugParam = z.infer<typeof jobSlugParamSchema>;

// ============================================================================
// APPLICATION SCHEMAS
// ============================================================================

export const ApplicationStatusEnum = z.enum([
  'submitted',
  'viewed',
  'screening',
  'interview',
  'offer',
  'rejected',
  'withdrawn',
]);

export const applyToJobSchema = z.object({
  coverLetter: z.string().max(5000, 'Cover letter must not exceed 5000 characters').optional(),
  screeningAnswers: z.record(z.any()).optional(),
  source: z.string().max(50).default('easy_apply'),
});

export type ApplyToJobInput = z.infer<typeof applyToJobSchema>;

export const listApplicationsQuerySchema = z.object({
  status: ApplicationStatusEnum.optional(),
  // Filter presets
  filter: z.enum(['all', 'active', 'interviews', 'offers', 'rejected', 'withdrawn']).optional(),
  sortBy: z.enum(['date_applied', 'status', 'company']).default('date_applied'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ListApplicationsQuery = z.infer<typeof listApplicationsQuerySchema>;

export const exportApplicationsQuerySchema = z.object({
  status: ApplicationStatusEnum.optional(),
  filter: z.enum(['all', 'active', 'interviews', 'offers', 'rejected', 'withdrawn']).optional(),
});

export type ExportApplicationsQuery = z.infer<typeof exportApplicationsQuerySchema>;

export const updateApplicationStatusSchema = z.object({
  status: ApplicationStatusEnum,
});

export type UpdateApplicationStatusInput = z.infer<typeof updateApplicationStatusSchema>;

export const applicationIdParamSchema = z.object({
  id: z.string().uuid('Invalid application ID format'),
});

export type ApplicationIdParam = z.infer<typeof applicationIdParamSchema>;
