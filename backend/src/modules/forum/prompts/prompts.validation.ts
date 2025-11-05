import { z } from 'zod';

/**
 * Prompt Library Validation Schemas
 * Used for validating prompt API requests
 */

// Template JSON schema
export const templateSchema = z.object({
  model: z.string().min(1, 'Model is required').max(100),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().optional(),
  topP: z.number().min(0).max(1).optional(),
  frequencyPenalty: z.number().min(-2).max(2).optional(),
  presencePenalty: z.number().min(-2).max(2).optional(),
  systemPrompt: z.string().optional(),
  userPrompt: z.string().optional(),
  stopSequences: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

// Prompt categories enum
const promptCategories = [
  'content_creation',
  'code_generation',
  'data_analysis',
  'education',
  'research',
  'creative_writing',
  'technical_writing',
  'translation',
  'summarization',
  'brainstorming',
  'debugging',
  'documentation',
  'other',
] as const;

// Create prompt schema (POST /api/prompts)
export const createPromptSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(255, 'Title must be at most 255 characters'),
  content: z
    .string()
    .min(10, 'Content must be at least 10 characters')
    .max(10000, 'Content must be at most 10000 characters'),
  category: z.enum(promptCategories, {
    errorMap: () => ({ message: 'Invalid category' }),
  }),
  useCase: z
    .string()
    .max(200, 'Use case must be at most 200 characters')
    .optional()
    .nullable(),
  model: z
    .string()
    .max(100, 'Model must be at most 100 characters')
    .optional()
    .nullable(),
  tags: z
    .array(z.string().max(50, 'Tag must be at most 50 characters'))
    .max(10, 'Maximum 10 tags allowed')
    .optional()
    .default([]),
  templateJson: templateSchema.optional().nullable(),
});

// Update prompt schema (PUT /api/prompts/:id)
export const updatePromptSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(255, 'Title must be at most 255 characters')
    .optional(),
  content: z
    .string()
    .min(10, 'Content must be at least 10 characters')
    .max(10000, 'Content must be at most 10000 characters')
    .optional(),
  category: z
    .enum(promptCategories, {
      errorMap: () => ({ message: 'Invalid category' }),
    })
    .optional(),
  useCase: z
    .string()
    .max(200, 'Use case must be at most 200 characters')
    .optional()
    .nullable(),
  model: z
    .string()
    .max(100, 'Model must be at most 100 characters')
    .optional()
    .nullable(),
  tags: z
    .array(z.string().max(50, 'Tag must be at most 50 characters'))
    .max(10, 'Maximum 10 tags allowed')
    .optional(),
  templateJson: templateSchema.optional().nullable(),
});

// Rate prompt schema (POST /api/prompts/:id/rate)
export const ratePromptSchema = z.object({
  rating: z
    .number()
    .int()
    .min(1, 'Rating must be between 1 and 5')
    .max(5, 'Rating must be between 1 and 5'),
  comment: z
    .string()
    .max(1000, 'Comment must be at most 1000 characters')
    .optional()
    .nullable(),
});

// Vote prompt schema (POST /api/prompts/:id/vote)
export const votePromptSchema = z.object({
  value: z
    .number()
    .int()
    .refine((val) => val === 1 || val === -1, {
      message: 'Vote value must be 1 (upvote) or -1 (downvote)',
    }),
});

// Query params schema for listing prompts (GET /api/prompts)
export const listPromptsQuerySchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/, 'Page must be a positive integer')
    .transform(Number)
    .pipe(z.number().int().positive())
    .optional()
    .default('1')
    .transform(Number),
  limit: z
    .string()
    .regex(/^\d+$/, 'Limit must be a positive integer')
    .transform(Number)
    .pipe(z.number().int().positive().max(100))
    .optional()
    .default('20')
    .transform(Number),
  category: z.enum(promptCategories).optional(),
  useCase: z.string().max(200).optional(),
  model: z.string().max(100).optional(),
  search: z.string().max(200).optional(),
  sort: z
    .enum([
      'newest',
      'oldest',
      'top_rated',
      'most_voted',
      'most_forked',
      'trending',
    ])
    .optional()
    .default('newest'),
  minRating: z
    .string()
    .regex(/^\d+(\.\d+)?$/, 'Min rating must be a number')
    .transform(Number)
    .pipe(z.number().min(0).max(5))
    .optional(),
  tags: z.string().optional(), // comma-separated tags
});

// Prompt ID param validation
export const promptIdParamSchema = z.object({
  id: z.string().uuid('Invalid prompt ID'),
});

/**
 * TypeScript types inferred from schemas
 */
export type CreatePromptInput = z.infer<typeof createPromptSchema>;
export type UpdatePromptInput = z.infer<typeof updatePromptSchema>;
export type RatePromptInput = z.infer<typeof ratePromptSchema>;
export type VotePromptInput = z.infer<typeof votePromptSchema>;
export type ListPromptsQuery = z.infer<typeof listPromptsQuerySchema>;
export type PromptIdParam = z.infer<typeof promptIdParamSchema>;
export type TemplateJson = z.infer<typeof templateSchema>;
