/**
 * SEO Usage Examples
 *
 * This file demonstrates how to implement SEO on different page types
 * Copy these patterns when creating new pages
 */

import { SEO, StructuredData } from '@/components/common/SEO';
import { useSEO } from '@/hooks/useSEO';
import {
  generateArticleSchema,
  generateJobPostingSchema,
  generatePersonSchema,
  generateBreadcrumbSchema,
  generateOrganizationSchema,
  generateWebSiteSchema,
} from '@/utils/structuredData';
import { extractExcerpt } from '@/utils/seo';

// ============================================
// Example 1: Simple Static Page
// ============================================
export const SimplePageExample = () => {
  return (
    <>
      <SEO
        title="About Us"
        description="Learn about Neurmatic - the leading LLM community platform"
        type="website"
        image="/images/about-og.jpg"
      />

      <div>
        <h1>About Us</h1>
        {/* Page content */}
      </div>
    </>
  );
};

// ============================================
// Example 2: News Article Page
// ============================================
export const ArticlePageExample = () => {
  // Fetch article data
  const article = {
    id: 1,
    title: 'GPT-5 Released with Groundbreaking Features',
    slug: 'gpt-5-released',
    summary: 'OpenAI announces GPT-5 with revolutionary capabilities...',
    content: '<p>Full article content here...</p>',
    featuredImageUrl: '/images/articles/gpt-5.jpg',
    publishedAt: '2025-01-01T12:00:00Z',
    updatedAt: '2025-01-02T10:00:00Z',
    author: {
      name: 'John Doe',
      username: 'johndoe',
    },
    category: {
      name: 'AI Models',
      slug: 'ai-models',
    },
    tags: [
      { name: 'GPT-5' },
      { name: 'OpenAI' },
      { name: 'Language Models' },
    ],
  };

  // Generate structured data
  const articleSchema = generateArticleSchema({
    title: article.title,
    description: article.summary,
    content: article.content,
    featuredImage: article.featuredImageUrl,
    publishedAt: article.publishedAt,
    updatedAt: article.updatedAt,
    author: {
      name: article.author.name,
      username: article.author.username,
    },
    slug: article.slug,
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'News', path: '/news' },
    { name: article.category.name, path: `/news?category=${article.category.slug}` },
    { name: article.title, path: `/news/${article.slug}` },
  ]);

  const keywords = article.tags.map(tag => tag.name);

  return (
    <>
      <SEO
        title={article.title}
        description={article.summary || extractExcerpt(article.content, 160)}
        type="article"
        image={article.featuredImageUrl}
        url={`/news/${article.slug}`}
        keywords={keywords}
        author={article.author.username}
        publishedTime={article.publishedAt}
        modifiedTime={article.updatedAt}
        section={article.category.name}
        tags={keywords}
      />
      <StructuredData data={[articleSchema, breadcrumbSchema]} />

      <article>
        <h1>{article.title}</h1>
        {/* Article content */}
      </article>
    </>
  );
};

// ============================================
// Example 3: Job Listing Page
// ============================================
export const JobPageExample = () => {
  const job = {
    id: 1,
    title: 'Senior ML Engineer',
    slug: 'senior-ml-engineer-openai',
    description: 'Join our team working on cutting-edge language models...',
    postedAt: '2025-01-01T00:00:00Z',
    validUntil: '2025-03-01T00:00:00Z',
    employmentType: ['FULL_TIME'],
    company: {
      name: 'OpenAI',
      website: 'https://openai.com',
      logo: '/images/companies/openai.png',
    },
    location: {
      type: 'hybrid' as const,
      city: 'San Francisco',
      state: 'CA',
      country: 'USA',
    },
    salary: {
      currency: 'USD',
      min: 150000,
      max: 250000,
      period: 'YEAR' as const,
    },
  };

  const jobSchema = generateJobPostingSchema(job);

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Jobs', path: '/jobs' },
    { name: job.company.name, path: `/companies/${job.company.name.toLowerCase()}` },
    { name: job.title, path: `/jobs/${job.slug}` },
  ]);

  return (
    <>
      <SEO
        title={`${job.title} at ${job.company.name}`}
        description={extractExcerpt(job.description, 160)}
        type="website"
        image={job.company.logo}
        url={`/jobs/${job.slug}`}
        keywords={[job.title, job.company.name, job.location.city, 'LLM job']}
      />
      <StructuredData data={[jobSchema, breadcrumbSchema]} />

      <div>
        <h1>{job.title}</h1>
        <h2>{job.company.name}</h2>
        {/* Job details */}
      </div>
    </>
  );
};

// ============================================
// Example 4: User Profile Page
// ============================================
export const ProfilePageExample = () => {
  const user = {
    id: 1,
    name: 'Jane Smith',
    username: 'janesmith',
    avatar: '/images/avatars/jane.jpg',
    bio: 'ML Engineer passionate about LLMs and AI safety',
    title: 'Senior ML Engineer',
    company: 'OpenAI',
    socialLinks: {
      github: 'https://github.com/janesmith',
      linkedin: 'https://linkedin.com/in/janesmith',
      twitter: 'https://twitter.com/janesmith',
      website: 'https://janesmith.dev',
    },
  };

  const personSchema = generatePersonSchema(user);

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Community', path: '/community' },
    { name: user.name, path: `/profile/${user.username}` },
  ]);

  return (
    <>
      <SEO
        title={`${user.name} - ${user.title}`}
        description={user.bio || `View ${user.name}'s profile on Neurmatic`}
        type="profile"
        image={user.avatar}
        url={`/profile/${user.username}`}
        author={user.username}
      />
      <StructuredData data={[personSchema, breadcrumbSchema]} />

      <div>
        <img src={user.avatar} alt={user.name} />
        <h1>{user.name}</h1>
        <p>{user.title}</p>
        {/* Profile content */}
      </div>
    </>
  );
};

