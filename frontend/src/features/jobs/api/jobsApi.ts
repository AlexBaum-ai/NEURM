import { apiClient } from '@/lib/api';
import type {
  JobsResponse,
  JobDetail,
  JobFilters,
  SaveJobRequest,
  ApplyJobRequest,
  JobListItem,
  JobMatch,
  JobMatchResponse,
  ApplicationsResponse,
  Application,
  ApplicationFilterType,
  JobAlert,
  CreateAlertRequest,
  UpdateAlertRequest,
  CompanyApplicationsResponse,
  ATSApplicantDetail,
  ATSFilters,
  UpdateATSStatusRequest,
  AddNoteRequest,
  UpdateRatingRequest,
  ShareApplicationRequest,
  CompanyAnalytics,
  JobAnalytics,
  DateRangeFilter,
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

      // Match filters
      if (params.filters.minMatchScore !== undefined) {
        queryParams.append('minMatchScore', params.filters.minMatchScore.toString());
      }
      if (params.filters.includeMatches !== undefined) {
        queryParams.append('match', params.filters.includeMatches.toString());
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

  /**
   * Get match score for a specific job
   */
  getJobMatch: async (slug: string): Promise<JobMatch> => {
    const response = await apiClient.get<JobMatchResponse>(`/jobs/${slug}/match`);
    return response.data;
  },

  /**
   * Get user's applications with optional filter
   */
  getApplications: async (filter?: ApplicationFilterType): Promise<ApplicationsResponse> => {
    const queryParams = new URLSearchParams();
    if (filter && filter !== 'all') {
      queryParams.append('filter', filter);
    }

    const queryString = queryParams.toString();
    const response = await apiClient.get<{ success: boolean; data: ApplicationsResponse }>(
      `/applications${queryString ? '?' + queryString : ''}`
    );
    return response.data;
  },

  /**
   * Get single application by ID with full details
   */
  getApplicationById: async (id: string): Promise<Application> => {
    const response = await apiClient.get<{ success: boolean; data: Application }>(
      `/applications/${id}`
    );
    return response.data;
  },

  /**
   * Withdraw an application
   */
  withdrawApplication: async (id: string): Promise<{ success: boolean; message: string }> => {
    return apiClient.put<{ success: boolean; message: string }>(
      `/applications/${id}/withdraw`,
      {}
    );
  },

  /**
   * Export applications as CSV
   */
  exportApplications: async (): Promise<Blob> => {
    const response = await apiClient.get<Blob>('/applications/export', {
      responseType: 'blob',
    });
    return response;
  },

  /**
   * Get all job alerts for the current user
   */
  getJobAlerts: async (): Promise<JobAlert[]> => {
    const response = await apiClient.get<{
      success: boolean;
      data: { alerts: JobAlert[] };
    }>('/jobs/alerts');
    return response.data.alerts;
  },

  /**
   * Create a new job alert
   */
  createJobAlert: async (data: CreateAlertRequest): Promise<JobAlert> => {
    const response = await apiClient.post<{
      success: boolean;
      data: { alert: JobAlert };
    }>('/jobs/alerts', data);
    return response.data.alert;
  },

  /**
   * Update an existing job alert
   */
  updateJobAlert: async (id: string, data: UpdateAlertRequest): Promise<JobAlert> => {
    const response = await apiClient.patch<{
      success: boolean;
      data: { alert: JobAlert };
    }>(`/jobs/alerts/${id}`, data);
    return response.data.alert;
  },

  /**
   * Delete a job alert
   */
  deleteJobAlert: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/jobs/alerts/${id}`);
  },

  /**
   * Test a job alert (sends sample email)
   */
  testJobAlert: async (id: string): Promise<{ success: boolean; message: string }> => {
    return apiClient.post<{ success: boolean; message: string }>(
      `/jobs/alerts/${id}/test`,
      {}
    );
  },

  // ========== ATS (Applicant Tracking System) APIs for Companies ==========

  /**
   * Get all applications for company's jobs with filters (ATS dashboard)
   */
  getCompanyApplications: async (filters?: ATSFilters): Promise<CompanyApplicationsResponse> => {
    const queryParams = new URLSearchParams();

    if (filters) {
      if (filters.jobId) queryParams.append('jobId', filters.jobId);
      if (filters.status && filters.status.length > 0) {
        filters.status.forEach((status) => queryParams.append('status', status));
      }
      if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) queryParams.append('dateTo', filters.dateTo);
      if (filters.minMatchScore !== undefined) {
        queryParams.append('minMatchScore', filters.minMatchScore.toString());
      }
      if (filters.maxMatchScore !== undefined) {
        queryParams.append('maxMatchScore', filters.maxMatchScore.toString());
      }
      if (filters.rating && filters.rating.length > 0) {
        filters.rating.forEach((rating) => queryParams.append('rating', rating.toString()));
      }
      if (filters.search) queryParams.append('search', filters.search);
    }

    const queryString = queryParams.toString();
    const response = await apiClient.get<{
      success: boolean;
      data: CompanyApplicationsResponse;
    }>(`/companies/applications${queryString ? '?' + queryString : ''}`);
    return response.data;
  },

  /**
   * Get full application details for ATS (includes notes, activity, etc.)
   */
  getCompanyApplicationById: async (id: string): Promise<ATSApplicantDetail> => {
    const response = await apiClient.get<{
      success: boolean;
      data: ATSApplicantDetail;
    }>(`/companies/applications/${id}`);
    return response.data;
  },

  /**
   * Update application status in ATS
   */
  updateApplicationStatus: async (
    id: string,
    data: UpdateATSStatusRequest
  ): Promise<{ success: boolean; message: string }> => {
    return apiClient.put<{ success: boolean; message: string }>(
      `/companies/applications/${id}/status`,
      data
    );
  },

  /**
   * Add a note to an application
   */
  addApplicationNote: async (
    id: string,
    data: AddNoteRequest
  ): Promise<{ success: boolean; message: string }> => {
    return apiClient.post<{ success: boolean; message: string }>(
      `/companies/applications/${id}/notes`,
      data
    );
  },

  /**
   * Rate an applicant (1-5 stars)
   */
  rateApplicant: async (
    id: string,
    data: UpdateRatingRequest
  ): Promise<{ success: boolean; message: string }> => {
    return apiClient.put<{ success: boolean; message: string }>(
      `/companies/applications/${id}/rating`,
      data
    );
  },

  /**
   * Share application with team members
   */
  shareApplication: async (
    id: string,
    data: ShareApplicationRequest
  ): Promise<{ success: boolean; message: string }> => {
    return apiClient.post<{ success: boolean; message: string }>(
      `/companies/applications/${id}/share`,
      data
    );
  },

  /**
   * Get activity log for an application
   */
  getApplicationActivity: async (id: string): Promise<any[]> => {
    const response = await apiClient.get<{
      success: boolean;
      data: { activities: any[] };
    }>(`/companies/applications/${id}/activity`);
    return response.data.activities;
  },

  // ========== Analytics APIs for Companies ==========

  /**
   * Get company-wide analytics with date range filter
   */
  getCompanyAnalytics: async (
    companyId: string,
    dateFilter?: DateRangeFilter
  ): Promise<CompanyAnalytics> => {
    const queryParams = new URLSearchParams();

    if (dateFilter) {
      if (dateFilter.range !== 'custom') {
        queryParams.append('range', dateFilter.range);
      } else {
        if (dateFilter.startDate) queryParams.append('startDate', dateFilter.startDate);
        if (dateFilter.endDate) queryParams.append('endDate', dateFilter.endDate);
      }
    }

    const queryString = queryParams.toString();
    const response = await apiClient.get<{
      success: boolean;
      data: CompanyAnalytics;
    }>(`/companies/${companyId}/analytics${queryString ? '?' + queryString : ''}`);
    return response.data;
  },

  /**
   * Get job-specific analytics
   */
  getJobAnalytics: async (
    companyId: string,
    jobId: string,
    dateFilter?: DateRangeFilter
  ): Promise<JobAnalytics> => {
    const queryParams = new URLSearchParams();

    if (dateFilter) {
      if (dateFilter.range !== 'custom') {
        queryParams.append('range', dateFilter.range);
      } else {
        if (dateFilter.startDate) queryParams.append('startDate', dateFilter.startDate);
        if (dateFilter.endDate) queryParams.append('endDate', dateFilter.endDate);
      }
    }

    const queryString = queryParams.toString();
    const response = await apiClient.get<{
      success: boolean;
      data: JobAnalytics;
    }>(
      `/companies/${companyId}/analytics/jobs/${jobId}${queryString ? '?' + queryString : ''}`
    );
    return response.data;
  },

  /**
   * Export analytics as CSV
   */
  exportAnalyticsCSV: async (companyId: string, dateFilter?: DateRangeFilter): Promise<Blob> => {
    const queryParams = new URLSearchParams();

    if (dateFilter) {
      if (dateFilter.range !== 'custom') {
        queryParams.append('range', dateFilter.range);
      } else {
        if (dateFilter.startDate) queryParams.append('startDate', dateFilter.startDate);
        if (dateFilter.endDate) queryParams.append('endDate', dateFilter.endDate);
      }
    }

    const queryString = queryParams.toString();
    const response = await apiClient.get<Blob>(
      `/companies/${companyId}/analytics/export/csv${queryString ? '?' + queryString : ''}`,
      {
        responseType: 'blob',
      }
    );
    return response;
  },

  /**
   * Export analytics as PDF (backend-generated)
   */
  exportAnalyticsPDF: async (companyId: string, dateFilter?: DateRangeFilter): Promise<Blob> => {
    const queryParams = new URLSearchParams();

    if (dateFilter) {
      if (dateFilter.range !== 'custom') {
        queryParams.append('range', dateFilter.range);
      } else {
        if (dateFilter.startDate) queryParams.append('startDate', dateFilter.startDate);
        if (dateFilter.endDate) queryParams.append('endDate', dateFilter.endDate);
      }
    }

    const queryString = queryParams.toString();
    const response = await apiClient.get<Blob>(
      `/companies/${companyId}/analytics/export/pdf${queryString ? '?' + queryString : ''}`,
      {
        responseType: 'blob',
      }
    );
    return response;
  },
};
