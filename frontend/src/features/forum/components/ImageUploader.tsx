import React from 'react';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageFile {
  file: File;
  preview: string;
}

interface ImageUploaderProps {
  images: ImageFile[];
  onChange: (images: ImageFile[]) => void;
  maxImages?: number;
  maxSize?: number; // in bytes
  error?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  images,
  onChange,
  maxImages = 5,
  maxSize = 5 * 1024 * 1024, // 5MB
  error,
}) => {
  const [uploadError, setUploadError] = React.useState<string>('');

  const onDrop = React.useCallback(
    (acceptedFiles: File[]) => {
      setUploadError('');

      // Check if adding these files would exceed max
      if (images.length + acceptedFiles.length > maxImages) {
        setUploadError(`You can only upload up to ${maxImages} images`);
        return;
      }

      // Validate each file
      const validFiles = acceptedFiles.filter((file) => {
        if (file.size > maxSize) {
          setUploadError(`${file.name} is too large (max ${maxSize / 1024 / 1024}MB)`);
          return false;
        }
        if (!file.type.match(/^image\/(jpeg|jpg|png|gif|webp)$/i)) {
          setUploadError(`${file.name} is not a supported image format`);
          return false;
        }
        return true;
      });

      // Create previews
      const newImages: ImageFile[] = validFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));

      onChange([...images, ...newImages]);
    },
    [images, maxImages, maxSize, onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
    },
    maxSize,
    disabled: images.length >= maxImages,
  });

  const removeImage = (index: number) => {
    const newImages = [...images];
    URL.revokeObjectURL(newImages[index].preview);
    newImages.splice(index, 1);
    onChange(newImages);
    setUploadError('');
  };

  // Clean up previews on unmount
  React.useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.preview));
    };
  }, []);

  return (
    <div className="w-full">
      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
        Images (Optional)
      </label>

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {images.map((img, index) => (
            <div key={index} className="group relative aspect-square overflow-hidden rounded-lg border border-gray-300 dark:border-gray-700">
              <img
                src={img.preview}
                alt={`Upload ${index + 1}`}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute right-1 top-1 rounded-full bg-accent-600 p-1 text-white opacity-0 transition-opacity hover:bg-accent-700 group-hover:opacity-100"
                title="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Dropzone */}
      {images.length < maxImages && (
        <div
          {...getRootProps()}
          className={cn(
            'cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors',
            isDragActive
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'border-gray-300 bg-gray-50 hover:border-primary-400 dark:border-gray-700 dark:bg-gray-800',
            error && 'border-accent-300'
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            {isDragActive ? (
              <Upload className="h-10 w-10 text-primary-500" />
            ) : (
              <ImageIcon className="h-10 w-10 text-gray-400" />
            )}
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {isDragActive ? 'Drop images here' : 'Drag & drop images or click to browse'}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Max {maxImages} images, {maxSize / 1024 / 1024}MB each (JPEG, PNG, GIF, WebP)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Image count */}
      {images.length > 0 && (
        <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
          {images.length} of {maxImages} images uploaded
        </p>
      )}

      {/* Errors */}
      {(error || uploadError) && (
        <p className="mt-2 text-sm text-accent-600 dark:text-accent-400">
          {error || uploadError}
        </p>
      )}
    </div>
  );
};

export default ImageUploader;
