/**
 * MediaUploader Component
 * Drag-and-drop file upload with progress tracking
 */

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useUploadMedia } from '../hooks/useMedia';
import { Button } from '@/components/common/Button/Button';

interface MediaUploaderProps {
  folderId?: string;
  onUploadComplete?: () => void;
  maxFiles?: number;
  maxFileSize?: number;
  accept?: Record<string, string[]>;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  folderId,
  onUploadComplete,
  maxFiles = 10,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  accept = {
    'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'],
  },
}) => {
  const { mutate: upload, uploadProgress, resetProgress, isPending } = useUploadMedia();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      upload(
        { files: acceptedFiles, folderId },
        {
          onSuccess: () => {
            onUploadComplete?.();
            setTimeout(() => resetProgress(), 2000);
          },
        }
      );
    },
    [upload, folderId, onUploadComplete, resetProgress]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject, fileRejections } = useDropzone({
    onDrop,
    accept,
    maxFiles,
    maxSize: maxFileSize,
    disabled: isPending,
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${isDragActive && !isDragReject ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : ''}
          ${isDragReject ? 'border-red-500 bg-red-50 dark:bg-red-950' : ''}
          ${!isDragActive && !isDragReject ? 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600' : ''}
          ${isPending ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <Upload className="w-12 h-12 text-gray-400" />
          {isDragActive && !isDragReject && (
            <p className="text-blue-600 dark:text-blue-400 font-medium">Drop files here...</p>
          )}
          {isDragReject && (
            <p className="text-red-600 dark:text-red-400 font-medium">
              Some files will be rejected
            </p>
          )}
          {!isDragActive && (
            <>
              <p className="text-gray-700 dark:text-gray-300 font-medium">
                Drag & drop files here, or click to select
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Max {maxFiles} files, up to {formatFileSize(maxFileSize)} each
              </p>
            </>
          )}
        </div>
      </div>

      {/* File Rejections */}
      {fileRejections.length > 0 && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
            Some files were rejected:
          </h4>
          <ul className="text-xs text-red-700 dark:text-red-300 space-y-1">
            {fileRejections.map(({ file, errors }) => (
              <li key={file.name}>
                <span className="font-medium">{file.name}</span>:{' '}
                {errors.map((e) => e.message).join(', ')}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Upload Progress
          </h4>
          {uploadProgress.map((progress) => (
            <div
              key={progress.filename}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {progress.status === 'uploading' && (
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  )}
                  {progress.status === 'success' && (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                  {progress.status === 'error' && (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                    {progress.filename}
                  </span>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                  {progress.progress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    progress.status === 'error'
                      ? 'bg-red-600'
                      : progress.status === 'success'
                        ? 'bg-green-600'
                        : 'bg-blue-600'
                  }`}
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
              {progress.error && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">{progress.error}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MediaUploader;
