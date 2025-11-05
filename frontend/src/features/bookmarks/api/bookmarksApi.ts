import { apiClient } from '@/lib/api';
import type {
  BookmarksResponse,
  CollectionsResponse,
  BookmarkCollection,
  CreateCollectionInput,
  UpdateCollectionInput,
  UpdateBookmarkInput,
} from '../types';

export const bookmarksApi = {
  /**
   * Get user's bookmarks with optional filtering
   */
  getBookmarks: async (params?: {
    page?: number;
    limit?: number;
    collectionId?: string;
  }): Promise<BookmarksResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.collectionId) queryParams.append('collectionId', params.collectionId);

    const url = `/users/me/bookmarks${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.get<BookmarksResponse>(url);
  },

  /**
   * Get user's bookmark collections
   */
  getCollections: async (): Promise<CollectionsResponse> => {
    return apiClient.get<CollectionsResponse>('/users/me/bookmark-collections');
  },

  /**
   * Create a new bookmark collection
   */
  createCollection: async (data: CreateCollectionInput): Promise<{ success: boolean; data: BookmarkCollection }> => {
    return apiClient.post<{ success: boolean; data: BookmarkCollection }>('/users/me/bookmark-collections', data);
  },

  /**
   * Update an existing collection
   */
  updateCollection: async (
    id: string,
    data: UpdateCollectionInput
  ): Promise<{ success: boolean; data: BookmarkCollection }> => {
    return apiClient.patch<{ success: boolean; data: BookmarkCollection }>(
      `/users/me/bookmark-collections/${id}`,
      data
    );
  },

  /**
   * Delete a collection
   */
  deleteCollection: async (id: string): Promise<{ success: boolean }> => {
    return apiClient.delete<{ success: boolean }>(`/users/me/bookmark-collections/${id}`);
  },

  /**
   * Update bookmark (move to different collection or update notes)
   */
  updateBookmark: async (id: string, data: UpdateBookmarkInput): Promise<{ success: boolean }> => {
    return apiClient.patch<{ success: boolean }>(`/users/me/bookmarks/${id}`, data);
  },

  /**
   * Remove bookmark
   */
  removeBookmark: async (slug: string): Promise<{ success: boolean }> => {
    return apiClient.delete<{ success: boolean }>(`/news/articles/${slug}/bookmark`);
  },
};
