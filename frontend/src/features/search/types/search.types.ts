/**
 * Search Types
 *
 * Type definitions for the universal search feature
 */

/**
 * Content type enumeration
 */
export type ContentType = 'articles' | 'forum_topics' | 'forum_replies' | 'jobs' | 'users' | 'companies';

/**
 * Sort options for search results
 */
export type SearchSortOption = 'relevance' | 'date' | 'popularity';

/**
 * Base search result interface
 */
export interface BaseSearchResult {
  id: string;
  type: ContentType;
  title: string;
  excerpt: string;
  url: string;
  date: string;
  highlights?: string[];
}

/**
 * Article search result
 */
export interface ArticleSearchResult extends BaseSearchResult {
  type: 'articles';
  author: string;
  authorAvatar?: string;
  category: string;
  tags: string[];
  viewCount: number;
  thumbnailUrl?: string;
}

/**
 * Forum topic search result
 */
export interface ForumTopicSearchResult extends BaseSearchResult {
  type: 'forum_topics';
  author: string;
  authorAvatar?: string;
  category: string;
  replyCount: number;
  viewCount: number;
  lastActivityDate: string;
  isSolved: boolean;
}

/**
 * Forum reply search result
 */
export interface ForumReplySearchResult extends BaseSearchResult {
  type: 'forum_replies';
  author: string;
  authorAvatar?: string;
  topicTitle: string;
  topicUrl: string;
  isAccepted: boolean;
}

/**
 * Job search result
 */
export interface JobSearchResult extends BaseSearchResult {
  type: 'jobs';
  company: string;
  companyLogo?: string;
  location: string;
  employmentType: string;
  salaryRange?: string;
  isRemote: boolean;
}

/**
 * User search result
 */
export interface UserSearchResult extends BaseSearchResult {
  type: 'users';
  username: string;
  avatar?: string;
  bio?: string;
  reputation: number;
  followers: number;
}

/**
 * Company search result
 */
export interface CompanySearchResult extends BaseSearchResult {
  type: 'companies';
  slug: string;
  logo?: string;
  industry?: string;
  employeeCount?: string;
  location?: string;
  jobCount: number;
}

/**
 * Union type for all search results
 */
export type SearchResult =
  | ArticleSearchResult
  | ForumTopicSearchResult
  | ForumReplySearchResult
  | JobSearchResult
  | UserSearchResult
  | CompanySearchResult;

/**
 * Grouped search results by type
 */
export interface GroupedSearchResults {
  articles: ArticleSearchResult[];
  forum_topics: ForumTopicSearchResult[];
  forum_replies: ForumReplySearchResult[];
  jobs: JobSearchResult[];
  users: UserSearchResult[];
  companies: CompanySearchResult[];
}

/**
 * Search response from API
 */
export interface SearchResponse {
  results: SearchResult[];
  grouped: GroupedSearchResults;
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  query: string;
}

/**
 * Search suggestion
 */
export interface SearchSuggestion {
  text: string;
  type: ContentType;
  count?: number;
}

/**
 * Search autocomplete response
 */
export interface SearchAutocompleteResponse {
  suggestions: SearchSuggestion[];
  recentSearches: string[];
}

/**
 * Search history item
 */
export interface SearchHistoryItem {
  id: string;
  query: string;
  resultsCount: number;
  createdAt: string;
}

/**
 * Saved search
 */
export interface SavedSearch {
  id: string;
  query: string;
  filters?: SearchFilters;
  name?: string;
  createdAt: string;
}

/**
 * Search filters
 */
export interface SearchFilters {
  types?: ContentType[];
  dateFrom?: string;
  dateTo?: string;
  category?: string;
  tags?: string[];
  location?: string;
  employmentType?: string;
  isRemote?: boolean;
}

/**
 * Search parameters
 */
export interface SearchParams {
  q: string;
  type?: ContentType[];
  sort?: SearchSortOption;
  page?: number;
  limit?: number;
  filters?: SearchFilters;
}

/**
 * Voice recognition result
 */
export interface VoiceSearchResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}
