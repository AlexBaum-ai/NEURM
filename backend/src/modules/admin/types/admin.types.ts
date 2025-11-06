/**
 * Admin Dashboard Types
 *
 * Type definitions for admin dashboard metrics and statistics
 */

export interface RealTimeStats {
  usersOnline: number;
  postsPerHour: number;
  applicationsToday: number;
}

export interface KeyMetrics {
  dau: number; // Daily Active Users
  mau: number; // Monthly Active Users
  wau: number; // Weekly Active Users
  mrr: number; // Monthly Recurring Revenue
  arpu: number; // Average Revenue Per User
  nps: number | null; // Net Promoter Score
  retentionRate: number; // User retention rate (percentage)
}

export interface QuickStats {
  totalUsers: number;
  totalArticles: number;
  totalTopics: number;
  totalJobs: number;
  totalApplications: number;
}

export interface GrowthCharts {
  users: TimeSeriesData[];
  content: TimeSeriesData[];
  revenue: TimeSeriesData[];
}

export interface TimeSeriesData {
  date: string;
  value: number;
  label?: string;
}

export interface Alert {
  id: string;
  type: 'error' | 'spam' | 'abuse' | 'system';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  count: number;
  timestamp: Date;
  url?: string;
}

export interface RecentActivity {
  id: string;
  type: 'user_registered' | 'article_published' | 'topic_created' | 'job_posted' | 'report_submitted';
  description: string;
  userId?: string;
  userName?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface SystemHealth {
  apiResponseTime: {
    avg: number;
    p95: number;
    p99: number;
  };
  errorRate: number; // percentage
  databaseSize: string;
  redisStatus: 'connected' | 'disconnected';
  databaseStatus: 'connected' | 'disconnected';
}

export interface AdminDashboardData {
  realTimeStats: RealTimeStats;
  keyMetrics: KeyMetrics;
  quickStats: QuickStats;
  growthCharts: GrowthCharts;
  alerts: Alert[];
  recentActivity: RecentActivity[];
  systemHealth: SystemHealth;
  generatedAt: Date;
}

export interface ExportFormat {
  format: 'csv' | 'pdf';
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface DateRangeQuery {
  startDate?: Date;
  endDate?: Date;
  period?: 'day' | 'week' | 'month' | 'year';
}

export interface MetricsAggregation {
  date: Date;
  totalUsers: number;
  newUsers: number;
  activeUsers: number;
  totalArticles: number;
  totalTopics: number;
  totalJobs: number;
  applications: number;
  pageViews: number;
  errorCount: number;
  spamReports: number;
  abuseReports: number;
}
