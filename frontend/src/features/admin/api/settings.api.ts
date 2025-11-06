/**
 * Admin Settings API Client
 *
 * API methods for managing platform settings
 */

import { apiClient } from '@/lib/api';
import type {
  PlatformSetting,
  SettingsGroup,
  BulkUpdateSettingsInput,
  MaintenanceMode,
  TestEmailInput,
  TestOAuthInput,
  SettingCategory,
} from '../types/settings.types';

const BASE_URL = '/admin/settings';

export const settingsApi = {
  /**
   * Get all platform settings
   */
  getAllSettings: async (params?: {
    category?: SettingCategory;
    includeEncrypted?: boolean;
  }): Promise<PlatformSetting[]> => {
    return apiClient.get<PlatformSetting[]>(BASE_URL, { params });
  },

  /**
   * Get settings grouped by category
   */
  getSettingsGrouped: async (): Promise<SettingsGroup[]> => {
    const settings = await apiClient.get<PlatformSetting[]>(BASE_URL);

    // Group settings by category
    const grouped = settings.reduce((acc, setting) => {
      const existing = acc.find((g) => g.category === setting.category);
      if (existing) {
        existing.settings.push(setting);
      } else {
        acc.push({
          category: setting.category,
          settings: [setting],
        });
      }
      return acc;
    }, [] as SettingsGroup[]);

    return grouped;
  },

  /**
   * Get settings for a specific category
   */
  getSettingsByCategory: async (
    category: SettingCategory
  ): Promise<PlatformSetting[]> => {
    return apiClient.get<PlatformSetting[]>(BASE_URL, {
      params: { category },
    });
  },

  /**
   * Update platform settings (bulk update)
   */
  updateSettings: async (
    input: BulkUpdateSettingsInput
  ): Promise<PlatformSetting[]> => {
    return apiClient.put<PlatformSetting[]>(BASE_URL, input);
  },

  /**
   * Update maintenance mode
   */
  updateMaintenanceMode: async (
    input: MaintenanceMode & { reason?: string }
  ): Promise<void> => {
    return apiClient.put<void>(`${BASE_URL}/maintenance`, input);
  },

  /**
   * Test email configuration
   */
  testEmail: async (input: TestEmailInput): Promise<{ success: boolean; message: string }> => {
    return apiClient.post<{ success: boolean; message: string }>(
      `${BASE_URL}/test-email`,
      input
    );
  },

  /**
   * Test OAuth configuration
   */
  testOAuth: async (input: TestOAuthInput): Promise<{ success: boolean; message: string }> => {
    return apiClient.post<{ success: boolean; message: string }>(
      `${BASE_URL}/test-oauth`,
      input
    );
  },
};
