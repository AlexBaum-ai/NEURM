/**
 * MediaGrid Component
 * Grid/List view for media files with selection and pagination
 */

import React from 'react';
import MediaCard from './MediaCard';
import type { MediaFile } from '../types/media.types';
import { Button } from '@/components/common/Button/Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MediaGridProps {
  media: MediaFile[];
  selectedIds?: string[];
  onSelectMedia?: (id: string) => void;
  onDeleteMedia?: (id: string) => void;
  onEditMedia?: (media: MediaFile) => void;
  selectable?: boolean;
  viewMode?: 'grid' | 'list';
  pagination?: {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
  isLoading?: boolean;
}

export const MediaGrid: React.FC<MediaGridProps> = ({
  media,
  selectedIds = [],
  onSelectMedia,
  onDeleteMedia,
  onEditMedia,
  selectable = false,
  viewMode = 'grid',
  pagination,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (media.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No media files</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Upload some files to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {media.map((item) => (
            <MediaCard
              key={item.id}
              media={item}
              selected={selectedIds.includes(item.id)}
              onSelect={onSelectMedia}
              onDelete={onDeleteMedia}
              onEdit={onEditMedia}
              selectable={selectable}
            />
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-2">
          {media.map((item) => (
            <div
              key={item.id}
              className={`
                flex items-center gap-4 p-3 rounded-lg border
                ${selectedIds.includes(item.id) ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : 'border-gray-200 dark:border-gray-700'}
                ${selectable ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : ''}
              `}
              onClick={() => selectable && onSelectMedia?.(item.id)}
            >
              {/* Thumbnail */}
              <div className="w-12 h-12 flex-shrink-0 bg-gray-100 dark:bg-gray-900 rounded overflow-hidden">
                {item.mimeType.startsWith('image/') ? (
                  <img
                    src={item.thumbnailUrl || item.cdnUrl || item.url}
                    alt={item.altText || item.filename}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {item.filename}
                </h4>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                  <span>{item.mimeType}</span>
                  {item.width && item.height && (
                    <span>
                      {item.width} × {item.height}
                    </span>
                  )}
                </div>
              </div>

              {/* Alt Text */}
              {item.altText && (
                <div className="hidden md:block flex-1 min-w-0">
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {item.altText}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2">
                {onEditMedia && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditMedia(item);
                    }}
                  >
                    Edit
                  </Button>
                )}
                {onDeleteMedia && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteMedia(item.id);
                    }}
                    className="text-red-600 hover:text-red-700 dark:text-red-400"
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            size="sm"
            variant="outline"
            disabled={pagination.page === 1}
            onClick={() => pagination.onPageChange(pagination.page - 1)}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={pagination.page === pagination.totalPages}
            onClick={() => pagination.onPageChange(pagination.page + 1)}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default MediaGrid;
