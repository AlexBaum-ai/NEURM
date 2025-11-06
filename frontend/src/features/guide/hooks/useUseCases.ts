import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { guideApi } from '../api/guideApi';
import type { UseCaseFilters, UseCaseSortOption, SubmitUseCaseData } from '../types';

interface UseUseCasesParams {
  limit?: number;
  sortBy?: UseCaseSortOption;
  filters?: UseCaseFilters;
}

/**
 * Hook for infinite scroll pagination of use cases
 */
export const useUseCases = ({
  limit = 20,
  sortBy = 'publishedAt-desc',
  filters,
}: UseUseCasesParams = {}) => {
  return useInfiniteQuery({
    queryKey: ['useCases', { sortBy, filters }],
    queryFn: ({ pageParam = 1 }) =>
      guideApi.getUseCases({
        page: pageParam,
        limit,
        sortBy,
        filters,
      }),
    getNextPageParam: (lastPage) => {
      const { pagination } = lastPage;
      const hasNext = pagination.page < pagination.totalPages;
      return hasNext ? pagination.page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook for fetching featured use cases
 */
export const useFeaturedUseCases = () => {
  return useQuery({
    queryKey: ['useCases', 'featured'],
    queryFn: () => guideApi.getFeaturedUseCases(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook for fetching a single use case by slug
 */
export const useUseCaseDetail = (slug: string) => {
  return useQuery({
    queryKey: ['useCase', slug],
    queryFn: () => guideApi.getUseCaseBySlug(slug),
    staleTime: 5 * 60 * 1000,
    enabled: !!slug,
  });
};

/**
 * Hook for submitting a new use case
 */
export const useSubmitUseCase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SubmitUseCaseData) => guideApi.submitUseCase(data),
    onSuccess: () => {
      // Invalidate use cases list
      queryClient.invalidateQueries({ queryKey: ['useCases'] });
    },
  });
};

/**
 * Hook for fetching admin use cases (for review dashboard)
 */
export const useAdminUseCases = (params: {
  page?: number;
  limit?: number;
  status?: string;
} = {}) => {
  return useQuery({
    queryKey: ['adminUseCases', params],
    queryFn: () => guideApi.getAdminUseCases(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook for reviewing a use case (admin only)
 */
export const useReviewUseCase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      action,
      feedback,
    }: {
      id: string;
      action: 'APPROVED' | 'REJECTED';
      feedback?: string;
    }) => guideApi.reviewUseCase(id, action, feedback),
    onSuccess: () => {
      // Invalidate admin use cases list
      queryClient.invalidateQueries({ queryKey: ['adminUseCases'] });
      queryClient.invalidateQueries({ queryKey: ['useCases'] });
    },
  });
};
