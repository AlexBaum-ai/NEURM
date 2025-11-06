import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card/Card';
import { FileText, MessageSquare, Briefcase, Eye, MessageCircle, Users, TrendingUp } from 'lucide-react';
import type { ContentPerformanceMetrics } from '../../../types';

interface ContentPerformanceProps {
  content: ContentPerformanceMetrics;
}

type ContentTab = 'articles' | 'forum' | 'jobs';

const ContentPerformance: React.FC<ContentPerformanceProps> = ({ content }) => {
  const [activeTab, setActiveTab] = useState<ContentTab>('articles');

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const tabs = [
    { id: 'articles' as ContentTab, label: 'Articles', icon: FileText },
    { id: 'forum' as ContentTab, label: 'Forum', icon: MessageSquare },
    { id: 'jobs' as ContentTab, label: 'Jobs', icon: Briefcase },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Content Performance</CardTitle>
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-1 text-sm rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {activeTab === 'articles' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatNumber(content.articles.totalViews)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Views</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatNumber(content.articles.avgViewsPerArticle)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Avg Views/Article</div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {content.articles.mostViewed.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Top Articles</div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Most Viewed Articles
              </h4>
              {content.articles.mostViewed.slice(0, 10).map((article, index) => (
                <div
                  key={article.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center justify-center w-8 h-8 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white truncate">
                        {article.title}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        by {article.author} • {formatDate(article.publishedAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                    <Eye className="h-4 w-4" />
                    <span className="text-sm font-semibold">{formatNumber(article.viewCount)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'forum' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatNumber(content.forum.totalTopics)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Topics</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatNumber(content.forum.totalReplies)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Replies</div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {content.forum.avgRepliesPerTopic.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Avg Replies/Topic</div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Top Forum Topics
              </h4>
              {content.forum.topTopics.slice(0, 10).map((topic, index) => (
                <div
                  key={topic.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center justify-center w-8 h-8 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white truncate">
                        {topic.title}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        by {topic.author} • {formatDate(topic.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <MessageCircle className="h-4 w-4" />
                      <span className="text-sm">{formatNumber(topic.replyCount)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <Eye className="h-4 w-4" />
                      <span className="text-sm">{formatNumber(topic.viewCount)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-sm">{formatNumber(topic.voteCount)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'jobs' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatNumber(content.jobs.totalJobs)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Jobs</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatNumber(content.jobs.totalApplications)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Applications</div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {content.jobs.avgApplicationsPerJob.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Avg Applications/Job</div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Trending Jobs
              </h4>
              {content.jobs.trendingJobs.slice(0, 10).map((job, index) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center justify-center w-8 h-8 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white truncate">
                        {job.title}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {job.company} • Posted {formatDate(job.postedAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <Users className="h-4 w-4" />
                      <span className="text-sm font-semibold">{formatNumber(job.applicationCount)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <Eye className="h-4 w-4" />
                      <span className="text-sm">{formatNumber(job.viewCount)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ContentPerformance;
