import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card/Card';
import { Award, FileText, MessageSquare, MessageCircle, TrendingUp } from 'lucide-react';
import type { Contributor } from '../../../types';

interface TopContributorsProps {
  contributors: Contributor[];
  limit?: number;
}

const TopContributors: React.FC<TopContributorsProps> = ({ contributors, limit = 10 }) => {
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getMedalColor = (index: number): string => {
    switch (index) {
      case 0:
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400';
      case 1:
        return 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
      case 2:
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400';
      default:
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
    }
  };

  const displayContributors = contributors.slice(0, limit);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Top Contributors</CardTitle>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Award className="h-4 w-4" />
            <span>By Reputation</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayContributors.map((contributor, index) => (
            <div
              key={contributor.id}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1">
                {/* Rank Badge */}
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${getMedalColor(
                    index
                  )}`}
                >
                  {index < 3 ? (
                    <Award className="h-5 w-5" />
                  ) : (
                    <span className="text-sm">#{index + 1}</span>
                  )}
                </div>

                {/* Avatar & Name */}
                <div className="flex items-center gap-3 flex-1">
                  {contributor.avatarUrl ? (
                    <img
                      src={contributor.avatarUrl}
                      alt={contributor.displayName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-semibold">
                      {contributor.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {contributor.displayName}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      @{contributor.username}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 mr-4">
                <div className="text-center">
                  <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                    <Award className="h-4 w-4" />
                    <span className="font-semibold">{formatNumber(contributor.reputation)}</span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Rep</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                    <FileText className="h-4 w-4" />
                    <span className="font-semibold">{contributor.articleCount}</span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Articles</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <MessageSquare className="h-4 w-4" />
                    <span className="font-semibold">{contributor.topicCount}</span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Topics</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                    <MessageCircle className="h-4 w-4" />
                    <span className="font-semibold">{contributor.replyCount}</span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Replies</div>
                </div>
              </div>

              {/* Total Contributions */}
              <div className="text-right">
                <div className="flex items-center gap-1 text-primary-600 dark:text-primary-400">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-lg font-bold">
                    {formatNumber(contributor.totalContributions)}
                  </span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {contributors.length}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Contributors</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {formatNumber(
                  contributors.reduce((sum, c) => sum + c.articleCount, 0)
                )}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Articles</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatNumber(
                  contributors.reduce((sum, c) => sum + c.topicCount, 0)
                )}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Topics</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {formatNumber(
                  contributors.reduce((sum, c) => sum + c.reputation, 0)
                )}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Rep</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TopContributors;
