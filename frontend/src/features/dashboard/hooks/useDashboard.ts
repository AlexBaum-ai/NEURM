import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboardApi';
import type { UpdateConfigPayload } from '../types';

export const useDashboardData = () => {
  return useSuspenseQuery({
    queryKey: ['dashboard', 'data'],
    queryFn: dashboardApi.getDashboardData,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useDashboardConfig = () => {
  return useSuspenseQuery({
    queryKey: ['dashboard', 'config'],
    queryFn: dashboardApi.getDashboardConfig,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useUpdateDashboardConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (config: UpdateConfigPayload) =>
      dashboardApi.updateDashboardConfig(config),
    onSuccess: (updatedConfig) => {
      queryClient.setQueryData(['dashboard', 'config'], updatedConfig);
    },
  });
};
