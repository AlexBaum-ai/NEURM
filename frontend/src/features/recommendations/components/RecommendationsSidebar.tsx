import React, { useCallback, useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { Card } from '@/components/common/Card/Card';
import { RecommendationCard } from './RecommendationCard';
import { useRecommendationsByType, useRecommendationFeedback, useRecommendationClick } from '../hooks/useRecommendations';
import type { FeedbackType, Recommendation, RecommendationType } from '../types';

interface RecommendationsSidebarProps {
  type: RecommendationType;
  excludeIds?: string[];
  limit?: number;
  title: string;
  emptyMessage?: string;
  className?: string;
}

const RecommendationsSidebarContent: React.FC<RecommendationsSidebarProps> = ({
  type,
  excludeIds = [],
  limit = 5,
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
    <Card className={className}>
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          <h3 className="text-base font-bold text-gray-900 dark:text-white">{title}</h3>
        </div>
      </div>

      <div>
        {data.recommendations.map((rec, index) => (
          <RecommendationCard
            key={rec.id}
            recommendation={rec}
            position={index}
            onFeedback={(feedback) => handleFeedback(rec, feedback)}
            onClick={() => handleClick(rec, index)}
            isSubmitting={feedbackMutation.isPending}
            showExplanation={true}
          />
        ))}
      </div>
    </Card>
  );
};

export const RecommendationsSidebar: React.FC<RecommendationsSidebarProps> = (props) => {
  return <RecommendationsSidebarContent {...props} />;
};
