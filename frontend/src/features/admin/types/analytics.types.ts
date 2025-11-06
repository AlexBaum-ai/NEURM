/**
 * Analytics-specific types for admin analytics dashboard
 */

// ============================================
// Analytics Response Types
// ============================================

export interface AnalyticsOverview {
  userGrowth: UserGrowthData[];
  engagement: EngagementMetrics;
  contentPerformance: ContentPerformanceMetrics;
  revenue: RevenueMetrics;
  topContributors: Contributor[];
  trafficSources: TrafficSource[];
}

export interface UserGrowthData {
  date: string;
  totalUsers: number;
  newUsers: number;
  activeUsers: number;
  deletedUsers?: number;
}

export interface EngagementMetrics {
  dau: number;
  mau: number;
  wau: number;
  dauMauRatio: number;
  avgSessionTime: number; // in minutes
  avgPagesPerSession: number;
  bounceRate: number;
  returnUserRate: number;
}

export interface ContentPerformanceMetrics {
  articles: {
    mostViewed: ContentItem[];
    trending: ContentItem[];
    totalViews: number;
    avgViewsPerArticle: number;
  };
  forum: {
    topTopics: ForumTopic[];
    totalTopics: number;
    totalReplies: number;
    avgRepliesPerTopic: number;
  };
  jobs: {
    trendingJobs: JobItem[];
    totalJobs: number;
    totalApplications: number;
    avgApplicationsPerJob: number;
  };
}

export interface ContentItem {
  id: string;
  title: string;
  slug: string;
  viewCount: number;
  author: string;
  publishedAt: string;
}

export interface ForumTopic {
  id: string;
  title: string;
  slug: string;
  replyCount: number;
  viewCount: number;
  voteCount: number;
  author: string;
  createdAt: string;
}

export interface JobItem {
  id: string;
  title: string;
  company: string;
  applicationCount: number;
  viewCount: number;
  postedAt: string;
}

export interface RevenueMetrics {
  mrr: number;
  mrrGrowth: number; // percentage
  newSubscriptions: number;
  churnedSubscriptions: number;
  churnRate: number; // percentage
  arpu: number;
  ltv: number;
  revenueByPlan: RevenuePlanBreakdown[];
  revenueTimeseries: RevenueTimeseriesData[];
}

export interface RevenuePlanBreakdown {
  plan: string;
  count: number;
  revenue: number;
  percentage: number;
}

export interface RevenueTimeseriesData {
  date: string;
  revenue: number;
  subscriptions: number;
  churn: number;
}

export interface Contributor {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  reputation: number;
  articleCount: number;
  topicCount: number;
  replyCount: number;
  totalContributions: number;
}

export interface TrafficSource {
  source: string;
  sessions: number;
  percentage: number;
  bounceRate: number;
}

// ============================================
// Query Parameters
// ============================================

export interface AnalyticsQueryParams {
  period?: 'daily' | 'weekly' | 'monthly';
  metrics?: string[];
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export interface CustomAnalyticsQueryParams {
  startDate: string;
  endDate: string;
  metrics: string[];
  granularity?: 'hourly' | 'daily' | 'weekly' | 'monthly';
  compareWith?: {
    startDate: string;
    endDate: string;
  };
}

export interface CohortAnalysisParams {
  startDate: string;
  endDate: string;
  cohortType?: 'signup' | 'first_purchase';
  period?: 'daily' | 'weekly' | 'monthly';
}

export interface FunnelAnalysisParams {
  funnelType: 'user_onboarding' | 'job_application';
  startDate?: string;
  endDate?: string;
  groupBy?: 'day' | 'week' | 'month';
}

// ============================================
// Funnel Analysis
// ============================================

export interface FunnelStep {
  step: string;
  label: string;
  count: number;
  conversionRate: number;
  dropoffRate: number;
}

export interface FunnelAnalysis {
  funnelType: string;
  steps: FunnelStep[];
  overallConversionRate: number;
  meta: {
    startDate: string;
    endDate: string;
    groupBy?: string;
  };
}

// ============================================
// Cohort Analysis
// ============================================

export interface CohortData {
  cohort: string;
  size: number;
  retentionRates: number[];
  periods: string[];
}

export interface CohortAnalysis {
  cohorts: CohortData[];
  meta: {
    cohortType: string;
    period: string;
    startDate: string;
    endDate: string;
  };
}

// ============================================
// Export Options
// ============================================

export interface AnalyticsExportOptions {
  format: 'csv' | 'pdf';
  metrics: string[];
  startDate: string;
  endDate: string;
  includeCharts?: boolean;
}

// ============================================
// Custom Report Builder
// ============================================

export interface CustomReport {
  id?: string;
  name: string;
  description?: string;
  metrics: string[];
  dateRange: {
    startDate: string;
    endDate: string;
  };
  granularity: 'hourly' | 'daily' | 'weekly' | 'monthly';
  chartTypes: {
    [metricKey: string]: 'line' | 'bar' | 'pie' | 'area';
  };
}

// ============================================
// Time Period Presets
// ============================================

export type DateRangePreset = 'today' | '7days' | '30days' | '90days' | 'custom';

export interface DateRangeWithPreset {
  startDate: string;
  endDate: string;
  preset: DateRangePreset;
}

// ============================================
// Chart Data Types
// ============================================

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
  color?: string;
}

export interface PieChartData {
  name: string;
  value: number;
  color?: string;
  percentage?: number;
}

export interface BarChartData {
  category: string;
  value: number;
  color?: string;
}

// ============================================
// Metric Card Data
// ============================================

export interface MetricCardData {
  label: string;
  value: number | string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  format?: 'number' | 'currency' | 'percentage' | 'time';
  icon?: string;
  color?: string;
}
