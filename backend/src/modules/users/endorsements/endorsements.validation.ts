import { z } from 'zod';

/**
 * Validation schema for endorsement parameters
 */
export const endorsementParamsSchema = z.object({
  username: z.string().min(1).max(50),
  skillId: z.string().uuid(),
});

export type EndorsementParams = z.infer<typeof endorsementParamsSchema>;

/**
 * Validation schema for listing endorsements query parameters
 */
export const listEndorsementsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export type ListEndorsementsQuery = z.infer<typeof listEndorsementsQuerySchema>;
