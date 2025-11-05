/**
 * MediaPicker Component
 * Modal for selecting media files in article editor
 */

import React, { useState, useCallback } from 'react';
import { Search, X, Upload as UploadIcon } from 'lucide-react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
} from '@/components/common/Modal/Modal';
import MediaGrid from './MediaGrid';
import MediaUploader from './MediaUploader';
import FolderTree from './FolderTree';
import { useMediaList } from '../hooks/useMedia';
import { Button } from '@/components/common/Button/Button';
import { Input } from '@/components/common/Input/Input';
import { useDebounce } from '@/hooks/useDebounce';
import type { MediaFile, MediaPickerConfig } from '../types/media.types';

interface MediaPickerProps extends MediaPickerConfig {
  isOpen: boolean;
  onClose: () => void;
}

export const MediaPicker: React.FC<MediaPickerProps> = ({
  isOpen,
  onClose,
  multiple = false,
  maxFiles = 1,
  accept,
  onSelect,
}) => {
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [showUploader, setShowUploader] = useState(false);
  const [showFolders, setShowFolders] = useState(true);

  const debouncedSearch = useDebounce(searchQuery, 500);

  const { data: mediaData, isLoading } = useMediaList({
    page,
    limit: 24,
    folderId: selectedFolderId,
    search: debouncedSearch || undefined,
    mimeType: accept ? accept.join(',') : undefined,
    sortBy: 'uploadedAt',
    sortOrder: 'desc',
  });

  const handleSelectMedia = useCallback(
    (id: string) => {
      if (multiple) {
        setSelectedMediaIds((prev) => {
          const newSelection = prev.includes(id)
            ? prev.filter((mediaId) => mediaId !== id)
            : [...prev, id];

          // Enforce maxFiles limit
          return newSelection.slice(0, maxFiles);
        });
      } else {
        setSelectedMediaIds([id]);
      }
    },
    [multiple, maxFiles]
  );

  const handleConfirm = () => {
    const selectedMedia = mediaData?.data.filter((m) => selectedMediaIds.includes(m.id)) || [];
    onSelect(selectedMedia);
    handleClose();
  };

  const handleClose = () => {
    setSelectedMediaIds([]);
    setSearchQuery('');
    setPage(1);
    setShowUploader(false);
    onClose();
  };

  const handleUploadComplete = () => {
    setShowUploader(false);
  };

  return (
    <Modal open={isOpen} onOpenChange={handleClose}>
      <ModalContent className="max-w-6xl">
        <ModalHeader>
          <ModalTitle>Select Media</ModalTitle>
        </ModalHeader>
        <div className="flex flex-col h-[70vh]">
        {showUploader ? (
          <div className="flex-1 overflow-y-auto p-4">
            <MediaUploader
              folderId={selectedFolderId}
              onUploadComplete={handleUploadComplete}
              accept={
                accept
                  ? accept.reduce(
                      (acc, type) => ({
                        ...acc,
                        [type]: [`.${type.split('/')[1]}`],
                      }),
                      {}
                    )
                  : undefined
              }
            />
            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={() => setShowUploader(false)}>
                Back to Library
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              {/* Toolbar */}
              <div className={`flex-1 p-4 ${showFolders ? 'border-r border-gray-200 dark:border-gray-700' : ''}`}>
                <div className="flex items-center gap-3 mb-4">
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
                  <Button onClick={() => setShowUploader(true)} size="sm">
                    <UploadIcon className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFolders(!showFolders)}
                  >
                    {showFolders ? 'Hide' : 'Show'} Folders
                  </Button>
                </div>

                {selectedMediaIds.length > 0 && (
                  <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded text-sm text-blue-900 dark:text-blue-100">
                    <span>
                      {selectedMediaIds.length} selected
                      {maxFiles > 1 && ` (max ${maxFiles})`}
                    </span>
                    <button
                      onClick={() => setSelectedMediaIds([])}
                      className="ml-auto text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Folder Sidebar */}
              {showFolders && (
                <div className="w-56 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <FolderTree
                    selectedFolderId={selectedFolderId}
                    onSelectFolder={setSelectedFolderId}
                  />
                </div>
              )}

              {/* Media Grid */}
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
                <MediaGrid
                  media={mediaData?.data || []}
                  selectedIds={selectedMediaIds}
                  onSelectMedia={handleSelectMedia}
                  selectable={true}
                  viewMode="grid"
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

            {/* Footer Actions */}
            <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {multiple
                  ? `Select up to ${maxFiles} file${maxFiles > 1 ? 's' : ''}`
                  : 'Select one file'}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={selectedMediaIds.length === 0}
                >
                  Insert {selectedMediaIds.length > 0 && `(${selectedMediaIds.length})`}
                </Button>
              </div>
            </div>
          </>
        )}
        </div>
      </ModalContent>
    </Modal>
  );
};

export default MediaPicker;
