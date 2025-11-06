import { useLocation } from 'react-router-dom';
import { getCanonicalUrl } from '@/utils/seo';
import type { SEOConfig } from '@/utils/seo';

/**
 * Custom hook for SEO configuration
 * Provides common SEO utilities and current page context
 *
 * @example
 * ```tsx
 * const { canonicalUrl, buildPageTitle } = useSEO();
 *
 * <SEO
 *   title={buildPageTitle('Page Title')}
 *   canonical={canonicalUrl}
 * />
 * ```
 */
export const useSEO = () => {
  const location = useLocation();

  /**
   * Get canonical URL for current page
   */
  const canonicalUrl = getCanonicalUrl(location.pathname + location.search);

  /**
   * Build page title with site name
   */
  const buildPageTitle = (title: string, includeSiteName = true): string => {
    if (!includeSiteName) return title;
    return `${title} | Neurmatic`;
  };

  /**
   * Get default SEO config for current page
   */
  const getDefaultSEO = (): SEOConfig => {
    return {
      url: canonicalUrl,
      locale: 'en_US',
      siteName: 'Neurmatic',
      type: 'website',
    };
  };

  /**
   * Check if page should be indexed
   */
  const shouldIndex = (): boolean => {
    // Don't index auth pages, admin pages, etc.
    const noIndexPaths = ['/admin', '/settings', '/verify', '/reset-password'];
    return !noIndexPaths.some(path => location.pathname.startsWith(path));
  };

  return {
    canonicalUrl,
    pathname: location.pathname,
    buildPageTitle,
    getDefaultSEO,
    shouldIndex: shouldIndex(),
  };
};

export default useSEO;
