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
