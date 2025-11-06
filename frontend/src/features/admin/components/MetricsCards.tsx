import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card/Card';
import {
  Users,
  TrendingUp,
  DollarSign,
  Activity,
  UserCheck,
  Calendar,
  Star,
} from 'lucide-react';
import type { DashboardMetrics } from '../types';

interface MetricsCardsProps {
  metrics: DashboardMetrics['keyMetrics'];
  quickStats: DashboardMetrics['quickStats'];
  realTimeStats: DashboardMetrics['realTimeStats'];
}

const MetricsCards: React.FC<MetricsCardsProps> = ({
  metrics,
  quickStats,
  realTimeStats,
}) => {
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatCurrency = (num: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(num);
  };

  const formatPercentage = (num: number): string => {
    return `${(num * 100).toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Real-time Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Users Online
            </CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatNumber(realTimeStats.usersOnline)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Real-time</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Posts per Hour
            </CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {realTimeStats.postsPerHour}
            </div>
            <p className="text-xs text-gray-500 mt-1">Current rate</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Applications Today
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {realTimeStats.applicationsToday}
            </div>
            <p className="text-xs text-gray-500 mt-1">Last 24 hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              DAU (Daily Active Users)
            </CardTitle>
            <UserCheck className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatNumber(metrics.dau)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Active today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              MAU (Monthly Active)
            </CardTitle>
            <Calendar className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatNumber(metrics.mau)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              MRR (Monthly Revenue)
            </CardTitle>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(metrics.mrr)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Recurring revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Retention Rate
            </CardTitle>
            <Star className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatPercentage(metrics.retentionRate)}
            </div>
            <p className="text-xs text-gray-500 mt-1">User retention</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {formatNumber(quickStats.totalUsers)}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Total Users
            </p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {formatNumber(quickStats.totalArticles)}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Articles
            </p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {formatNumber(quickStats.totalTopics)}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Forum Topics
            </p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              {formatNumber(quickStats.totalJobs)}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Job Listings
            </p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-pink-600 dark:text-pink-400">
              {formatNumber(quickStats.totalApplications)}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Applications
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MetricsCards;
