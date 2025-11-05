/**
 * Company Types
 *
 * TypeScript type definitions for company-related data structures
 */

export interface Company {
  id: string;
  name: string;
  slug: string;
  website?: string;
  description?: string;
  logoUrl?: string;
  headerImageUrl?: string;
  industry?: string;
  companySize?: CompanySize;
  location?: string;
  locations: string[];
  foundedYear?: number;
  mission?: string;
  benefits: string[];
  cultureDescription?: string;
  techStack?: TechStack;
  linkedinUrl?: string;
  twitterUrl?: string;
  githubUrl?: string;
  ownerUserId: string;
  verifiedCompany: boolean;
  viewCount: number;
  followerCount: number;
  isFollowing?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TechStack {
  modelsUsed?: string[];
  frameworks?: string[];
  languages?: string[];
  infrastructure?: string[];
  tools?: string[];
}

export type CompanySize = '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1000+';

export interface CompanyJob {
  id: string;
  title: string;
  slug: string;
  location: string;
  workLocation: 'remote' | 'hybrid' | 'on_site';
  experienceLevel: 'junior' | 'mid' | 'senior' | 'lead';
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  publishedAt: string;
}

export interface CompanyListItem {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  industry?: string;
  companySize?: CompanySize;
  location?: string;
  verifiedCompany: boolean;
  _count: {
    jobs: number;
    follows: number;
  };
}

export interface CompanyFormData {
  name: string;
  website?: string;
  description?: string;
  logoUrl?: string;
  headerImageUrl?: string;
  industry?: string;
  companySize?: CompanySize;
  location?: string;
  locations?: string[];
  foundedYear?: number;
  mission?: string;
  benefits?: string[];
  cultureDescription?: string;
  techStack?: TechStack;
  linkedinUrl?: string;
  twitterUrl?: string;
  githubUrl?: string;
}

export interface ListCompaniesParams {
  page?: number;
  limit?: number;
  search?: string;
  industry?: string;
  companySize?: CompanySize;
  verified?: boolean;
}

export interface ListCompaniesResponse {
  companies: CompanyListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CompanyJobsResponse {
  jobs: CompanyJob[];
  count: number;
}
