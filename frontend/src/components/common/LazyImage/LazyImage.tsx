import React, { useState, useEffect, useRef } from 'react';
import { clsx } from 'clsx';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderSrc?: string;
  threshold?: number;
  rootMargin?: string;
  onLoad?: () => void;
  onError?: () => void;
  width?: number | string;
  height?: number | string;
}

/**
 * LazyImage component that uses IntersectionObserver for lazy loading images
 *
 * Features:
 * - Lazy loads images when they enter the viewport
 * - Optional placeholder image while loading
 * - Configurable intersection observer options
 * - Loading state with blur effect
 * - Error handling with fallback
 *
 * @example
 * <LazyImage
 *   src="/images/hero.jpg"
 *   alt="Hero image"
 *   placeholderSrc="/images/placeholder.jpg"
 *   className="w-full h-64 object-cover"
 * />
 */
export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className,
  placeholderSrc = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23e5e7eb" width="400" height="300"/%3E%3C/svg%3E',
  threshold = 0.01,
  rootMargin = '50px',
  onLoad,
  onError,
  width,
  height,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!imgRef.current) return;

    // Create IntersectionObserver
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(imgRef.current);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  return (
    <div className={clsx('relative overflow-hidden', className)}>
      <img
        ref={imgRef}
        src={isInView ? src : placeholderSrc}
        alt={alt}
        className={clsx(
          'transition-all duration-300',
          isLoaded ? 'blur-0 scale-100' : 'blur-sm scale-105',
          hasError && 'opacity-50'
        )}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
        width={width}
        height={height}
      />

      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
      )}

      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <svg
              className="w-12 h-12 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm">Failed to load image</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LazyImage;
