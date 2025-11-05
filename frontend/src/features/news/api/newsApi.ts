import { apiClient } from '@/lib/api';
import type {
  ArticleDetailResponse,
  CategoriesResponse,
  TagsResponse,
  ArticlesResponse,
  NewsFilters,
  SortOption
} from '../types';
import { parseSortOption } from '../utils/sortUtils';

export const newsApi = {
  /**
   * Fetch paginated articles with filters
   */
  getArticles: async (params: {
    page?: number;
    limit?: number;
    sortBy?: SortOption;
    filters?: NewsFilters;
  }): Promise<ArticlesResponse> => {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    // Parse sort option into separate sortBy and sortOrder parameters
    if (params.sortBy) {
      const { sortBy, sortOrder } = parseSortOption(params.sortBy);
      queryParams.append('sortBy', sortBy);
      if (sortOrder) {
        queryParams.append('sortOrder', sortOrder);
      }
    }

    if (params.filters) {
      if (params.filters.search) queryParams.append('search', params.filters.search);
      if (params.filters.categorySlug) queryParams.append('category', params.filters.categorySlug);
      if (params.filters.difficulty) queryParams.append('difficulty', params.filters.difficulty);
      if (params.filters.modelSlug) queryParams.append('model', params.filters.modelSlug);
      if (params.filters.tags && params.filters.tags.length > 0) {
        params.filters.tags.forEach(tag => queryParams.append('tags', tag));
      }
    }

    return apiClient.get<ArticlesResponse>(`/news/articles?${queryParams.toString()}`);
  },

  /**
   * Fetch featured articles
   */
  getFeaturedArticles: async (): Promise<ArticlesResponse> => {
    return apiClient.get<ArticlesResponse>('/news/articles?featured=true&limit=5');
  },

  /**
   * Fetch trending articles
   */
  getTrendingArticles: async (): Promise<ArticlesResponse> => {
    return apiClient.get<ArticlesResponse>('/news/articles?trending=true&limit=5');
  },

  /**
   * Fetch article by slug
   */
  getArticleBySlug: async (slug: string): Promise<ArticleDetailResponse> => {
    return apiClient.get<ArticleDetailResponse>(`/news/articles/${slug}`);
  },

  /**
   * Bookmark an article
   */
  bookmarkArticle: async (articleId: string): Promise<{ success: boolean }> => {
    return apiClient.post<{ success: boolean }>(`/news/articles/${articleId}/bookmark`);
  },

  /**
   * Remove bookmark from article
   */
  unbookmarkArticle: async (articleId: string): Promise<{ success: boolean }> => {
    return apiClient.delete<{ success: boolean }>(`/news/articles/${articleId}/bookmark`);
  },

  /**
   * Increment view count for article (called when user reads article)
   */
  incrementViewCount: async (articleId: string): Promise<void> => {
    return apiClient.post<void>(`/news/articles/${articleId}/view`);
  },

  /**
   * Fetch hierarchical category tree
   */
  getCategories: async (): Promise<CategoriesResponse> => {
    return apiClient.get<CategoriesResponse>('/news/categories');
  },

  /**
   * Search tags (for autocomplete)
   */
  searchTags: async (search?: string, limit: number = 20): Promise<TagsResponse> => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    params.append('limit', limit.toString());

    const queryString = params.toString();
    return apiClient.get<TagsResponse>(`/news/tags${queryString ? `?${queryString}` : ''}`);
  },
};
