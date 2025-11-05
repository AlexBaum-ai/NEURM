import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Trash2, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadCoverImage } from '../api/profileApi';
import { ImageUploadButton } from './ImageUploadButton';
import { ImageCropModal } from './ImageCropModal';
import { Button } from '@/components/common/Button/Button';
import axios from 'axios';

interface CoverImageUploadProps {
  currentCoverImage?: string;
  username: string;
  onUploadSuccess?: (coverImageUrl: string) => void;
  onDeleteSuccess?: () => void;
}

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export const CoverImageUpload: React.FC<CoverImageUploadProps> = ({
  currentCoverImage,
  username,
  onUploadSuccess,
  onDeleteSuccess,
}) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('');
  const [showCropModal, setShowCropModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);

  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (croppedBlob: Blob) => {
      const file = new File([croppedBlob], 'cover.jpg', { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('cover', file);

      const response = await axios.post('/api/v1/users/me/cover', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress({
              loaded: progressEvent.loaded,
              total: progressEvent.total,
              percentage,
            });
          }
        },
      });

      return response.data.coverImageUrl;
    },
    onSuccess: (coverImageUrl) => {
      queryClient.invalidateQueries({ queryKey: ['profile', username] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      onUploadSuccess?.(coverImageUrl);
      setUploadProgress(null);
    },
    onError: (error) => {
      console.error('Cover image upload failed:', error);
      setUploadProgress(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await axios.delete('/api/v1/users/me/cover');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', username] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      onDeleteSuccess?.();
    },
  });

  const handleImageSelect = (file: File) => {
    setSelectedImage(file);
    const url = URL.createObjectURL(file);
    setImagePreviewUrl(url);
    setShowCropModal(true);
  };

  const handleCropComplete = async (croppedImage: Blob) => {
    setShowCropModal(false);
    await uploadMutation.mutateAsync(croppedImage);
  };

  const handleCloseCropModal = () => {
    setShowCropModal(false);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImagePreviewUrl('');
    setSelectedImage(null);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to remove your cover image?')) {
      deleteMutation.mutate();
    }
  };

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const isUploading = uploadMutation.isPending;

  return (
    <div className="space-y-4">
      {/* Cover Image Preview */}
      <div className="relative h-48 md:h-64 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg overflow-hidden">
        {currentCoverImage ? (
          <img
            src={currentCoverImage}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-16 h-16 text-white/50" />
          </div>
        )}

        {/* Upload Progress Overlay */}
        {isUploading && uploadProgress && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-3" />
              <div className="text-white">
                <p className="text-lg font-medium mb-1">Uploading...</p>
                <p className="text-sm">{uploadProgress.percentage}%</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons Overlay */}
        {!isUploading && (
          <div className="absolute bottom-4 right-4 flex gap-2">
            <ImageUploadButton
              onImageSelect={handleImageSelect}
              maxSize={10}
              acceptedFormats={['image/jpeg', 'image/png', 'image/webp']}
              buttonText="Upload Cover"
              variant="primary"
              size="sm"
              disabled={isUploading || deleteMutation.isPending}
              isLoading={isUploading}
            />

            {currentCoverImage && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={isUploading || deleteMutation.isPending}
                className="gap-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Info Text */}
      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
        Upload a landscape image (16:9 ratio). Max size: 10MB. Formats: JPEG, PNG, WebP.
      </p>

      {/* Crop Modal */}
      {showCropModal && imagePreviewUrl && (
        <ImageCropModal
          imageUrl={imagePreviewUrl}
          aspectRatio={16 / 9}
          onCropComplete={handleCropComplete}
          onClose={handleCloseCropModal}
          title="Crop Cover Image"
        />
      )}
    </div>
  );
};

export default CoverImageUpload;
