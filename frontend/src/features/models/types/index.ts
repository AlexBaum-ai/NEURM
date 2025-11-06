export type ModelStatus = 'active' | 'deprecated' | 'beta' | 'coming_soon';

export type ModelCategory = 'text' | 'multimodal' | 'image' | 'audio' | 'video' | 'code';

export interface ModelPricing {
  inputCost?: number; // Cost per 1M tokens
  outputCost?: number; // Cost per 1M tokens
  currency?: string;
  unit?: string;
}

export interface ModelBenchmark {
  name: string;
  score: number;
  maxScore?: number;
  description?: string;
}

export interface ModelSpec {
  contextWindow?: number;
  maxOutputTokens?: number;
  trainingDataCutoff?: string;
  languages?: string[];
  capabilities?: string[];
  modelSize?: string;
}

export interface ModelProvider {
  id: number;
  name: string;
  slug: string;
  logo?: string;
  website?: string;
}

export interface Model {
  id: number;
  name: string;
  slug: string;
  provider: ModelProvider;
  status: ModelStatus;
  category: ModelCategory;
  description: string;
  releaseDate?: string;
  specs: ModelSpec;
  pricing?: ModelPricing;
  benchmarks: ModelBenchmark[];
  apiEndpoint?: string;
  documentationUrl?: string;
  followerCount: number;
  isFollowing?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ModelListResponse {
  models: Model[];
  total: number;
  page: number;
  limit: number;
}

export interface ModelNewsItem {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  publishedAt: string;
  category: string;
  readTime: number;
  viewCount: number;
  author: {
    id: number;
    username: string;
    displayName: string;
    avatar?: string;
  };
}

export interface ModelDiscussion {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  replyCount: number;
  viewCount: number;
  createdAt: string;
  author: {
    id: number;
    username: string;
    displayName: string;
    avatar?: string;
  };
  lastActivity?: string;
}

export interface ModelJob {
  id: number;
  title: string;
  slug: string;
  company: {
    id: number;
    name: string;
    logo?: string;
  };
  location: string;
  jobType: string;
  salaryRange?: string;
  postedAt: string;
}

export interface ModelFilters {
  status?: ModelStatus[];
  category?: ModelCategory[];
  provider?: string[];
  search?: string;
}

export interface ModelComparison {
  id: string;
  models: Model[];
  createdAt: string;
  userId?: number;
}

export interface ModelComparisonResponse {
  id: string;
  models: Model[];
}

export interface SavedComparison {
  id: string;
  name: string;
  modelIds: number[];
  createdAt: string;
}

export interface ModelVersion {
  id: number;
  version: string;
  releasedAt: string;
  changelog?: string;
  features?: string[];
  improvements?: string[];
  isLatest: boolean;
}

export interface ModelVersionsResponse {
  versions: ModelVersion[];
  total: number;
}

export interface RelatedModel {
  id: number;
  name: string;
  slug: string;
  provider: ModelProvider;
  category: ModelCategory;
  description: string;
  similarity: number; // 0-100 similarity score
}

export interface CommunityResource {
  id: number;
  type: 'tutorial' | 'use_case' | 'article' | 'video';
  title: string;
  url: string;
  author?: string;
  publishedAt?: string;
  description?: string;
}

export interface BenchmarkComparisonData {
  models: Array<{
    id: number;
    name: string;
    slug: string;
    color: string;
  }>;
  benchmarks: Array<{
    name: string;
    description?: string;
    scores: Array<{
      modelId: number;
      score: number;
      maxScore?: number;
    }>;
  }>;
}
