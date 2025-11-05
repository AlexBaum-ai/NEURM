/**
 * Media API Service
 * Handles all media-related API calls
 */

import apiClient from '@/lib/api';
import type {
  MediaFile,
  MediaFolder,
  MediaListParams,
  MediaListResponse,
  MediaUpdateData,
  MediaBulkOperation,
  FolderTreeNode,
} from '../types/media.types';

/**
 * Upload files to the media library
 */
export const uploadMedia = async (
  files: File[],
  folderId?: string,
  onProgress?: (filename: string, progress: number) => void
): Promise<MediaFile[]> => {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append('files', file);
  });

  if (folderId) {
    formData.append('folderId', folderId);
  }

  const response = await apiClient.post<{ data: MediaFile[] }>('/media/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onProgress) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        files.forEach((file) => onProgress(file.name, progress));
      }
    },
  });

  return response.data;
};

/**
 * Get paginated media list
 */
export const getMediaList = async (params: MediaListParams = {}): Promise<MediaListResponse> => {
  return apiClient.get<MediaListResponse>('/media', { params });
};

/**
 * Get single media file by ID
 */
export const getMediaById = async (id: string): Promise<MediaFile> => {
  const response = await apiClient.get<{ data: MediaFile }>(`/media/${id}`);
  return response.data;
};

/**
 * Update media metadata
 */
export const updateMedia = async (id: string, data: MediaUpdateData): Promise<MediaFile> => {
  const response = await apiClient.put<{ data: MediaFile }>(`/media/${id}`, data);
  return response.data;
};

/**
 * Delete single media file
 */
export const deleteMedia = async (id: string): Promise<void> => {
  await apiClient.delete(`/media/${id}`);
};

/**
 * Bulk delete media files
 */
export const bulkDeleteMedia = async (mediaIds: string[]): Promise<void> => {
  await apiClient.post('/media/bulk-delete', { mediaIds });
};

/**
 * Move media files to a folder
 */
export const moveMedia = async (mediaIds: string[], targetFolderId?: string): Promise<void> => {
  await apiClient.post('/media/bulk-move', { mediaIds, targetFolderId });
};

/**
 * Perform bulk operations on media
 */
export const bulkOperateMedia = async (operation: MediaBulkOperation): Promise<void> => {
  if (operation.operation === 'delete') {
    await bulkDeleteMedia(operation.mediaIds);
  } else if (operation.operation === 'move') {
    await moveMedia(operation.mediaIds, operation.targetFolderId);
  }
};

/**
 * Get all folders
 */
export const getFolders = async (): Promise<MediaFolder[]> => {
  const response = await apiClient.get<{ data: MediaFolder[] }>('/media/folders');
  return response.data;
};

/**
 * Get folder tree structure
 */
export const getFolderTree = async (): Promise<FolderTreeNode[]> => {
  const response = await apiClient.get<{ data: FolderTreeNode[] }>('/media/folders/tree');
  return response.data;
};

/**
 * Create a new folder
 */
export const createFolder = async (name: string, parentId?: string): Promise<MediaFolder> => {
  const response = await apiClient.post<{ data: MediaFolder }>('/media/folders', {
    name,
    parentId,
  });
  return response.data;
};

/**
 * Update folder
 */
export const updateFolder = async (id: string, name: string): Promise<MediaFolder> => {
  const response = await apiClient.put<{ data: MediaFolder }>(`/media/folders/${id}`, { name });
  return response.data;
};

/**
 * Delete folder
 */
export const deleteFolder = async (id: string): Promise<void> => {
  await apiClient.delete(`/media/folders/${id}`);
};

/**
 * Search media files
 */
export const searchMedia = async (query: string, params?: MediaListParams): Promise<MediaListResponse> => {
  return apiClient.get<MediaListResponse>('/media', {
    params: {
      ...params,
      search: query,
    },
  });
};
