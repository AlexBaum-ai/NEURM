import { z } from 'zod';

/**
 * Digest validation schemas
 */

export const updateDigestPreferencesSchema = z.object({
  body: z.object({
    dailyEnabled: z.boolean().optional(),
    dailyTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in format HH:MM').optional(),
    weeklyEnabled: z.boolean().optional(),
    weeklyDay: z.number().int().min(0).max(6).optional(), // 0=Sunday, 6=Saturday
    weeklyTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in format HH:MM').optional(),
    timezone: z.string().optional(),
    includeNews: z.boolean().optional(),
    includeForum: z.boolean().optional(),
    includeJobs: z.boolean().optional(),
    includeActivity: z.boolean().optional(),
    minContentItems: z.number().int().min(1).max(20).optional(),
    vacationMode: z.boolean().optional(),
    vacationUntil: z.string().datetime().optional().nullable(),
  }),
});

export const previewDigestSchema = z.object({
  query: z.object({
    type: z.enum(['daily', 'weekly']).default('daily'),
  }),
});

export const trackOpenSchema = z.object({
  params: z.object({
    trackingToken: z.string().min(1),
  }),
});

export const trackClickSchema = z.object({
  params: z.object({
    trackingToken: z.string().min(1),
  }),
  query: z.object({
    url: z.string().url(),
  }),
});

export const unsubscribeSchema = z.object({
  query: z.object({
    token: z.string().min(1),
  }),
});

export type UpdateDigestPreferencesInput = z.infer<typeof updateDigestPreferencesSchema>['body'];
export type PreviewDigestQuery = z.infer<typeof previewDigestSchema>['query'];
export type TrackOpenParams = z.infer<typeof trackOpenSchema>['params'];
export type TrackClickParams = z.infer<typeof trackClickSchema>['params'];
export type TrackClickQuery = z.infer<typeof trackClickSchema>['query'];
export type UnsubscribeQuery = z.infer<typeof unsubscribeSchema>['query'];
