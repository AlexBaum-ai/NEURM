import { z } from 'zod';

/**
 * Validation schema for session ID parameter
 */
export const sessionIdParamSchema = z.object({
  id: z.string().uuid({ message: 'Invalid session ID format' }),
});

/**
 * Type exports
 */
export type SessionIdParam = z.infer<typeof sessionIdParamSchema>;
