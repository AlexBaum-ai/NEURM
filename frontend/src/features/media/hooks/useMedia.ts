/**
 * Media Hooks
 * React Query hooks for media management
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  getMediaList,
  getMediaById,
  uploadMedia,
  updateMedia,
  deleteMedia,
  bulkDeleteMedia,
  moveMedia,
  getFolders,
  getFolderTree,
  createFolder,
  updateFolder,
  deleteFolder,
  searchMedia,
} from '../api/mediaApi';
import type {
  MediaFile,
  MediaFolder,
  MediaListParams,
  MediaUpdateData,
  MediaUploadProgress,
} from '../types/media.types';

const QUERY_KEYS = {
  media: 'media',
  mediaList: 'mediaList',
  mediaItem: 'mediaItem',
  folders: 'folders',
  folderTree: 'folderTree',
};

/**
 * Hook to fetch paginated media list
 */
export const useMediaList = (params: MediaListParams = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.mediaList, params],
    queryFn: () => getMediaList(params),
  });
};

/**
 * Hook to fetch single media item
 */
export const useMediaItem = (id: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.mediaItem, id],
    queryFn: () => getMediaById(id),
    enabled: !!id,
  });
};

/**
 * Hook to search media
 */
export const useSearchMedia = (query: string, params?: MediaListParams) => {
  return useQuery({
    queryKey: [QUERY_KEYS.mediaList, 'search', query, params],
    queryFn: () => searchMedia(query, params),
    enabled: query.length > 0,
  });
};

/**
 * Hook to fetch folders
 */
export const useFolders = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.folders],
    queryFn: getFolders,
  });
};

/**
 * Hook to fetch folder tree
 */
export const useFolderTree = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.folderTree],
    queryFn: getFolderTree,
  });
};

/**
 * Hook to upload media with progress tracking
 */
export const useUploadMedia = () => {
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState<Record<string, MediaUploadProgress>>({});

  const mutation = useMutation({
    mutationFn: async ({ files, folderId }: { files: File[]; folderId?: string }) => {
      // Initialize progress for each file
      files.forEach((file) => {
        setUploadProgress((prev) => ({
          ...prev,
          [file.name]: {
            filename: file.name,
            progress: 0,
            status: 'uploading',
          },
        }));
      });

      const handleProgress = (filename: string, progress: number) => {
        setUploadProgress((prev) => ({
          ...prev,
          [filename]: {
            ...prev[filename],
            progress,
          },
        }));
      };

      const uploadedFiles = await uploadMedia(files, folderId, handleProgress);

      // Update progress to success
      uploadedFiles.forEach((file) => {
        setUploadProgress((prev) => ({
          ...prev,
          [file.originalFilename]: {
            filename: file.originalFilename,
            progress: 100,
            status: 'success',
            file,
          },
        }));
      });

      return uploadedFiles;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.mediaList] });
    },
    onError: (error, variables) => {
      // Update progress to error
      variables.files.forEach((file) => {
        setUploadProgress((prev) => ({
          ...prev,
          [file.name]: {
            filename: file.name,
            progress: 0,
            status: 'error',
            error: error instanceof Error ? error.message : 'Upload failed',
          },
        }));
      });
    },
  });

  const resetProgress = () => setUploadProgress({});

  return {
    ...mutation,
    uploadProgress: Object.values(uploadProgress),
    resetProgress,
  };
};

/**
 * Hook to update media metadata
 */
export const useUpdateMedia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MediaUpdateData }) => updateMedia(id, data),
    onSuccess: (updatedMedia) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.mediaList] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.mediaItem, updatedMedia.id] });
    },
  });
};

/**
 * Hook to delete single media
 */
export const useDeleteMedia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteMedia(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.mediaList] });
    },
  });
};

/**
 * Hook to bulk delete media
 */
export const useBulkDeleteMedia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (mediaIds: string[]) => bulkDeleteMedia(mediaIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.mediaList] });
    },
  });
};

/**
 * Hook to move media to folder
 */
export const useMoveMedia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ mediaIds, targetFolderId }: { mediaIds: string[]; targetFolderId?: string }) =>
      moveMedia(mediaIds, targetFolderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.mediaList] });
    },
  });
};

/**
 * Hook to create folder
 */
export const useCreateFolder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, parentId }: { name: string; parentId?: string }) =>
      createFolder(name, parentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.folders] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.folderTree] });
    },
  });
};

/**
 * Hook to update folder
 */
export const useUpdateFolder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => updateFolder(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.folders] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.folderTree] });
    },
  });
};

/**
 * Hook to delete folder
 */
export const useDeleteFolder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteFolder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.folders] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.folderTree] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.mediaList] });
    },
  });
};
