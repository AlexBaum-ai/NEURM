/**
 * Analytics data fetching hooks
 */

import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/adminApi';
import type {
  AnalyticsQueryParams,
  CustomAnalyticsQueryParams,
  CohortAnalysisParams,
  FunnelAnalysisParams,
} from '../types';
import toast from 'react-hot-toast';

/**
 * Fetch comprehensive analytics
 */
export function useAnalytics(params?: AnalyticsQueryParams) {
  return useSuspenseQuery({
    queryKey: ['admin', 'analytics', params],
    queryFn: () => adminApi.getAnalytics(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch custom analytics with date range
 */
export function useCustomAnalytics(params: CustomAnalyticsQueryParams) {
  return useSuspenseQuery({
    queryKey: ['admin', 'analytics', 'custom', params],
    queryFn: () => adminApi.getCustomAnalytics(params),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch cohort analysis
 */
export function useCohortAnalysis(params: CohortAnalysisParams) {
  return useSuspenseQuery({
    queryKey: ['admin', 'analytics', 'cohorts', params],
    queryFn: () => adminApi.getCohortAnalysis(params),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Fetch funnel analysis
 */
export function useFunnelAnalysis(
  funnelType: 'user_onboarding' | 'job_application',
  params?: Omit<FunnelAnalysisParams, 'funnelType'>
) {
  return useSuspenseQuery({
    queryKey: ['admin', 'analytics', 'funnel', funnelType, params],
    queryFn: () => adminApi.getFunnelAnalysis(funnelType, params),
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Export analytics data
 */
export function useExportAnalytics() {
  return useMutation({
    mutationFn: (options: {
      format: 'csv' | 'pdf';
      metrics: string[];
      startDate: string;
      endDate: string;
      includeCharts?: boolean;
    }) => adminApi.exportAnalytics(options),
    onSuccess: (blob, variables) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-${new Date().toISOString().split('T')[0]}.${variables.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`Analytics exported as ${variables.format.toUpperCase()}`);
    },
    onError: (error) => {
      console.error('Export failed:', error);
      toast.error('Failed to export analytics');
    },
  });
}

/**
 * Invalidate analytics cache
 */
export function useInvalidateAnalyticsCache() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => adminApi.invalidateAnalyticsCache(),
    onSuccess: () => {
      // Invalidate all analytics queries
      queryClient.invalidateQueries({ queryKey: ['admin', 'analytics'] });
      toast.success('Analytics cache invalidated');
    },
    onError: (error) => {
      console.error('Cache invalidation failed:', error);
      toast.error('Failed to invalidate cache');
    },
  });
}
