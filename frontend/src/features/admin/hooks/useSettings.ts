/**
 * Settings Hooks
 *
 * React Query hooks for platform settings
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../api/settings.api';
import type {
  BulkUpdateSettingsInput,
  MaintenanceMode,
  PlatformSetting,
  SettingCategory,
  SettingsGroup,
  TestEmailInput,
  TestOAuthInput,
} from '../types/settings.types';
import toast from 'react-hot-toast';

const SETTINGS_KEYS = {
  all: ['admin', 'settings'] as const,
  list: () => [...SETTINGS_KEYS.all, 'list'] as const,
  grouped: () => [...SETTINGS_KEYS.all, 'grouped'] as const,
  category: (category: SettingCategory) => [...SETTINGS_KEYS.all, 'category', category] as const,
};

/**
 * Get all platform settings
 */
export const useSettings = (params?: {
  category?: SettingCategory;
  includeEncrypted?: boolean;
}) => {
  return useQuery({
    queryKey: params?.category
      ? SETTINGS_KEYS.category(params.category)
      : SETTINGS_KEYS.list(),
    queryFn: () => settingsApi.getAllSettings(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Get settings grouped by category
 */
export const useSettingsGrouped = () => {
  return useQuery({
    queryKey: SETTINGS_KEYS.grouped(),
    queryFn: () => settingsApi.getSettingsGrouped(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Get settings for a specific category
 */
export const useSettingsByCategory = (category: SettingCategory) => {
  return useQuery({
    queryKey: SETTINGS_KEYS.category(category),
    queryFn: () => settingsApi.getSettingsByCategory(category),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Update platform settings
 */
export const useUpdateSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: BulkUpdateSettingsInput) => settingsApi.updateSettings(input),
    onSuccess: () => {
      // Invalidate all settings queries
      queryClient.invalidateQueries({ queryKey: SETTINGS_KEYS.all });
      toast.success('Settings updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update settings';
      toast.error(message);
    },
  });
};

/**
 * Update maintenance mode
 */
export const useUpdateMaintenanceMode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: MaintenanceMode & { reason?: string }) =>
      settingsApi.updateMaintenanceMode(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: SETTINGS_KEYS.all });
      const message = variables.enabled
        ? 'Maintenance mode enabled'
        : 'Maintenance mode disabled';
      toast.success(message);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update maintenance mode';
      toast.error(message);
    },
  });
};

/**
 * Test email configuration
 */
export const useTestEmail = () => {
  return useMutation({
    mutationFn: (input: TestEmailInput) => settingsApi.testEmail(input),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to test email';
      toast.error(message);
    },
  });
};

/**
 * Test OAuth configuration
 */
export const useTestOAuth = () => {
  return useMutation({
    mutationFn: (input: TestOAuthInput) => settingsApi.testOAuth(input),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to test OAuth';
      toast.error(message);
    },
  });
};

/**
 * Helper hook to convert settings array to key-value object
 */
export const useSettingsAsObject = <T extends Record<string, any>>(
  settings: PlatformSetting[] | undefined
): T => {
  if (!settings) return {} as T;

  return settings.reduce((acc, setting) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {} as any) as T;
};
