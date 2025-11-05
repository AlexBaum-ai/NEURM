/**
 * Forum Moderation Types
 * Types for moderation actions, logs, and reports
 */

export type ModerationAction =
  | 'pin_topic'
  | 'unpin_topic'
  | 'lock_topic'
  | 'unlock_topic'
  | 'move_topic'
  | 'merge_topic'
  | 'delete_topic'
  | 'edit_topic'
  | 'hide_reply'
  | 'delete_reply'
  | 'edit_reply'
  | 'warn_user'
  | 'suspend_user'
  | 'ban_user';

export type ModerationTargetType = 'topic' | 'reply' | 'user';

export interface ModerationLog {
  id: string;
  moderatorId: string;
  action: ModerationAction;
  targetType: ModerationTargetType;
  targetId: string;
  reason: string | null;
  metadata: Record<string, any> | null;
  createdAt: string;

  // Relations
  moderator: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };

  // UI helper fields
  targetTitle?: string;
  targetUrl?: string;
}

export interface MoveTopicInput {
  topicId: string;
  categoryId: string;
  reason?: string;
}

export interface MergeTopicsInput {
  sourceTopicId: string;
  targetTopicId: string;
  reason?: string;
}

export interface WarnUserInput {
  userId: string;
  reason: string;
}

export interface SuspendUserInput {
  userId: string;
  reason: string;
  durationDays: number;
}

export interface BanUserInput {
  userId: string;
  reason: string;
  isPermanent: boolean;
}

export interface ModerationStats {
  actionsToday: number;
  pendingReports: number;
  activeSuspensions: number;
  totalActions: number;
}

export interface ModerationLogResponse {
  success: boolean;
  data: {
    logs: ModerationLog[];
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

export interface ModerationStatsResponse {
  success: boolean;
  data: ModerationStats;
}

// Report Types (for future Sprint 5 task SPRINT-5-003/004)
export type ReportReason =
  | 'spam'
  | 'harassment'
  | 'off_topic'
  | 'misinformation'
  | 'copyright'
  | 'other';

export type ReportStatus =
  | 'pending'
  | 'reviewing'
  | 'resolved_violation'
  | 'resolved_no_action'
  | 'dismissed';

export interface Report {
  id: string;
  reporterId: string;
  reportableType: 'topic' | 'reply';
  reportableId: string;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;

  // Relations
  reporter: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
}
