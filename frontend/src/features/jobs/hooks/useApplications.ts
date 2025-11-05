import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobsApi } from '../api/jobsApi';
import type { ApplicationFilterType, ApplicationsResponse } from '../types';

/**
 * Hook to fetch and manage user's job applications
 * Includes real-time polling every 30 seconds
 */
export const useApplications = (filter: ApplicationFilterType = 'all') => {
  return useSuspenseQuery({
    queryKey: ['applications', filter],
    queryFn: () => jobsApi.getApplications(filter),
    refetchInterval: 30000, // Poll every 30 seconds
    refetchIntervalInBackground: false, // Only poll when tab is active
    staleTime: 10000, // Consider data stale after 10 seconds
  });
};

/**
 * Hook to fetch a single application by ID
 */
export const useApplication = (id: string | null) => {
  return useSuspenseQuery({
    queryKey: ['application', id],
    queryFn: () => {
      if (!id) throw new Error('Application ID is required');
      return jobsApi.getApplicationById(id);
    },
    enabled: !!id,
  });
};

/**
 * Hook to withdraw an application
 */
export const useWithdrawApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (applicationId: string) => jobsApi.withdrawApplication(applicationId),
    onSuccess: () => {
      // Invalidate all application queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['application'] });
    },
  });
};

/**
 * Hook to export applications as CSV
 */
export const useExportApplications = () => {
  return useMutation({
    mutationFn: async () => {
      const blob = await jobsApi.exportApplications();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `applications_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true };
    },
  });
};
