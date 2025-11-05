import { useSuspenseQuery, useMutation } from '@tanstack/react-query';
import { jobsApi } from '../api/jobsApi';
import type { DateRangeFilter, CompanyAnalytics, JobAnalytics } from '../types';
import { useState, useCallback } from 'react';

/**
 * Hook to fetch company analytics with date range filtering
 */
export const useCompanyAnalytics = (companyId: string, initialDateFilter?: DateRangeFilter) => {
  const [dateFilter, setDateFilter] = useState<DateRangeFilter | undefined>(initialDateFilter);

  const query = useSuspenseQuery({
    queryKey: ['company-analytics', companyId, dateFilter],
    queryFn: () => jobsApi.getCompanyAnalytics(companyId, dateFilter),
    staleTime: 60000, // Consider data stale after 1 minute
  });

  return {
    ...query,
    dateFilter,
    setDateFilter,
  };
};

/**
 * Hook to fetch job-specific analytics
 */
export const useJobAnalytics = (
  companyId: string,
  jobId: string | null,
  dateFilter?: DateRangeFilter
) => {
  return useSuspenseQuery({
    queryKey: ['job-analytics', companyId, jobId, dateFilter],
    queryFn: () => {
      if (!jobId) throw new Error('Job ID is required');
      return jobsApi.getJobAnalytics(companyId, jobId, dateFilter);
    },
    enabled: !!jobId,
    staleTime: 60000,
  });
};

/**
 * Hook for CSV export with proper file download handling
 */
export const useExportAnalyticsCSV = () => {
  return useMutation({
    mutationFn: async ({
      companyId,
      dateFilter,
    }: {
      companyId: string;
      dateFilter?: DateRangeFilter;
    }) => {
      const blob = await jobsApi.exportAnalyticsCSV(companyId, dateFilter);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
  });
};

/**
 * Hook for PDF export with proper file download handling
 */
export const useExportAnalyticsPDF = () => {
  return useMutation({
    mutationFn: async ({
      companyId,
      dateFilter,
    }: {
      companyId: string;
      dateFilter?: DateRangeFilter;
    }) => {
      const blob = await jobsApi.exportAnalyticsPDF(companyId, dateFilter);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
  });
};
