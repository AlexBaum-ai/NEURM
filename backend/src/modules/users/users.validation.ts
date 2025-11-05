import { z } from 'zod';

/**
 * User Profile Validation Schemas
 * Used for validating user profile API requests
 */

// Update profile schema (PATCH /api/v1/users/me)
export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .min(1, 'Display name must not be empty')
    .max(100, 'Display name must be at most 100 characters')
    .optional(),
  headline: z
    .string()
    .max(200, 'Headline must be at most 200 characters')
    .optional()
    .nullable(),
  bio: z
    .string()
    .max(5000, 'Bio must be at most 5000 characters')
    .optional()
    .nullable(),
  location: z
    .string()
    .max(100, 'Location must be at most 100 characters')
    .optional()
    .nullable(),
  website: z
    .string()
    .url('Website must be a valid URL')
    .max(255, 'Website URL must be at most 255 characters')
    .optional()
    .nullable(),
  githubUrl: z
    .string()
    .url('GitHub URL must be a valid URL')
    .max(255, 'GitHub URL must be at most 255 characters')
    .optional()
    .nullable(),
  linkedinUrl: z
    .string()
    .url('LinkedIn URL must be a valid URL')
    .max(255, 'LinkedIn URL must be at most 255 characters')
    .optional()
    .nullable(),
  twitterUrl: z
    .string()
    .url('Twitter URL must be a valid URL')
    .max(255, 'Twitter URL must be at most 255 characters')
    .optional()
    .nullable(),
  huggingfaceUrl: z
    .string()
    .url('HuggingFace URL must be a valid URL')
    .max(255, 'HuggingFace URL must be at most 255 characters')
    .optional()
    .nullable(),
  pronouns: z
    .string()
    .max(50, 'Pronouns must be at most 50 characters')
    .optional()
    .nullable(),
  availabilityStatus: z
    .enum(['not_looking', 'open', 'actively_looking'])
    .optional(),
  yearsExperience: z
    .number()
    .int()
    .min(0, 'Years of experience must be 0 or greater')
    .max(100, 'Years of experience must be at most 100')
    .optional()
    .nullable(),
  avatarUrl: z
    .string()
    .url('Avatar URL must be a valid URL')
    .max(500, 'Avatar URL must be at most 500 characters')
    .optional()
    .nullable(),
  coverImageUrl: z
    .string()
    .url('Cover image URL must be a valid URL')
    .max(500, 'Cover image URL must be at most 500 characters')
    .optional()
    .nullable(),
});

// Username parameter validation (for GET /api/v1/users/:username)
export const usernameParamSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be at most 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
});

// Privacy settings validation
export const updatePrivacySettingsSchema = z.object({
  bio: z.enum(['public', 'community', 'recruiters', 'private']).optional(),
  work_experience: z.enum(['public', 'community', 'recruiters', 'private']).optional(),
  education: z.enum(['public', 'community', 'recruiters', 'private']).optional(),
  portfolio: z.enum(['public', 'community', 'recruiters', 'private']).optional(),
  skills: z.enum(['public', 'community', 'recruiters', 'private']).optional(),
  salary: z.enum(['public', 'community', 'recruiters', 'private']).optional(),
  contact: z.enum(['public', 'community', 'recruiters', 'private']).optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one privacy setting must be provided' }
);

// Change email schema (PATCH /api/v1/users/me/email)
export const changeEmailSchema = z.object({
  newEmail: z
    .string()
    .email('Must be a valid email address')
    .max(255, 'Email must be at most 255 characters'),
  password: z
    .string()
    .min(1, 'Password is required for email change'),
});

// Change password schema (PATCH /api/v1/users/me/password)
export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: z
    .string()
    .min(1, 'Password confirmation is required'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Delete account schema (DELETE /api/v1/users/me)
export const deleteAccountSchema = z.object({
  password: z
    .string()
    .min(1, 'Password is required to delete account'),
  confirmation: z
    .string()
    .min(1, 'Please type DELETE to confirm'),
}).refine((data) => data.confirmation === 'DELETE', {
  message: 'You must type DELETE to confirm account deletion',
  path: ['confirmation'],
});

// Type exports for TypeScript
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UsernameParam = z.infer<typeof usernameParamSchema>;
export type UpdatePrivacySettingsInput = z.infer<typeof updatePrivacySettingsSchema>;
export type ChangeEmailInput = z.infer<typeof changeEmailSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
