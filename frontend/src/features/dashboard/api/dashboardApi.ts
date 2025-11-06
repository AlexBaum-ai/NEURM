import { apiClient } from '@/lib/api';
import type {
  DashboardData,
  DashboardConfig,
  UpdateConfigPayload,
} from '../types';

export const dashboardApi = {
  /**
   * Fetch all dashboard data (widgets content)
   */
  getDashboardData: async (): Promise<DashboardData> => {
    return apiClient.get<DashboardData>('/dashboard');
  },

  /**
   * Fetch dashboard configuration (widget positions, enabled state)
   */
  getDashboardConfig: async (): Promise<DashboardConfig> => {
    return apiClient.get<DashboardConfig>('/dashboard/config');
  },

  /**
   * Update dashboard configuration
   */
  updateDashboardConfig: async (
    config: UpdateConfigPayload
  ): Promise<DashboardConfig> => {
    return apiClient.put<DashboardConfig>('/dashboard/config', config);
  },
};
