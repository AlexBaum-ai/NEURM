import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobsApi } from '../api/jobsApi';
import type {
  ATSFilters,
  CompanyApplicationsResponse,
  ATSApplicantDetail,
  UpdateATSStatusRequest,
  AddNoteRequest,
  UpdateRatingRequest,
  ShareApplicationRequest,
} from '../types';

/**
 * Hook to fetch company applications for ATS dashboard
 * Includes real-time polling every 60 seconds
 */
export const useCompanyApplications = (filters?: ATSFilters) => {
  return useSuspenseQuery({
    queryKey: ['company-applications', filters],
    queryFn: () => jobsApi.getCompanyApplications(filters),
    refetchInterval: 60000, // Poll every 60 seconds as per requirements
    refetchIntervalInBackground: false, // Only poll when tab is active
    staleTime: 30000, // Consider data stale after 30 seconds
  });
};

/**
 * Hook to fetch single application details for ATS
 */
export const useCompanyApplicationDetail = (id: string | null) => {
  return useSuspenseQuery({
    queryKey: ['company-application-detail', id],
    queryFn: () => {
      if (!id) throw new Error('Application ID is required');
      return jobsApi.getCompanyApplicationById(id);
    },
    enabled: !!id,
  });
};

/**
 * Hook to update application status
 */
export const useUpdateApplicationStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateATSStatusRequest }) =>
      jobsApi.updateApplicationStatus(id, data),
    onSuccess: () => {
      // Invalidate queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['company-applications'] });
      queryClient.invalidateQueries({ queryKey: ['company-application-detail'] });
    },
  });
};

/**
 * Hook to add a note to an application
 */
export const useAddApplicationNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AddNoteRequest }) =>
      jobsApi.addApplicationNote(id, data),
    onSuccess: (_, variables) => {
      // Invalidate the specific application detail to refetch notes
      queryClient.invalidateQueries({
        queryKey: ['company-application-detail', variables.id],
      });
    },
  });
};

/**
 * Hook to rate an applicant
 */
export const useRateApplicant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRatingRequest }) =>
      jobsApi.rateApplicant(id, data),
    onSuccess: () => {
      // Invalidate queries to show updated rating
      queryClient.invalidateQueries({ queryKey: ['company-applications'] });
      queryClient.invalidateQueries({ queryKey: ['company-application-detail'] });
    },
  });
};

/**
 * Hook to share application with team members
 */
export const useShareApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ShareApplicationRequest }) =>
      jobsApi.shareApplication(id, data),
    onSuccess: (_, variables) => {
      // Invalidate the specific application detail to show updated sharing info
      queryClient.invalidateQueries({
        queryKey: ['company-application-detail', variables.id],
      });
    },
  });
};
