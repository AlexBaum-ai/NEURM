import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card/Card';
import {
  Users,
  Activity,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  Eye,
  MousePointerClick,
} from 'lucide-react';
import type { EngagementMetrics, RevenueMetrics } from '../../types';

interface AnalyticsMetricsCardsProps {
  engagement: EngagementMetrics;
  revenue: RevenueMetrics;
}

const AnalyticsMetricsCards: React.FC<AnalyticsMetricsCardsProps> = ({
  engagement,
  revenue,
}) => {
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

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const metricCards = [
    {
      label: 'DAU/MAU Ratio',
      value: formatPercentage(engagement.dauMauRatio),
      icon: Users,
      color: 'blue',
      description: 'User stickiness indicator',
    },
    {
      label: 'Avg Session Time',
      value: formatTime(engagement.avgSessionTime),
      icon: Clock,
      color: 'green',
      description: 'Time per session',
    },
    {
      label: 'Pages per Session',
      value: engagement.avgPagesPerSession.toFixed(1),
      icon: MousePointerClick,
      color: 'purple',
      description: 'Avg pages viewed',
    },
    {
      label: 'Bounce Rate',
      value: formatPercentage(engagement.bounceRate),
      icon: Eye,
      color: engagement.bounceRate > 0.6 ? 'red' : 'orange',
      description: 'Single-page visits',
    },
    {
      label: 'MRR',
      value: formatCurrency(revenue.mrr),
      icon: DollarSign,
      color: 'green',
      trend: {
        value: revenue.mrrGrowth,
        isPositive: revenue.mrrGrowth >= 0,
      },
      description: 'Monthly recurring revenue',
    },
    {
      label: 'ARPU',
      value: formatCurrency(revenue.arpu),
      icon: Users,
      color: 'blue',
      description: 'Average revenue per user',
    },
    {
      label: 'Churn Rate',
      value: formatPercentage(revenue.churnRate),
      icon: revenue.churnRate > 0.05 ? TrendingDown : TrendingUp,
      color: revenue.churnRate > 0.05 ? 'red' : 'green',
      description: 'Subscription churn',
    },
    {
      label: 'Return Users',
      value: formatPercentage(engagement.returnUserRate),
      icon: Activity,
      color: 'indigo',
      description: 'Users who came back',
    },
  ];

  const colorClasses = {
    blue: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
    green: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
    purple: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20',
    orange: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20',
    red: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
    indigo: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20',
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metricCards.map((metric, index) => {
        const Icon = metric.icon;
        const colorClass = colorClasses[metric.color as keyof typeof colorClasses];

        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {metric.label}
              </CardTitle>
              <div className={`p-2 rounded-lg ${colorClass}`}>
                <Icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {metric.value}
              </div>
              {metric.trend && (
                <div className="flex items-center gap-1 mt-1">
                  {metric.trend.isPositive ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span
                    className={`text-xs ${
                      metric.trend.isPositive ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {formatPercentage(Math.abs(metric.trend.value))}
                  </span>
                </div>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {metric.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default AnalyticsMetricsCards;
