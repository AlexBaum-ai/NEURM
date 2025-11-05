/**
 * Reputation Types
 * Based on backend ReputationService from SPRINT-4-010
 */

export type ReputationLevel = 'newcomer' | 'contributor' | 'expert' | 'master' | 'legend';

export interface ReputationLevelConfig {
  level: ReputationLevel;
  label: string;
  color: string;
  icon: string;
  minPoints: number;
  nextLevelPoints: number | null;
}

export interface ReputationLevelProgress {
  current: number;
  nextLevelThreshold: number | null;
  percentage: number;
}

export interface ReputationBreakdown {
  topicsCreated: number;
  repliesCreated: number;
  upvotesReceived: number;
  downvotesReceived: number;
  bestAnswers: number;
  badgesEarned: number;
  penalties: number;
}

export interface ReputationActivity {
  id: string;
  eventType: string;
  points: number;
  description: string;
  referenceId: string | null;
  createdAt: string;
}

export interface ReputationPermissions {
  canDownvote: boolean;
  canEditOthersContent: boolean;
  canModerate: boolean;
}

export interface UserReputation {
  userId: string;
  totalReputation: number;
  level: ReputationLevel;
  levelProgress: ReputationLevelProgress;
  breakdown: ReputationBreakdown;
  recentActivity: ReputationActivity[];
  permissions: ReputationPermissions;
}

export interface ReputationResponse {
  success: boolean;
  data: UserReputation;
}

// Level thresholds and configuration
export const REPUTATION_LEVELS: Record<ReputationLevel, ReputationLevelConfig> = {
  newcomer: {
    level: 'newcomer',
    label: 'Newcomer',
    color: '#9E9E9E', // gray
    icon: '🌱',
    minPoints: 0,
    nextLevelPoints: 100,
  },
  contributor: {
    level: 'contributor',
    label: 'Contributor',
    color: '#2196F3', // blue
    icon: '💬',
    minPoints: 100,
    nextLevelPoints: 500,
  },
  expert: {
    level: 'expert',
    label: 'Expert',
    color: '#9C27B0', // purple
    icon: '⭐',
    minPoints: 500,
    nextLevelPoints: 1000,
  },
  master: {
    level: 'master',
    label: 'Master',
    color: '#FFB300', // gold
    icon: '👑',
    minPoints: 1000,
    nextLevelPoints: 2500,
  },
  legend: {
    level: 'legend',
    label: 'Legend',
    color: '#F44336', // red
    icon: '🔥',
    minPoints: 2500,
    nextLevelPoints: null,
  },
};

// Helper to get level config
export function getReputationLevelConfig(level: ReputationLevel): ReputationLevelConfig {
  return REPUTATION_LEVELS[level];
}

// Helper to format reputation points
export function formatReputationPoints(points: number): string {
  if (points >= 1000000) {
    return `${(points / 1000000).toFixed(1)}M`;
  }
  if (points >= 1000) {
    return `${(points / 1000).toFixed(1)}K`;
  }
  return points.toString();
}
