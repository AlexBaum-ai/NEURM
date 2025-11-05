/**
 * Report Types
 * Types for content reporting and moderation
 */

export type ReportReason = 'spam' | 'harassment' | 'off_topic' | 'misinformation' | 'copyright';

export type ReportStatus =
  | 'pending'
  | 'reviewing'
  | 'resolved_violation'
  | 'resolved_no_action'
  | 'dismissed';

export type ReportableType = 'topic' | 'reply';

export interface Report {
  id: string;
  reporterId: string;
  reportableType: ReportableType;
  reportableId: string;
  reason: ReportReason;
  description: string;
  status: ReportStatus;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;

  // Relations
  reporter: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  content?: ReportedContent;
  resolver?: {
    id: string;
    username: string;
    displayName: string | null;
  } | null;
}

export interface ReportedContent {
  id: string;
  title?: string; // for topics
  content: string;
  excerpt: string;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  createdAt: string;
}

export interface CreateReportInput {
  reportableType: ReportableType;
  reportableId: string;
  reason: ReportReason;
  description: string;
}

export interface ResolveReportInput {
  action: 'mark_violation' | 'no_action' | 'dismiss';
  notes?: string;
}

export interface ReportFilters {
  reason?: ReportReason;
  status?: ReportStatus;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface ReportStatistics {
  totalReports: number;
  pendingReports: number;
  resolvedToday: number;
  byReason: Record<ReportReason, number>;
  byStatus: Record<ReportStatus, number>;
}

// API Response types
export interface ReportResponse {
  success: boolean;
  data: {
    report: Report;
  };
}

export interface ReportsListResponse {
  success: boolean;
  data: {
    reports: Report[];
    pagination: {
      page: number;
      limit: number;
      totalCount: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  };
}

export interface ReportStatisticsResponse {
  success: boolean;
  data: {
    statistics: ReportStatistics;
  };
}

// UI-specific types
export const reportReasonLabels: Record<ReportReason, string> = {
  spam: 'Spam',
  harassment: 'Harassment',
  off_topic: 'Off-topic',
  misinformation: 'Misinformation',
  copyright: 'Copyright Violation',
};

export const reportReasonDescriptions: Record<ReportReason, string> = {
  spam: 'Unsolicited promotional content or repetitive posts',
  harassment: 'Abusive, threatening, or harassing behavior',
  off_topic: 'Content not related to the discussion',
  misinformation: 'False or misleading information',
  copyright: 'Unauthorized use of copyrighted material',
};

export const reportStatusLabels: Record<ReportStatus, string> = {
  pending: 'Pending',
  reviewing: 'Under Review',
  resolved_violation: 'Violation Confirmed',
  resolved_no_action: 'No Action Needed',
  dismissed: 'Dismissed',
};

export const reportStatusColors: Record<ReportStatus, string> = {
  pending: '#f59e0b', // amber
  reviewing: '#3b82f6', // blue
  resolved_violation: '#ef4444', // red
  resolved_no_action: '#10b981', // green
  dismissed: '#6b7280', // gray
};
