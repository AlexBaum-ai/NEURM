import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../api/adminApi';
import type { DateRange } from '../types';

export const useDashboard = (dateRange?: DateRange) => {
  return useQuery({
    queryKey: ['admin', 'dashboard', dateRange],
    queryFn: () => adminApi.getDashboard(dateRange),
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 25000, // Consider data stale after 25 seconds
  });
};
