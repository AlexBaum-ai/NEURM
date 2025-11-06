/**
 * Platform Settings Types
 *
 * Frontend types matching backend settings schema
 */

export enum SettingCategory {
  GENERAL = 'GENERAL',
  FEATURES = 'FEATURES',
  INTEGRATIONS = 'INTEGRATIONS',
  SECURITY = 'SECURITY',
  EMAIL = 'EMAIL',
}

export enum SettingType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  JSON = 'JSON',
  ENCRYPTED = 'ENCRYPTED',
}

export interface PlatformSetting {
  id: string;
  key: string;
  value: string | number | boolean | Record<string, any>;
  category: SettingCategory;
  type: SettingType;
  description?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SettingsGroup {
  category: SettingCategory;
  settings: PlatformSetting[];
}

export interface GeneralSettings {
  platform_name?: string;
  tagline?: string;
  logo_url?: string;
  favicon_url?: string;
  default_language?: 'en' | 'nl';
  timezone?: string;
  maintenance_mode?: boolean;
  maintenance_message?: string;
}

export interface FeatureSettings {
  forum_enabled?: boolean;
  jobs_enabled?: boolean;
  llm_guide_enabled?: boolean;
  messaging_enabled?: boolean;
  notifications_enabled?: boolean;
  search_enabled?: boolean;
  beta_features?: string[];
}

export interface IntegrationSettings {
  // OAuth providers
  google_oauth_enabled?: boolean;
  linkedin_oauth_enabled?: boolean;
  github_oauth_enabled?: boolean;

  // Analytics
  google_analytics_id?: string;
  plausible_domain?: string;

  // CDN
  cdn_enabled?: boolean;
  cdn_url?: string;

  // Email service
  email_service?: 'sendgrid' | 'aws_ses';
}

export interface SecuritySettings {
  // Rate limiting
  rate_limit_enabled?: boolean;
  rate_limit_window_ms?: number;
  rate_limit_max_requests?: number;

  // Session
  session_timeout_minutes?: number;

  // 2FA
  two_factor_enforcement?: 'none' | 'admin' | 'all';

  // CAPTCHA
  captcha_enabled?: boolean;
  captcha_provider?: 'recaptcha' | 'hcaptcha' | 'turnstile';
  captcha_site_key?: string;
  captcha_secret_key?: string;

  // Password policy
  password_min_length?: number;
  password_require_uppercase?: boolean;
  password_require_lowercase?: boolean;
  password_require_numbers?: boolean;
  password_require_special?: boolean;
}

export interface EmailSettings {
  // SMTP config
  smtp_host?: string;
  smtp_port?: number;
  smtp_secure?: boolean;
  smtp_user?: string;
  smtp_password?: string;

  // Email addresses
  from_email?: string;
  support_email?: string;
  noreply_email?: string;

  // Notification settings
  notification_email_enabled?: boolean;
  digest_email_enabled?: boolean;
  digest_frequency?: 'daily' | 'weekly' | 'monthly';
}

export interface MaintenanceMode {
  enabled: boolean;
  message?: string;
}

export type AllSettings = GeneralSettings &
  FeatureSettings &
  IntegrationSettings &
  SecuritySettings &
  EmailSettings;

export interface UpdateSettingInput {
  key: string;
  value: string | number | boolean | Record<string, any>;
  category: SettingCategory;
  type: SettingType;
  description?: string;
  isPublic?: boolean;
  reason?: string;
}

export interface BulkUpdateSettingsInput {
  settings: UpdateSettingInput[];
  reason?: string;
}

export interface SettingsUpdatePayload {
  [key: string]: string | number | boolean | Record<string, any> | undefined;
}

export interface TestEmailInput {
  recipient: string;
}

export interface TestOAuthInput {
  provider: 'google' | 'linkedin' | 'github';
}
