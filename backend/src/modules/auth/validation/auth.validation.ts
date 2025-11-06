import { z } from 'zod';

/**
 * Password validation rules:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

/**
 * Email validation
 */
const emailSchema = z
  .string()
  .email('Invalid email address')
  .toLowerCase()
  .trim();

/**
 * Username validation rules:
 * - 3-50 characters
 * - Alphanumeric, underscores, and hyphens only
 * - Must start with a letter or number
 */
const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(50, 'Username must not exceed 50 characters')
  .regex(
    /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/,
    'Username must start with a letter or number and contain only letters, numbers, underscores, and hyphens'
  )
  .trim();

/**
 * POST /api/v1/auth/register
 * Register new user account
 */
export const registerSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: passwordSchema,
    username: usernameSchema,
    termsAccepted: z
      .boolean()
      .refine((val) => val === true, {
        message: 'You must accept the terms and conditions',
      }),
  }),
});

/**
 * POST /api/v1/auth/login
 * Authenticate user
 */
export const loginSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required'),
  }),
});

/**
 * POST /api/v1/auth/refresh
 * Refresh access token
 */
export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

/**
 * POST /api/v1/auth/verify-email
 * Verify email address
 */
export const verifyEmailSchema = z.object({
  body: z.object({
    token: z
      .string()
      .min(1, 'Verification token is required')
      .length(64, 'Invalid token format'),
  }),
});

/**
 * POST /api/v1/auth/resend-verification
 * Resend email verification
 */
export const resendVerificationSchema = z.object({
  body: z.object({
    email: emailSchema,
  }),
});

/**
 * POST /api/v1/auth/forgot-password
 * Request password reset
 */
export const forgotPasswordSchema = z.object({
  body: z.object({
    email: emailSchema,
  }),
});

/**
 * POST /api/v1/auth/reset-password
 * Reset password with token
 */
export const resetPasswordSchema = z.object({
  body: z.object({
    token: z
      .string()
      .min(1, 'Reset token is required')
      .length(64, 'Invalid token format'),
    newPassword: passwordSchema,
  }),
});

// Type exports for use in controllers
export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>['body'];
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>['body'];
export type ResendVerificationInput = z.infer<
  typeof resendVerificationSchema
>['body'];
export type ForgotPasswordInput = z.infer<
  typeof forgotPasswordSchema
>['body'];
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>['body'];
