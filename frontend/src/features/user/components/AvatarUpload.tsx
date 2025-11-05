import React, { useState, useEffect } from 'react';
import { Camera, Trash2, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadAvatar } from '../api/profileApi';
import { ImageUploadButton } from './ImageUploadButton';
import { ImageCropModal } from './ImageCropModal';
import { Button } from '@/components/common/Button/Button';
import axios from 'axios';

interface AvatarUploadProps {
  currentAvatar?: string;
  displayName?: string;
  username: string;
  onUploadSuccess?: (avatarUrl: string) => void;
  onDeleteSuccess?: () => void;
}

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatar,
  displayName,
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
      const file = new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await axios.post('/api/v1/users/me/avatar', formData, {
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

      return response.data.avatarUrl;
    },
    onSuccess: (avatarUrl) => {
      queryClient.invalidateQueries({ queryKey: ['profile', username] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      onUploadSuccess?.(avatarUrl);
      setUploadProgress(null);
    },
    onError: (error) => {
      console.error('Avatar upload failed:', error);
      setUploadProgress(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await axios.delete('/api/v1/users/me/avatar');
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
    if (confirm('Are you sure you want to remove your avatar?')) {
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
    <div className="flex flex-col items-center gap-4">
      {/* Avatar Preview */}
      <div className="relative">
        <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-900 bg-gray-200 dark:bg-gray-700 overflow-hidden shadow-lg">
          {currentAvatar ? (
            <img
              src={currentAvatar}
              alt={displayName || username}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl font-bold text-gray-400 dark:text-gray-500">
              {(displayName || username).charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Upload Progress Overlay */}
        {isUploading && uploadProgress && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-white animate-spin mx-auto mb-2" />
              <span className="text-white text-sm font-medium">
                {uploadProgress.percentage}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <ImageUploadButton
          onImageSelect={handleImageSelect}
          maxSize={5}
          acceptedFormats={['image/jpeg', 'image/png', 'image/webp']}
          buttonText="Upload Avatar"
          variant="outline"
          size="sm"
          disabled={isUploading || deleteMutation.isPending}
          isLoading={isUploading}
        />

        {currentAvatar && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={isUploading || deleteMutation.isPending}
            className="gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
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

      {/* Info Text */}
      <p className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-xs">
        Upload a square image (1:1 ratio). Max size: 5MB. Formats: JPEG, PNG, WebP.
      </p>

      {/* Crop Modal */}
      {showCropModal && imagePreviewUrl && (
        <ImageCropModal
          imageUrl={imagePreviewUrl}
          aspectRatio={1}
          onCropComplete={handleCropComplete}
          onClose={handleCloseCropModal}
          title="Crop Avatar"
        />
      )}
    </div>
  );
};

export default AvatarUpload;
