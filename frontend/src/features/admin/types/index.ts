export type UserRole = 'user' | 'moderator' | 'admin';

export type UserStatus = 'active' | 'suspended' | 'banned' | 'pending_verification';

export type UserActivityType =
  | 'account_created'
  | 'email_verified'
  | 'profile_updated'
  | 'article_published'
  | 'topic_created'
  | 'reply_posted'
  | 'job_applied'
  | 'role_changed'
  | 'suspended'
  | 'ban_applied'
  | 'ban_removed';

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt?: string;
  reputation: number;
  articleCount: number;
  topicCount: number;
  replyCount: number;
  jobApplicationCount: number;
}

export interface UserDetailInfo extends AdminUser {
  bio?: string;
  location?: string;
  website?: string;
  github?: string;
  twitter?: string;
  linkedin?: string;
  phoneNumber?: string;
  timezone?: string;
  language: string;
  twoFactorEnabled: boolean;
  darkMode: boolean;
  emailNotifications: boolean;
  marketingEmails: boolean;
  suspensionInfo?: SuspensionInfo;
  banInfo?: BanInfo;
}

export interface SuspensionInfo {
  suspendedAt: string;
  suspendedBy: string;
  suspendedByUsername: string;
  reason: string;
  expiresAt?: string;
  isActive: boolean;
}

export interface BanInfo {
  bannedAt: string;
  bannedBy: string;
  bannedByUsername: string;
  reason: string;
  isPermanent: boolean;
}

export interface UserActivity {
  id: string;
  type: UserActivityType;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface UserContent {
  articles: ContentSummary[];
  topics: ContentSummary[];
  replies: ContentSummary[];
  jobApplications: JobApplicationSummary[];
}

export interface ContentSummary {
  id: string;
  title: string;
  slug: string;
  status: 'published' | 'draft' | 'deleted';
  createdAt: string;
  viewCount: number;
  voteCount?: number;
}

export interface JobApplicationSummary {
  id: string;
  jobTitle: string;
  companyName: string;
  status: 'pending' | 'reviewing' | 'interviewed' | 'accepted' | 'rejected';
  appliedAt: string;
}

export interface UserReport {
  id: string;
  reporterUsername: string;
  reporterDisplayName: string;
  reason: string;
  description: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface UserFilters {
  search?: string;
  role?: UserRole | 'all';
  status?: UserStatus | 'all';
  dateFrom?: string;
  dateTo?: string;
}

export interface UserListResponse {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SuspendUserPayload {
  userId: string;
  reason: string;
  duration?: number; // in days, undefined = indefinite
  notifyUser: boolean;
}

export interface BanUserPayload {
  userId: string;
  reason: string;
  notifyUser: boolean;
}

export interface UpdateUserRolePayload {
  userId: string;
  role: UserRole;
}

export interface SendMessagePayload {
  userId: string;
  subject: string;
  message: string;
}

export interface BulkAction {
  action: 'export' | 'bulk_message' | 'bulk_role_update';
  userIds: string[];
  payload?: Record<string, unknown>;
}

export interface ExportUsersPayload {
  format: 'csv' | 'json';
  filters?: UserFilters;
  selectedUserIds?: string[];
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  bannedUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
}

// Dashboard Types
export interface DashboardMetrics {
  realTimeStats: {
    usersOnline: number;
    postsPerHour: number;
    applicationsToday: number;
  };
  keyMetrics: {
    dau: number;
    mau: number;
    wau: number;
    mrr: number;
    arpu: number;
    nps: number;
    retentionRate: number;
  };
  quickStats: {
    totalUsers: number;
    totalArticles: number;
    totalTopics: number;
    totalJobs: number;
    totalApplications: number;
  };
  growthCharts: {
    users: GrowthData[];
    content: GrowthData[];
    revenue: GrowthData[];
  };
  alerts: Alert[];
  recentActivity: Activity[];
  systemHealth: SystemHealth;
}

export interface GrowthData {
  date: string;
  value: number;
  label?: string;
}

export interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  count?: number;
  timestamp: string;
  actionUrl?: string;
}

export interface Activity {
  id: string;
  type: 'user' | 'content' | 'report' | 'application' | 'system';
  title: string;
  description: string;
  timestamp: string;
  user?: {
    id: string;
    name: string;
    avatar?: string;
  };
  metadata?: Record<string, unknown>;
}

export interface SystemHealth {
  apiResponseTime: number;
  errorRate: number;
  databaseSize: number;
  status: 'healthy' | 'warning' | 'critical';
}

export interface DateRange {
  startDate: string;
  endDate: string;
  preset?: 'today' | '7days' | '30days' | '90days' | 'custom';
}

export interface ExportOptions {
  format: 'csv' | 'pdf';
  dataType: 'metrics' | 'users' | 'content' | 'analytics';
  dateRange?: DateRange;
}

// Content Moderation Types
export type ContentType = 'article' | 'topic' | 'reply' | 'job';

export type ContentStatus = 'pending' | 'approved' | 'rejected' | 'flagged' | 'hidden' | 'deleted';

export interface ContentItem {
  id: string;
  type: ContentType;
  title: string;
  excerpt?: string;
  author: string | {
    id: string;
    displayName: string;
    avatarUrl?: string;
    reputation: number;
  };
  status: ContentStatus;
  createdAt: string;
  thumbnailUrl?: string;
  categoryName?: string;
  jobTitle?: string;
  reportCount?: number;
  spamScore?: number;
}

export interface ContentQueueResponse {
  items: ContentItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ContentDetail extends ContentItem {
  content: string;
  metadata?: Record<string, unknown>;
  reports?: ContentReport[];
  moderationHistory?: ModerationHistoryItem[];
}

export interface ContentReport {
  id: string;
  reporterId: string;
  reporterName: string;
  reason: string;
  description: string;
  createdAt: string;
}

export interface ModerationHistoryItem {
  id: string;
  action: 'approved' | 'rejected' | 'hidden' | 'deleted';
  moderatorId: string;
  moderatorName: string;
  reason?: string;
  createdAt: string;
}

export interface ModerationAction {
  contentId: string;
  contentType: ContentType;
  action: 'approve' | 'reject' | 'hide' | 'delete';
  reason?: string;
}

export interface BulkModerationAction {
  contentIds: string[];
  contentType: ContentType;
  action: 'approve' | 'reject' | 'hide' | 'delete';
  reason?: string;
}

export interface ModerationResponse {
  success: boolean;
  message: string;
  affectedCount?: number;
}

export interface ModerationFilters {
  tab?: 'pending' | 'reported' | 'flagged';
  contentType?: ContentType | 'all';
  status?: ContentStatus | 'all';
  search?: string;
  sortBy?: 'newest' | 'oldest' | 'most_reported' | 'highest_spam';
  sortOrder?: 'asc' | 'desc';
}

// Export analytics types
export * from './analytics.types';