// ============================================
// Example 5: Forum Topic Page
// ============================================
export const ForumTopicExample = () => {
  const topic = {
    id: 1,
    title: 'How to fine-tune GPT-4 for specific domains?',
    slug: 'fine-tune-gpt-4-domains',
    content: '<p>I\'m trying to fine-tune GPT-4 for legal documents...</p>',
    createdAt: '2025-01-01T10:00:00Z',
    author: {
      name: 'Mike Johnson',
      username: 'mikej',
    },
    category: {
      name: 'Q&A',
      slug: 'qa',
    },
    tags: [
      { name: 'GPT-4' },
      { name: 'Fine-tuning' },
      { name: 'Training' },
    ],
    replyCount: 15,
    viewCount: 342,
  };

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Forum', path: '/forum' },
    { name: topic.category.name, path: `/forum/c/${topic.category.slug}` },
    { name: topic.title, path: `/forum/t/${topic.slug}/${topic.id}` },
  ]);

  const excerpt = extractExcerpt(topic.content, 160);
  const keywords = topic.tags.map(tag => tag.name);

  return (
    <>
      <SEO
        title={topic.title}
        description={excerpt}
        type="article"
        url={`/forum/t/${topic.slug}/${topic.id}`}
        keywords={keywords}
        author={topic.author.username}
        publishedTime={topic.createdAt}
        section={topic.category.name}
        tags={keywords}
      />
      <StructuredData data={breadcrumbSchema} />

      <div>
        <h1>{topic.title}</h1>
        <div>
          <span>{topic.replyCount} replies</span>
          <span>{topic.viewCount} views</span>
        </div>
        {/* Topic content */}
      </div>
    </>
  );
};

// ============================================
// Example 6: Homepage with Organization Schema
// ============================================
export const HomepageExample = () => {
  const organizationSchema = generateOrganizationSchema();
  const websiteSchema = generateWebSiteSchema();

  return (
    <>
      <SEO
        title="Neurmatic - LLM Community Platform"
        description="Join the leading community for Large Language Model enthusiasts. Stay updated with news, discussions, and job opportunities."
        type="website"
        image="/images/og-home.jpg"
        url="/"
        keywords={['LLM', 'AI', 'machine learning', 'community', 'forum', 'jobs']}
      />
      <StructuredData data={[organizationSchema, websiteSchema]} />

      <div>
        <h1>Welcome to Neurmatic</h1>
        {/* Homepage content */}
      </div>
    </>
  );
};

// ============================================
// Example 7: Model Comparison Page
// ============================================
export const ModelComparisonExample = () => {
  const { canonicalUrl } = useSEO();

  const models = [
    { name: 'GPT-4', slug: 'gpt-4' },
    { name: 'Claude 3', slug: 'claude-3' },
    { name: 'Gemini Pro', slug: 'gemini-pro' },
  ];

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Models', path: '/models' },
    { name: 'Compare', path: '/models/compare' },
  ]);

  const modelNames = models.map(m => m.name).join(' vs ');

  return (
    <>
      <SEO
        title={`${modelNames} Comparison`}
        description={`Compare ${modelNames} side by side. See pricing, performance, and features.`}
        type="website"
        canonical={canonicalUrl}
        keywords={['LLM comparison', ...models.map(m => m.name)]}
      />
      <StructuredData data={breadcrumbSchema} />

      <div>
        <h1>Model Comparison</h1>
        {/* Comparison table */}
      </div>
    </>
  );
};

// ============================================
// Example 8: Page with No Indexing (Admin/Settings)
// ============================================
export const AdminPageExample = () => {
  return (
    <>
      <SEO
        title="Admin Dashboard"
        description="Administrative dashboard - private page"
        noindex={true}
        nofollow={true}
      />

      <div>
        <h1>Admin Dashboard</h1>
        {/* Admin content - not indexed by search engines */}
      </div>
    </>
  );
};

// ============================================
// Example 9: Search Results Page
// ============================================
export const SearchResultsExample = () => {
  const searchQuery = 'GPT-4 fine-tuning';

  return (
    <>
      <SEO
        title={`Search Results for "${searchQuery}"`}
        description={`Search results for ${searchQuery} on Neurmatic`}
        noindex={true} // Prevent duplicate content issues
      />

      <div>
        <h1>Search Results</h1>
        <p>Results for: {searchQuery}</p>
        {/* Search results */}
      </div>
    </>
  );
};

// ============================================
// Example 10: Paginated List Page
// ============================================
export const PaginatedListExample = () => {
  const currentPage = 2;

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'News', path: '/news' },
    { name: `Page ${currentPage}`, path: `/news?page=${currentPage}` },
  ]);

  return (
    <>
      <SEO
        title={`Latest News - Page ${currentPage}`}
        description="Browse the latest LLM news and updates from the community"
        canonical={`/news?page=${currentPage}`}
        noindex={currentPage > 1} // Only index first page to avoid duplicate content
      />
      <StructuredData data={breadcrumbSchema} />

      <div>
        <h1>Latest News</h1>
        {/* Article list */}
        {/* Pagination */}
      </div>
    </>
  );
};

export default {
  SimplePageExample,
  ArticlePageExample,
  JobPageExample,
  ProfilePageExample,
  ForumTopicExample,
  HomepageExample,
  ModelComparisonExample,
  AdminPageExample,
  SearchResultsExample,
  PaginatedListExample,
};
