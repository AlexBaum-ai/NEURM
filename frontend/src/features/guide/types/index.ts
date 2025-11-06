// Use Case Types

export interface TechStackBadge {
  id: string;
  name: string;
  slug: string;
  category?: string;
}

export interface ResultsMetrics {
  metric: string;
  value: string;
  improvement?: string;
}

export interface UseCase {
  id: string;
  slug: string;
  title: string;
  summary: string;
  companyName?: string;
  companySize?: 'STARTUP' | 'SME' | 'ENTERPRISE';
  industry: string;
  category: string;
  implementationType: 'FULL_INTEGRATION' | 'PILOT' | 'PROOF_OF_CONCEPT' | 'RESEARCH';

  // Content sections
  problemStatement?: string;
  solutionDescription?: string;
  architectureDetails?: string;
  implementationDetails?: string;
  challengesFaced?: string;
  lessonsLearned?: string;
  recommendedPractices?: string;
  resourceLinks?: string;

  // Metadata
  techStack: TechStackBadge[];
  resultsMetrics?: ResultsMetrics[];
  hasCode: boolean;
  hasROI: boolean;

  // Related entities
  relatedModels: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  relatedJobs?: Array<{
    id: string;
    title: string;
    slug: string;
  }>;

  // Stats
  viewCount: number;
  commentCount: number;

  // Status
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedBy?: {
    id: string;
    username: string;
    profile: {
      avatarUrl?: string;
      displayName?: string;
    };
  };

  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface UseCaseListItem {
  id: string;
  slug: string;
  title: string;
  summary: string;
  companyName?: string;
  industry: string;
  category: string;
  implementationType: string;
  techStack: TechStackBadge[];
  resultsMetrics?: ResultsMetrics[];
  viewCount: number;
  commentCount: number;
  hasCode: boolean;
  hasROI: boolean;
  createdAt: string;
  publishedAt?: string;
}

export interface UseCaseFilters {
  search?: string;
  category?: string;
  industry?: string;
  model?: string;
  implementationType?: string;
  hasCode?: boolean;
  hasROI?: boolean;
}

export type UseCaseSortOption =
  | 'publishedAt-desc'
  | 'publishedAt-asc'
  | 'viewCount-desc'
  | 'commentCount-desc';

export interface UseCasesResponse {
  success: boolean;
  data: UseCaseListItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface UseCaseDetailResponse {
  success: boolean;
  data: {
    useCase: UseCase;
    relatedUseCases: UseCaseListItem[];
  };
}

export interface SubmitUseCaseData {
  title: string;
  summary: string;
  companyName?: string;
  companySize?: string;
  industry: string;
  category: string;
  implementationType: string;
  problemStatement?: string;
  solutionDescription?: string;
  architectureDetails?: string;
  implementationDetails?: string;
  challengesFaced?: string;
  lessonsLearned?: string;
  recommendedPractices?: string;
  resourceLinks?: string;
  techStack: string[];
  relatedModels: string[];
  resultsMetrics?: ResultsMetrics[];
  hasCode: boolean;
  hasROI: boolean;
}

export interface CategoryOption {
  value: string;
  label: string;
}

export interface IndustryOption {
  value: string;
  label: string;
}

export interface ImplementationTypeOption {
  value: string;
  label: string;
}

// Table of Contents
export interface TableOfContentsItem {
  id: string;
  text: string;
  level: number;
}

// Glossary Types
export interface GlossaryTerm {
  id: number;
  slug: string;
  term: string;
  definition: string;
  briefDefinition: string;
  category: string;
  examples?: string[];
  relatedTerms?: RelatedTerm[];
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface RelatedTerm {
  id: number;
  slug: string;
  term: string;
  briefDefinition: string;
}

export interface GlossaryCategory {
  category: string;
  count: number;
}

export interface GlossaryAlphabet {
  letter: string;
  count: number;
}

export interface GlossarySearchResult {
  terms: GlossaryTerm[];
  total: number;
}

export interface GlossaryFilters {
  search?: string;
  category?: string;
  letter?: string;
}

export interface PopularTerm {
  id: number;
  slug: string;
  term: string;
  briefDefinition: string;
  category: string;
  viewCount: number;
}
