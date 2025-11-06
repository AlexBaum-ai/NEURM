/**
 * SEO utility functions for meta tags and structured data
 */

export interface SEOConfig {
  title?: string;
  description?: string;
  keywords?: string[];
  author?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  locale?: string;
  siteName?: string;
  noindex?: boolean;
  nofollow?: boolean;
  canonical?: string;
}

export interface TwitterCardConfig {
  card: 'summary' | 'summary_large_image' | 'app' | 'player';
  site?: string;
  creator?: string;
  title?: string;
  description?: string;
  image?: string;
}

/**
 * Generate default SEO configuration
 */
export const defaultSEO: SEOConfig = {
  siteName: 'Neurmatic',
  locale: 'en_US',
  type: 'website',
  image: '/og-image.png', // Default OG image
};

/**
 * Build full page title with site name
 */
export const buildTitle = (title?: string, includeSiteName = true): string => {
  if (!title) return 'Neurmatic - LLM Community Platform';
  return includeSiteName ? `${title} | Neurmatic` : title;
};

/**
 * Generate canonical URL
 */
export const getCanonicalUrl = (path: string): string => {
  const baseUrl = import.meta.env.VITE_SITE_URL || 'https://neurmatic.com';
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

/**
 * Truncate description to SEO-friendly length
 */
export const truncateDescription = (text: string, maxLength = 160): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3).trim() + '...';
};

/**
 * Strip HTML tags from text
 */
export const stripHtml = (html: string): string => {
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

/**
 * Generate robots meta content
 */
export const getRobotsContent = (config: SEOConfig): string => {
  const directives: string[] = [];

  if (config.noindex) directives.push('noindex');
  else directives.push('index');

  if (config.nofollow) directives.push('nofollow');
  else directives.push('follow');

  return directives.join(', ');
};

/**
 * Get absolute image URL
 */
export const getAbsoluteImageUrl = (imagePath?: string): string => {
  if (!imagePath) return getCanonicalUrl('/og-image.png');
  if (imagePath.startsWith('http')) return imagePath;
  return getCanonicalUrl(imagePath);
};

/**
 * Generate keywords meta content
 */
export const getKeywordsContent = (keywords?: string[]): string => {
  if (!keywords || keywords.length === 0) return '';
  return keywords.join(', ');
};

/**
 * Extract excerpt from content
 */
export const extractExcerpt = (content: string, maxLength = 160): string => {
  const plainText = stripHtml(content);
  return truncateDescription(plainText, maxLength);
};
