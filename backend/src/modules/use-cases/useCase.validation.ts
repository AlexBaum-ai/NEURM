import { z } from 'zod';

// Enums matching Prisma schema
export const UseCaseStatusEnum = z.enum(['pending', 'approved', 'published', 'rejected']);
export const UseCaseCategoryEnum = z.enum([
  'customer_support',
  'code_generation',
  'data_analysis',
  'content_creation',
  'research',
  'automation',
  'translation',
  'summarization',
  'classification',
  'extraction',
  'other',
]);
export const UseCaseIndustryEnum = z.enum([
  'saas',
  'healthcare',
  'finance',
  'ecommerce',
  'education',
  'marketing',
  'legal',
  'hr',
  'consulting',
  'manufacturing',
  'media',
  'other',
]);
export const UseCaseImplementationTypeEnum = z.enum([
  'rag',
  'fine_tuning',
  'agent',
  'prompt_engineering',
  'embeddings',
  'function_calling',
  'multimodal',
  'other',
]);
export const CompanySizeEnum = z.enum(['startup', 'small', 'medium', 'large', 'enterprise']);

// Content JSON structure validation
export const UseCaseContentSchema = z.object({
  problem: z.string().min(50).max(5000),
  solution: z.string().min(50).max(5000),
  architecture: z.string().min(50).max(10000).optional(),
  implementation: z.string().min(50).max(15000).optional(),
  results: z.string().min(50).max(5000),
  metrics: z
    .array(
      z.object({
        name: z.string(),
        value: z.string(),
        description: z.string().optional(),
      })
    )
    .optional(),
  challenges: z.string().min(20).max(5000).optional(),
  learnings: z.string().min(20).max(5000).optional(),
  tips: z.string().min(20).max(3000).optional(),
  resources: z
    .array(
      z.object({
        title: z.string(),
        url: z.string().url(),
        type: z.enum(['documentation', 'github', 'article', 'video', 'paper', 'other']).optional(),
      })
    )
    .optional(),
  codeSnippets: z
    .array(
      z.object({
        title: z.string(),
        language: z.string(),
        code: z.string(),
        description: z.string().optional(),
      })
    )
    .optional(),
});

// Create use case submission validation
export const createUseCaseSchema = z.object({
  title: z.string().min(10).max(255),
  summary: z.string().min(50).max(500),
  content: UseCaseContentSchema,
  techStack: z.array(z.string()).min(1).max(20),
  category: UseCaseCategoryEnum,
  industry: UseCaseIndustryEnum,
  implementationType: UseCaseImplementationTypeEnum,
  companySize: CompanySizeEnum.optional(),
  companyId: z.string().uuid().optional(),
  modelIds: z.array(z.string().uuid()).max(10).optional(),
  hasCode: z.boolean().optional(),
  hasRoiData: z.boolean().optional(),
});

// Update use case validation (admin or author)
export const updateUseCaseSchema = z.object({
  title: z.string().min(10).max(255).optional(),
  summary: z.string().min(50).max(500).optional(),
  content: UseCaseContentSchema.optional(),
  techStack: z.array(z.string()).min(1).max(20).optional(),
  category: UseCaseCategoryEnum.optional(),
  industry: UseCaseIndustryEnum.optional(),
  implementationType: UseCaseImplementationTypeEnum.optional(),
  companySize: CompanySizeEnum.optional(),
  companyId: z.string().uuid().optional(),
  modelIds: z.array(z.string().uuid()).max(10).optional(),
  hasCode: z.boolean().optional(),
  hasRoiData: z.boolean().optional(),
  featured: z.boolean().optional(),
});

// Admin review validation
export const reviewUseCaseSchema = z.object({
  status: z.enum(['approved', 'published', 'rejected']),
  rejectionReason: z.string().min(20).max(1000).optional(),
  featured: z.boolean().optional(),
});

// Query filters validation
export const useCaseFiltersSchema = z.object({
  status: UseCaseStatusEnum.optional(),
  category: UseCaseCategoryEnum.optional(),
  industry: UseCaseIndustryEnum.optional(),
  implementationType: UseCaseImplementationTypeEnum.optional(),
  companySize: CompanySizeEnum.optional(),
  featured: z.coerce.boolean().optional(),
  hasCode: z.coerce.boolean().optional(),
  hasRoiData: z.coerce.boolean().optional(),
  authorId: z.string().uuid().optional(),
  companyId: z.string().uuid().optional(),
  modelId: z.string().uuid().optional(),
  techStack: z.string().optional(), // Comma-separated list
  search: z.string().max(200).optional(),
  sort: z.enum(['recent', 'popular', 'most_discussed', 'views']).optional().default('recent'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

// Types inferred from schemas
export type CreateUseCaseInput = z.infer<typeof createUseCaseSchema>;
export type UpdateUseCaseInput = z.infer<typeof updateUseCaseSchema>;
export type ReviewUseCaseInput = z.infer<typeof reviewUseCaseSchema>;
export type UseCaseFilters = z.infer<typeof useCaseFiltersSchema>;
export type UseCaseContent = z.infer<typeof UseCaseContentSchema>;
