/**
 * ImageUpload Component
 *
 * Image upload component with preview and validation
 */

import React, { useState, useRef } from 'react';
import { Box, Typography, IconButton, CircularProgress } from '@mui/material';
import { CloudUpload as UploadIcon, Delete as DeleteIcon } from '@mui/icons-material';

interface ImageUploadProps {
  label: string;
  currentImage?: string;
  onUpload: (file: File) => void;
  onRemove?: () => void;
  maxSize: number; // in MB
  aspectRatio?: string;
  height?: number;
  loading?: boolean;
  error?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  label,
  currentImage,
  onUpload,
  onRemove,
  maxSize,
  aspectRatio,
  height = 200,
  loading = false,
  error,
}) => {
  const [preview, setPreview] = useState<string | undefined>(currentImage);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Call upload handler
    onUpload(file);
  };

  const handleRemove = () => {
    setPreview(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onRemove?.();
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Box>
      <Typography variant="subtitle2" className="mb-2 font-medium">
        {label}
      </Typography>
      <Typography variant="caption" color="text.secondary" className="block mb-2">
        Max size: {maxSize}MB. Formats: JPG, PNG, WebP
        {aspectRatio && ` (Recommended: ${aspectRatio})`}
      </Typography>

      <Box
        className="border-2 border-dashed rounded-lg overflow-hidden relative"
        sx={{
          borderColor: error ? 'error.main' : 'divider',
          height,
        }}
      >
        {preview ? (
          <Box className="relative h-full">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <Box
              className="absolute top-2 right-2 flex gap-2"
              sx={{
                '& button': {
                  bgcolor: 'background.paper',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                },
              }}
            >
              <IconButton
                size="small"
                onClick={handleClick}
                disabled={loading}
              >
                <UploadIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={handleRemove}
                disabled={loading}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
            {loading && (
              <Box
                className="absolute inset-0 flex items-center justify-center"
                sx={{ bgcolor: 'rgba(0, 0, 0, 0.5)' }}
              >
                <CircularProgress size={40} />
              </Box>
            )}
          </Box>
        ) : (
          <Box
            className="h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            onClick={handleClick}
          >
            {loading ? (
              <CircularProgress />
            ) : (
              <>
                <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Click to upload
                </Typography>
              </>
            )}
          </Box>
        )}
      </Box>

      {error && (
        <Typography variant="caption" color="error" className="mt-1 block">
          {error}
        </Typography>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={handleFileSelect}
      />
    </Box>
  );
};

export default ImageUpload;
