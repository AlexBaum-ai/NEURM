import { apiClient } from '@/lib/api';
import type {
  DashboardMetrics,
  DateRange,
  ExportOptions,
  ContentQueueResponse,
  ModerationAction,
  BulkModerationAction,
  ModerationResponse,
  ContentDetail,
  ModerationFilters,
  ContentType,
} from '../types';

export const adminApi = {
  // ============================================
  // Dashboard APIs
  // ============================================

  // Get dashboard metrics
  getDashboard: async (dateRange?: DateRange): Promise<DashboardMetrics> => {
    const params = dateRange
      ? { startDate: dateRange.startDate, endDate: dateRange.endDate }
      : {};
    return apiClient.get<DashboardMetrics>('/admin/dashboard', { params });
  },

  // Export metrics
  exportMetrics: async (options: ExportOptions): Promise<Blob> => {
    const response = await apiClient.post<Blob>(
      '/admin/dashboard/export',
      options,
      {
        responseType: 'blob',
      }
    );
    return response;
  },

  // Quick actions
  quickActions: {
    createArticle: () => '/admin/articles/new',
    reviewReports: () => '/admin/content',
    manageUsers: () => '/admin/users',
  },

  // ============================================
  // Content Moderation APIs
  // ============================================

  /**
   * Fetch content queue with filters
   */
  getContentQueue: async (params: {
    page?: number;
    limit?: number;
    filters?: ModerationFilters;
  }): Promise<ContentQueueResponse> => {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    if (params.filters) {
      if (params.filters.tab) queryParams.append('tab', params.filters.tab);
      if (params.filters.contentType) queryParams.append('type', params.filters.contentType);
      if (params.filters.status) queryParams.append('status', params.filters.status);
      if (params.filters.search) queryParams.append('search', params.filters.search);
      if (params.filters.sortBy) queryParams.append('sortBy', params.filters.sortBy);
      if (params.filters.sortOrder) queryParams.append('sortOrder', params.filters.sortOrder);
    }

    return apiClient.get<ContentQueueResponse>(`/admin/content?${queryParams.toString()}`);
  },

  /**
   * Fetch reported content queue
   */
  getReportedContent: async (params: {
    page?: number;
    limit?: number;
  }): Promise<ContentQueueResponse> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    return apiClient.get<ContentQueueResponse>(`/admin/content/reported?${queryParams.toString()}`);
  },

  /**
   * Get detailed content information
   */
  getContentDetail: async (
    contentType: ContentType,
    contentId: string
  ): Promise<ContentDetail> => {
    return apiClient.get<ContentDetail>(`/admin/content/${contentType}/${contentId}`);
  },

  /**
   * Approve content
   */
  approveContent: async (
    contentType: ContentType,
    contentId: string
  ): Promise<ModerationResponse> => {
    return apiClient.put<ModerationResponse>(`/admin/content/${contentType}/${contentId}/approve`);
  },

  /**
   * Reject content with reason
   */
  rejectContent: async (
    contentType: ContentType,
    contentId: string,
    reason?: string
  ): Promise<ModerationResponse> => {
    return apiClient.put<ModerationResponse>(`/admin/content/${contentType}/${contentId}/reject`, {
      reason,
    });
  },

  /**
   * Hide content from public view
   */
  hideContent: async (
    contentType: ContentType,
    contentId: string,
    reason?: string
  ): Promise<ModerationResponse> => {
    return apiClient.put<ModerationResponse>(`/admin/content/${contentType}/${contentId}/hide`, {
      reason,
    });
  },

  /**
   * Delete content permanently
   */
  deleteContent: async (
    contentType: ContentType,
    contentId: string,
    reason?: string
  ): Promise<ModerationResponse> => {
    return apiClient.delete<ModerationResponse>(`/admin/content/${contentType}/${contentId}`, {
      data: { reason },
    });
  },

  /**
   * Perform single moderation action
   */
  moderateContent: async (action: ModerationAction): Promise<ModerationResponse> => {
    const { contentId, contentType, action: actionType, reason } = action;

    switch (actionType) {
      case 'approve':
        return adminApi.approveContent(contentType, contentId);
      case 'reject':
        return adminApi.rejectContent(contentType, contentId, reason);
      case 'hide':
        return adminApi.hideContent(contentType, contentId, reason);
      case 'delete':
        return adminApi.deleteContent(contentType, contentId, reason);
      default:
        throw new Error(`Unknown action: ${actionType}`);
    }
  },

  /**
   * Perform bulk moderation action
   */
  bulkModerateContent: async (
    bulkAction: BulkModerationAction
  ): Promise<ModerationResponse> => {
    return apiClient.post<ModerationResponse>('/admin/content/bulk', bulkAction);
  },

  // ============================================
  // Analytics APIs
  // ============================================

  /**
   * Get comprehensive analytics
   */
  getAnalytics: async (params?: {
    period?: 'daily' | 'weekly' | 'monthly';
    metrics?: string[];
    startDate?: string;
    endDate?: string;
    limit?: number;
  }) => {
    return apiClient.get('/admin/analytics', { params });
  },

  /**
   * Get custom analytics with date range
   */
  getCustomAnalytics: async (params: {
    startDate: string;
    endDate: string;
    metrics: string[];
    granularity?: 'hourly' | 'daily' | 'weekly' | 'monthly';
    compareWith?: {
      startDate: string;
      endDate: string;
    };
  }) => {
    return apiClient.get('/admin/analytics/custom', { params });
  },

  /**
   * Get cohort retention analysis
   */
  getCohortAnalysis: async (params: {
    startDate: string;
    endDate: string;
    cohortType?: 'signup' | 'first_purchase';
    period?: 'daily' | 'weekly' | 'monthly';
  }) => {
    return apiClient.get('/admin/analytics/cohorts', { params });
  },

  /**
   * Get funnel analysis
   */
  getFunnelAnalysis: async (
    funnelType: 'user_onboarding' | 'job_application',
    params?: {
      startDate?: string;
      endDate?: string;
      groupBy?: 'day' | 'week' | 'month';
    }
  ) => {
    return apiClient.get(`/admin/analytics/funnels/${funnelType}`, { params });
  },

  /**
   * Export analytics data
   */
  exportAnalytics: async (options: {
    format: 'csv' | 'pdf';
    metrics: string[];
    startDate: string;
    endDate: string;
    includeCharts?: boolean;
  }): Promise<Blob> => {
    const response = await apiClient.post<Blob>('/admin/analytics/export', options, {
      responseType: 'blob',
    });
    return response;
  },

  /**
   * Invalidate analytics cache
   */
  invalidateAnalyticsCache: async (): Promise<{ message: string }> => {
    return apiClient.post('/admin/analytics/cache/invalidate');
  },
};
