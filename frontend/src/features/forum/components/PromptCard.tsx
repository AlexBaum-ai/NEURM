import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ThumbsUp, GitFork, Eye, User } from 'lucide-react';
import { Card } from '@/components/common/Card/Card';
import type { Prompt } from '../types/prompt';
import { PROMPT_CATEGORIES, PROMPT_USE_CASES } from '../types/prompt';

interface PromptCardProps {
  prompt: Prompt;
}

const PromptCard: React.FC<PromptCardProps> = ({ prompt }) => {
  const getCategoryLabel = (value: string) => {
    return PROMPT_CATEGORIES.find((cat) => cat.value === value)?.label || value;
  };

  const getUseCaseLabel = (value: string) => {
    return PROMPT_USE_CASES.find((uc) => uc.value === value)?.label || value;
  };

  const excerpt =
    prompt.content.length > 150
      ? prompt.content.substring(0, 150) + '...'
      : prompt.content;

  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
      <Link to={`/forum/prompts/${prompt.id}`} className="flex-1 p-4 sm:p-6 block">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2 flex-1 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
            {prompt.title}
          </h3>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
            {getCategoryLabel(prompt.category)}
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {getUseCaseLabel(prompt.useCase)}
          </span>
          {prompt.model && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
              {prompt.model}
            </span>
          )}
        </div>

        {/* Excerpt */}
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
          {excerpt}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
          {/* Rating */}
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="font-medium">{prompt.ratingAvg.toFixed(1)}</span>
            <span className="text-xs">({prompt.ratingCount})</span>
          </div>

          {/* Votes */}
          <div className="flex items-center gap-1">
            <ThumbsUp className="w-4 h-4" />
            <span>{prompt.voteScore}</span>
          </div>

          {/* Forks */}
          {prompt.forkCount > 0 && (
            <div className="flex items-center gap-1">
              <GitFork className="w-4 h-4" />
              <span>{prompt.forkCount}</span>
            </div>
          )}

          {/* Views */}
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            <span>{prompt.viewCount}</span>
          </div>
        </div>

        {/* Author */}
        <div className="flex items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
          {prompt.author.avatar ? (
            <img
              src={prompt.author.avatar}
              alt={prompt.author.displayName}
              className="w-6 h-6 rounded-full"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
              <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </div>
          )}
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {prompt.author.displayName}
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {new Date(prompt.createdAt).toLocaleDateString()}
          </span>
        </div>
      </Link>
    </Card>
  );
};

export default PromptCard;
