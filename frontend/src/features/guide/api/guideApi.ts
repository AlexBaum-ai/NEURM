import { apiClient } from '@/lib/api';
import type {
  UseCasesResponse,
  UseCaseDetailResponse,
  UseCaseFilters,
  UseCaseSortOption,
  SubmitUseCaseData,
} from '../types';

export const guideApi = {
  /**
   * Fetch paginated use cases with filters
   */
  getUseCases: async (params: {
    page?: number;
    limit?: number;
    sortBy?: UseCaseSortOption;
    filters?: UseCaseFilters;
  }): Promise<UseCasesResponse> => {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);

    if (params.filters) {
      if (params.filters.search) queryParams.append('search', params.filters.search);
      if (params.filters.category) queryParams.append('category', params.filters.category);
      if (params.filters.industry) queryParams.append('industry', params.filters.industry);
      if (params.filters.model) queryParams.append('model', params.filters.model);
      if (params.filters.implementationType)
        queryParams.append('implementationType', params.filters.implementationType);
      if (params.filters.hasCode !== undefined)
        queryParams.append('hasCode', params.filters.hasCode.toString());
      if (params.filters.hasROI !== undefined)
        queryParams.append('hasROI', params.filters.hasROI.toString());
    }

    return apiClient.get<UseCasesResponse>(`/use-cases?${queryParams.toString()}`);
  },

  /**
   * Fetch featured use cases
   */
  getFeaturedUseCases: async (): Promise<UseCasesResponse> => {
    return apiClient.get<UseCasesResponse>('/use-cases/featured');
  },

  /**
   * Fetch use case by slug
   */
  getUseCaseBySlug: async (slug: string): Promise<UseCaseDetailResponse> => {
    return apiClient.get<UseCaseDetailResponse>(`/use-cases/${slug}`);
  },

  /**
   * Submit a new use case
   */
  submitUseCase: async (data: SubmitUseCaseData): Promise<{ success: boolean; slug: string }> => {
    return apiClient.post<{ success: boolean; slug: string }>('/use-cases/submit', data);
  },

  /**
   * Get all use cases for admin review (pending + approved + rejected)
   */
  getAdminUseCases: async (params: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<UseCasesResponse> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.status) queryParams.append('status', params.status);

    return apiClient.get<UseCasesResponse>(`/use-cases/admin/all?${queryParams.toString()}`);
  },

  /**
   * Review a use case (admin only)
   */
  reviewUseCase: async (
    id: string,
    action: 'APPROVED' | 'REJECTED',
    feedback?: string
  ): Promise<{ success: boolean }> => {
    return apiClient.put<{ success: boolean }>(`/admin/use-cases/${id}/review`, {
      action,
      feedback,
    });
  },
};
