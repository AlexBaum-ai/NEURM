/**
 * Search Module Types
 *
 * Type definitions for the universal search system
 */

export type ContentType =
  | 'articles'
  | 'forum_topics'
  | 'forum_replies'
  | 'jobs'
  | 'users'
  | 'companies';

export type SortOption = 'relevance' | 'date' | 'popularity';

export interface SearchOptions {
  query: string;
  contentTypes?: ContentType[];
  sortBy?: SortOption;
  page?: number;
  limit?: number;
  userId?: string;
}

export interface SearchResult {
  id: string;
  type: ContentType;
  title: string;
  excerpt: string;
  highlights: string[];
  url: string;
  metadata: SearchResultMetadata;
  relevanceScore: number;
}

export interface SearchResultMetadata {
  authorId?: string;
  authorName?: string;
  authorUsername?: string;
  createdAt: Date;
  updatedAt?: Date;
  viewCount?: number;
  replyCount?: number;
  upvoteCount?: number;
  companyName?: string;
  categoryName?: string;
  tags?: string[];
  status?: string;
  location?: string;
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
  };
}

export interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  query: string;
  contentTypes: ContentType[];
  sortBy: SortOption;
  executionTime: number;
}

export interface AutocompleteResult {
  suggestion: string;
  type: ContentType;
  count: number;
}

export interface AutocompleteResponse {
  suggestions: AutocompleteResult[];
  query: string;
}

export interface PopularSearch {
  query: string;
  count: number;
  lastSearched: Date;
}

export interface SavedSearchInput {
  name: string;
  query: string;
  contentTypes?: ContentType[];
  sortBy?: SortOption;
  notificationEnabled?: boolean;
}

export interface SearchHistoryEntry {
  id: string;
  query: string;
  contentTypes: ContentType[];
  sortBy?: SortOption;
  createdAt: Date;
}
