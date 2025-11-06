/**
 * Structured Data (JSON-LD) utilities for SEO
 * @see https://schema.org/
 */

interface BaseStructuredData {
  '@context': 'https://schema.org';
  '@type': string;
}

/**
 * Organization schema
 */
export interface OrganizationSchema extends BaseStructuredData {
  '@type': 'Organization';
  name: string;
  url: string;
  logo: string;
  description?: string;
  sameAs?: string[]; // Social media profiles
  contactPoint?: {
    '@type': 'ContactPoint';
    contactType: string;
    email?: string;
    url?: string;
  }[];
}

/**
 * Article schema
 */
export interface ArticleSchema extends BaseStructuredData {
  '@type': 'Article' | 'NewsArticle' | 'BlogPosting';
  headline: string;
  description?: string;
  image?: string | string[];
  datePublished: string;
  dateModified?: string;
  author: {
    '@type': 'Person';
    name: string;
    url?: string;
  } | {
    '@type': 'Organization';
    name: string;
  };
  publisher: {
    '@type': 'Organization';
    name: string;
    logo: {
      '@type': 'ImageObject';
      url: string;
    };
  };
  mainEntityOfPage?: {
    '@type': 'WebPage';
    '@id': string;
  };
}

/**
 * JobPosting schema
 */
export interface JobPostingSchema extends BaseStructuredData {
  '@type': 'JobPosting';
  title: string;
  description: string;
  datePosted: string;
  validThrough?: string;
  employmentType?: string | string[];
  hiringOrganization: {
    '@type': 'Organization';
    name: string;
    sameAs?: string;
    logo?: string;
  };
  jobLocation: {
    '@type': 'Place';
    address: {
      '@type': 'PostalAddress';
      addressLocality?: string;
      addressRegion?: string;
      addressCountry?: string;
      streetAddress?: string;
      postalCode?: string;
    };
  } | {
    '@type': 'Place';
    address: string; // Remote jobs
  };
  baseSalary?: {
    '@type': 'MonetaryAmount';
    currency: string;
    value: {
      '@type': 'QuantitativeValue';
      minValue?: number;
      maxValue?: number;
      unitText?: 'YEAR' | 'MONTH' | 'HOUR';
    };
  };
  qualifications?: string;
  experienceRequirements?: string;
  skills?: string;
}

/**
 * Person schema
 */
export interface PersonSchema extends BaseStructuredData {
  '@type': 'Person';
  name: string;
  url?: string;
  image?: string;
  jobTitle?: string;
  description?: string;
  sameAs?: string[]; // Social profiles
  worksFor?: {
    '@type': 'Organization';
    name: string;
  };
}

/**
 * BreadcrumbList schema
 */
export interface BreadcrumbListSchema extends BaseStructuredData {
  '@type': 'BreadcrumbList';
  itemListElement: {
    '@type': 'ListItem';
    position: number;
    name: string;
    item: string;
  }[];
}

/**
 * WebSite schema with search action
 */
export interface WebSiteSchema extends BaseStructuredData {
  '@type': 'WebSite';
  name: string;
  url: string;
  description?: string;
  potentialAction?: {
    '@type': 'SearchAction';
    target: {
      '@type': 'EntryPoint';
      urlTemplate: string;
    };
    'query-input': string;
  };
}

/**
 * Generate Organization structured data
 */
export const generateOrganizationSchema = (): OrganizationSchema => {
  const baseUrl = import.meta.env.VITE_SITE_URL || 'https://neurmatic.com';

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Neurmatic',
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    description: 'Neurmatic is an integrated platform for the Large Language Model (LLM) community, combining news, forums, and jobs.',
    sameAs: [
      // Add social media profiles when available
    ],
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        url: `${baseUrl}/contact`,
      },
    ],
  };
};

/**
 * Generate Article structured data
 */
