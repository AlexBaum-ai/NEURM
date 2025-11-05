/**
 * Badge Types
 * Based on backend implementation from SPRINT-6-001
 */

export type BadgeType = 'skill' | 'activity' | 'special';
export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

/**
 * Badge Definition
 * Represents a badge template in the system
 */
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // URL or emoji
  type: BadgeType;
  rarity: BadgeRarity;
  category: string; // e.g., 'Prompt Master', 'RAG Expert', 'Helpful', 'Popular', 'Beta Tester'
  criteria: BadgeCriteria;
  createdAt: string;
  updatedAt: string;
}

/**
 * Badge Criteria
 * Defines requirements to earn a badge
 */
export interface BadgeCriteria {
  type: CriteriaType;
  threshold: number;
  timeframe: 'all_time' | 'daily' | 'weekly' | 'monthly';
  additionalConditions?: Record<string, any>;
}

export type CriteriaType =
  | 'reply_count'
  | 'topic_count'
  | 'upvote_count'
  | 'accepted_answer_count'
  | 'reputation_threshold'
  | 'streak_days'
  | 'first_action'
  | 'special_event';

/**
 * User Badge
 * Represents a badge earned by a user
 */
export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  badge: Badge;
  earnedAt: string;
  progress?: BadgeProgress;
  notified: boolean;
}

/**
 * Badge Progress
 * Tracks progress toward earning a locked badge
 */
export interface BadgeProgress {
  current: number;
  required: number;
  percentage: number;
  lastUpdated: string;
}

/**
 * Badge with Progress
 * Used for displaying badges in the gallery (earned or locked)
 */
export interface BadgeWithProgress extends Badge {
  isEarned: boolean;
  earnedAt?: string;
  progress?: BadgeProgress;
}

/**
 * Badge Filter Options
 */
export interface BadgeFilters {
  type?: BadgeType;
  rarity?: BadgeRarity;
  category?: string;
  earnedStatus?: 'earned' | 'locked' | 'all';
  searchQuery?: string;
}

/**
 * Badge Statistics
 */
export interface BadgeStats {
  totalBadges: number;
  earnedBadges: number;
  lockedBadges: number;
  byType: Record<BadgeType, number>;
  byRarity: Record<BadgeRarity, number>;
  recentlyEarned: UserBadge[];
}

// ========================================
// API Response Types
// ========================================

export interface BadgesResponse {
  success: boolean;
  data: {
    badges: Badge[];
    totalCount: number;
  };
}

export interface UserBadgesResponse {
  success: boolean;
  data: {
    earned: UserBadge[];
    progress: BadgeWithProgress[];
    stats: BadgeStats;
  };
}

export interface BadgeProgressResponse {
  success: boolean;
  data: {
    progress: Record<string, BadgeProgress>; // key: badgeId
  };
}

export interface BadgeDetailResponse {
  success: boolean;
  data: {
    badge: Badge;
    isEarned: boolean;
    earnedAt?: string;
    progress?: BadgeProgress;
    earnedBy?: number; // Count of users who earned this badge
  };
}

// ========================================
// Badge Rarity Config
// ========================================

export interface BadgeRarityConfig {
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  glowColor: string;
  label: string;
}

export const BADGE_RARITY_CONFIG: Record<BadgeRarity, BadgeRarityConfig> = {
  common: {
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
    textColor: 'text-gray-800',
    glowColor: 'shadow-gray-200',
    label: 'Common',
  },
  rare: {
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300',
    textColor: 'text-blue-800',
    glowColor: 'shadow-blue-200',
    label: 'Rare',
  },
  epic: {
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-300',
    textColor: 'text-purple-800',
    glowColor: 'shadow-purple-200',
    label: 'Epic',
  },
  legendary: {
    color: 'text-amber-600',
    bgColor: 'bg-gradient-to-br from-amber-100 to-yellow-100',
    borderColor: 'border-amber-400',
    textColor: 'text-amber-900',
    glowColor: 'shadow-amber-300',
    label: 'Legendary',
  },
};

// ========================================
// Badge Type Icons and Labels
// ========================================

export const BADGE_TYPE_CONFIG: Record<BadgeType, { label: string; icon: string }> = {
  skill: { label: 'Skill Badge', icon: '🎯' },
  activity: { label: 'Activity Badge', icon: '⚡' },
  special: { label: 'Special Badge', icon: '⭐' },
};

// ========================================
// Share Badge Config
// ========================================

export interface ShareBadgeOptions {
  platform: 'twitter' | 'linkedin' | 'facebook' | 'copy';
  badgeName: string;
  username: string;
  badgeUrl?: string;
}
