import { apiClient } from '@/lib/api';
import type {
  JobsResponse,
  JobDetail,
  JobFilters,
  SaveJobRequest,
  ApplyJobRequest,
  JobListItem,
} from '../types';

export const jobsApi = {
  /**
   * Fetch paginated jobs with filters
   */
  getJobs: async (params: {
    page?: number;
    limit?: number;
    filters?: JobFilters;
  }): Promise<JobsResponse> => {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    if (params.filters) {
      // Location filters
      if (params.filters.location) queryParams.append('location', params.filters.location);
      if (params.filters.locationType) {
        params.filters.locationType.forEach((type) =>
          queryParams.append('locationType', type)
        );
      }

      // Experience and employment
      if (params.filters.experienceLevel) {
        params.filters.experienceLevel.forEach((level) =>
          queryParams.append('experienceLevel', level)
        );
      }
      if (params.filters.employmentType) {
        params.filters.employmentType.forEach((type) =>
          queryParams.append('employmentType', type)
        );
      }

      // Salary range
      if (params.filters.salaryMin !== undefined) {
        queryParams.append('salaryMin', params.filters.salaryMin.toString());
      }
      if (params.filters.salaryMax !== undefined) {
        queryParams.append('salaryMax', params.filters.salaryMax.toString());
      }

      // Tech stack
      if (params.filters.model) {
        params.filters.model.forEach((model) => queryParams.append('model', model));
      }
      if (params.filters.framework) {
        params.filters.framework.forEach((framework) =>
          queryParams.append('framework', framework)
        );
      }

      // Other filters
      if (params.filters.hasVisaSponsorship !== undefined) {
        queryParams.append('hasVisaSponsorship', params.filters.hasVisaSponsorship.toString());
      }
      if (params.filters.search) {
        queryParams.append('search', params.filters.search);
      }

      // Sorting
      if (params.filters.sort) {
        const sortMap = {
          newest: '-publishedAt',
          highest_salary: 'salaryMax',
          best_match: '-matchScore',
        };
        queryParams.append('sort', sortMap[params.filters.sort] || '-publishedAt');
      }
    }

    const queryString = queryParams.toString();
    const response = await apiClient.get<{ success: boolean; data: JobsResponse }>(
      `/jobs${queryString ? '?' + queryString : ''}`
    );
    return response.data;
  },

  /**
   * Fetch job detail by slug
   */
  getJobBySlug: async (slug: string): Promise<JobDetail> => {
    const response = await apiClient.get<{ success: boolean; data: JobDetail }>(
      `/jobs/${slug}`
    );
    return response.data;
  },

  /**
   * Get similar/related jobs based on tech stack
   */
  getRelatedJobs: async (slug: string, limit: number = 6): Promise<JobListItem[]> => {
    const job = await jobsApi.getJobBySlug(slug);
    
    const filters: JobFilters = {
      model: job.primaryLlms.slice(0, 2),
      framework: job.frameworks.slice(0, 2),
    };
    
    const response = await jobsApi.getJobs({ limit, filters });
    
    return response.jobs.filter((j) => j.slug !== slug).slice(0, limit);
  },

  /**
   * Save/bookmark a job
   */
  saveJob: async (slug: string, data?: SaveJobRequest): Promise<{ success: boolean }> => {
    return apiClient.post<{ success: boolean }>(`/jobs/${slug}/save`, data);
  },

  /**
   * Unsave/unbookmark a job
   */
  unsaveJob: async (slug: string): Promise<void> => {
    return apiClient.delete<void>(`/jobs/${slug}/save`);
  },

  /**
   * Apply to a job
   */
  applyToJob: async (
    slug: string,
    data: ApplyJobRequest
  ): Promise<{ success: boolean; message: string }> => {
    return apiClient.post<{ success: boolean; message: string }>(
      `/jobs/${slug}/apply`,
      data
    );
  },

  /**
   * Get user's saved jobs
   */
  getSavedJobs: async (): Promise<JobListItem[]> => {
    const response = await apiClient.get<{
      success: boolean;
      data: { savedJobs: Array<{ job: JobListItem }> };
    }>('/users/me/saved-jobs');
    return response.data.savedJobs.map((item) => item.job);
  },
};
