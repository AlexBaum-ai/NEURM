/**
 * Leaderboard Types
 * Based on backend leaderboard API from SPRINT-6-003
 */

export type LeaderboardPeriod = 'weekly' | 'monthly' | 'all-time' | 'hall-of-fame';

export interface LeaderboardUser {
  rank: number;
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  reputationGain: number;
  totalReputation?: number;
  postCount: number;
  acceptedAnswers: number;
  badges?: LeaderboardBadge[];
  // For animated rank changes
  previousRank?: number;
  rankChange?: number; // positive = moved up, negative = moved down
}

export interface LeaderboardBadge {
  id: string;
  name: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface LeaderboardData {
  period: LeaderboardPeriod;
  users: LeaderboardUser[];
  updatedAt: string;
  currentUserRank?: CurrentUserRank;
}

export interface CurrentUserRank {
  rank: number;
  reputationGain: number;
  postCount: number;
  acceptedAnswers: number;
  totalUsers: number;
  percentile: number;
}

export interface LeaderboardResponse {
  success: boolean;
  data: LeaderboardData;
}

export interface CurrentUserRankResponse {
  success: boolean;
  data: {
    weekly: CurrentUserRank | null;
    monthly: CurrentUserRank | null;
    allTime: CurrentUserRank | null;
  };
}

export interface HallOfFameEntry {
  period: string; // e.g., "2024-01" for January 2024
  rank: number;
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  reputationGain: number;
  postCount: number;
  acceptedAnswers: number;
}

export interface HallOfFameResponse {
  success: boolean;
  data: {
    entries: HallOfFameEntry[];
    updatedAt: string;
  };
}

// Helper function to get period label
export function getPeriodLabel(period: LeaderboardPeriod): string {
  const labels: Record<LeaderboardPeriod, string> = {
    weekly: 'This Week',
    monthly: 'This Month',
    'all-time': 'All Time',
    'hall-of-fame': 'Hall of Fame',
  };
  return labels[period];
}

// Helper function to get rank color/badge
export function getRankColor(rank: number): string {
  if (rank === 1) return '#FFD700'; // Gold
  if (rank === 2) return '#C0C0C0'; // Silver
  if (rank === 3) return '#CD7F32'; // Bronze
  return 'transparent';
}

// Helper function to get rank icon
export function getRankIcon(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return '';
}
