import { PrismaClient, Prisma } from '@prisma/client';
import prisma from '@/config/database';
import { UpdateJobPreferencesInput, UpdateCandidateProfileInput } from './profiles.validation';

/**
 * Type for complete candidate profile with all relations
 */
export type CandidateProfileWithRelations = Prisma.UserGetPayload<{
  include: {
    profile: true;
    jobPreferences: true;
    skills: true;
    workExperiences: {
      orderBy: {
        startDate: 'desc';
      };
    };
    educations: {
      orderBy: {
        startDate: 'desc';
      };
    };
    portfolioProjects: {
      where: {
        isFeatured: true;
      };
      orderBy: {
        displayOrder: 'asc';
      };
    };
    userBadges: {
      include: {
        badge: true;
      };
      orderBy: {
        earnedAt: 'desc';
      };
      take: 5;
    };
    reputation: true;
    _count: {
      select: {
        topics: true;
        replies: true;
        articles: true;
      };
    };
  };
}>;

/**
 * ProfilesRepository
 * Data access layer for candidate profiles
 */
export class ProfilesRepository {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || prisma;
  }

  /**
   * Find candidate profile by user ID
   */
  async findCandidateProfileById(userId: string): Promise<CandidateProfileWithRelations | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        jobPreferences: true,
        skills: true,
        workExperiences: {
          orderBy: {
            startDate: 'desc',
          },
        },
        educations: {
          orderBy: {
            startDate: 'desc',
          },
        },
        portfolioProjects: {
          where: {
            isFeatured: true,
          },
          orderBy: {
            displayOrder: 'asc',
          },
        },
        userBadges: {
          include: {
            badge: true,
          },
          orderBy: {
            earnedAt: 'desc',
          },
          take: 5,
        },
        reputation: true,
        _count: {
          select: {
            topics: true,
            replies: true,
            articles: true,
          },
        },
      },
    });
  }

  /**
   * Find candidate profile by username
   */
  async findCandidateProfileByUsername(
    username: string
  ): Promise<CandidateProfileWithRelations | null> {
    return this.prisma.user.findUnique({
      where: { username },
      include: {
        profile: true,
        jobPreferences: true,
        skills: true,
        workExperiences: {
          orderBy: {
            startDate: 'desc',
          },
        },
        educations: {
          orderBy: {
            startDate: 'desc',
          },
        },
        portfolioProjects: {
          where: {
            isFeatured: true,
          },
          orderBy: {
            displayOrder: 'asc',
          },
        },
        userBadges: {
          include: {
            badge: true,
          },
          orderBy: {
            earnedAt: 'desc',
          },
          take: 5,
        },
        reputation: true,
        _count: {
          select: {
            topics: true,
            replies: true,
            articles: true,
          },
        },
      },
    });
  }

  /**
   * Get user's job preferences
   */
  async getJobPreferences(userId: string) {
    return this.prisma.jobPreferences.findUnique({
      where: { userId },
    });
  }

  /**
   * Upsert job preferences (create or update)
   */
  async upsertJobPreferences(userId: string, data: UpdateJobPreferencesInput) {
    return this.prisma.jobPreferences.upsert({
      where: { userId },
      create: {
        userId,
        ...data,
      },
      update: data,
    });
  }

  /**
   * Update basic profile fields
   */
  async updateProfile(userId: string, data: Partial<UpdateCandidateProfileInput>) {
    return this.prisma.profile.upsert({
      where: { userId },
      create: {
        userId,
        ...data,
      },
      update: data,
    });
  }

  /**
   * Get portfolio projects for a user
   */
  async getPortfolioProjects(userId: string) {
    return this.prisma.portfolioProject.findMany({
      where: { userId },
      orderBy: [{ isFeatured: 'desc' }, { displayOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Get privacy settings for a user
   */
  async getPrivacySettings(userId: string) {
    const settings = await this.prisma.profilePrivacySetting.findMany({
      where: { userId },
    });

    // Convert to map
    const settingsMap: Record<string, string> = {};
    settings.forEach((setting) => {
      settingsMap[setting.section] = setting.visibility;
    });

    return settingsMap;
  }

  /**
   * Check if user's profile is visible to recruiters
   */
  async isVisibleToRecruiters(userId: string): Promise<boolean> {
    const jobPreferences = await this.prisma.jobPreferences.findUnique({
      where: { userId },
      select: { visibleToRecruiters: true },
    });

    return jobPreferences?.visibleToRecruiters ?? false;
  }

  /**
   * Get user role (for recruiter access check)
   */
  async getUserRole(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, accountType: true },
    });

    return user;
  }

  /**
   * Get forum community stats for user
   */
  async getCommunityStats(userId: string) {
    const [reputation, topReplies, topTopics] = await Promise.all([
      // Get reputation
      this.prisma.userReputation.findUnique({
        where: { userId },
      }),

      // Get top replies (by vote score)
      this.prisma.reply.findMany({
        where: {
          authorId: userId,
          isDeleted: false,
        },
        orderBy: {
          voteScore: 'desc',
        },
        take: 3,
        include: {
          topic: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
      }),

      // Get top topics (by vote score)
      this.prisma.topic.findMany({
        where: {
          authorId: userId,
          isDraft: false,
        },
        orderBy: {
          voteScore: 'desc',
        },
        take: 3,
        select: {
          id: true,
          title: true,
          slug: true,
          voteScore: true,
          replyCount: true,
          viewCount: true,
        },
      }),
    ]);

    return {
      reputation: reputation?.totalReputation || 0,
      reputationLevel: reputation?.level || 'newcomer',
      topReplies,
      topTopics,
    };
  }
}

export default ProfilesRepository;
