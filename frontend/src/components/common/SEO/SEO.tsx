import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import {
  buildTitle,
  getCanonicalUrl,
  getRobotsContent,
  getAbsoluteImageUrl,
  getKeywordsContent,
  type SEOConfig
} from '@/utils/seo';

interface SEOProps extends SEOConfig {
  children?: React.ReactNode;
}

/**
 * SEO Component
 *
 * Manages meta tags, OpenGraph, Twitter Cards, and structured data
 * Uses react-helmet-async for dynamic meta tag management
 *
 * @example
 * ```tsx
 * <SEO
 *   title="Article Title"
 *   description="Article description"
 *   type="article"
 *   image="/images/article.jpg"
 *   publishedTime="2024-01-01T00:00:00Z"
 * />
 * ```
 */
export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords,
  author,
  image,
  url,
  type = 'website',
  publishedTime,
  modifiedTime,
  section,
  tags,
  locale = 'en_US',
  siteName = 'Neurmatic',
  noindex = false,
  nofollow = false,
  canonical,
  children,
}) => {
  const location = useLocation();

  // Build full title
  const fullTitle = buildTitle(title);

  // Get canonical URL
  const canonicalUrl = canonical || url || getCanonicalUrl(location.pathname);

  // Get absolute image URL
  const absoluteImageUrl = getAbsoluteImageUrl(image);

  // Get robots content
  const robotsContent = getRobotsContent({ noindex, nofollow });

  // Get keywords
  const keywordsContent = getKeywordsContent(keywords);

  return (
    <Helmet>
      {/* Basic meta tags */}
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {keywordsContent && <meta name="keywords" content={keywordsContent} />}
      {author && <meta name="author" content={author} />}
      <meta name="robots" content={robotsContent} />

      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />

      {/* OpenGraph meta tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={locale} />
      {absoluteImageUrl && <meta property="og:image" content={absoluteImageUrl} />}
      {absoluteImageUrl && <meta property="og:image:alt" content={title || siteName} />}

      {/* Article-specific OpenGraph tags */}
      {type === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === 'article' && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {type === 'article' && author && (
        <meta property="article:author" content={author} />
      )}
      {type === 'article' && section && (
        <meta property="article:section" content={section} />
      )}
      {type === 'article' && tags && tags.map((tag) => (
        <meta key={tag} property="article:tag" content={tag} />
      ))}

      {/* Twitter Card meta tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      {absoluteImageUrl && <meta name="twitter:image" content={absoluteImageUrl} />}
      {absoluteImageUrl && <meta name="twitter:image:alt" content={title || siteName} />}

      {/* LinkedIn meta tags */}
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      {/* Additional structured data can be added as children */}
      {children}
    </Helmet>
  );
};

export default SEO;
