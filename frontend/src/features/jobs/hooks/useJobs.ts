import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobsApi } from '../api/jobsApi';
import type { JobFilters } from '../types';

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
