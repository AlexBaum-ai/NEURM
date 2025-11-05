/**
 * useCompany Hook
 *
 * Hook for fetching and managing company data
 */

import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/common/Toast';
import {
  getCompanyProfile,
  getCompanyJobs,
  updateCompanyProfile,
  followCompany,
  unfollowCompany,
} from '../api/companiesApi';
import type { CompanyFormData } from '../types';

/**
 * Fetch company profile with jobs
 */
export const useCompany = (slug: string) => {
  const { data: company } = useSuspenseQuery({
    queryKey: ['company', slug],
    queryFn: () => getCompanyProfile(slug),
  });

  const { data: jobsData } = useSuspenseQuery({
    queryKey: ['company', slug, 'jobs'],
    queryFn: () => getCompanyJobs(company.id),
  });

  return {
    company,
    jobs: jobsData.jobs,
    jobCount: jobsData.count,
  };
};

/**
 * Update company profile mutation
 */
export const useUpdateCompany = (companyId: string) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (data: Partial<CompanyFormData>) => updateCompanyProfile(companyId, data),
    onSuccess: (updatedCompany) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['company', updatedCompany.slug] });
      queryClient.invalidateQueries({ queryKey: ['company', companyId] });
      showToast({
        type: 'success',
        message: 'Company profile updated successfully',
      });
    },
    onError: (error: Error) => {
      showToast({
        type: 'error',
        message: error.message || 'Failed to update company profile',
      });
    },
  });
};

/**
 * Follow/unfollow company mutation
 */
export const useFollowCompany = (companyId: string, companySlug: string) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const followMutation = useMutation({
    mutationFn: () => followCompany(companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', companySlug] });
      queryClient.invalidateQueries({ queryKey: ['company', companyId] });
      showToast({
        type: 'success',
        message: 'Successfully followed company',
      });
    },
    onError: (error: Error) => {
      showToast({
        type: 'error',
        message: error.message || 'Failed to follow company',
      });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: () => unfollowCompany(companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', companySlug] });
      queryClient.invalidateQueries({ queryKey: ['company', companyId] });
      showToast({
        type: 'success',
        message: 'Successfully unfollowed company',
      });
    },
    onError: (error: Error) => {
      showToast({
        type: 'error',
        message: error.message || 'Failed to unfollow company',
      });
    },
  });

  return {
    follow: followMutation.mutate,
    unfollow: unfollowMutation.mutate,
    isFollowing: followMutation.isPending,
    isUnfollowing: unfollowMutation.isPending,
  };
};
