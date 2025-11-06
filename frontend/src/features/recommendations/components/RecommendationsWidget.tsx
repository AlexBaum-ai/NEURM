import React, { useState, useCallback, useMemo } from 'react';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '@/components/common/Card/Card';
import { Button } from '@/components/common/Button/Button';
import { RecommendationCard } from './RecommendationCard';
import { useRecommendations, useRecommendationFeedback, useRecommendationClick } from '../hooks/useRecommendations';
import type { FeedbackType, Recommendation, RecommendationType } from '../types';

interface RecommendationsWidgetProps {
  types?: RecommendationType[];
  limit?: number;
  title?: string;
  showExplanation?: boolean;
  className?: string;
}

const RecommendationsWidgetContent: React.FC<RecommendationsWidgetProps> = ({
  types,
  limit = 10,
  title = 'Recommended for You',
  showExplanation = true,
  className = '',
}) => {
  const { data } = useRecommendations({
    types,
    limit,
    includeExplanations: showExplanation,
  });

  const feedbackMutation = useRecommendationFeedback();
  const clickMutation = useRecommendationClick();

  const [isExpanded, setIsExpanded] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Filter out dismissed recommendations
  const activeRecommendations = useMemo(() => {
    return data.recommendations.filter((rec) => {
      const itemId =
        rec.type === 'article'
          ? rec.article.id
          : rec.type === 'forum_topic'
          ? rec.topic.id
          : rec.type === 'job'
          ? rec.job.id
          : rec.user.id;
      return !dismissedIds.has(itemId);
    });
  }, [data.recommendations, dismissedIds]);

  // Show 5 initially, expand to show all
  const displayedRecommendations = isExpanded
    ? activeRecommendations
    : activeRecommendations.slice(0, 5);

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

      // If dismissed, hide immediately
      if (feedback === 'dismiss' || feedback === 'not_interested') {
        setDismissedIds((prev) => new Set(prev).add(itemId));
      }

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

  if (activeRecommendations.length === 0) {
    return (
      <Card className={className}>
        <div className="p-8 text-center">
          <Sparkles className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No recommendations yet
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Start exploring content to get personalized recommendations
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Personalized content based on your interests
        </p>
      </div>

      <div>
        {displayedRecommendations.map((rec, index) => (
          <RecommendationCard
            key={rec.id}
            recommendation={rec}
            position={index}
            onFeedback={(feedback) => handleFeedback(rec, feedback)}
            onClick={() => handleClick(rec, index)}
            isSubmitting={feedbackMutation.isPending}
            showExplanation={showExplanation}
          />
        ))}
      </div>

      {activeRecommendations.length > 5 && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                Show Less
                <ChevronUp className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>
                Show {activeRecommendations.length - 5} More
                <ChevronDown className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      )}
    </Card>
  );
};

export const RecommendationsWidget: React.FC<RecommendationsWidgetProps> = (props) => {
  return <RecommendationsWidgetContent {...props} />;
};
