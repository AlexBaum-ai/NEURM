import { PrismaClient, BadgeType, BadgeCategory } from '@prisma/client';

/**
 * Badge Seed Data
 *
 * Seeds initial badge definitions for the forum gamification system.
 * Badges are categorized by:
 * - skill: Expertise-based badges (Prompt Master, RAG Expert)
 * - activity: Participation-based badges (First Post, 100 Replies)
 * - special: Unique achievements (Beta Tester, Helpful)
 *
 * Badge types (rarity):
 * - bronze: Common badges (easy to earn)
 * - silver: Uncommon badges (moderate effort)
 * - gold: Rare badges (significant effort)
 * - platinum: Legendary badges (exceptional achievement)
 */

export const seedBadges = async (prisma: PrismaClient): Promise<void> => {
  console.log('🏅 Seeding badges...');

  const badges = [
    // ============================================================================
    // ACTIVITY BADGES - Participation and Engagement
    // ============================================================================
    {
      name: 'First Post',
      slug: 'first-post',
      description: 'Created your first topic in the forum',
      iconUrl: '/badges/first-post.svg',
      badgeType: 'bronze' as BadgeType,
      category: 'activity' as BadgeCategory,
      criteria: {
        type: 'topic_count',
        threshold: 1,
        timeframe: 'all_time',
      },
    },
    {
      name: 'First Reply',
      slug: 'first-reply',
      description: 'Posted your first reply to a topic',
      iconUrl: '/badges/first-reply.svg',
      badgeType: 'bronze' as BadgeType,
      category: 'activity' as BadgeCategory,
      criteria: {
        type: 'reply_count',
        threshold: 1,
        timeframe: 'all_time',
      },
    },
    {
      name: 'Conversationalist',
      slug: 'conversationalist',
      description: 'Posted 50 replies in the forum',
      iconUrl: '/badges/conversationalist.svg',
      badgeType: 'bronze' as BadgeType,
      category: 'activity' as BadgeCategory,
      criteria: {
        type: 'reply_count',
        threshold: 50,
        timeframe: 'all_time',
      },
    },
    {
      name: 'Contributor',
      slug: 'contributor',
      description: 'Posted 100 replies in the forum',
      iconUrl: '/badges/contributor.svg',
      badgeType: 'silver' as BadgeType,
      category: 'activity' as BadgeCategory,
      criteria: {
        type: 'reply_count',
        threshold: 100,
        timeframe: 'all_time',
      },
    },
    {
      name: 'Prolific',
      slug: 'prolific',
      description: 'Posted 500 replies in the forum',
      iconUrl: '/badges/prolific.svg',
      badgeType: 'gold' as BadgeType,
      category: 'activity' as BadgeCategory,
      criteria: {
        type: 'reply_count',
        threshold: 500,
        timeframe: 'all_time',
      },
    },
    {
      name: 'Discussion Starter',
      slug: 'discussion-starter',
      description: 'Created 10 topics in the forum',
      iconUrl: '/badges/discussion-starter.svg',
      badgeType: 'bronze' as BadgeType,
      category: 'activity' as BadgeCategory,
      criteria: {
        type: 'topic_count',
        threshold: 10,
        timeframe: 'all_time',
      },
    },
    {
      name: 'Topic Creator',
      slug: 'topic-creator',
      description: 'Created 50 topics in the forum',
      iconUrl: '/badges/topic-creator.svg',
      badgeType: 'silver' as BadgeType,
      category: 'activity' as BadgeCategory,
      criteria: {
        type: 'topic_count',
        threshold: 50,
        timeframe: 'all_time',
      },
    },
    {
      name: 'Streak Master',
      slug: 'streak-master',
      description: 'Active for 7 consecutive days',
      iconUrl: '/badges/streak-master.svg',
      badgeType: 'silver' as BadgeType,
      category: 'activity' as BadgeCategory,
      criteria: {
        type: 'streak_days',
        threshold: 7,
        timeframe: 'all_time',
      },
    },
    {
      name: 'Dedication',
      slug: 'dedication',
      description: 'Active for 30 consecutive days',
      iconUrl: '/badges/dedication.svg',
      badgeType: 'gold' as BadgeType,
      category: 'activity' as BadgeCategory,
      criteria: {
        type: 'streak_days',
        threshold: 30,
        timeframe: 'all_time',
      },
    },

    // ============================================================================
    // SKILL BADGES - Expertise and Quality
    // ============================================================================
    {
      name: 'Helpful',
      slug: 'helpful',
      description: 'Received 50 upvotes on your posts',
      iconUrl: '/badges/helpful.svg',
      badgeType: 'bronze' as BadgeType,
      category: 'skill' as BadgeCategory,
      criteria: {
        type: 'upvote_count',
        threshold: 50,
        timeframe: 'all_time',
      },
    },
    {
      name: 'Popular',
      slug: 'popular',
      description: 'Received 100 upvotes on your posts',
      iconUrl: '/badges/popular.svg',
      badgeType: 'silver' as BadgeType,
      category: 'skill' as BadgeCategory,
      criteria: {
        type: 'upvote_count',
        threshold: 100,
        timeframe: 'all_time',
      },
    },
    {
      name: 'Renowned',
      slug: 'renowned',
      description: 'Received 500 upvotes on your posts',
      iconUrl: '/badges/renowned.svg',
      badgeType: 'gold' as BadgeType,
      category: 'skill' as BadgeCategory,
      criteria: {
        type: 'upvote_count',
        threshold: 500,
        timeframe: 'all_time',
      },
    },
    {
      name: 'Legendary',
      slug: 'legendary',
      description: 'Received 1000 upvotes on your posts',
      iconUrl: '/badges/legendary.svg',
      badgeType: 'platinum' as BadgeType,
      category: 'skill' as BadgeCategory,
      criteria: {
        type: 'upvote_count',
        threshold: 1000,
        timeframe: 'all_time',
      },
    },
    {
      name: 'Accepted Answer',
      slug: 'accepted-answer',
      description: 'Had your answer accepted as the best solution',
      iconUrl: '/badges/accepted-answer.svg',
      badgeType: 'bronze' as BadgeType,
      category: 'skill' as BadgeCategory,
      criteria: {
        type: 'accepted_answer_count',
        threshold: 1,
        timeframe: 'all_time',
      },
    },
    {
      name: 'Solution Provider',
      slug: 'solution-provider',
      description: 'Had 10 answers accepted as the best solution',
      iconUrl: '/badges/solution-provider.svg',
      badgeType: 'silver' as BadgeType,
      category: 'skill' as BadgeCategory,
      criteria: {
        type: 'accepted_answer_count',
        threshold: 10,
        timeframe: 'all_time',
      },
    },
    {
      name: 'Expert',
      slug: 'expert',
      description: 'Had 50 answers accepted as the best solution',
      iconUrl: '/badges/expert.svg',
      badgeType: 'gold' as BadgeType,
      category: 'skill' as BadgeCategory,
      criteria: {
        type: 'accepted_answer_count',
        threshold: 50,
        timeframe: 'all_time',
      },
    },
    {
      name: 'Reputation 100',
      slug: 'reputation-100',
      description: 'Reached 100 reputation points',
      iconUrl: '/badges/reputation-100.svg',
      badgeType: 'bronze' as BadgeType,
      category: 'skill' as BadgeCategory,
      criteria: {
        type: 'reputation',
        threshold: 100,
        timeframe: 'all_time',
      },
    },
    {
      name: 'Reputation 500',
      slug: 'reputation-500',
      description: 'Reached 500 reputation points',
      iconUrl: '/badges/reputation-500.svg',
      badgeType: 'silver' as BadgeType,
      category: 'skill' as BadgeCategory,
      criteria: {
        type: 'reputation',
        threshold: 500,
        timeframe: 'all_time',
      },
    },
    {
      name: 'Reputation 1000',
      slug: 'reputation-1000',
      description: 'Reached 1000 reputation points',
      iconUrl: '/badges/reputation-1000.svg',
      badgeType: 'gold' as BadgeType,
      category: 'skill' as BadgeCategory,
      criteria: {
        type: 'reputation',
        threshold: 1000,
        timeframe: 'all_time',
      },
    },
    {
      name: 'Reputation 2500',
      slug: 'reputation-2500',
      description: 'Reached 2500 reputation points (Legend status)',
      iconUrl: '/badges/reputation-2500.svg',
      badgeType: 'platinum' as BadgeType,
      category: 'skill' as BadgeCategory,
      criteria: {
        type: 'reputation',
        threshold: 2500,
        timeframe: 'all_time',
      },
    },

    // ============================================================================
    // SPECIAL BADGES - Community Roles and Unique Achievements
    // ============================================================================
    {
      name: 'Beta Tester',
      slug: 'beta-tester',
      description: 'Joined during the beta testing phase',
      iconUrl: '/badges/beta-tester.svg',
      badgeType: 'platinum' as BadgeType,
      category: 'special' as BadgeCategory,
      criteria: {
        type: 'topic_count',
        threshold: 1,
        timeframe: 'all_time',
      },
    },
    {
      name: 'Prompt Master',
      slug: 'prompt-master',
      description: 'Created 10 high-quality prompts in the Prompt Library',
      iconUrl: '/badges/prompt-master.svg',
      badgeType: 'gold' as BadgeType,
      category: 'special' as BadgeCategory,
      criteria: {
        type: 'topic_count',
        threshold: 10,
        timeframe: 'all_time',
      },
    },
    {
      name: 'RAG Expert',
      slug: 'rag-expert',
      description: 'Contributed 20 expert answers about RAG implementations',
      iconUrl: '/badges/rag-expert.svg',
      badgeType: 'gold' as BadgeType,
      category: 'special' as BadgeCategory,
      criteria: {
        type: 'accepted_answer_count',
        threshold: 20,
        timeframe: 'all_time',
      },
    },
    {
      name: 'Civic Duty',
      slug: 'civic-duty',
      description: 'Cast 100 votes on topics and replies',
      iconUrl: '/badges/civic-duty.svg',
      badgeType: 'silver' as BadgeType,
      category: 'special' as BadgeCategory,
      criteria: {
        type: 'vote_count',
        threshold: 100,
        timeframe: 'all_time',
      },
    },
    {
      name: 'Electorate',
      slug: 'electorate',
      description: 'Cast 500 votes on topics and replies',
      iconUrl: '/badges/electorate.svg',
      badgeType: 'gold' as BadgeType,
      category: 'special' as BadgeCategory,
      criteria: {
        type: 'vote_count',
        threshold: 500,
        timeframe: 'all_time',
      },
    },
  ];

  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { slug: badge.slug },
      update: {
        name: badge.name,
        description: badge.description,
        iconUrl: badge.iconUrl,
        badgeType: badge.badgeType,
        category: badge.category,
        criteria: badge.criteria,
      },
      create: badge,
    });
  }

  console.log(`✅ Seeded ${badges.length} badges`);
};
