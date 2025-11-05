import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobsApi } from '../api/jobsApi';
import type { JobFilters, ApplicationFilterType } from '../types';

interface UseJobsParams {
  limit?: number;
  filters?: JobFilters;
}

/**
 * Hook for infinite scroll pagination of jobs
 */
export const useJobs = ({ limit = 20, filters }: UseJobsParams = {}) => {
  return useInfiniteQuery({
    queryKey: ['jobs', { filters }],
    queryFn: ({ pageParam = 1 }) =>
      jobsApi.getJobs({
        page: pageParam,
        limit,
        filters,
      }),
    getNextPageParam: (lastPage) => {
      const hasNext = lastPage.page < lastPage.totalPages;
      return hasNext ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook for regular pagination of jobs
 */
export const useJobsPaginated = ({ limit = 20, filters }: UseJobsParams = {}) => {
  const page = filters?.sort ? 1 : 1;
  return useQuery({
    queryKey: ['jobs', 'paginated', { page, filters }],
    queryFn: () =>
      jobsApi.getJobs({
        page,
        limit,
        filters,
      }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook for fetching a single job by slug
 */
export const useJob = (slug: string) => {
  return useQuery({
    queryKey: ['job', slug],
    queryFn: () => jobsApi.getJobBySlug(slug),
    enabled: !!slug,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook for fetching related jobs
 */
export const useRelatedJobs = (slug: string, limit: number = 6) => {
  return useQuery({
    queryKey: ['jobs', 'related', slug],
    queryFn: () => jobsApi.getRelatedJobs(slug, limit),
    enabled: !!slug,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
};

/**
 * Hook for saving a job
 */
export const useSaveJob = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ slug, notes }: { slug: string; notes?: string }) =>
      jobsApi.saveJob(slug, notes ? { notes } : undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['savedJobs'] });
    },
  });
};

/**
 * Hook for unsaving a job
 */
export const useUnsaveJob = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (slug: string) => jobsApi.unsaveJob(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['savedJobs'] });
    },
  });
};

/**
 * Hook for applying to a job
 */
export const useApplyJob = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ slug, data }: { slug: string; data: any }) =>
      jobsApi.applyToJob(slug, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['job', variables.slug] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
};

/**
 * Hook for fetching user's saved jobs
 */
export const useSavedJobs = () => {
  return useQuery({
    queryKey: ['savedJobs'],
    queryFn: () => jobsApi.getSavedJobs(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook for fetching job match score and breakdown
 */
export const useJobMatch = (slug: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['jobMatch', slug],
    queryFn: () => jobsApi.getJobMatch(slug),
    enabled: enabled && !!slug,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: false, // Don't retry on auth errors
  });
};

/**
 * Hook for fetching user's applications with real-time updates (polling)
 */
export const useApplications = (filter?: ApplicationFilterType) => {
  return useQuery({
    queryKey: ['applications', filter],
    queryFn: () => jobsApi.getApplications(filter),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for real-time updates
  });
};

/**
 * Hook for fetching a single application by ID
 */
export const useApplication = (id: string) => {
  return useQuery({
    queryKey: ['application', id],
    queryFn: () => jobsApi.getApplicationById(id),
    enabled: !!id,
    staleTime: 30 * 1000, // 30 seconds
  });
};

/**
 * Hook for withdrawing an application
 */
export const useWithdrawApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => jobsApi.withdrawApplication(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['application'] });
    },
  });
};

/**
 * Hook for exporting applications
 */
export const useExportApplications = () => {
  return useMutation({
    mutationFn: () => jobsApi.exportApplications(),
  });
};

/**
 * Hook for fetching user's job alerts
 */
export const useJobAlerts = () => {
  return useQuery({
    queryKey: ['jobAlerts'],
    queryFn: () => jobsApi.getJobAlerts(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook for creating a new job alert
 */
export const useCreateJobAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => jobsApi.createJobAlert(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobAlerts'] });
    },
  });
};

/**
 * Hook for updating a job alert
 */
export const useUpdateJobAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      jobsApi.updateJobAlert(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobAlerts'] });
    },
  });
};

/**
 * Hook for deleting a job alert
 */
export const useDeleteJobAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => jobsApi.deleteJobAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobAlerts'] });
    },
  });
};

/**
 * Hook for testing a job alert
 */
export const useTestJobAlert = () => {
  return useMutation({
    mutationFn: (id: string) => jobsApi.testJobAlert(id),
  });
};
