/**
 * Search Result Card Component
 *
 * Displays individual search results with highlighted matched terms
 */

import * as React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/common/Badge/Badge';
import type {
  SearchResult,
  ArticleSearchResult,
  ForumTopicSearchResult,
  ForumReplySearchResult,
  JobSearchResult,
  UserSearchResult,
  CompanySearchResult,
} from '../types/search.types';

interface SearchResultCardProps {
  result: SearchResult;
  query: string;
}

const highlightText = (text: string, query: string): React.ReactNode => {
  if (!query.trim()) return text;

  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return parts.map((part, index) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={index} className="bg-yellow-200 dark:bg-yellow-900 text-gray-900 dark:text-gray-100">
        {part}
      </mark>
    ) : (
      part
    )
  );
};

const ArticleResult: React.FC<{ result: ArticleSearchResult; query: string }> = ({ result, query }) => (
  <div className="flex gap-4">
    {result.thumbnailUrl && (
      <img
        src={result.thumbnailUrl}
        alt=""
        className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
      />
    )}
    <div className="flex-1 min-w-0">
      <div className="flex items-start gap-2 mb-1">
        <Badge variant="primary" size="sm">Article</Badge>
        <Badge variant="outline" size="sm">{result.category}</Badge>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1 line-clamp-2">
        {highlightText(result.title, query)}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
        {highlightText(result.excerpt, query)}
      </p>
      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
        <span className="flex items-center gap-1">
          {result.authorAvatar && (
            <img src={result.authorAvatar} alt="" className="w-4 h-4 rounded-full" />
          )}
          {result.author}
        </span>
        <span>•</span>
        <span>{new Date(result.date).toLocaleDateString()}</span>
        <span>•</span>
        <span>{result.viewCount} views</span>
      </div>
    </div>
  </div>
);

const ForumTopicResult: React.FC<{ result: ForumTopicSearchResult; query: string }> = ({ result, query }) => (
  <div className="flex-1 min-w-0">
    <div className="flex items-start gap-2 mb-1">
      <Badge variant="secondary" size="sm">Forum Topic</Badge>
      <Badge variant="outline" size="sm">{result.category}</Badge>
      {result.isSolved && <Badge variant="success" size="sm">Solved</Badge>}
    </div>
    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1 line-clamp-2">
      {highlightText(result.title, query)}
    </h3>
    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
      {highlightText(result.excerpt, query)}
    </p>
    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
      <span className="flex items-center gap-1">
        {result.authorAvatar && (
          <img src={result.authorAvatar} alt="" className="w-4 h-4 rounded-full" />
        )}
        {result.author}
      </span>
      <span>•</span>
      <span>{result.replyCount} replies</span>
      <span>•</span>
      <span>{new Date(result.lastActivityDate).toLocaleDateString()}</span>
    </div>
  </div>
);

const ForumReplyResult: React.FC<{ result: ForumReplySearchResult; query: string }> = ({ result, query }) => (
  <div className="flex-1 min-w-0">
    <div className="flex items-start gap-2 mb-1">
      <Badge variant="secondary" size="sm">Forum Reply</Badge>
      {result.isAccepted && <Badge variant="success" size="sm">Accepted</Badge>}
    </div>
    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
      Reply in: <Link to={result.topicUrl} className="text-primary-600 dark:text-primary-400 hover:underline">{result.topicTitle}</Link>
    </p>
    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-3">
      {highlightText(result.excerpt, query)}
    </p>
    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
      <span className="flex items-center gap-1">
        {result.authorAvatar && (
          <img src={result.authorAvatar} alt="" className="w-4 h-4 rounded-full" />
        )}
        {result.author}
      </span>
      <span>•</span>
      <span>{new Date(result.date).toLocaleDateString()}</span>
    </div>
  </div>
);

const JobResult: React.FC<{ result: JobSearchResult; query: string }> = ({ result, query }) => (
  <div className="flex gap-4">
    {result.companyLogo && (
      <img
        src={result.companyLogo}
        alt={result.company}
        className="w-16 h-16 object-contain rounded-lg flex-shrink-0"
      />
    )}
    <div className="flex-1 min-w-0">
      <div className="flex items-start gap-2 mb-1">
        <Badge variant="accent" size="sm">Job</Badge>
        <Badge variant="outline" size="sm">{result.employmentType}</Badge>
        {result.isRemote && <Badge variant="success" size="sm">Remote</Badge>}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1 line-clamp-2">
        {highlightText(result.title, query)}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
        {result.company}
      </p>
      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
        <span>{result.location}</span>
        {result.salaryRange && (
          <>
            <span>•</span>
            <span>{result.salaryRange}</span>
          </>
        )}
        <span>•</span>
        <span>{new Date(result.date).toLocaleDateString()}</span>
      </div>
    </div>
  </div>
);

const UserResult: React.FC<{ result: UserSearchResult; query: string }> = ({ result, query }) => (
  <div className="flex gap-4">
    <img
      src={result.avatar || '/default-avatar.png'}
      alt={result.username}
      className="w-16 h-16 rounded-full object-cover flex-shrink-0"
    />
    <div className="flex-1 min-w-0">
      <div className="flex items-start gap-2 mb-1">
        <Badge variant="outline" size="sm">User</Badge>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
        {highlightText(result.username, query)}
      </h3>
      {result.bio && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
          {highlightText(result.bio, query)}
        </p>
      )}
      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
        <span>{result.reputation} reputation</span>
        <span>•</span>
        <span>{result.followers} followers</span>
      </div>
    </div>
  </div>
);

const CompanyResult: React.FC<{ result: CompanySearchResult; query: string }> = ({ result, query }) => (
  <div className="flex gap-4">
    {result.logo && (
      <img
        src={result.logo}
        alt={result.title}
        className="w-16 h-16 object-contain rounded-lg flex-shrink-0"
      />
    )}
    <div className="flex-1 min-w-0">
      <div className="flex items-start gap-2 mb-1">
        <Badge variant="outline" size="sm">Company</Badge>
        {result.industry && <Badge variant="outline" size="sm">{result.industry}</Badge>}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1 line-clamp-2">
        {highlightText(result.title, query)}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
        {highlightText(result.excerpt, query)}
      </p>
      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
        {result.location && <span>{result.location}</span>}
        {result.employeeCount && (
          <>
            <span>•</span>
            <span>{result.employeeCount} employees</span>
          </>
        )}
        <span>•</span>
        <span>{result.jobCount} open positions</span>
      </div>
    </div>
  </div>
);

export const SearchResultCard: React.FC<SearchResultCardProps> = ({ result, query }) => {
  const renderResult = () => {
    switch (result.type) {
      case 'articles':
        return <ArticleResult result={result as ArticleSearchResult} query={query} />;
      case 'forum_topics':
        return <ForumTopicResult result={result as ForumTopicSearchResult} query={query} />;
      case 'forum_replies':
        return <ForumReplyResult result={result as ForumReplySearchResult} query={query} />;
      case 'jobs':
        return <JobResult result={result as JobSearchResult} query={query} />;
      case 'users':
        return <UserResult result={result as UserSearchResult} query={query} />;
      case 'companies':
        return <CompanyResult result={result as CompanySearchResult} query={query} />;
      default:
        return null;
    }
  };

  return (
    <Link
      to={result.url}
      className={cn(
        'block p-4 rounded-lg border border-gray-200 dark:border-gray-800',
        'hover:border-primary-300 dark:hover:border-primary-700',
        'hover:shadow-md dark:hover:shadow-gray-900',
        'transition-all duration-200'
      )}
    >
      {renderResult()}
    </Link>
  );
};
