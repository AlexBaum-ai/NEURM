/**
 * Settings Validation
 *
 * Zod validation schemas for platform settings (matching backend)
 */

import { z } from 'zod';

/**
 * General settings schema
 */
export const generalSettingsSchema = z.object({
  platform_name: z.string().min(1, 'Platform name is required').max(100).optional(),
  tagline: z.string().min(1).max(200).optional(),
  logo_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  favicon_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  default_language: z.enum(['en', 'nl']).optional(),
  timezone: z.string().optional(),
  maintenance_mode: z.boolean().optional(),
  maintenance_message: z.string().max(500).optional(),
});

/**
 * Feature flags schema
 */
export const featureSettingsSchema = z.object({
  forum_enabled: z.boolean().optional(),
  jobs_enabled: z.boolean().optional(),
  llm_guide_enabled: z.boolean().optional(),
  messaging_enabled: z.boolean().optional(),
  notifications_enabled: z.boolean().optional(),
  search_enabled: z.boolean().optional(),
  beta_features: z.array(z.string()).optional(),
});

/**
 * Integration settings schema
 */
export const integrationSettingsSchema = z.object({
  // OAuth providers
  google_oauth_enabled: z.boolean().optional(),
  linkedin_oauth_enabled: z.boolean().optional(),
  github_oauth_enabled: z.boolean().optional(),

  // Analytics
  google_analytics_id: z.string().optional(),
  plausible_domain: z.string().optional(),

  // CDN
  cdn_enabled: z.boolean().optional(),
  cdn_url: z.string().url('Invalid URL').optional().or(z.literal('')),

  // Email service
  email_service: z.enum(['sendgrid', 'aws_ses']).optional(),
});

/**
 * Security settings schema
 */
export const securitySettingsSchema = z.object({
  // Rate limiting
  rate_limit_enabled: z.boolean().optional(),
  rate_limit_window_ms: z
    .number()
    .min(1000, 'Minimum 1 second')
    .max(3600000, 'Maximum 1 hour')
    .optional(),
  rate_limit_max_requests: z
    .number()
    .min(1, 'Minimum 1 request')
    .max(10000, 'Maximum 10,000 requests')
    .optional(),

  // Session
  session_timeout_minutes: z
    .number()
    .min(5, 'Minimum 5 minutes')
    .max(10080, 'Maximum 1 week')
    .optional(),

  // 2FA
  two_factor_enforcement: z.enum(['none', 'admin', 'all']).optional(),

  // CAPTCHA
  captcha_enabled: z.boolean().optional(),
  captcha_provider: z.enum(['recaptcha', 'hcaptcha', 'turnstile']).optional(),
  captcha_site_key: z.string().optional(),
  captcha_secret_key: z.string().optional(),

  // Password policy
  password_min_length: z
    .number()
    .min(8, 'Minimum 8 characters')
    .max(128, 'Maximum 128 characters')
    .optional(),
  password_require_uppercase: z.boolean().optional(),
  password_require_lowercase: z.boolean().optional(),
  password_require_numbers: z.boolean().optional(),
  password_require_special: z.boolean().optional(),
});

/**
 * Email settings schema
 */
export const emailSettingsSchema = z.object({
  // SMTP config
  smtp_host: z.string().optional(),
  smtp_port: z.number().min(1).max(65535).optional(),
  smtp_secure: z.boolean().optional(),
  smtp_user: z.string().optional(),
  smtp_password: z.string().optional(),

  // Email addresses
  from_email: z.string().email('Invalid email').optional().or(z.literal('')),
  support_email: z.string().email('Invalid email').optional().or(z.literal('')),
  noreply_email: z.string().email('Invalid email').optional().or(z.literal('')),

  // Notification settings
  notification_email_enabled: z.boolean().optional(),
  digest_email_enabled: z.boolean().optional(),
  digest_frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
});

export type GeneralSettingsFormData = z.infer<typeof generalSettingsSchema>;
export type FeatureSettingsFormData = z.infer<typeof featureSettingsSchema>;
export type IntegrationSettingsFormData = z.infer<typeof integrationSettingsSchema>;
export type SecuritySettingsFormData = z.infer<typeof securitySettingsSchema>;
export type EmailSettingsFormData = z.infer<typeof emailSettingsSchema>;
