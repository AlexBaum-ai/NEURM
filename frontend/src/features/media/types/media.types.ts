/**
 * Media Library Types
 * Type definitions for the media management system
 */

export interface MediaFile {
  id: string;
  filename: string;
  originalFilename: string;
  path: string;
  url: string;
  cdnUrl?: string;
  thumbnailUrl?: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  altText?: string;
  caption?: string;
  folderId?: string;
  folder?: MediaFolder;
  uploadedBy: string;
  uploadedAt: string;
  updatedAt: string;
}

export interface MediaFolder {
  id: string;
  name: string;
  parentId?: string;
  path: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  children?: MediaFolder[];
  mediaCount?: number;
}

export interface MediaUploadProgress {
  filename: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
  file?: MediaFile;
}

export interface MediaListParams {
  page?: number;
  limit?: number;
  search?: string;
  folderId?: string;
  mimeType?: string;
  sortBy?: 'filename' | 'size' | 'uploadedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface MediaListResponse {
  data: MediaFile[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface FolderTreeNode {
  id: string;
  name: string;
  parentId?: string;
  children: FolderTreeNode[];
  mediaCount: number;
}

export interface MediaUpdateData {
  altText?: string;
  caption?: string;
  folderId?: string;
}

export interface MediaBulkOperation {
  mediaIds: string[];
  operation: 'move' | 'delete';
  targetFolderId?: string;
}

export type MediaViewMode = 'grid' | 'list';

export interface MediaPickerConfig {
  multiple?: boolean;
  maxFiles?: number;
  accept?: string[];
  onSelect: (files: MediaFile[]) => void;
}
