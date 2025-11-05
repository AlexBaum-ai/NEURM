/**
 * MediaLibrary Component
 * Main media management interface with upload, browse, and organize functionality
 */

import React, { useState, useCallback } from 'react';
import {
  Grid3x3,
  List,
  Upload as UploadIcon,
  Search,
  Trash2,
  FolderInput,
  X,
} from 'lucide-react';
import FolderTree from './FolderTree';
import MediaUploader from './MediaUploader';
import MediaGrid from './MediaGrid';
import { useMediaList, useDeleteMedia, useBulkDeleteMedia, useMoveMedia, useUpdateMedia } from '../hooks/useMedia';
import type { MediaFile, MediaViewMode, MediaUpdateData } from '../types/media.types';
import { Button } from '@/components/common/Button/Button';
import { Input } from '@/components/common/Input/Input';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
} from '@/components/common/Modal/Modal';
import { useDebounce } from '@/hooks/useDebounce';

export const MediaLibrary: React.FC = () => {
  const [viewMode, setViewMode] = useState<MediaViewMode>('grid');
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>();
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [showUploader, setShowUploader] = useState(false);
  const [editingMedia, setEditingMedia] = useState<MediaFile | null>(null);

  const debouncedSearch = useDebounce(searchQuery, 500);

  const { data: mediaData, isLoading } = useMediaList({
    page,
    limit: 24,
    folderId: selectedFolderId,
    search: debouncedSearch || undefined,
    sortBy: 'uploadedAt',
    sortOrder: 'desc',
  });

  const { mutate: deleteMedia } = useDeleteMedia();
  const { mutate: bulkDeleteMedia } = useBulkDeleteMedia();
  const { mutate: moveMedia } = useMoveMedia();
  const { mutate: updateMedia } = useUpdateMedia();

  const handleSelectMedia = useCallback((id: string) => {
    setSelectedMediaIds((prev) =>
      prev.includes(id) ? prev.filter((mediaId) => mediaId !== id) : [...prev, id]
    );
  }, []);

  const handleSelectAll = () => {
    if (selectedMediaIds.length === mediaData?.data.length) {
      setSelectedMediaIds([]);
    } else {
      setSelectedMediaIds(mediaData?.data.map((m) => m.id) || []);
    }
  };

  const handleDeleteMedia = (id: string) => {
    if (confirm('Are you sure you want to delete this media file?')) {
      deleteMedia(id, {
        onSuccess: () => {
          setSelectedMediaIds((prev) => prev.filter((mediaId) => mediaId !== id));
        },
      });
    }
  };

  const handleBulkDelete = () => {
    if (selectedMediaIds.length === 0) return;

    if (confirm(`Are you sure you want to delete ${selectedMediaIds.length} files?`)) {
      bulkDeleteMedia(selectedMediaIds, {
        onSuccess: () => {
          setSelectedMediaIds([]);
        },
      });
    }
  };

  const handleBulkMove = (targetFolderId?: string) => {
    if (selectedMediaIds.length === 0) return;

    moveMedia(
      { mediaIds: selectedMediaIds, targetFolderId },
      {
        onSuccess: () => {
          setSelectedMediaIds([]);
        },
      }
    );
  };

  const handleEditMedia = (media: MediaFile) => {
    setEditingMedia(media);
  };

  const handleSaveEdit = (data: MediaUpdateData) => {
    if (!editingMedia) return;

    updateMedia(
      { id: editingMedia.id, data },
      {
        onSuccess: () => {
          setEditingMedia(null);
        },
      }
    );
  };

  const handleUploadComplete = () => {
    setShowUploader(false);
  };

  return (
    <div className="h-full flex">
      {/* Sidebar - Folder Tree */}
      <div className="w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
        <FolderTree selectedFolderId={selectedFolderId} onSelectFolder={setSelectedFolderId} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
        {/* Toolbar */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Media Library</h2>
            <Button onClick={() => setShowUploader(true)}>
              <UploadIcon className="w-4 h-4 mr-2" />
              Upload Files
            </Button>
          </div>

          {/* Search and View Toggle */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search media..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  </button>
                )}
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedMediaIds.length > 0 && (
            <div className="mt-3 flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <span className="text-sm text-blue-900 dark:text-blue-100">
                {selectedMediaIds.length} selected
              </span>
              <div className="flex gap-2 ml-auto">
                <Button size="sm" variant="outline" onClick={handleSelectAll}>
                  {selectedMediaIds.length === mediaData?.data.length ? 'Deselect All' : 'Select All'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkMove(undefined)}>
                  <FolderInput className="w-4 h-4 mr-2" />
                  Move
                </Button>
                <Button size="sm" variant="outline" onClick={handleBulkDelete}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelectedMediaIds([])}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Media Grid/List */}
        <div className="flex-1 overflow-y-auto p-6">
          <MediaGrid
            media={mediaData?.data || []}
            selectedIds={selectedMediaIds}
            onSelectMedia={handleSelectMedia}
            onDeleteMedia={handleDeleteMedia}
            onEditMedia={handleEditMedia}
            selectable={true}
            viewMode={viewMode}
            pagination={
              mediaData?.pagination
                ? {
                    page: mediaData.pagination.page,
                    totalPages: mediaData.pagination.totalPages,
                    onPageChange: setPage,
                  }
                : undefined
            }
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Upload Modal */}
      <Modal open={showUploader} onOpenChange={() => setShowUploader(false)}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Upload Media</ModalTitle>
          </ModalHeader>
          <MediaUploader
            folderId={selectedFolderId}
            onUploadComplete={handleUploadComplete}
          />
        </ModalContent>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editingMedia} onOpenChange={() => setEditingMedia(null)}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Edit Media</ModalTitle>
          </ModalHeader>
          {editingMedia && (
            <EditMediaForm
              media={editingMedia}
              onSave={handleSaveEdit}
              onCancel={() => setEditingMedia(null)}
            />
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

interface EditMediaFormProps {
  media: MediaFile;
  onSave: (data: MediaUpdateData) => void;
  onCancel: () => void;
}

const EditMediaForm: React.FC<EditMediaFormProps> = ({ media, onSave, onCancel }) => {
  const [altText, setAltText] = useState(media.altText || '');
  const [caption, setCaption] = useState(media.caption || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ altText, caption });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Preview */}
      {media.mimeType.startsWith('image/') && (
        <div className="aspect-video bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden">
          <img
            src={media.cdnUrl || media.url}
            alt={media.altText || media.filename}
            className="w-full h-full object-contain"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Alt Text
        </label>
        <Input
          type="text"
          value={altText}
          onChange={(e) => setAltText(e.target.value)}
          placeholder="Describe this image..."
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Alternative text for accessibility and SEO
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Caption
        </label>
        <Input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Optional caption..."
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Changes</Button>
      </div>
    </form>
  );
};

export default MediaLibrary;
