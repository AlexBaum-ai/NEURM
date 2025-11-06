import React, { Suspense, useState, useCallback, useMemo } from 'react';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/common/Button/Button';
import { RecommendationCard } from '@/features/recommendations/components/RecommendationCard';
import { useRecommendations, useRecommendationFeedback, useRecommendationClick } from '@/features/recommendations/hooks';
import type { FeedbackType, Recommendation } from '@/features/recommendations/types';

const RecommendationsWidgetContent: React.FC = () => {
  const { data } = useRecommendations({
    limit: 10,
    includeExplanations: true,
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
      <div className="flex flex-col items-center justify-center h-full py-8 text-center">
        <Sparkles className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Start exploring content to get personalized recommendations
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {displayedRecommendations.map((rec, index) => (
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

      {activeRecommendations.length > 5 && (
        <div className="pt-2">
          <Button
            variant="ghost"
            size="sm"
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
    </div>
  );
};

const RecommendationsWidgetSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse flex-shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="flex gap-2">
              <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const DashboardRecommendationsWidget: React.FC = () => {
  return (
    <Suspense fallback={<RecommendationsWidgetSkeleton />}>
      <RecommendationsWidgetContent />
    </Suspense>
  );
};