export const generateArticleSchema = (article: {
  title: string;
  description?: string;
  content?: string;
  featuredImage?: string;
  publishedAt: string;
  updatedAt?: string;
  author: {
    name: string;
    username?: string;
  };
  slug: string;
}): ArticleSchema => {
  const baseUrl = import.meta.env.VITE_SITE_URL || 'https://neurmatic.com';

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description || article.content?.substring(0, 200),
    image: article.featuredImage ? `${baseUrl}${article.featuredImage}` : undefined,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    author: {
      '@type': 'Person',
      name: article.author.name,
      url: article.author.username ? `${baseUrl}/profile/${article.author.username}` : undefined,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Neurmatic',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/news/${article.slug}`,
    },
  };
};

/**
 * Generate JobPosting structured data
 */
export const generateJobPostingSchema = (job: {
  title: string;
  description: string;
  postedAt: string;
  validUntil?: string;
  employmentType?: string[];
  company: {
    name: string;
    website?: string;
    logo?: string;
  };
  location: {
    type: 'remote' | 'onsite' | 'hybrid';
    city?: string;
    state?: string;
    country?: string;
    address?: string;
    postalCode?: string;
  };
  salary?: {
    currency: string;
    min?: number;
    max?: number;
    period?: 'YEAR' | 'MONTH' | 'HOUR';
  };
}): JobPostingSchema => {
  const baseUrl = import.meta.env.VITE_SITE_URL || 'https://neurmatic.com';

  const schema: JobPostingSchema = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description,
    datePosted: job.postedAt,
    validThrough: job.validUntil,
    employmentType: job.employmentType,
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company.name,
      sameAs: job.company.website,
      logo: job.company.logo ? `${baseUrl}${job.company.logo}` : undefined,
    },
    jobLocation: job.location.type === 'remote' ? {
      '@type': 'Place',
      address: 'Remote',
    } : {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.location.city,
        addressRegion: job.location.state,
        addressCountry: job.location.country,
        streetAddress: job.location.address,
        postalCode: job.location.postalCode,
      },
    },
  };

  if (job.salary) {
    schema.baseSalary = {
      '@type': 'MonetaryAmount',
      currency: job.salary.currency,
      value: {
        '@type': 'QuantitativeValue',
        minValue: job.salary.min,
        maxValue: job.salary.max,
        unitText: job.salary.period || 'YEAR',
      },
    };
  }

  return schema;
};

/**
 * Generate Person structured data
 */
export const generatePersonSchema = (person: {
  name: string;
  username?: string;
  avatar?: string;
  bio?: string;
  title?: string;
  company?: string;
  socialLinks?: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
}): PersonSchema => {
  const baseUrl = import.meta.env.VITE_SITE_URL || 'https://neurmatic.com';
  const sameAs: string[] = [];

  if (person.socialLinks) {
    if (person.socialLinks.github) sameAs.push(person.socialLinks.github);
    if (person.socialLinks.linkedin) sameAs.push(person.socialLinks.linkedin);
    if (person.socialLinks.twitter) sameAs.push(person.socialLinks.twitter);
    if (person.socialLinks.website) sameAs.push(person.socialLinks.website);
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: person.name,
    url: person.username ? `${baseUrl}/profile/${person.username}` : undefined,
    image: person.avatar ? `${baseUrl}${person.avatar}` : undefined,
    jobTitle: person.title,
    description: person.bio,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
    worksFor: person.company ? {
      '@type': 'Organization',
      name: person.company,
    } : undefined,
  };
};

/**
 * Generate BreadcrumbList structured data
 */
export const generateBreadcrumbSchema = (items: { name: string; path: string }[]): BreadcrumbListSchema => {
  const baseUrl = import.meta.env.VITE_SITE_URL || 'https://neurmatic.com';

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${baseUrl}${item.path}`,
    })),
  };
};

/**
 * Generate WebSite schema with search
 */
export const generateWebSiteSchema = (): WebSiteSchema => {
  const baseUrl = import.meta.env.VITE_SITE_URL || 'https://neurmatic.com';

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Neurmatic',
    url: baseUrl,
    description: 'LLM Community Platform - News, Forums, and Jobs',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
};
