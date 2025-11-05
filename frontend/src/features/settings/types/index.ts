import { z } from 'zod';

// Settings-related types
export interface UserSession {
  id: string;
  deviceName: string;
  browser: string;
  os: string;
  ipAddress: string;
  location?: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface TwoFactorSettings {
  enabled: boolean;
  method?: 'totp' | 'sms';
  backupCodes?: string[];
}

export interface EmailChangeRequest {
  newEmail: string;
  status: 'pending' | 'verified';
  expiresAt: string;
}

export interface DataExportRequest {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestedAt: string;
  completedAt?: string;
  downloadUrl?: string;
  expiresAt?: string;
}

// Validation schemas
export const changeEmailSchema = z.object({
  newEmail: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string().min(1, 'Password confirmation is required'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required'),
  confirmText: z.string().refine((val) => val === 'DELETE', {
    message: 'Type DELETE to confirm',
  }),
  captcha: z.string().min(1, 'Please complete the CAPTCHA'),
});

export const enable2FASchema = z.object({
  code: z.string().length(6, 'Code must be 6 digits'),
});

export const disable2FASchema = z.object({
  password: z.string().min(1, 'Password is required'),
  code: z.string().length(6, 'Code must be 6 digits'),
});

// Form data types
export type ChangeEmailFormData = z.infer<typeof changeEmailSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type DeleteAccountFormData = z.infer<typeof deleteAccountSchema>;
export type Enable2FAFormData = z.infer<typeof enable2FASchema>;
export type Disable2FAFormData = z.infer<typeof disable2FASchema>;

// API response types
export interface ChangeEmailResponse {
  message: string;
  verificationSent: boolean;
}

export interface ChangePasswordResponse {
  message: string;
}

export interface Enable2FAResponse {
  qrCode: string;
  secret: string;
  backupCodes: string[];
}

export interface SessionsResponse {
  data: UserSession[];
}

export interface TwoFactorSettingsResponse {
  data: TwoFactorSettings;
}

export interface DataExportResponse {
  data: DataExportRequest;
}
