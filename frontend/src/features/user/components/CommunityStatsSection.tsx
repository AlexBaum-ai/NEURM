import React from 'react';
import {
  MessageSquare,
  ThumbsUp,
  CheckCircle,
  Award,
  BookOpen,
  FileText,
  TrendingUp,
} from 'lucide-react';
import type { UserProfile, Badge } from '../types';

interface CommunityStatsSectionProps {
  profile: UserProfile;
}

/**
 * CommunityStatsSection - Display candidate's community contributions
 *
 * Shows:
 * - Forum reputation and activity
 * - Top answers and helpful answers count
 * - Badges earned
 * - Content contributions (tutorials, articles)
 * - Engagement metrics
 */
export const CommunityStatsSection: React.FC<CommunityStatsSectionProps> = ({ profile }) => {
  const { communityStats } = profile;

  // Don't render if no community stats data
  if (!communityStats) {
    return null;
  }

  const statCards = [
    {
      icon: <Award className="w-5 h-5" />,
      label: 'Forum Reputation',
      value: communityStats.forumReputation,
      color: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    },
    {
      icon: <CheckCircle className="w-5 h-5" />,
      label: 'Best Answers',
      value: communityStats.bestAnswersCount,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      icon: <ThumbsUp className="w-5 h-5" />,
      label: 'Helpful Answers',
      value: communityStats.helpfulAnswersCount,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      label: 'Questions Asked',
      value: communityStats.questionsAskedCount,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-100 dark:bg-purple-900/30',
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      label: 'Answers Given',
      value: communityStats.answersGivenCount,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-100 dark:bg-indigo-900/30',
    },
    {
      icon: <BookOpen className="w-5 h-5" />,
      label: 'Tutorials Published',
      value: communityStats.tutorialsPublished,
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-100 dark:bg-orange-900/30',
    },
    {
      icon: <FileText className="w-5 h-5" />,
      label: 'Articles Published',
      value: communityStats.articlesPublished,
      color: 'text-pink-600 dark:text-pink-400',
      bg: 'bg-pink-100 dark:bg-pink-900/30',
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      label: 'Upvotes Received',
      value: communityStats.upvotesReceived,
      color: 'text-teal-600 dark:text-teal-400',
      bg: 'bg-teal-100 dark:bg-teal-900/30',
    },
  ];

  const renderBadge = (badge: Badge) => (
    <div
      key={badge.id}
      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      title={badge.description}
    >
      {badge.iconUrl ? (
        <img
          src={badge.iconUrl}
          alt={badge.name}
          className="w-10 h-10"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
          <Award className="w-6 h-6 text-white" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 dark:text-white truncate">{badge.name}</div>
        <div className="text-xs text-gray-600 dark:text-gray-400 truncate">{badge.category}</div>
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-500">
        {new Date(badge.earnedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-2 mb-6">
        <Award className="w-6 h-6 text-primary-600 dark:text-primary-400" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Community Contributions</h2>
      </div>

      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div className={`mb-2 ${stat.bg} p-2 rounded-lg ${stat.color}`}>
                {stat.icon}
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
              <div className="text-xs text-center text-gray-600 dark:text-gray-400 mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Badges Section */}
        {communityStats.badges && communityStats.badges.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Badges ({communityStats.badges.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {communityStats.badges.slice(0, 6).map(renderBadge)}
            </div>
            {communityStats.badges.length > 6 && (
              <button
                type="button"
                className="mt-3 text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                View all {communityStats.badges.length} badges
              </button>
            )}
          </div>
        )}

        {/* Top Contributor Badge (if applicable) */}
        {communityStats.topAnswersCount > 10 && (
          <div className="flex items-center gap-2 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <Award className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            <div>
              <div className="font-medium text-gray-900 dark:text-white">Top Contributor</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Recognized for exceptional community contributions
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityStatsSection;
