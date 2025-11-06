import React, { useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Newspaper,
  MessageCircle,
  Briefcase,
  User,
  TrendingUp,
  Eye,
  MessageSquare,
  MapPin,
  Award,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/common/Badge/Badge';
import { FeedbackButtons } from './FeedbackButtons';
import type {
  Recommendation,
  ArticleRecommendation,
  ForumTopicRecommendation,
  JobRecommendation,
  UserRecommendation,
  FeedbackType,
} from '../types';
import { cn } from '@/lib/utils';

interface RecommendationCardProps {
  recommendation: Recommendation;
  position: number;
  onFeedback: (feedback: FeedbackType) => void;
  onClick: () => void;
  isSubmitting?: boolean;
  showExplanation?: boolean;
}

const ArticleCard: React.FC<{
  rec: ArticleRecommendation;
  showExplanation: boolean;
  onClick: () => void;
}> = ({ rec, showExplanation, onClick }) => {
  const { article } = rec;

  return (
    <Link
      to={`/news/${article.slug}`}
      onClick={onClick}
      className="block hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
    >
      <div className="flex gap-4">
        {article.featuredImageUrl && (
          <img
            src={article.featuredImageUrl}
            alt={article.title}
            className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-1">
            <Newspaper className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-1" />
            <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2">
              {article.title}
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
            {article.excerpt}
          </p>
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
            <Badge variant="secondary" size="sm">
              {article.categoryName}
            </Badge>
            <span>{article.readingTime} min read</span>
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {article.viewCount}
            </span>
            <span>{formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}</span>
          </div>
          {showExplanation && rec.explanation && (
            <div className="mt-2">
              <Badge variant="outline" size="sm" className="text-xs">
                {rec.explanation}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

const ForumTopicCard: React.FC<{
  rec: ForumTopicRecommendation;
  showExplanation: boolean;
  onClick: () => void;
}> = ({ rec, showExplanation, onClick }) => {
  const { topic } = rec;

  return (
    <Link
      to={`/forum/${topic.categorySlug}/${topic.slug}`}
      onClick={onClick}
      className="block hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 mb-1">
          <MessageCircle className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-1" />
          <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2">{topic.title}</h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
          {topic.excerpt}
        </p>
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
          <Badge variant="secondary" size="sm">
            {topic.categoryName}
          </Badge>
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            {topic.replyCount}
          </span>
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {topic.voteCount}
          </span>
          <span>{formatDistanceToNow(new Date(topic.createdAt), { addSuffix: true })}</span>
        </div>
        {showExplanation && rec.explanation && (
          <div className="mt-2">
            <Badge variant="outline" size="sm" className="text-xs">
              {rec.explanation}
            </Badge>
          </div>
        )}
      </div>
    </Link>
  );
};

const JobCard: React.FC<{
  rec: JobRecommendation;
  showExplanation: boolean;
  onClick: () => void;
}> = ({ rec, showExplanation, onClick }) => {
  const { job } = rec;

  const salaryDisplay =
    job.salaryRange
      ? `${job.salaryRange.currency} ${(job.salaryRange.min / 1000).toFixed(0)}k - ${(
          job.salaryRange.max / 1000
        ).toFixed(0)}k`
      : null;

  return (
    <Link
      to={`/jobs/${job.slug}`}
      onClick={onClick}
      className="block hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
    >
      <div className="flex gap-4">
        {job.companyLogo && (
          <img
            src={job.companyLogo}
            alt={job.companyName}
            className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-1">
            <Briefcase className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-1" />
            <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">{job.title}</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{job.companyName}</p>
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {job.location}
            </span>
            <Badge variant="secondary" size="sm">
              {job.remoteType}
            </Badge>
            {salaryDisplay && <span>{salaryDisplay}</span>}
            {job.matchScore > 0 && (
              <Badge variant="success" size="sm">
                {job.matchScore}% match
              </Badge>
            )}
          </div>
          {showExplanation && rec.explanation && (
            <div className="mt-2">
              <Badge variant="outline" size="sm" className="text-xs">
                {rec.explanation}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

const UserCard: React.FC<{
  rec: UserRecommendation;
  showExplanation: boolean;
  onClick: () => void;
}> = ({ rec, showExplanation, onClick }) => {
  const { user } = rec;

  return (
    <Link
      to={`/u/${user.username}`}
      onClick={onClick}
      className="block hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
    >
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.displayName}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <User className="w-6 h-6 text-gray-400" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
            {user.displayName}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">@{user.username}</p>
          {user.bio && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">{user.bio}</p>
          )}
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
            <span className="flex items-center gap-1">
              <Award className="w-3 h-3" />
              {user.reputation} reputation
            </span>
            {user.commonInterests.length > 0 && (
              <span>{user.commonInterests.length} common interests</span>
            )}
          </div>
          {showExplanation && rec.explanation && (
            <div className="mt-2">
              <Badge variant="outline" size="sm" className="text-xs">
                {rec.explanation}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  position,
  onFeedback,
  onClick,
  isSubmitting = false,
  showExplanation = true,
}) => {
  const handleClick = useCallback(() => {
    onClick();
  }, [onClick]);

  return (
    <div className="p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      <div className="mb-2">
        {recommendation.type === 'article' && (
          <ArticleCard
            rec={recommendation as ArticleRecommendation}
            showExplanation={showExplanation}
            onClick={handleClick}
          />
        )}
        {recommendation.type === 'forum_topic' && (
          <ForumTopicCard
            rec={recommendation as ForumTopicRecommendation}
            showExplanation={showExplanation}
            onClick={handleClick}
          />
        )}
        {recommendation.type === 'job' && (
          <JobCard
            rec={recommendation as JobRecommendation}
            showExplanation={showExplanation}
            onClick={handleClick}
          />
        )}
        {recommendation.type === 'user' && (
          <UserCard
            rec={recommendation as UserRecommendation}
            showExplanation={showExplanation}
            onClick={handleClick}
          />
        )}
      </div>

      <div className="flex items-center justify-end mt-2">
        <FeedbackButtons
          itemType={recommendation.type}
          itemId={
            recommendation.type === 'article'
              ? (recommendation as ArticleRecommendation).article.id
              : recommendation.type === 'forum_topic'
              ? (recommendation as ForumTopicRecommendation).topic.id
              : recommendation.type === 'job'
              ? (recommendation as JobRecommendation).job.id
              : (recommendation as UserRecommendation).user.id
          }
          onFeedback={onFeedback}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
};
