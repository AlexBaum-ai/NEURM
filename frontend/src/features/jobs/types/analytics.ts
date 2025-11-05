export interface AnalyticsSummary {
  totalJobs: number;
  totalApplications: number;
  avgMatchScore: number;
  avgTimeToHire: number; // in days
}

export interface FunnelStage {
  stage: string;
  count: number;
  percentage: number;
}

export interface TimeSeriesDataPoint {
  date: string;
  applications: number;
  views: number;
}

export interface ExperienceLevelData {
  level: string;
  count: number;
  percentage: number;
}

export interface TrafficSource {
  source: string;
  count: number;
  percentage: number;
}

export interface JobPerformance {
  jobId: string;
  jobTitle: string;
  views: number;
  applications: number;
  conversionRate: number;
  avgMatchScore: number;
  hired: number;
}

export interface CompanyAnalytics {
  summary: AnalyticsSummary;
  timeSeries: TimeSeriesDataPoint[];
  funnel: FunnelStage[];
  experienceLevel: ExperienceLevelData[];
  trafficSources: TrafficSource[];
  jobPerformance: JobPerformance[];
}

export interface JobAnalytics {
  jobId: string;
  jobTitle: string;
  totalViews: number;
  totalApplications: number;
  conversionRate: number;
  avgMatchScore: number;
  timeToHire: number;
  timeSeries: TimeSeriesDataPoint[];
  funnel: FunnelStage[];
  experienceLevel: ExperienceLevelData[];
  trafficSources: TrafficSource[];
}

export type DateRange = '7' | '30' | '90' | 'custom';

export interface DateRangeFilter {
  range: DateRange;
  startDate?: string;
  endDate?: string;
}
