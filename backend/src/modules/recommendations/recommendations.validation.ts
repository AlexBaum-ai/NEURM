import { z } from 'zod';

/**
 * Recommendation Validation Schemas
 *
 * Validates requests for the recommendation engine endpoints.
 */

// Get recommendations query schema
export const getRecommendationsSchema = z.object({
  types: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(',') : undefined))
    .pipe(
      z
        .array(z.enum(['article', 'forum_topic', 'job', 'user']))
        .optional()
    ),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().min(1).max(100)),
  excludeIds: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(',') : [])),
  includeExplanations: z
    .string()
    .optional()
    .transform((val) => val === 'true')
    .pipe(z.boolean().default(true)),
});

export type GetRecommendationsQuery = z.infer<typeof getRecommendationsSchema>;

// Recommendation feedback schema
export const recommendationFeedbackSchema = z.object({
  itemType: z.enum(['article', 'forum_topic', 'job', 'user']),
  itemId: z.string().uuid(),
  feedback: z.enum(['like', 'dislike', 'dismiss', 'not_interested']),
});

export type RecommendationFeedbackInput = z.infer<typeof recommendationFeedbackSchema>;

// Feedback update schema (for PATCH)
export const updateFeedbackSchema = z.object({
  feedback: z.enum(['like', 'dislike', 'dismiss', 'not_interested']),
});

export type UpdateFeedbackInput = z.infer<typeof updateFeedbackSchema>;
