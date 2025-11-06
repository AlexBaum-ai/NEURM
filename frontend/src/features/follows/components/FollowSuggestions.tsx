import React, { Suspense } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card/Card';
import { FollowButton } from './FollowButton';
import { useFollowSuggestions } from '../hooks/useFollows';
import type { FollowSuggestion, User, Company, Category, Tag, Model } from '../types';

const FollowSuggestionsContent: React.FC = () => {
  const { data } = useFollowSuggestions();

  if (!data || data.suggestions.length === 0) {
    return null;
  }

  const getEntityLink = (suggestion: FollowSuggestion) => {
    switch (suggestion.entityType) {
      case 'user':
        return `/profile/${(suggestion.entity as User).username}`;
      case 'company':
        return `/companies/${(suggestion.entity as Company).slug}`;
      case 'category':
        return `/news?category=${(suggestion.entity as Category).slug}`;
      case 'tag':
        return `/news?tag=${(suggestion.entity as Tag).slug}`;
      case 'model':
        return `/models/${(suggestion.entity as Model).slug}`;
      default:
        return '#';
    }
  };

  const getEntityName = (suggestion: FollowSuggestion) => {
    const entity = suggestion.entity;
    if ('displayName' in entity) return entity.displayName;
    if ('name' in entity) return entity.name;
    return '';
  };

  const getEntityAvatar = (suggestion: FollowSuggestion) => {
    const entity = suggestion.entity;
    if ('avatarUrl' in entity) return entity.avatarUrl;
    if ('logoUrl' in entity) return entity.logoUrl;
    return null;
  };

  const getEntityDescription = (suggestion: FollowSuggestion) => {
    const entity = suggestion.entity;
    if ('bio' in entity) return entity.bio;
    if ('description' in entity) return entity.description;
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
          </svg>
          Suggested to Follow
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.suggestions.slice(0, 5).map((suggestion, index) => {
            const entityName = getEntityName(suggestion);
            const entityAvatar = getEntityAvatar(suggestion);
            const entityDescription = getEntityDescription(suggestion);
            const entityLink = getEntityLink(suggestion);

            return (
              <div key={index} className="flex items-start gap-3">
                <Link to={entityLink} className="flex-shrink-0">
                  {entityAvatar ? (
                    <img
                      src={entityAvatar}
                      alt={entityName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                      <span className="text-primary-600 dark:text-primary-400 font-semibold">
                        {entityName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    to={entityLink}
                    className="font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 block truncate"
                  >
                    {entityName}
                  </Link>
                  {entityDescription && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-0.5">
                      {entityDescription}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {suggestion.reason}
                  </p>
                </div>
                <FollowButton
                  entityType={suggestion.entityType}
                  entityId={(suggestion.entity as any).id}
                  size="sm"
                  showCount={false}
                  className="flex-shrink-0"
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export const FollowSuggestions: React.FC = () => {
  return (
    <Suspense
      fallback={
        <Card>
          <CardHeader>
            <CardTitle>Suggested to Follow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-3 animate-pulse">
                  <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      }
    >
      <FollowSuggestionsContent />
    </Suspense>
  );
};

export default FollowSuggestions;
