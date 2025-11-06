/**
 * Search Feature Exports
 */

export { GlobalSearchBar } from './components/GlobalSearchBar';
export { SearchAutocomplete } from './components/SearchAutocomplete';
export { SearchResultCard } from './components/SearchResultCard';
export { SearchFilters } from './components/SearchFilters';

export {
  useSearch,
  useSearchSuggestions,
  useSearchHistory,
  useSavedSearches,
  useSaveSearch,
  useDeleteSavedSearch,
  useClearHistory,
  searchKeys,
} from './hooks/useSearch';

export { useVoiceSearch } from './hooks/useVoiceSearch';

export { searchApi } from './api/searchApi';

export type {
  ContentType,
  SearchSortOption,
  SearchResult,
  ArticleSearchResult,
  ForumTopicSearchResult,
  ForumReplySearchResult,
  JobSearchResult,
  UserSearchResult,
  CompanySearchResult,
  GroupedSearchResults,
  SearchResponse,
  SearchSuggestion,
  SearchAutocompleteResponse,
  SearchHistoryItem,
  SavedSearch,
  SearchFilters,
  SearchParams,
  VoiceSearchResult,
} from './types/search.types';
