import { z } from 'zod';

/**
 * Job Preferences Validation Schemas
 */

export const updateJobPreferencesSchema = z.object({
  rolesInterested: z.array(z.string().min(1).max(100)).optional(),
  jobTypes: z.array(z.string()).optional(),
  workLocations: z.array(z.string()).optional(),
  preferredLocations: z.array(z.string().max(100)).optional(),
  openToRelocation: z.boolean().optional(),
  salaryExpectationMin: z.number().positive().optional().nullable(),
  salaryExpectationMax: z.number().positive().optional().nullable(),
  salaryCurrency: z.string().length(3).optional().nullable(), // ISO 4217 currency code
  desiredStartDate: z.string().datetime().optional().nullable(),
  availability: z.string().max(100).optional().nullable(),
  companyPreferences: z
    .object({
      companySize: z.array(z.string()).optional(),
      industries: z.array(z.string()).optional(),
      workCulture: z.array(z.string()).optional(),
      benefits: z.array(z.string()).optional(),
    })
    .optional()
    .nullable(),
  visibleToRecruiters: z.boolean().optional(),
});

export type UpdateJobPreferencesInput = z.infer<typeof updateJobPreferencesSchema>;

/**
 * Candidate Profile Update Schema
 * Combines all candidate-specific profile updates
 */
export const updateCandidateProfileSchema = z.object({
  // Job preferences
  jobPreferences: updateJobPreferencesSchema.optional(),

  // Basic profile fields (from existing Profile model)
  displayName: z.string().min(2).max(100).optional(),
  headline: z.string().max(200).optional().nullable(),
  bio: z.string().max(5000).optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  website: z.string().url().max(255).optional().nullable(),
  githubUrl: z.string().url().max(255).optional().nullable(),
  linkedinUrl: z.string().url().max(255).optional().nullable(),
  twitterUrl: z.string().url().max(255).optional().nullable(),
  huggingfaceUrl: z.string().url().max(255).optional().nullable(),
  pronouns: z.string().max(50).optional().nullable(),
  availabilityStatus: z.enum(['not_looking', 'open', 'actively_looking']).optional(),
  yearsExperience: z.number().min(0).max(70).optional().nullable(),
});

export type UpdateCandidateProfileInput = z.infer<typeof updateCandidateProfileSchema>;

/**
 * Username param validation
 */
export const usernameParamSchema = z.object({
  username: z.string().min(3).max(50),
});

export type UsernameParam = z.infer<typeof usernameParamSchema>;
