import React, { useCallback } from 'react';
import { Sparkles } from 'lucide-react';
import { RecommendationCard } from './RecommendationCard';
import { useRecommendationsByType, useRecommendationFeedback, useRecommendationClick } from '../hooks/useRecommendations';
import type { FeedbackType, Recommendation, RecommendationType } from '../types';

interface RecommendationsSectionProps {
  type: RecommendationType;
  excludeIds?: string[];
  limit?: number;
  title: string;
  emptyMessage?: string;
  className?: string;
}

const RecommendationsSectionContent: React.FC<RecommendationsSectionProps> = ({
  type,
  excludeIds = [],
  limit = 6,
  title,
  emptyMessage = 'No recommendations available',
  className = '',
}) => {
  const { data } = useRecommendationsByType(type, limit, excludeIds);
  const feedbackMutation = useRecommendationFeedback();
  const clickMutation = useRecommendationClick();

  const handleFeedback = useCallback(
    (rec: Recommendation, feedback: FeedbackType) => {
      const itemId =
        rec.type === 'article'
          ? rec.article.id
          : rec.type === 'forum_topic'
          ? rec.topic.id
          : rec.type === 'job'
          ? rec.job.id
          : rec.user.id;

      feedbackMutation.mutate({
        itemType: rec.type,
        itemId,
        feedback,
      });
    },
    [feedbackMutation]
  );

  const handleClick = useCallback(
    (rec: Recommendation, position: number) => {
      const itemId =
        rec.type === 'article'
          ? rec.article.id
          : rec.type === 'forum_topic'
          ? rec.topic.id
          : rec.type === 'job'
          ? rec.job.id
          : rec.user.id;

      clickMutation.mutate({
        itemType: rec.type,
        itemId,
        position,
        relevanceScore: rec.relevanceScore,
      });
    },
    [clickMutation]
  );

  if (data.recommendations.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.recommendations.map((rec, index) => (
          <div
            key={rec.id}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <RecommendationCard
              recommendation={rec}
              position={index}
              onFeedback={(feedback) => handleFeedback(rec, feedback)}
              onClick={() => handleClick(rec, index)}
              isSubmitting={feedbackMutation.isPending}
              showExplanation={true}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export const RecommendationsSection: React.FC<RecommendationsSectionProps> = (props) => {
  return <RecommendationsSectionContent {...props} />;
};
