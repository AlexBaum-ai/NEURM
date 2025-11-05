/**
 * Companies API Client
 *
 * API functions for company-related operations
 */

import api from '@/lib/api';
import type {
  Company,
  CompanyFormData,
  CompanyJobsResponse,
  ListCompaniesParams,
  ListCompaniesResponse,
  MessageTemplate,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  BulkMessageRequest,
  BulkMessageResponse,
  BulkMessagesHistoryResponse,
  RateLimitStatus,
} from '../types';

/**
 * Get company profile by ID or slug
 */
export const getCompanyProfile = async (id: string): Promise<Company> => {
  const response = await api.get<{ success: boolean; data: Company }>(`/companies/${id}`);
  return response.data.data;
};

/**
 * List companies with pagination and filters
 */
export const listCompanies = async (
  params?: ListCompaniesParams
): Promise<ListCompaniesResponse> => {
  const response = await api.get<{
    success: boolean;
    data: Company[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>('/companies', { params });

  return {
    companies: response.data.data,
    pagination: response.data.pagination,
  };
};

/**
 * Get company's active jobs
 */
export const getCompanyJobs = async (
  id: string,
  includeDetails = false
): Promise<CompanyJobsResponse> => {
  const response = await api.get<{ success: boolean; data: CompanyJobsResponse }>(
    `/companies/${id}/jobs`,
    { params: { includeDetails } }
  );
  return response.data.data;
};

/**
 * Create company profile
 */
export const createCompany = async (data: CompanyFormData): Promise<Company> => {
  const response = await api.post<{ success: boolean; data: Company }>('/companies', data);
  return response.data.data;
};

/**
 * Update company profile (company admin only)
 */
export const updateCompanyProfile = async (
  id: string,
  data: Partial<CompanyFormData>
): Promise<Company> => {
  const response = await api.put<{ success: boolean; data: Company }>(`/companies/${id}`, data);
  return response.data.data;
};

/**
 * Follow company
 */
export const followCompany = async (id: string): Promise<void> => {
  await api.post(`/companies/${id}/follow`);
};

/**
 * Unfollow company
 */
export const unfollowCompany = async (id: string): Promise<void> => {
  await api.delete(`/companies/${id}/follow`);
};

/**
 * Upload company logo
 */
export const uploadCompanyLogo = async (id: string, file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('logo', file);

  const response = await api.post<{ success: boolean; data: { url: string } }>(
    `/companies/${id}/logo`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data.data.url;
};

/**
 * Upload company header image
 */
export const uploadCompanyHeader = async (id: string, file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('header', file);

  const response = await api.post<{ success: boolean; data: { url: string } }>(
    `/companies/${id}/header`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data.data.url;
};

/**
 * Bulk Messaging API Functions
 */

/**
 * Send bulk messages to multiple candidates
 */
export const sendBulkMessages = async (
  data: BulkMessageRequest
): Promise<BulkMessageResponse> => {
  const response = await api.post<{ success: boolean; data: BulkMessageResponse }>(
    '/companies/messages/bulk',
    data
  );
  return response.data.data;
};

/**
 * Get all message templates
 */
export const getMessageTemplates = async (): Promise<MessageTemplate[]> => {
  const response = await api.get<{
    success: boolean;
    data: { templates: MessageTemplate[] };
  }>('/companies/messages/templates');
  return response.data.data.templates;
};

/**
 * Create a new message template
 */
export const createMessageTemplate = async (
  data: CreateTemplateRequest
): Promise<MessageTemplate> => {
  const response = await api.post<{ success: boolean; data: { template: MessageTemplate } }>(
    '/companies/messages/templates',
    data
  );
  return response.data.data.template;
};

/**
 * Update a message template
 */
export const updateMessageTemplate = async (
  id: string,
  data: UpdateTemplateRequest
): Promise<MessageTemplate> => {
  const response = await api.put<{ success: boolean; data: { template: MessageTemplate } }>(
    `/companies/messages/templates/${id}`,
    data
  );
  return response.data.data.template;
};

/**
 * Delete a message template
 */
export const deleteMessageTemplate = async (id: string): Promise<void> => {
  await api.delete(`/companies/messages/templates/${id}`);
};

/**
 * Get bulk message history
 */
export const getBulkMessageHistory = async (
  page = 1,
  limit = 20
): Promise<BulkMessagesHistoryResponse> => {
  const response = await api.get<{ success: boolean; data: BulkMessagesHistoryResponse }>(
    '/companies/messages/bulk',
    { params: { page, limit } }
  );
  return response.data.data;
};

/**
 * Get rate limit status
 */
export const getRateLimitStatus = async (): Promise<RateLimitStatus> => {
  const response = await api.get<{ success: boolean; data: RateLimitStatus }>(
    '/companies/messages/rate-limit'
  );
  return response.data.data;
};
