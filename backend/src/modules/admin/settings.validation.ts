/**
 * Settings Validation Schemas
 *
 * Zod schemas for platform settings validation
 */

import { z } from 'zod';
import { SettingCategory, SettingType } from '@prisma/client';

/**
 * Setting value schema based on type
 */
export const settingValueSchemas = {
  string: z.string().min(1).max(5000),
  number: z.number(),
  boolean: z.boolean(),
  json: z.record(z.any()),
  encrypted: z.string().min(1),
};

/**
 * General settings schema
 */
export const generalSettingsSchema = z.object({
  platform_name: z.string().min(1).max(100).optional(),
  tagline: z.string().min(1).max(200).optional(),
  logo_url: z.string().url().optional(),
  favicon_url: z.string().url().optional(),
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
  cdn_url: z.string().url().optional(),

  // Email service
  email_service: z.enum(['sendgrid', 'aws_ses']).optional(),
});

/**
 * Security settings schema
 */
export const securitySettingsSchema = z.object({
  // Rate limiting
  rate_limit_enabled: z.boolean().optional(),
  rate_limit_window_ms: z.number().min(1000).max(3600000).optional(),
  rate_limit_max_requests: z.number().min(1).max(10000).optional(),

  // Session
  session_timeout_minutes: z.number().min(5).max(10080).optional(), // 5 min to 1 week

  // 2FA
  two_factor_enforcement: z.enum(['none', 'admin', 'all']).optional(),

  // CAPTCHA
  captcha_enabled: z.boolean().optional(),
  captcha_provider: z.enum(['recaptcha', 'hcaptcha', 'turnstile']).optional(),
  captcha_site_key: z.string().optional(),
  captcha_secret_key: z.string().optional(),

  // Password policy
  password_min_length: z.number().min(8).max(128).optional(),
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
  from_email: z.string().email().optional(),
  support_email: z.string().email().optional(),
  noreply_email: z.string().email().optional(),

  // Notification settings
  notification_email_enabled: z.boolean().optional(),
  digest_email_enabled: z.boolean().optional(),
  digest_frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
});

/**
 * Single setting update schema
 */
export const updateSettingSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.record(z.any()),
  ]),
  category: z.nativeEnum(SettingCategory),
  type: z.nativeEnum(SettingType),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
  reason: z.string().max(500).optional(), // For audit log
});

/**
 * Bulk settings update schema
 */
export const bulkUpdateSettingsSchema = z.object({
  settings: z.array(updateSettingSchema),
  reason: z.string().max(500).optional(),
});

/**
 * Get settings query schema
 */
export const getSettingsQuerySchema = z.object({
  category: z.nativeEnum(SettingCategory).optional(),
  includeEncrypted: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
});

/**
 * Delete setting schema
 */
export const deleteSettingSchema = z.object({
  key: z.string().min(1).max(100),
  reason: z.string().max(500).optional(),
});

/**
 * Maintenance mode schema
 */
export const maintenanceModeSchema = z.object({
  enabled: z.boolean(),
  message: z.string().max(500).optional(),
  reason: z.string().max(500).optional(),
});

// Export types
export type GeneralSettings = z.infer<typeof generalSettingsSchema>;
export type FeatureSettings = z.infer<typeof featureSettingsSchema>;
export type IntegrationSettings = z.infer<typeof integrationSettingsSchema>;
export type SecuritySettings = z.infer<typeof securitySettingsSchema>;
export type EmailSettings = z.infer<typeof emailSettingsSchema>;
export type UpdateSettingInput = z.infer<typeof updateSettingSchema>;
export type BulkUpdateSettingsInput = z.infer<typeof bulkUpdateSettingsSchema>;
export type GetSettingsQuery = z.infer<typeof getSettingsQuerySchema>;
export type DeleteSettingInput = z.infer<typeof deleteSettingSchema>;
export type MaintenanceModeInput = z.infer<typeof maintenanceModeSchema>;
