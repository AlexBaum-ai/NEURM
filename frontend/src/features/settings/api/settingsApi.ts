import apiClient from '@/lib/api';
import type {
  ChangeEmailFormData,
  ChangeEmailResponse,
  ChangePasswordFormData,
  ChangePasswordResponse,
  UserSession,
  SessionsResponse,
  TwoFactorSettings,
  TwoFactorSettingsResponse,
  Enable2FAResponse,
  DataExportRequest,
  DataExportResponse,
} from '../types';
import type { ProfilePrivacySettings } from '@/features/user/types';

/**
 * Settings API Service
 * Handles all settings-related API calls
 */

// Account Settings
export const changeEmail = async (data: ChangeEmailFormData): Promise<ChangeEmailResponse> => {
  return apiClient.post('/auth/change-email', data);
};

export const verifyEmailChange = async (token: string): Promise<{ message: string }> => {
  return apiClient.post('/auth/verify-email-change', { token });
};

export const changePassword = async (
  data: ChangePasswordFormData
): Promise<ChangePasswordResponse> => {
  return apiClient.post('/auth/change-password', data);
};

// Privacy Settings
export const getPrivacySettings = async (): Promise<ProfilePrivacySettings> => {
  const response = await apiClient.get<{ data: ProfilePrivacySettings }>('/users/me/privacy');
  return response.data;
};

export const updatePrivacySettings = async (
  settings: Partial<ProfilePrivacySettings>
): Promise<ProfilePrivacySettings> => {
  const response = await apiClient.patch<{ data: ProfilePrivacySettings }>(
    '/users/me/privacy',
    settings
  );
  return response.data;
};

// Security Settings - 2FA
export const get2FASettings = async (): Promise<TwoFactorSettings> => {
  const response = await apiClient.get<TwoFactorSettingsResponse>('/auth/2fa/status');
  return response.data;
};

export const enable2FA = async (): Promise<Enable2FAResponse> => {
  return apiClient.post('/auth/2fa/enable');
};

export const verify2FA = async (code: string): Promise<{ backupCodes: string[] }> => {
  return apiClient.post('/auth/2fa/verify', { code });
};

export const disable2FA = async (password: string, code: string): Promise<{ message: string }> => {
  return apiClient.post('/auth/2fa/disable', { password, code });
};

export const regenerate2FABackupCodes = async (): Promise<{ backupCodes: string[] }> => {
  return apiClient.post('/auth/2fa/regenerate-codes');
};

// Session Management
export const getActiveSessions = async (): Promise<UserSession[]> => {
  const response = await apiClient.get<SessionsResponse>('/auth/sessions');
  return response.data;
};

export const revokeSession = async (sessionId: string): Promise<{ message: string }> => {
  return apiClient.delete(`/auth/sessions/${sessionId}`);
};

export const revokeAllSessions = async (): Promise<{ message: string }> => {
  return apiClient.delete('/auth/sessions');
};

// Data Export
export const requestDataExport = async (): Promise<DataExportRequest> => {
  const response = await apiClient.post<DataExportResponse>('/users/me/export');
  return response.data;
};

export const getDataExportStatus = async (): Promise<DataExportRequest | null> => {
  try {
    const response = await apiClient.get<DataExportResponse>('/users/me/export');
    return response.data;
  } catch (error) {
    return null;
  }
};

// Account Deletion
export const deleteAccount = async (
  password: string,
  captcha: string
): Promise<{ message: string }> => {
  return apiClient.post('/users/me/delete', { password, captcha });
};
