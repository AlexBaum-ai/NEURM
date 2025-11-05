import { z } from 'zod';

/**
 * User Skills Validation Schemas
 * Used for validating skill management API requests
 */

// Skill types allowed in the system
export const SKILL_TYPES = [
  'prompt_engineering',
  'fine_tuning',
  'rag',
  'deployment',
  'mlops',
  'nlp',
  'computer_vision',
  'reinforcement_learning',
  'data_engineering',
  'model_optimization',
  'api_integration',
  'evaluation',
  'safety_alignment',
  'multimodal',
  'other',
] as const;

// Create skill schema (POST /api/v1/users/me/skills)
export const createSkillSchema = z.object({
  skillName: z
    .string()
    .min(2, 'Skill name must be at least 2 characters')
    .max(100, 'Skill name must be at most 100 characters')
    .trim(),
  skillType: z
    .enum(SKILL_TYPES, {
      message: 'Invalid skill type',
    }),
  proficiency: z
    .number()
    .int()
    .min(1, 'Proficiency must be between 1 and 5')
    .max(5, 'Proficiency must be between 1 and 5'),
});

// Update skill schema (PATCH /api/v1/users/me/skills/:id)
export const updateSkillSchema = z.object({
  proficiency: z
    .number()
    .int()
    .min(1, 'Proficiency must be between 1 and 5')
    .max(5, 'Proficiency must be between 1 and 5'),
});

// Skill ID parameter validation
export const skillIdParamSchema = z.object({
  id: z.string().uuid('Invalid skill ID format'),
});

// Query params for listing skills
export const listSkillsQuerySchema = z.object({
  skillType: z.enum(SKILL_TYPES).optional(),
  limit: z
    .string()
    .regex(/^\d+$/, 'Limit must be a number')
    .transform(Number)
    .refine((val) => val > 0 && val <= 50, 'Limit must be between 1 and 50')
    .optional(),
});

// Autocomplete query params
export const autocompleteSkillsQuerySchema = z.object({
  query: z
    .string()
    .min(1, 'Query must be at least 1 character')
    .max(100, 'Query must be at most 100 characters')
    .trim(),
  limit: z
    .string()
    .optional()
    .default('10')
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val > 0 && val <= 20, 'Limit must be between 1 and 20'),
});

// Type exports for TypeScript
export type CreateSkillInput = z.infer<typeof createSkillSchema>;
export type UpdateSkillInput = z.infer<typeof updateSkillSchema>;
export type SkillIdParam = z.infer<typeof skillIdParamSchema>;
export type ListSkillsQuery = z.infer<typeof listSkillsQuerySchema>;
export type AutocompleteSkillsQuery = z.infer<typeof autocompleteSkillsQuerySchema>;
export type SkillType = (typeof SKILL_TYPES)[number];
