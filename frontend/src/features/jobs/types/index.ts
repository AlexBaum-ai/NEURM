export type ExperienceLevel = 'junior' | 'mid' | 'senior' | 'lead' | 'principal';
export type EmploymentType = 'full_time' | 'part_time' | 'freelance' | 'internship';
export type LocationType = 'remote' | 'hybrid' | 'on_site';
export type CompanySize = '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1000+';
export type UseCaseType = 'Conversational AI' | 'Content Generation' | 'Code Assistant' | 'Search & Retrieval' | 'Data Analysis' | 'Image Generation' | 'Other';
export type ModelStrategy = 'single' | 'hybrid' | 'ensemble';
export type SkillType = 'prompt_engineering' | 'fine_tuning' | 'rag' | 'evaluation' | 'deployment' | 'monitoring' | 'other';

export interface Company {
  id: string;
  companyName: string;
  slug: string;
  logoUrl: string | null;
  tagline?: string;
  description?: string;
  companySize?: CompanySize;
  location: string;
  websiteUrl?: string;
}

export interface JobSkill {
  skillName: string;
  skillType: SkillType;
  requiredLevel: number; // 1-5 stars
}

export interface JobListItem {
  id: string;
  title: string;
  slug: string;
  company: Company;
  locationType: LocationType;
  location: string;
  experienceLevel: ExperienceLevel;
  employmentType: EmploymentType;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  salaryIsPublic: boolean;
  primaryLlms: string[];
  frameworks: string[];
  hasVisaSponsorship: boolean;
  matchScore?: number;
  isFeatured: boolean;
  applicationCount: number;
  viewCount: number;
  publishedAt: string;
  isSaved?: boolean;
}

export interface JobDetail extends JobListItem {
  description: string;
  requirements: string;
  responsibilities: string;
  benefits: string | null;
  positionsAvailable: number;
  applicationDeadline: string | null;
  vectorDatabases: string[];
  infrastructure: string[];
  programmingLanguages: string[];
  useCaseType: UseCaseType;
  modelStrategy: ModelStrategy;
  skills: JobSkill[];
  interviewProcess: string | null;
  screeningQuestions: Array<{ question: string }> | null;
  isApplied?: boolean;
  hasApplied?: boolean;
  companyId: string;
}

export interface JobFilters {
  locationType?: LocationType[];
  location?: string;
  experienceLevel?: ExperienceLevel[];
  employmentType?: EmploymentType[];
  salaryMin?: number;
  salaryMax?: number;
  model?: string[];
  framework?: string[];
  hasVisaSponsorship?: boolean;
  search?: string;
  sort?: 'newest' | 'highest_salary' | 'best_match';
  minMatchScore?: number;
  includeMatches?: boolean;
}

export interface JobsResponse {
  jobs: JobListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SaveJobRequest {
  notes?: string;
}

export interface ApplyJobRequest {
  coverLetter: string;
  resumeUrl?: string;
  screeningAnswers?: Array<{ question: string; answer: string }>;
}

// Match-related types
export interface MatchFactor {
  name: string;
  score: number;
  weight: number;
  details?: string;
}

export interface JobMatch {
  jobId: string;
  matchScore: number;
  factors: MatchFactor[];
  topReasons: string[];
  lastUpdated: string;
}

export interface JobMatchResponse {
  success: boolean;
  data: JobMatch;
}
