/**
 * MediaCard Component
 * Card display for individual media files
 */

import React, { useState } from 'react';
import { Image, File, Check, Trash2, Edit2, Download, Copy } from 'lucide-react';
import type { MediaFile } from '../types/media.types';
import { formatDate } from 'date-fns';

interface MediaCardProps {
  media: MediaFile;
  selected?: boolean;
  onSelect?: (id: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (media: MediaFile) => void;
  selectable?: boolean;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  media,
  selected = false,
  onSelect,
  onDelete,
  onEdit,
  selectable = false,
}) => {
  const [imageError, setImageError] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i)) + ' ' + sizes[i];
  };

  const isImage = media.mimeType.startsWith('image/');
  const imageUrl = media.thumbnailUrl || media.cdnUrl || media.url;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(media.cdnUrl || media.url);
  };

  const handleDownload = () => {
    window.open(media.url, '_blank');
  };

  return (
    <div
      className={`
        relative group rounded-lg border overflow-hidden bg-white dark:bg-gray-800
        transition-all duration-200
        ${selected ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-200 dark:border-gray-700'}
        ${selectable ? 'cursor-pointer hover:shadow-lg' : ''}
      `}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={() => selectable && onSelect?.(media.id)}
    >
      {/* Selection Checkbox */}
      {selectable && (
        <div className="absolute top-2 left-2 z-10">
          <div
            className={`
              w-5 h-5 rounded border-2 flex items-center justify-center
              ${selected ? 'bg-blue-600 border-blue-600' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'}
            `}
          >
            {selected && <Check className="w-3 h-3 text-white" />}
          </div>
        </div>
      )}

      {/* Media Preview */}
      <div className="aspect-square bg-gray-100 dark:bg-gray-900 flex items-center justify-center overflow-hidden">
        {isImage && !imageError ? (
          <img
            src={imageUrl}
            alt={media.altText || media.filename}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <File className="w-12 h-12 text-gray-400" />
        )}
      </div>

      {/* Media Info */}
      <div className="p-3">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate" title={media.filename}>
          {media.filename}
        </h4>
        <div className="mt-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{formatFileSize(media.size)}</span>
          {media.width && media.height && (
            <span>
              {media.width} × {media.height}
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {formatDate(new Date(media.uploadedAt), 'MMM d, yyyy')}
        </p>
        {media.altText && (
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 truncate" title={media.altText}>
            Alt: {media.altText}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div className="absolute top-2 right-2 flex gap-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCopyUrl();
            }}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="Copy URL"
          >
            <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDownload();
            }}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="Download"
          >
            <Download className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(media);
              }}
              className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900 rounded"
              title="Edit"
            >
              <Edit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(media.id);
              }}
              className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900 rounded"
              title="Delete"
            >
              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MediaCard;
